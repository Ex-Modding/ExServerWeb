# Feature Specification: Web Dashboard, BlueMap & Telegram Bot

## 1. Web Dashboard Features

### 1.1 Embedded 3D BlueMap Viewer

- Direct iframe/embed of the server's BlueMap instance (`NEXT_PUBLIC_BLUEMAP_URL`).
- Controls HUD overlay:
  - Fullscreen toggle.
  - Server status indicator (pulsing green dot for Online, amber for Starting, gray for Offline).
  - Online player badges with avatars.

### 1.2 Real-time Movement Trails ("Следы" / Breadcrumbs)

- Displays recent paths traveled by participants across the world.
- Individual trace colors per player (e.g. Cyan for Soroqn, Orange for brother).
- Time-decay: trails automatically fade after a configurable duration (e.g., 15 minutes) or display recent session paths.

### 1.3 Hide & Seek Stealth Mode

- **Stealth Trigger**: When `ExServerMod` reports an active `HIDING` or `SEEKING` phase:
  - Player position pins are instantly removed from the map view.
  - Active breadcrumb trails are masked/paused.
  - A persistent top alert banner appears:
    `[ 🕵️ ПРЯТКИ АКТИВНЫ: Местоположение игроков засекречено для честной игры ]`
- When the game transitions to `INTERMISSION` or `IDLE`, pins and trail updates are restored.

---

## 2. Telegram Bot Command Reference (`POST /api/bot`)

The bot operates 24/7 via Vercel Webhook. All actions are restricted to `TELEGRAM_ALLOWED_USERS`.

### 2.1 Server Lifecycle

- `/start` or `/menu` — Displays interactive inline keyboard:
  - `[ 🟢 Включить сервер ]`
  - `[ 🔴 Выключить сервер ]`
  - `[ 📊 Статус и Игроки ]`
  - `[ 🗺️ Открыть 3D Карту ]`
  - `[ 🤖 Заспавнить АФК Бота ]`
  - `[ 🎮 Запустить Прятки ]`
- `/server_start` — Calls Exaroton API to boot the server.
- `/server_stop` — Gracefully stops the server.
- `/status` — Fetches current power state, online player count, memory utilization, and world status.

### 2.2 AFK Bot Control (Carpet Mod Integration)

- `/afk_spawn <name>` — Sends console command `/player <name> spawn` via Exaroton API.
- `/afk_kill <name>` — Sends console command `/player <name> kill`.

### 2.3 Game Triggers

- `/games_start` — Triggers `/games` vote directly on the server for instant party setup.
