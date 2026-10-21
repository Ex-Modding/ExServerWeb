"use client";

import { useEffect, useState } from "react";
import StatusHeader from "@/components/StatusHeader";
import BlueMapView from "@/components/BlueMapView";
import TelegramMiniAppInit from "@/components/TelegramMiniAppInit";

interface ServerState {
  online: boolean;
  statusText: string;
  address: string;
  players: {
    count: number;
    max: number;
    list: string[];
  };
  bluemapUrl: string;
}

export default function Home() {
  const [serverState, setServerState] = useState<ServerState>({
    online: false,
    statusText: "offline",
    address: "fome.exaroton.me",
    players: { count: 0, max: 20, list: [] },
    bluemapUrl: process.env.NEXT_PUBLIC_BLUEMAP_URL || "",
  });

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/status");
      if (res.ok) {
        const data = await res.json();
        setServerState(data);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchStatus();
    // Refresh status every 10 seconds
    const interval = setInterval(fetchStatus, 10_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-background">
      <TelegramMiniAppInit />

      {/* Top Floating Glass HUD */}
      <StatusHeader
        online={serverState.online}
        statusText={serverState.statusText}
        address={serverState.address}
        playerCount={serverState.players.count}
        maxPlayers={serverState.players.max}
        playerList={serverState.players.list}
      />

      {/* Main 3D BlueMap / Fallback Viewport */}
      <BlueMapView
        bluemapUrl={serverState.bluemapUrl}
        isOnline={serverState.online}
      />
    </main>
  );
}
