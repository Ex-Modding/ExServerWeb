"use client";

import { useEffect, useState } from "react";
import StatusHeader from "@/components/StatusHeader";
import RadarView from "@/components/RadarView";
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
    address: "soroqn.exaroton.me",
    players: { count: 0, max: 20, list: [] },
    bluemapUrl: process.env.NEXT_PUBLIC_BLUEMAP_URL || "",
  });

  const [viewMode, setViewMode] = useState<"radar" | "bluemap">("radar");

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

      {/* Main Tactical Radar or BlueMap Viewport */}
      {viewMode === "bluemap" && serverState.bluemapUrl ? (
        <BlueMapView
          bluemapUrl={serverState.bluemapUrl}
          isOnline={serverState.online}
        />
      ) : (
        <RadarView isOnline={serverState.online} />
      )}

      {/* Optional Mode Switcher if BlueMap URL exists */}
      {serverState.bluemapUrl && (
        <div className="absolute top-20 left-6 z-20 flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl shadow-lg">
          <button
            onClick={() => setViewMode("radar")}
            className={`px-3 py-1 text-xs rounded-lg transition-all ${
              viewMode === "radar" ? "bg-cyan-500 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Радар 2D
          </button>
          <button
            onClick={() => setViewMode("bluemap")}
            className={`px-3 py-1 text-xs rounded-lg transition-all ${
              viewMode === "bluemap" ? "bg-cyan-500 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            3D BlueMap
          </button>
        </div>
      )}
    </main>
  );
}
