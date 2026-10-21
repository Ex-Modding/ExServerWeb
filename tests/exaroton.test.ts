import test from "node:test";
import assert from "node:assert/strict";
import {
  mapStatusCode,
  fetchServerStatus,
  startServer,
  stopServer,
  spawnCarpetBot,
  killCarpetBot,
  setMockExarotonHandlers,
} from "../lib/exaroton.ts";
import { GET } from "../app/api/status/route.ts";
import { Bot } from "grammy";
import { setupBot } from "../lib/bot.ts";

test("mapStatusCode: maps Exaroton numeric status codes correctly", () => {
  assert.equal(mapStatusCode(0), "OFFLINE");
  assert.equal(mapStatusCode(1), "ONLINE");
  assert.equal(mapStatusCode(2), "STARTING");
  assert.equal(mapStatusCode(3), "STOPPING");
  assert.equal(mapStatusCode(4), "RESTARTING");
  assert.equal(mapStatusCode(5), "SAVING");
  assert.equal(mapStatusCode(6), "LOADING");
  assert.equal(mapStatusCode(7), "CRASHED");
  assert.equal(mapStatusCode(8), "PENDING");
  assert.equal(mapStatusCode(10), "PREPARING");
  assert.equal(mapStatusCode(999), "UNKNOWN");
});

test("fetchServerStatus & GET /api/status: returns server metrics", async () => {
  setMockExarotonHandlers(async () => ({
    id: "test-server-123",
    name: "FoMe Minecraft Server",
    address: "fome.exaroton.me",
    host: "123.45.67.89",
    port: 25565,
    status: "ONLINE",
    rawStatus: 1,
    players: {
      count: 2,
      max: 20,
      list: ["Soroqn", "Brother"],
    },
    software: {
      name: "Fabric",
      version: "1.21.1",
    },
  }));

  const status = await fetchServerStatus();
  assert.equal(status.status, "ONLINE");
  assert.equal(status.players.count, 2);
  assert.equal(status.players.list[0], "Soroqn");

  // Test the Next.js API route
  const res = await GET();
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.ok, true);
  assert.equal(json.data.status, "ONLINE");
  assert.equal(json.data.players.count, 2);

  // Reset mock
  setMockExarotonHandlers(null);
});

test("server lifecycle and carpet commands dispatch properly", async () => {
  const executedCommands: string[] = [];

  setMockExarotonHandlers(null, async (cmd) => {
    executedCommands.push(cmd);
    return true;
  });

  await startServer();
  await stopServer();
  await spawnCarpetBot("Steve");
  await killCarpetBot("Steve");

  assert.deepEqual(executedCommands, [
    "start",
    "stop",
    "/player Steve spawn",
    "/player Steve kill",
  ]);

  setMockExarotonHandlers(null, null);
});

test("bot /status: replies with formatted report", async () => {
  process.env.TELEGRAM_ALLOWED_USERS = "1106908205";

  setMockExarotonHandlers(async () => ({
    id: "test-server-123",
    name: "FoMe Minecraft Server",
    address: "fome.exaroton.me",
    host: "123.45.67.89",
    port: 25565,
    status: "ONLINE",
    rawStatus: 1,
    players: {
      count: 1,
      max: 20,
      list: ["Soroqn"],
    },
  }));

  const bot = new Bot("123456:AAFakeTestTokenForUnitTesting00000", {
    botInfo: {
      id: 123456,
      is_bot: true,
      first_name: "TestBot",
      username: "test_bot",
      can_join_groups: true,
      can_read_all_group_messages: false,
      supports_inline_queries: false,
      can_connect_to_business: false,
      has_main_web_app: false,
      has_topics_enabled: false,
      allows_users_to_create_topics: false,
      can_manage_bots: false,
      supports_join_request_queries: false,
    },
  });

  const interceptedCalls: Array<{
    method: string;
    payload: Record<string, unknown>;
  }> = [];
  bot.api.config.use(async (_prev, method, payload) => {
    interceptedCalls.push({
      method,
      payload: payload as Record<string, unknown>,
    });
    return { ok: true, result: true } as unknown as any;
  });

  setupBot(bot);

  await bot.handleUpdate({
    update_id: 200,
    message: {
      message_id: 10,
      date: Math.floor(Date.now() / 1000),
      chat: { id: 1106908205, type: "private" },
      from: { id: 1106908205, is_bot: false },
      text: "/status",
      entities: [{ type: "bot_command", offset: 0, length: 7 }],
    },
  });

  assert.equal(interceptedCalls.length, 1);
  assert.equal(interceptedCalls[0].method, "sendMessage");
  const text = String(interceptedCalls[0].payload.text);
  assert.ok(text.includes("Статус сервера FoMe"));
  assert.ok(text.includes("ONLINE"));
  assert.ok(text.includes("Soroqn"));

  setMockExarotonHandlers(null);
});
