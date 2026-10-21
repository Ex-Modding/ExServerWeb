import test from "node:test";
import assert from "node:assert/strict";
import { Bot } from "grammy";
import { isUserAuthorized, setupBot, buildMainMenuKeyboard } from "@/lib/bot";
import { POST, GET } from "@/app/api/bot/route";

test("isUserAuthorized: correctly validates allowed user IDs", () => {
  process.env.TELEGRAM_ALLOWED_USERS = "1106908205,5412790700";

  assert.equal(isUserAuthorized("1106908205"), true);
  assert.equal(isUserAuthorized(1106908205), true);
  assert.equal(isUserAuthorized("5412790700"), true);
  assert.equal(isUserAuthorized("9999999999"), false);
  assert.equal(isUserAuthorized(undefined, "1106908205"), true);
  assert.equal(isUserAuthorized(undefined, "9999999999"), false);
});

test("buildMainMenuKeyboard: generates required action buttons", () => {
  const keyboard = buildMainMenuKeyboard();
  const flatButtons = keyboard.inline_keyboard.flat();

  const labels = flatButtons.map((b) => b.text);
  assert.ok(labels.some((l) => l.includes("Включить сервер")));
  assert.ok(labels.some((l) => l.includes("Выключить сервер")));
  assert.ok(labels.some((l) => l.includes("Статус сервера")));
  assert.ok(labels.some((l) => l.includes("3D Карту")));
  assert.ok(labels.some((l) => l.includes("АФК Бота")));
});

test("setupBot: allows authorized user and replies with menu", async () => {
  process.env.TELEGRAM_ALLOWED_USERS = "1106908205";

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

  // Send /start from authorized user
  await bot.handleUpdate({
    update_id: 100,
    message: {
      message_id: 1,
      date: Math.floor(Date.now() / 1000),
      chat: { id: 1106908205, type: "private" },
      from: { id: 1106908205, is_bot: false, first_name: "Yaroslav" },
      text: "/start",
      entities: [{ type: "bot_command", offset: 0, length: 6 }],
    },
  });

  assert.equal(interceptedCalls.length, 1);
  assert.equal(interceptedCalls[0].method, "sendMessage");
  assert.ok(
    String(interceptedCalls[0].payload.text).includes("FoMe Server Console"),
  );
  assert.ok(Boolean(interceptedCalls[0].payload.reply_markup));
});

test("setupBot: rejects unauthorized user", async () => {
  process.env.TELEGRAM_ALLOWED_USERS = "1106908205";

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

  // Send /start from stranger
  await bot.handleUpdate({
    update_id: 101,
    message: {
      message_id: 2,
      date: Math.floor(Date.now() / 1000),
      chat: { id: 987654321, type: "private" },
      from: { id: 987654321, is_bot: false, first_name: "Stranger" },
      text: "/start",
      entities: [{ type: "bot_command", offset: 0, length: 6 }],
    },
  });

  assert.equal(interceptedCalls.length, 1);
  assert.equal(interceptedCalls[0].method, "sendMessage");
  assert.ok(
    String(interceptedCalls[0].payload.text).includes("Доступ запрещен"),
  );
});

test("route handler: GET returns health status", async () => {
  const res = await GET();
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.equal(data.service, "FoMe Server Companion Bot Webhook");
});

test("route handler: POST verifies secret token header", async () => {
  process.env.NODE_ENV = "test";
  process.env.TELEGRAM_ALLOWED_USERS = "1106908205";
  process.env.TELEGRAM_WEBHOOK_SECRET = "test_super_secret_token";

  // Request with invalid secret
  const badReq = new Request("http://localhost/api/bot", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-telegram-bot-api-secret-token": "wrong_secret",
    },
    body: JSON.stringify({ update_id: 999 }),
  });

  const badRes = await POST(badReq);
  assert.equal(badRes.status, 401);

  // Request with valid secret and authorized message
  const goodReq = new Request("http://localhost/api/bot", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-telegram-bot-api-secret-token": "test_super_secret_token",
    },
    body: JSON.stringify({
      update_id: 1000,
      message: {
        message_id: 10,
        date: Math.floor(Date.now() / 1000),
        chat: { id: 1106908205, type: "private" },
        from: { id: 1106908205, is_bot: false },
        text: "/start",
        entities: [{ type: "bot_command", offset: 0, length: 6 }],
      },
    }),
  });

  const goodRes = await POST(goodReq);
  assert.equal(goodRes.status, 200);
  const goodData = await goodRes.json();
  assert.equal(goodData.ok, true);
});
