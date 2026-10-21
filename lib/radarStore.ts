export interface PlayerRadarData {
  name: string;
  x: number;
  y: number;
  z: number;
  dimension: string;
  updatedAt: number;
}

export interface RadarBreadcrumb {
  x: number;
  z: number;
  timestamp: number;
}

export interface PlayerTrailData {
  playerName: string;
  color: string;
  points: RadarBreadcrumb[];
  currentLocation?: { x: number; y: number; z: number; dimension: string };
}

export interface ServerTelemetry {
  tps: number;
  mspt: number;
  cpu: number;
  updatedAt: number;
}

// Global in-memory cache across serverless warm invocations
declare global {
  // eslint-disable-next-line no-var
  var __fome_radar_players: Map<string, PlayerRadarData> | undefined;
  // eslint-disable-next-line no-var
  var __fome_radar_trails: Map<string, RadarBreadcrumb[]> | undefined;
  // eslint-disable-next-line no-var
  var __fome_server_telemetry: ServerTelemetry | undefined;
}

const playersMap = globalThis.__fome_radar_players ?? new Map<string, PlayerRadarData>();
const trailsMap = globalThis.__fome_radar_trails ?? new Map<string, RadarBreadcrumb[]>();
let telemetryData: ServerTelemetry = globalThis.__fome_server_telemetry ?? {
  tps: 20.0,
  mspt: 0,
  cpu: 0,
  updatedAt: 0,
};

globalThis.__fome_radar_players = playersMap;
globalThis.__fome_radar_trails = trailsMap;
globalThis.__fome_server_telemetry = telemetryData;

const PLAYER_COLORS: Record<string, string> = {
  soroqn: "#06b6d4", // Cyan
  l_sky2fly_l: "#f97316", // Orange
};

function getPlayerColor(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, color] of Object.entries(PLAYER_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return "#a855f7"; // Default purple
}

export function updateRadarTelemetry(tps?: number, mspt?: number, cpu?: number) {
  if (tps !== undefined || mspt !== undefined || cpu !== undefined) {
    telemetryData = {
      tps: tps !== undefined ? Number(tps.toFixed(1)) : telemetryData.tps,
      mspt: mspt !== undefined ? Number(mspt.toFixed(1)) : telemetryData.mspt,
      cpu: cpu !== undefined ? Math.round(cpu) : telemetryData.cpu,
      updatedAt: Date.now(),
    };
    globalThis.__fome_server_telemetry = telemetryData;
  }
}

export function getServerTelemetry(): ServerTelemetry | null {
  // If telemetry is older than 45s, consider it stale
  if (Date.now() - telemetryData.updatedAt > 45_000) {
    return null;
  }
  return telemetryData;
}

export function updateRadarPlayers(
  incoming: Array<{ name: string; x: number; y: number; z: number; dimension: string }>,
  metrics?: { tps?: number; mspt?: number; cpu?: number }
) {
  const now = Date.now();
  const currentNames = new Set(incoming.map((p) => p.name));

  // Remove offline players
  for (const name of Array.from(playersMap.keys())) {
    if (!currentNames.has(name)) {
      playersMap.delete(name);
    }
  }

  // Update positions & trails
  for (const p of incoming) {
    playersMap.set(p.name, {
      name: p.name,
      x: Math.round(p.x),
      y: Math.round(p.y),
      z: Math.round(p.z),
      dimension: p.dimension.replace("minecraft:", ""),
      updatedAt: now,
    });

    const trail = trailsMap.get(p.name) ?? [];
    trail.push({ x: Math.round(p.x), z: Math.round(p.z), timestamp: now });
    // Keep last 30 breadcrumb points
    if (trail.length > 30) {
      trail.shift();
    }
    trailsMap.set(p.name, trail);
  }

  if (metrics) {
    updateRadarTelemetry(metrics.tps, metrics.mspt, metrics.cpu);
  }
}

export function getRadarState() {
  const players = Array.from(playersMap.values());
  const trails: PlayerTrailData[] = players.map((p) => ({
    playerName: p.name,
    color: getPlayerColor(p.name),
    points: trailsMap.get(p.name) ?? [],
    currentLocation: { x: p.x, y: p.y, z: p.z, dimension: p.dimension },
  }));

  return {
    players,
    trails,
    telemetry: getServerTelemetry(),
    count: players.length,
    updatedAt: players.length > 0 ? Math.max(...players.map((p) => p.updatedAt)) : null,
  };
}

export function formatPlayerCoordsText(): string {
  const { players } = getRadarState();
  if (players.length === 0) {
    return "ℹ️ На сервере сейчас никого нет онлайн.";
  }

  const lines = ["📍 *Координаты игроков онлайн:*", ""];
  for (const p of players) {
    const dimName =
      p.dimension === "the_nether"
        ? "🔥 The Nether"
        : p.dimension === "the_end"
        ? "🌌 The End"
        : "🌲 Overworld";

    lines.push(`• 👤 *${p.name}*: X: \`${p.x}\` | Y: \`${p.y}\` | Z: \`${p.z}\` (${dimName})`);
  }

  return lines.join("\n");
}
