import { NextResponse } from "next/server";
import { getServerStatus } from "@/lib/exaroton";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await getServerStatus();
  const isOnline = status?.status === "ONLINE";

  return NextResponse.json({
    ok: true,
    data: status,
    online: isOnline,
    statusText: (status?.status ?? "OFFLINE").toLowerCase(),
    address: status?.address || status?.host || "fome.exaroton.me",
    players: status?.players ?? { count: 0, max: 20, list: [] },
    memory: status?.memory?.current ?? 0,
    bluemapUrl: process.env.NEXT_PUBLIC_BLUEMAP_URL || "",
  });
}
