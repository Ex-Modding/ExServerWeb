import { getGameState, updateGameState, GamePhase } from "@/lib/gameState";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const state = getGameState();
  return Response.json({
    ok: true,
    data: state,
  });
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { phase, mode, timeRemainingSeconds } = body;

    const updated = updateGameState({
      phase: phase as GamePhase,
      mode: mode,
      timeRemainingSeconds:
        typeof timeRemainingSeconds === "number"
          ? timeRemainingSeconds
          : undefined,
    });

    return Response.json({
      ok: true,
      data: updated,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ ok: false, error: msg }, { status: 400 });
  }
}
