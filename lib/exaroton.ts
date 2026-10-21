/**
 * Exaroton REST API Client
 * Docs: https://developers.exaroton.com/
 */

export interface ServerStatusResult {
  id?: string;
  name?: string;
  address?: string;
  status: string;
  rawStatus?: number;
  host?: string;
  port?: number;
  players: {
    max: number;
    count: number;
    list: string[];
  };
  memory?: {
    current: number;
  };
  software?: {
    name: string;
    version: string;
  };
}

export type ExarotonServerStatus = ServerStatusResult;

const EXAROTON_API_BASE = "https://api.exaroton.com/v1";

type MockStatusHandler = () => Promise<ServerStatusResult | null>;
type MockCommandHandler = (command: string) => Promise<boolean>;

let mockStatusHandler: MockStatusHandler | null = null;
let mockCommandHandler: MockCommandHandler | null = null;

export function setMockExarotonHandlers(
  statusHandler?: MockStatusHandler | null,
  commandHandler?: MockCommandHandler | null
) {
  mockStatusHandler = statusHandler ?? null;
  mockCommandHandler = commandHandler ?? null;
}

function getHeaders(): HeadersInit {
  const token = process.env.EXAROTON_API_TOKEN;
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token || ""}`,
  };
}

function getServerId(): string {
  const id = process.env.EXAROTON_SERVER_ID;
  if (!id) {
    throw new Error("EXAROTON_SERVER_ID is not configured in .env");
  }
  return id;
}

export function mapStatusCode(status: number): string {
  switch (status) {
    case 0:
      return "OFFLINE";
    case 1:
      return "ONLINE";
    case 2:
      return "STARTING";
    case 3:
      return "STOPPING";
    case 4:
      return "RESTARTING";
    case 5:
      return "SAVING";
    case 6:
      return "LOADING";
    case 7:
      return "CRASHED";
    case 8:
      return "PENDING";
    case 10:
      return "PREPARING";
    default:
      return "UNKNOWN";
  }
}

export const statusNumberToText = mapStatusCode;

export async function fetchServerStatus(): Promise<ServerStatusResult | null> {
  if (mockStatusHandler) {
    return await mockStatusHandler();
  }

  const token = process.env.EXAROTON_API_TOKEN;
  const id = process.env.EXAROTON_SERVER_ID;

  if (!token || !id) {
    return null;
  }

  try {
    const res = await fetch(`${EXAROTON_API_BASE}/servers/${id}`, {
      headers: getHeaders(),
      next: { revalidate: 5 },
    });

    if (!res.ok) {
      console.error(`[Exaroton] Status error: ${res.status} ${res.statusText}`);
      return null;
    }

    const json = await res.json();
    if (!json.success || !json.data) {
      return null;
    }

    const data = json.data;
    return {
      id: data.id,
      name: data.name,
      address: data.address,
      status: mapStatusCode(data.status),
      rawStatus: data.status,
      host: data.host,
      port: data.port,
      players: {
        max: data.players?.max ?? 20,
        count: data.players?.count ?? 0,
        list: data.players?.list ?? [],
      },
      memory: {
        current: data.memory?.current ?? 0,
      },
      software: data.software
        ? {
            name: data.software.name,
            version: data.software.version,
          }
        : undefined,
    };
  } catch (err) {
    console.error("[Exaroton] Failed to query server status:", err);
    return null;
  }
}

export const getServerStatus = fetchServerStatus;

export async function startServer(): Promise<{ success: boolean; message?: string }> {
  if (mockCommandHandler) {
    const ok = await mockCommandHandler("start");
    return { success: ok, message: ok ? "Server starting" : "Failed to start" };
  }

  const id = getServerId();
  const res = await fetch(`${EXAROTON_API_BASE}/servers/${id}/start`, {
    method: "POST",
    headers: getHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  return { success: res.ok, message: json.error || (res.ok ? "Server starting" : "Failed to start") };
}

export async function stopServer(): Promise<{ success: boolean; message?: string }> {
  if (mockCommandHandler) {
    const ok = await mockCommandHandler("stop");
    return { success: ok, message: ok ? "Server stopping" : "Failed to stop" };
  }

  const id = getServerId();
  const res = await fetch(`${EXAROTON_API_BASE}/servers/${id}/stop`, {
    method: "POST",
    headers: getHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  return { success: res.ok, message: json.error || (res.ok ? "Server stopping" : "Failed to stop") };
}

export async function executeCommand(command: string): Promise<{ success: boolean; message?: string }> {
  if (mockCommandHandler) {
    const ok = await mockCommandHandler(command);
    return { success: ok, message: ok ? "Command executed" : "Failed to execute" };
  }

  const id = getServerId();
  const res = await fetch(`${EXAROTON_API_BASE}/servers/${id}/command`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ command }),
  });
  const json = await res.json().catch(() => ({}));
  return { success: res.ok, message: json.error || (res.ok ? "Command executed" : "Failed to execute command") };
}

export async function spawnCarpetBot(name: string = "Steve"): Promise<{ success: boolean; message?: string }> {
  return await executeCommand(`/player ${name} spawn`);
}

export async function killCarpetBot(name: string = "Steve"): Promise<{ success: boolean; message?: string }> {
  return await executeCommand(`/player ${name} kill`);
}
