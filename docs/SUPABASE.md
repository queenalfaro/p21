# Supabase — настройка и workflow

Этот документ описывает, как у нас устроен бэкенд: какие проекты в Supabase, кто и как накатывает миграции, откуда берутся типы во фронтенде.

## Архитектура

Два **облачных** проекта в Supabase:

| Проект      | Где живёт                  | Кто туда пишет                    |
|-------------|----------------------------|-----------------------------------|
| `dev`       | подключён к репо через CLI | лиды, при разработке             |
| `prod`      | подключён только из CI     | автоматически при merge в `main` |

**Локальный Supabase стек мы не запускаем.** Никакого `supabase start`, никакого docker-in-docker в Codespaces. Все миграции тестируются прямо на dev-проекте — он и есть наша staging-среда. Это упрощение сознательное: надо минимизировать движущиеся части.

Источник правды для схемы — папка `supabase/migrations/`. Если что-то меняется в БД, оно меняется через миграцию в репо, а не через клик в дашборде.

---

## Часть 1 — Однократная настройка (делают лиды)

### 1.1. Создать два проекта в Supabase

1. Зарегистрируйся на <https://supabase.com> (через GitHub быстрее всего).
2. **New Project** × 2:
   - Имя: `event-app-dev`, регион — ближайший к команде (Frankfurt для Европы).
   - Имя: `event-app-prod`, тот же регион.
   - Database password: сгенерируй и сохрани в менеджер паролей — он нужен раз, и потом ещё раз когда забудешь.
3. Подожди \~2 минуты, пока оба провижнятся.

> **Free tier** даёт 2 активных проекта, по 500 MB БД, 1 GB storage, 50 000 MAU. Этого хватает с запасом. Третий проект Supabase автоматически уведёт в paused — учитывай.

### 1.2. Записать project refs

В URL дашборда каждого проекта есть слаг:
`https://supabase.com/dashboard/project/`**`abcdefghijklmnop`**

Это **project ref**. Запиши оба — будут нужны и для CLI, и для Vercel.

### 1.3. Получить личный access token

1. <https://supabase.com/dashboard/account/tokens> → **Generate new token**.
2. Назови `event-app codespaces` или вроде того.
3. Скопируй сразу — больше не покажут.

### 1.4. Прокинуть секреты в Codespaces

В GitHub: **Settings → Codespaces → Secrets → New repository secret**.

| Имя секрета               | Значение                              | Для кого           |
|---------------------------|---------------------------------------|--------------------|
| `SUPABASE_ACCESS_TOKEN`   | токен из шага 1.3                     | только лиды        |
| `SUPABASE_PROJECT_REF`    | ref dev-проекта (из 1.2)              | вся команда        |
| `VITE_SUPABASE_URL`       | `https://<dev-ref>.supabase.co`       | вся команда        |
| `VITE_SUPABASE_ANON_KEY`  | dashboard → Settings → API → anon key | вся команда        |

Ограничь scope каждого секрета (`Repository access` → выбери только этот репо). Для `SUPABASE_ACCESS_TOKEN` дополнительно — `Selected users only` (только лиды).

При следующем создании Codespace эти переменные окажутся в env автоматически — копировать в `.env` не надо.

### 1.5. Применить миграции на dev-проект

