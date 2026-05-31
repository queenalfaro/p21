Уже есть готовый развернутый dev сервер со следующей sql схемой:

```sql
-- Функция для автоматического обновления поля updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Типы статусов комнаты
CREATE TYPE room_status AS ENUM ('draft', 'active', 'completed');

-- Базовые роли в комнате
CREATE TYPE room_role AS ENUM ('admin', 'user');

-- Типы сообщений (расширяемо)
CREATE TYPE message_type AS ENUM ('text', 'poll', 'checklist', 'rating', 'system');



-- ПОЛЬЗОВАТЕЛИ
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL, -- Обязательно даже для анонимов
    username VARCHAR(255) UNIQUE, -- Уникальный ник для полных профилей
    avatar_url TEXT,
    is_anonymous BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}'::jsonb, -- Настройки пушей, темы и т.д.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- КОМНАТЫ (Мероприятия)
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    roomname VARCHAR(255) UNIQUE NOT NULL, -- Уникальный ID для ссылок (например, my-event-2024)
    description TEXT,
    avatar_url TEXT,
    status room_status DEFAULT 'draft',
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    settings JSONB DEFAULT '{}'::jsonb, -- Глобальные настройки комнаты (кто может писать и т.д.)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER update_rooms_modtime BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- УЧАСТНИКИ КОМНАТЫ (Связь Many-to-Many)
CREATE TABLE room_members (
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role room_role DEFAULT 'user',
    permissions JSONB DEFAULT '[]'::jsonb, -- Кастомные пермишены (например: ["manage_room", "pin_messages"])
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (room_id, user_id) -- Один юзер = одна запись в рамках комнаты
);
CREATE INDEX idx_room_members_user ON room_members(user_id);



-- СООБЩЕНИЯ
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- При удалении юзера сообщение останется (как в ТГ)
    parent_id UUID REFERENCES messages(id) ON DELETE CASCADE, -- Для тредов/веток (reply_to)
    type message_type DEFAULT 'text',
    payload JSONB DEFAULT '{}'::jsonb, -- Данные (например: текст сообщения, массив вариантов ответов для опроса, UI-настройки)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER update_messages_modtime BEFORE UPDATE ON messages FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Индекс для супер-быстрой загрузки бесконечной ленты сообщений комнаты
CREATE INDEX idx_messages_feed ON messages(room_id, created_at DESC);
CREATE INDEX idx_messages_thread ON messages(parent_id) WHERE parent_id IS NOT NULL;

-- ВЗАИМОДЕЙСТВИЯ (Голоса в опросах, галочки в чеклистах)
CREATE TABLE message_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL, -- 'vote', 'check', 'rate'
    value JSONB NOT NULL, -- За что проголосовали: {"option_index": 1} или {"checked_items": [1, 3]}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (message_id, user_id, interaction_type) -- Пользователь может проголосовать только 1 раз в 1 опросе
);
CREATE INDEX idx_message_interactions_msg ON message_interactions(message_id);



-- АНАЛИТИКА

-- 1. Таблица ТЕКУЩЕГО состояния (Здесь хранится последнее слово пользователя)
-- Делаем её UNLOGGED, чтобы частые пинги не насиловали жесткий диск сервера
CREATE UNLOGGED TABLE current_user_states (
    user_id UUID PRIMARY KEY,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    last_ping_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Функция для клиента: обновить свой статус
CREATE OR REPLACE FUNCTION update_my_status(p_user_id UUID, p_room_id UUID, p_status VARCHAR)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO current_user_states (user_id, room_id, status, last_ping_at)
    VALUES (p_user_id, p_room_id, p_status, NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET room_id = EXCLUDED.room_id,
        status = EXCLUDED.status,
        last_ping_at = NOW();
END;
$$;

-- 3. Таблица ИСТОРИИ (Таймлайн для графика)
CREATE TABLE analytics_timeline (
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    bucket_time TIMESTAMPTZ NOT NULL, -- Время среза (например 12:00, 12:01)
    engaged_count INT DEFAULT 0,
    distracted_count INT DEFAULT 0,
    unknown_count INT DEFAULT 0,
    PRIMARY KEY (room_id, bucket_time)
);

-- Включаем планировщик
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 4. Функция, которая делает Snapshot (фотографию)
CREATE OR REPLACE FUNCTION take_analytics_snapshot()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO analytics_timeline (room_id, bucket_time, engaged_count, distracted_count, unknown_count)
    SELECT
        s.room_id,
        date_trunc('minute', NOW()) AS bucket_time, -- Округляем до текущей минуты
        COUNT(*) FILTER (WHERE s.status = 'engaged'),
        COUNT(*) FILTER (WHERE s.status = 'distracted'),
        COUNT(*) FILTER (WHERE s.status = 'unknown')
    FROM current_user_states s
    JOIN rooms r ON s.room_id = r.id
    WHERE r.status = 'active' -- Считаем статистику ТОЛЬКО для идущих мероприятий
    GROUP BY s.room_id;

    -- ЗАМЕТЬТЕ: Мы НЕ удаляем старые записи из current_user_states.
    -- Если человек отвалился 2 часа назад в статусе engaged, он попадет в этот COUNT.
END;
$$;

-- 5. Запускаем cron: делать фотографию каждую минуту
SELECT cron.schedule('snapshot_analytics', '* * * * *', 'SELECT take_analytics_snapshot()');
```

Локльного supabase cli нету, все взаимодействия производятся через web интерфейс (ux/ui или SQL Editor - второй предпочтительнее, так как ux/ui часто меняются).
