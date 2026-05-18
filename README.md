# Event App — Development Environment

Этот репозиторий настроен так, чтобы любой участник команды мог **за один клик** получить полностью готовое окружение для разработки. Ничего не нужно ставить локально, вся работа ведется просто в VSCode.

## Как начать (для разработчиков)

### 🟢 Вариант 1 — GitHub Codespaces (рекомендуется)

> Это путь по умолчанию. Просто работай в браузере или в локальном VS Code, подключённом к облачной машине.

1. Открой репозиторий на GitHub.
2. Нажми зелёную кнопку **Code → Codespaces → Create codespace on `<твоя-ветка>`**.
3. Подожди \~2–3 минуты, пока соберётся образ (первый раз; дальше — секунды).
4. Когда откроется VS Code — в терминале выполни:
    ```bash
    pnpm dev
    ```
5. VS Code сам предложит открыть форвардженный порт `5173` — кликай и работаешь.

**Подключение из локального VS Code** (быстрее, чем браузер):
Установи расширение [GitHub Codespaces](https://marketplace.visualstudio.com/items?itemName=GitHub.codespaces), нажми `F1` → `Codespaces: Connect to Codespace…`.

### 🟡 Вариант 2 — Локально через Docker

> Нужен, если хочешь работать офлайн или экономить часы Codespaces.

**Prerequisites:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) (macOS / Windows / Linux).

```bash
# 1) Скопируй пример env (один раз)
cp .env.example .env
# теперь открой .env и впиши свои Supabase ключи (см. ниже)

# 2) Подними контейнер
docker compose up -d

# 3) Зайди внутрь
docker compose exec app bash

# 4) Внутри контейнера
pnpm install     # только при первом запуске или после обновления зависимостей
pnpm dev         # запустит Vite на http://localhost:5173
```

VS Code умеет автоматически «прицепиться» к запущенному контейнеру — нажми `F1` → `Dev Containers: Attach to Running Container…`, выбери `event-app-app-1`. Все рекомендованные расширения и настройки подтянутся.

Останавливай контейнер, когда закончил работать:

```bash
docker compose down
```

Среда **одинакова** в Codespaces и локально.

---

## Что внутри среды

| Что               | Версия / источник                                          |
| ----------------- | ---------------------------------------------------------- |
| Node.js           | 20 LTS (`mcr.microsoft.com/devcontainers/typescript-node`) |
| pnpm              | пин в `package.json` → `packageManager`                    |
| Supabase CLI      | пин в `Dockerfile` → `SUPABASE_CLI_VERSION`                |
| GitHub CLI (`gh`) | dev container feature (только в Codespaces)                |

## Полезные команды

| Команда                             | Что делает                            |
| ----------------------------------- | ------------------------------------- |
| `pnpm dev`                          | Vite dev server с HMR                 |
| `pnpm build`                        | Production-сборка всех пакетов        |
| `pnpm lint`                         | ESLint по всем пакетам                |
| `pnpm typecheck`                    | TypeScript без эмита, по всем пакетам |
| `pnpm format`                       | Prettier --write                      |
| `supabase gen types typescript ...` | Сгенерировать TS-типы из схемы БД     |
| `supabase db push`                  | Применить миграции к remote проекту   |

## Структура фронта

Вот структура проекта, представленная в виде таблицы:

