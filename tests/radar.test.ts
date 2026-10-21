import test from "node:test";
import assert from "node:assert/strict";
import {
  updateRadarPlayers,
  getRadarState,
  formatPlayerCoordsText,
} from "../lib/radarStore.ts";
import { GET, POST } from "../app/api/radar/route.ts";

test("radarStore: correctly updates player coordinates and trails", () => {
  updateRadarPlayers([
    {
      name: "Soroqn",
      x: 100,
      y: 64,
      z: -200,
      dimension: "minecraft:overworld",
    },
    {
      name: "Brother",
      x: 300,
      y: 70,
      z: 50,
      dimension: "minecraft:the_nether",
    },
  ]);

  const state = getRadarState();
  assert.equal(state.count, 2);
  assert.equal(state.players[0].name, "Soroqn");
  assert.equal(state.players[0].dimension, "overworld");

  const text = formatPlayerCoordsText();
  assert.ok(text.includes("Soroqn"));
  assert.ok(text.includes("Brother"));
  assert.ok(text.includes("The Nether"));
});

test("route handler /api/radar: GET returns radar state", async () => {
  const res = await GET();
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.ok, true);
  assert.ok(Array.isArray(json.data.players));
});

test("route handler /api/radar: POST validates secret and updates store", async () => {
  process.env.TELEGRAM_WEBHOOK_SECRET = "fome_secret_webhook_2026";

  const req = new Request("http://localhost/api/radar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: "fome_secret_webhook_2026",
      players: [
        {
          name: "Soroqn",
          x: 150,
          y: 68,
          z: -100,
          dimension: "overworld",
        },
      ],
    }),
  });

  const res = await POST(req);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.ok, true);
  assert.equal(json.count, 1);
});
