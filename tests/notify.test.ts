import test from "node:test";
import assert from "node:assert/strict";
import { POST, GET } from "../app/api/notify/route.ts";
import { bot } from "../lib/bot.ts";

test("route handler /api/notify: GET returns health status", async () => {
  const res = await GET();
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
});

test("route handler /api/notify: POST rejects unauthorized secret", async () => {
  const req = new Request("http://localhost/api/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event: "server_started", secret: "wrong_secret" }),
  });

  const res = await POST(req);
  assert.equal(res.status, 401);
});

test("route handler /api/notify: POST delivers notification on valid secret", async () => {
  process.env.NODE_ENV = "test";
  process.env.TELEGRAM_WEBHOOK_SECRET = "fome_secret_webhook_2026";

  const req = new Request("http://localhost/api/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: "server_started",
      secret: "fome_secret_webhook_2026",
    }),
  });

  const res = await POST(req);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.equal(data.delivered, true);
});
