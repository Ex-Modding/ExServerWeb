import test from "node:test";
import assert from "node:assert/strict";
import {
  isStealthModeActive,
  getGameState,
  updateGameState,
} from "../lib/gameState.ts";
import { GET, POST } from "../app/api/game-state/route.ts";

test("isStealthModeActive: correctly enforces stealth invariant during Hide & Seek", () => {
  assert.equal(isStealthModeActive("HIDING"), true);
  assert.equal(isStealthModeActive("SEEKING"), true);
  assert.equal(isStealthModeActive("IDLE"), false);
  assert.equal(isStealthModeActive("VOTING"), false);
  assert.equal(isStealthModeActive("INTERMISSION"), false);
});

test("updateGameState: transitions state and toggles stealth flag", () => {
  updateGameState({ phase: "IDLE", mode: "CLASSIC" });
  let state = getGameState();
  assert.equal(state.phase, "IDLE");
  assert.equal(state.isStealthActive, false);

  updateGameState({ phase: "HIDING", mode: "MOB", timeRemainingSeconds: 120 });
  state = getGameState();
  assert.equal(state.phase, "HIDING");
  assert.equal(state.isStealthActive, true);
  assert.equal(state.timeRemainingSeconds, 120);

  updateGameState({ phase: "INTERMISSION" });
  state = getGameState();
  assert.equal(state.phase, "INTERMISSION");
  assert.equal(state.isStealthActive, false);
});

test("route handler: GET and POST /api/game-state", async () => {
  // Test POST
  const postReq = new Request("http://localhost/api/game-state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phase: "SEEKING",
      mode: "MOB",
      timeRemainingSeconds: 300,
    }),
  });

  const postRes = await POST(postReq);
  assert.equal(postRes.status, 200);
  const postJson = await postRes.json();
  assert.equal(postJson.ok, true);
  assert.equal(postJson.data.phase, "SEEKING");
  assert.equal(postJson.data.isStealthActive, true);

  // Test GET
  const getRes = await GET();
  assert.equal(getRes.status, 200);
  const getJson = await getRes.json();
  assert.equal(getJson.ok, true);
  assert.equal(getJson.data.phase, "SEEKING");
  assert.equal(getJson.data.isStealthActive, true);
});
