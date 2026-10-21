# Project Current State: ExServerWeb

## Summary

The complete companion web platform and serverless Telegram control center for the FoMe Minecraft survival server is fully implemented in **ExServerWeb**. It provides a 3D BlueMap interactive viewer, real-time movement traces ("Следы" / breadcrumbs), live server metrics (status, online players, RAM) via Exaroton API, anti-cheat Hide & Seek stealth masking, and a 24/7 serverless Telegram bot.

## Active Status

**All 5 Roadmap Tasks Completed** in `ExServerWeb`.
Verified with `task pre-commit` (0 lint errors, 13/13 automated unit tests passing) and `task build` (optimized production Vercel bundle).

---

## Implemented Components & Config

- [AGENT.md](file:///Users/soroqn/me/private-code/Minecraft-FoMe/ExServerWeb/AGENT.md): Operational guidelines and constraints.
- [Taskfile.yml](file:///Users/soroqn/me/private-code/Minecraft-FoMe/ExServerWeb/Taskfile.yml): Task pipeline (`task pre-commit`, `task dev`, `task lint`, `task test`, `task build`, `task deploy`).
- [package.json](file:///Users/soroqn/me/private-code/Minecraft-FoMe/ExServerWeb/package.json): Next.js 15, React 19, TypeScript, Tailwind CSS, `grammy`, `exaroton`, `tsx`.
- [tsconfig.json](file:///Users/soroqn/me/private-code/Minecraft-FoMe/ExServerWeb/tsconfig.json): Strict TypeScript configuration with `@/*` path aliases.
- [tailwind.config.ts](file:///Users/soroqn/me/private-code/Minecraft-FoMe/ExServerWeb/tailwind.config.ts) & [postcss.config.js](file:///Users/soroqn/me/private-code/Minecraft-FoMe/ExServerWeb/postcss.config.js): Tailwind CSS HUD dark theme configuration.
- [.eslintrc.json](file:///Users/soroqn/me/private-code/Minecraft-FoMe/ExServerWeb/.eslintrc.json): Next.js Core Web Vitals ESLint setup.
- [lib/bot.ts](file:///Users/soroqn/me/private-code/Minecraft-FoMe/ExServerWeb/lib/bot.ts): GrammY bot configuration with authorization middleware (`TELEGRAM_ALLOWED_USERS`), interactive inline HUD keyboard, lifecycle commands (`/start`, `/menu`, `/server_start`, `/server_stop`, `/status`, `/afk_spawn`, `/afk_kill`, `/games_start`), and Exaroton integration.
- [lib/exaroton.ts](file:///Users/soroqn/me/private-code/Minecraft-FoMe/ExServerWeb/lib/exaroton.ts): Exaroton service client for server power controls (start/stop/restart), real-time status queries, and Carpet mod console execution (`/player <name> spawn`/`kill`).
- [lib/gameState.ts](file:///Users/soroqn/me/private-code/Minecraft-FoMe/ExServerWeb/lib/gameState.ts): State machine integration and Hide & Seek anti-cheat stealth invariant (`isStealthModeActive`).
- [app/api/bot/route.ts](file:///Users/soroqn/me/private-code/Minecraft-FoMe/ExServerWeb/app/api/bot/route.ts): Serverless Vercel Webhook route (`POST /api/bot`) with `X-Telegram-Bot-Api-Secret-Token` validation (`TELEGRAM_WEBHOOK_SECRET`) and healthcheck (`GET /api/bot`).
- [app/api/status/route.ts](file:///Users/soroqn/me/private-code/Minecraft-FoMe/ExServerWeb/app/api/status/route.ts): Dynamic server status API endpoint returning power state, online player count/list, and address.
- [app/api/game-state/route.ts](file:///Users/soroqn/me/private-code/Minecraft-FoMe/ExServerWeb/app/api/game-state/route.ts): Dynamic match status endpoint for syncing game phase and stealth mode with `ExServerMod`.
- [components/BlueMapView.tsx](file:///Users/soroqn/me/private-code/Minecraft-FoMe/ExServerWeb/components/BlueMapView.tsx): 3D BlueMap WebGL iframe viewport with fullscreen toggle and standby radar fallback.
- [components/ServerHUD.tsx](file:///Users/soroqn/me/private-code/Minecraft-FoMe/ExServerWeb/components/ServerHUD.tsx): Floating HUD overlay displaying live server status dot, host/port, online player chips, and manual refresh button.
- [components/StealthAlertBanner.tsx](file:///Users/soroqn/me/private-code/Minecraft-FoMe/ExServerWeb/components/StealthAlertBanner.tsx): Persistent top alert banner displayed during active Hide & Seek rounds.
- [components/BreadcrumbOverlay.tsx](file:///Users/soroqn/me/private-code/Minecraft-FoMe/ExServerWeb/components/BreadcrumbOverlay.tsx): Player movement trails overlay with distinct player colors and anti-cheat concealment during stealth mode.
- [hooks/useTelegramWebApp.ts](file:///Users/soroqn/me/private-code/Minecraft-FoMe/ExServerWeb/hooks/useTelegramWebApp.ts): Telegram Mini App hooks for viewport expansion, user context, and haptic feedback.
- [app/layout.tsx](file:///Users/soroqn/me/private-code/Minecraft-FoMe/ExServerWeb/app/layout.tsx): Root layout injecting Telegram WebApp SDK (`telegram-web-app.js`) and viewport metadata.
- [app/page.tsx](file:///Users/soroqn/me/private-code/Minecraft-FoMe/ExServerWeb/app/page.tsx): Main HUD dashboard assembling BlueMap viewer, floating status overlay, stealth alert, and movement trails.
- [tests/](file:///Users/soroqn/me/private-code/Minecraft-FoMe/ExServerWeb/tests/):
  - [bot.test.ts](file:///Users/soroqn/me/private-code/Minecraft-FoMe/ExServerWeb/tests/bot.test.ts): Tests for bot security, secret token validation, menu dispatch, and commands.
  - [exaroton.test.ts](file:///Users/soroqn/me/private-code/Minecraft-FoMe/ExServerWeb/tests/exaroton.test.ts): Tests for Exaroton status parsing, `/api/status`, lifecycle commands, and Carpet AFK spawning.
  - [stealth.test.ts](file:///Users/soroqn/me/private-code/Minecraft-FoMe/ExServerWeb/tests/stealth.test.ts): Tests for stealth invariant, game state transitions, and `/api/game-state`.

---

## Task Backlog (see docs/roadmap.md)

- [x] **Task 1: Next.js + TypeScript Foundation & Tooling Setup**
- [x] **Task 2: Telegram Bot Webhook Route (`POST /api/bot`) & Security**
- [x] **Task 3: Exaroton API Client & Remote Server Controls**
- [x] **Task 4: BlueMap 3D Viewer & Telegram Mini App Integration**
- [x] **Task 5: Live Movement Breadcrumbs & Hide & Seek Stealth Mode**
