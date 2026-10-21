export type GamePhase =
  "IDLE" | "VOTING" | "HIDING" | "SEEKING" | "INTERMISSION";

export interface GameState {
  phase: GamePhase;
  mode: "CLASSIC" | "MOB";
  timeRemainingSeconds: number;
  isStealthActive: boolean;
  lastUpdated: string;
}

// In-memory game state store for the serverless instance
let currentGameState: GameState = {
  phase: "IDLE",
  mode: "CLASSIC",
  timeRemainingSeconds: 0,
  isStealthActive: false,
  lastUpdated: new Date().toISOString(),
};

/**
 * Checks whether Hide & Seek stealth concealment invariant is active.
 * During HIDING or SEEKING, live coordinates and movement trails must be masked.
 */
export function isStealthModeActive(phase: GamePhase): boolean {
  return phase === "HIDING" || phase === "SEEKING";
}

export function getGameState(): GameState {
  return currentGameState;
}

export function updateGameState(
  update: Partial<Omit<GameState, "isStealthActive" | "lastUpdated">>,
): GameState {
  const newPhase = update.phase ?? currentGameState.phase;
  currentGameState = {
    ...currentGameState,
    ...update,
    phase: newPhase,
    isStealthActive: isStealthModeActive(newPhase),
    lastUpdated: new Date().toISOString(),
  };
  return currentGameState;
}
