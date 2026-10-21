import { NextResponse } from "next/server";
import { getRadarState, updateRadarPlayers } from "@/lib/radarStore";

export const dynamic = "force-dynamic";

interface RadarIncomingPayload {
  secret?: string;
  players?: Array<{
    name: string;
    x: number;
    y: number;
    z: number;
    dimension: string;
  }>;
}

export async function GET() {
  const state = getRadarState();
  return NextResponse.json({
    ok: true,
    data: state,
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as RadarIncomingPayload;
    const headerSecret =
      req.headers.get("x-notify-secret") ||
      req.headers.get("x-telegram-bot-api-secret-token");
    const configuredSecret =
      process.env.TELEGRAM_WEBHOOK_SECRET || "fome_secret_webhook_2026";

    // Validate secret token
    if (body.secret !== configuredSecret && headerSecret !== configuredSecret) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const incoming = Array.isArray(body.players) ? body.players : [];
    updateRadarPlayers(incoming);

    return NextResponse.json({
      ok: true,
      count: incoming.length,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error("[Radar API Error]", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