| Путь                                     | Назначение                                                                                                                                                                                                                    |
| :--------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/`                          | **Корень исходников.** Всё приложение здесь. Структура делится на 6 верхнеуровневых папок — каждая со своей ролью.                                                                                                            |
| `lib/`                                   | **Внешние SDK и конфиги.** Файлы, которые вы создаёте один раз и почти не трогаете. Supabase-клиент, QueryClient, eventBus. Новичкам сюда заходить не нужно.                                                                  |
| `lib/supabase/`                          | Supabase-клиент и типы. `client.ts` — синглтон. `database.types.ts` — перезаписывается командой `pnpm supabase:gen-types`. Не редактировать вручную после первой генерации.                                                   |
| `lib/queryClient.ts`                     | Создание и экспорт `QueryClient` с настройками по умолчанию (retry, staleTime и т.д.). Импортируется только в `main.tsx`.                                                                                                     |
| `features/`                              | **Главная папка проекта.** Здесь живёт весь код, который пишет команда. Каждая фича = своя папка. Внутри каждой — services/, hooks/, components/ и types.ts.                                                                  |
| `features/auth/`                         | **Аутентификация.** `services/auth.ts` — signIn/signOut/getSession. `hooks/useSession.ts` — подписка на изменения сессии. `store.ts` — Zustand с текущим user.id (нужен везде, поэтому в store).                              |
| `features/rooms/`                        | **Комнаты.** Создание, поиск, список, параметры. `services/rooms.ts` — ensureDemoRoom, createRoom, listRooms, getRoomByCode. Компоненты: RoomCard, RoomHeader, CreateRoomForm.                                                |
| `features/messages/`                     | **Чат.** Самая большая фича. `components/MessageItem.tsx` — роутер по `type`: рендерит TextMessage, PollMessage, ChecklistMessage и т.д. Каждый тип сообщения — отдельный компонент.                                          |
| `features/messages/services/messages.ts` | Все вызовы Supabase для сообщений: `listMessages()`, `sendTextMessage()`, `sendPoll()`, `subscribeToRoomMessages()`. Только функции, никакого React.                                                                          |
| `features/messages/hooks/useMessages.ts` | Оборачивает сервис в `useQuery` + `useEffect` для realtime-подписки. Добавляет новые сообщения прямо в кэш через `setQueryData` — без лишних HTTP-запросов.                                                                   |
| `features/messages/components/`          | `Chat.tsx` — контейнер. `MessageList.tsx` — виртуализированный список. `MessageItem.tsx` — switch по type. `TextMessage.tsx`, `PollMessage.tsx` — конкретные рендеры. `MessageInput.tsx` — поле ввода.                        |
| `features/messages/types.ts`             | TypeScript типы для этой фичи: `TextPayload`, `PollPayload`, `ChecklistPayload`. Discriminated union по `message_type`. Импортируется сервисами и компонентами внутри фичи.                                                   |
| `features/profile/`                      | Профиль пользователя. Аватар, имя, username, настройки. Аналогичная структура: services → hooks → components.                                                                                                                 |
| `ui/`                                    | **Shadcn/ui компоненты.** Добавляются командой `pnpm dlx shadcn@latest add button` — не пишутся вручную. Это Button, Input, Dialog, Sheet и т.д. Можно кастомизировать, но осторожно: при следующем `add` файл перезапишется. |
| `shared/`                                | **Кросс-фичевые утилиты.** Сюда переносится код только когда его используют 3+ разных фичи. Создавать здесь что-то заранее — не нужно.                                                                                        |
| `shared/utils/`                          | `can.ts` — хелпер `can('create_poll')` из ТЗ. `cn.ts` — merger классов Tailwind. `eventBus.ts` — EventBus из ТЗ (emit события, не бизнес-логика). `formatDate.ts` и подобные.                                                 |
| `shared/components/`                     | `SharePage.tsx` — экран "поделиться" (QR + текст + кнопка). `ErrorBoundary.tsx`. Всё что используется в 3+ фичах.                                                                                                             |
| `pages/`                                 | **React Router страницы — тонкие файлы!** Страница только: читает params из URL, собирает нужные фича-компоненты в layout, передаёт props. Никакой логики, никаких прямых вызовов.                                            |
| `pages/index.tsx`                        | Главный экран. Рендерит список комнат из `features/rooms/` и кнопку создания. Максимум 30 строк.                                                                                                                              |
| `pages/room.tsx`                         | Экран комнаты. Читает `:code` из URL, рендерит `RoomHeader` + `Chat` + `MessageInput` из соответствующих фич. Максимум 40 строк.                                                                                              |
| `App.tsx`                                | Только Providers и Router. `QueryClientProvider`, `BrowserRouter`, `Routes`. Ничего больше.                                                                                                                                   |
| `main.tsx`                               | Entry-point. `createRoot().render()`. Одна функция, 15 строк.                                                                                                                                                                 |

## Troubleshooting

**`pnpm install` упал в Codespaces после `git pull`**
Зависимости поменялись. Перезапусти: `pnpm install`. Если кеш испорчен — `pnpm store prune && pnpm install`.

**Codespaces кончились бесплатные часы**
Бесплатный тариф — 120 core-hours/мес (2-ядерная машина = 60 ч). Останавливай codespace, когда не работаешь (он автостопит через 30 мин бездействия), и удаляй старые. Либо переходи на локальный Docker.
