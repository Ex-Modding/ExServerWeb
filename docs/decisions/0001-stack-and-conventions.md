# ADR 0001: Next.js App Router, Vercel Serverless, and Telegram Webhook

## Status

Accepted

## Context

A companion web platform and 24/7 remote control center is required for the FoMe Minecraft server. It must incur $0 hosting costs, have zero maintenance overhead, and operate seamlessly without requiring a dedicated persistent VPS.

## Decisions

### 1. Framework: Next.js + TypeScript

- Unified fullstack framework for both the frontend dashboard and backend API route handlers.
- TypeScript enforces compile-time safety for Exaroton and Telegram payloads.

### 2. Hosting: Vercel Serverless Functions

- Webhook-driven Telegram bot deployed to Vercel Route Handlers (`/api/bot`).
- Eliminates polling loops and continuous background processes. The function executes only when an event occurs and costs $0.

### 3. Exaroton REST API Integration

- Exaroton's official Node.js SDK / REST API is used for server start/stop and console command dispatch.

## Consequences

- Long-lived TCP connections (like Mineflayer bots) cannot run inside Vercel Serverless Functions due to execution timeouts. AFK bots must be spawned server-side via the Carpet mod command (`/player <name> spawn`).
