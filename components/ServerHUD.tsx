"use client";

import React, { useEffect, useState, useCallback } from "react";
import { ServerStatusResult } from "@/lib/exaroton";
import { useTelegramWebApp } from "@/hooks/useTelegramWebApp";

interface ServerHUDProps {
  initialStatus?: ServerStatusResult;
}

export function ServerHUD({ initialStatus }: ServerHUDProps) {
  const [status, setStatus] = useState<ServerStatusResult | null>(
    initialStatus ?? null,
  );
  const [isLoading, setIsLoading] = useState(!initialStatus);
  const { triggerHaptic } = useTelegramWebApp();

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/status");
      if (res.ok) {
        const json = await res.json();
        if (json.ok && json.data) {
          setStatus(json.data);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch server status:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleManualRefresh = () => {
    triggerHaptic("light");
    setIsLoading(true);
    fetchStatus();
  };

  const isOnline = status?.status === "ONLINE";
  const isPending =
    status?.status === "STARTING" ||
    status?.status === "LOADING" ||
    status?.status === "RESTARTING";

  return (
    <div className="absolute top-3 left-3 right-3 z-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pointer-events-none select-none">
      {/* Node / Server Panel */}
      <div className="pointer-events-auto flex items-center gap-3 border border-[#222222] bg-[#0f0f0f]/95 px-3 py-2 text-xs font-mono shadow-sm backdrop-blur-sm">
        {/* Softcery-style lamp */}
        <div className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isOnline
                ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]"
                : isPending
                  ? "bg-amber-400 animate-pulse"
                  : "bg-zinc-600"
            }`}
          />
          <span className="text-[11px] font-semibold tracking-wider uppercase text-[#ededed]">
            {status?.status ?? (isLoading ? "CONNECTING" : "OFFLINE")}
          </span>
        </div>

        <span className="text-[#333333]">|</span>

        <span className="text-[#8a8a8a] text-[11px]">
          {status?.host
            ? `${status.host}:${status.port ?? 25565}`
            : (status?.address ?? "fome.exaroton.me")}
        </span>
      </div>

      {/* Players Counter & Control */}
      <div className="pointer-events-auto flex items-center gap-1.5">
        <div className="flex items-center gap-2 border border-[#222222] bg-[#0f0f0f]/95 px-3 py-2 text-[11px] font-mono text-[#8a8a8a] shadow-sm backdrop-blur-sm">
          <span>USERS:</span>
          <span
            className={`font-semibold ${status?.players?.count ? "text-[#ededed]" : "text-[#8a8a8a]"}`}
          >
            {status?.players?.count ?? 0} / {status?.players?.max ?? 20}
          </span>
          {status?.players?.list && status.players.list.length > 0 && (
            <span className="text-[#555555] ml-1">
              [{status.players.list.join(", ")}]
            </span>
          )}
        </div>

        <button
          onClick={handleManualRefresh}
          className="border border-[#222222] bg-[#0f0f0f]/95 hover:bg-[#1a1a1a] hover:border-[#333333] text-[#8a8a8a] hover:text-[#ededed] p-2 transition-colors"
          title="Refresh telemetry"
          aria-label="Refresh telemetry"
        >
          <svg
            className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-zinc-300" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
