# AGENT INSTRUCTIONS: ExServerWeb

## CRITICAL: Mandatory Documentation Reading

Before planning, designing, or implementing any code or feature in this repository, the agent MUST read the core documentation in `docs/`:

- [docs/architecture.md](file:///Users/soroqn/me/private-code/Minecraft-FoMe/ExServerWeb/docs/architecture.md): Core stack (Next.js, TypeScript, Vercel Serverless), Telegram Webhook, and Exaroton integration.
- [docs/features/web-and-bot.md](file:///Users/soroqn/me/private-code/Minecraft-FoMe/ExServerWeb/docs/features/web-and-bot.md): Complete feature specifications for the Web Dashboard, BlueMap embedding, live movement trails, and Telegram bot commands.
- [docs/current-state.md](file:///Users/soroqn/me/private-code/Minecraft-FoMe/ExServerWeb/docs/current-state.md): Active status and pending tasks.
- [docs/decisions/](file:///Users/soroqn/me/private-code/Minecraft-FoMe/ExServerWeb/docs/decisions/): Architectural Decision Records (ADRs).

## Project Overview

Vercel-ready companion web platform and serverless control center for the FoMe Minecraft survival server.
It provides:

1. **Interactive Web Dashboard**: Live 3D BlueMap integration, real-time movement traces ("Следы" / breadcrumbs), live server metrics (status, online players, RAM) via Exaroton API, and Hide & Seek stealth status banner.
2. **Telegram Bot on Vercel Serverless (Webhook)**: 24/7 server control (start/stop/restart), carpet AFK bot spawning, live status queries, and game triggers without needing any self-hosted bot server.

## Mandatory Technical Constraints

- Primary Language: **TypeScript ONLY** (`.ts`, `.tsx`) with strict mode enabled.
- Framework: Next.js (App Router) + Tailwind CSS.
- Runtime Target: **Vercel Serverless Functions** (stateless, <15s execution timeout, webhook-driven).
- Comments: English only. Strictly raw, technical, and concise. No emojis or decorative fluff.
- Task Automation: `Taskfile.yml`.
- Zero Bloat: Write strictly requested logic without unused abstractions or speculative libraries.

## Command Reference

- `task dev`: Start Next.js local development server.
- `task lint`: Run ESLint checks.
- `task format`: Format code using Prettier.
- `task test`: Run automated tests.
- `task pre-commit`: Combined verification gate (`lint` + `test`). Must pass with 0 errors.
- `task build`: Compile production Next.js build.
- `task deploy`: Deploy to Vercel production.