Внутри Codespace (или локального devcontainer'а):

```bash
# Залинкаться с dev-проектом (один раз на codespace)
pnpm supabase:link

# Накатить всё, что лежит в supabase/migrations/
pnpm supabase:db:push

# Сгенерировать типы и закоммитить
pnpm supabase:gen-types
git add apps/web/src/lib/supabase/database.types.ts
git commit -m "chore: regenerate supabase types"
```

После этого `apps/web/src/lib/supabase/database.types.ts` содержит реальную схему и фронтенд получает полный type-safety.

### 1.6. Donastroить cloud dashboard

Эти вещи **не** управляются миграциями, их надо ткнуть в UI каждого проекта:

**Authentication → URL Configuration**
- *Site URL:* `https://<твой-vercel-домен>.vercel.app` (для prod), `http://localhost:5173` (для dev)
- *Redirect URLs:* добавь оба

**Authentication → Providers**
- *Email* — включить, для **dev** выключить "Confirm email" (быстрее тестировать), для **prod** оставить включённым
- *Anonymous Sign-Ins* — включить (требование ТЗ)
- *Google / Phone / прочее* — позже, по мере появления задач

**Database → Replication**
- Проверь что `supabase_realtime` publication содержит `messages` и `room_members` (миграция уже это делает, просто убедись).

---

## Часть 2 — Повседневный workflow

### Кто что делает

| Действие                          | Кто         | Команда                       |
|-----------------------------------|-------------|-------------------------------|
| Пишет код на фронте               | вся команда | `pnpm dev`                    |
| Создаёт новую миграцию            | **лид**     | `pnpm supabase:migration:new add_foo` |
| Применяет миграцию на dev         | **лид**     | `pnpm supabase:db:push`       |
| Регенерирует типы                 | **лид**     | `pnpm supabase:gen-types`     |
| Применяет миграцию на prod        | CI          | автоматически при merge в `main` |

### Добавить поле в БД

Допустим, хотим добавить `pinned_at timestamptz` к `messages`.

```bash
# 1) Сгенерировать пустую миграцию с правильным timestamp
pnpm supabase:migration:new add_pinned_at_to_messages

# Откроется новый файл supabase/migrations/<ts>_add_pinned_at_to_messages.sql
# Впиши туда:
#   alter table public.messages add column pinned_at timestamptz;

# 2) Применить на dev cloud
pnpm supabase:db:push

# 3) Перегенерировать типы
pnpm supabase:gen-types

# 4) Закоммитить миграцию + типы в одной ветке
git add supabase/migrations apps/web/src/lib/supabase/database.types.ts
git commit -m "feat(db): add pinned_at to messages"
```

После merge в `main` миграция автоматически уйдёт на prod (когда настроим CI — задача номер N).

### Я что-то поломал в dev БД, верните как было

> Откатов через CLI у Supabase в простой форме нет.
>
> На dev можно поступить грубо: в дашборде `Settings → General → Pause project → Restore from backup` (бекапы есть на free tier за последние 7 дней). Либо `DROP SCHEMA public CASCADE` через SQL Editor и заново `pnpm supabase:db:push`. Только на **dev**, никогда на prod.

### RLS залочила меня, не могу прочитать свои же данные

В дашборде → **Authentication → Policies** → найди таблицу. Можно временно отключить RLS на таблице (`Disable RLS`), починить, проверить и снова включить. Любое изменение политики оформляем как новую миграцию, чтобы оно поехало на prod.

---

## Часть 3 — Доменная модель (что лежит в БД)

Подробности в `supabase/migrations/20260517000000_initial_schema.sql`. Кратко:

```
auth.users  ──1:1──  profiles
    │
    └──N:M──  room_members  ──N:1──  rooms
                                       │
                                       └──1:N──  messages
```

- **`profiles`** создаётся автоматически триггером при signup (читает `username` и `display_name` из `raw_user_meta_data`).
- **`rooms`** имеет `code` для приглашений, `is_public` для публичных, `status` enum, `settings jsonb` для расширений.
- **`room_members`** держит роль (`admin` / `member`) и опциональный `permissions text[]` для кастомных прав. **На фронте проверяем `can('create_poll')`**, а не `role === 'admin'` — массив permissions для этого.
- **`messages`** — единая лента из ТЗ. Все «спецсообщения» (опросы, чеклисты, оценки, системки) — это строки с разным `type` и `payload jsonb`. На фронте по типу выбирается React-компонент.
- **Realtime** включён на `messages` и `room_members`. RLS применяется и к подпискам — пользователь получает только те ивенты, которые ему разрешено видеть.
- **Storage**: один публичный bucket `avatars/`. Конвенция пути — `avatars/{user_id}/<filename>` — на этом построены политики (загрузить можно только в свою папку).

### Использование во фронте

```ts
import { supabase } from '@/lib/supabase';

// типизировано автоматически по сгенерированной схеме
const { data, error } = await supabase
  .from('rooms')
  .select('id, name, status, room_members(user_id, role)')
  .eq('is_public', true);
```

Помни архитектурное правило из ТЗ: **UI-компоненты не дёргают `supabase` напрямую**. Этот импорт живёт только в `src/services/*` (или actions в Zustand). Из компонента вызывается сервис, который возвращает данные. Так мы сможем потом подменить транспорт, не переписывая UI.

---

## Troubleshooting

**`supabase link` ругается на отсутствие токена**
Codespaces secret `SUPABASE_ACCESS_TOKEN` не пробросился (например, ты не лид и у тебя нет доступа). Сделай `export SUPABASE_ACCESS_TOKEN=sbp_...` в текущей сессии — для разовых операций ОК.

**`db push` пишет "schema drift detected"**
В cloud-проекте что-то поменяли через UI, минуя миграции. Открой `pnpm supabase:db:diff`, перенеси изменения в новую миграцию вручную, закоммить, потом `db push` пройдёт. Этой ситуации избегаем — не правим схему через дашборд.

**`gen-types` возвращает пустой файл**
Не выполнен `supabase link`, либо `SUPABASE_PROJECT_REF` неверный, либо токена нет в env.

**RLS recursion error**
Если пишешь новую политику, которая обращается к таблице, на которой эта политика и висит — оборачивай проверку в `SECURITY DEFINER` функцию (как сделано с `is_room_member` / `is_room_admin`).

**"new row violates row-level security policy"**
Самая частая ошибка у новичков. Открой соответствующую таблицу в `supabase/migrations/...`, найди policy на `insert` для этой таблицы, проверь `with check`. Скорее всего там `auth.uid() = something_id`, а ты передаёшь что-то другое.
