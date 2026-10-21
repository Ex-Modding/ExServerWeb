"use client";

import React from "react";

export interface BreadcrumbPoint {
  x: number;
  z: number;
  timestamp: number;
}

export interface PlayerTrail {
  playerName: string;
  color: string;
  points: BreadcrumbPoint[];
  currentLocation?: { x: number; y: number; z: number };
}

interface BreadcrumbOverlayProps {
  isStealthActive: boolean;
  trails?: PlayerTrail[];
}

const DEFAULT_DEMO_TRAILS: PlayerTrail[] = [
  {
    playerName: "Soroqn",
    color: "#a1a1aa",
    points: [
      { x: 120, z: -250, timestamp: Date.now() - 600000 },
      { x: 145, z: -230, timestamp: Date.now() - 300000 },
      { x: 160, z: -210, timestamp: Date.now() - 60000 },
    ],
    currentLocation: { x: 165, y: 72, z: -205 },
  },
  {
    playerName: "Brother",
    color: "#71717a",
    points: [
      { x: -50, z: 80, timestamp: Date.now() - 500000 },
      { x: -35, z: 95, timestamp: Date.now() - 200000 },
      { x: -20, z: 110, timestamp: Date.now() - 30000 },
    ],
    currentLocation: { x: -15, y: 68, z: 115 },
  },
];

export function BreadcrumbOverlay({
  isStealthActive,
  trails = DEFAULT_DEMO_TRAILS,
}: BreadcrumbOverlayProps) {
  // CRITICAL STEALTH INVARIANT: Coordinates completely masked during Hide & Seek
  if (isStealthActive) {
    return (
      <div className="absolute bottom-3 left-3 z-20 pointer-events-auto select-none">
        <div className="border border-[#2e2316] bg-[#0f0e0b]/95 px-3 py-2 text-[11px] font-mono text-[#b38346] shadow-sm backdrop-blur-sm flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#b38346]" />
          <span>TRACES: MASKED_BY_INVARIANT</span>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-3 left-3 z-20 pointer-events-auto select-none">
      <div className="border border-[#222222] bg-[#0f0f0f]/95 px-3 py-2.5 text-xs font-mono shadow-sm backdrop-blur-sm flex flex-col gap-1.5 min-w-[200px]">
        <div className="text-[10px] text-[#555555] uppercase tracking-wider font-semibold border-b border-[#1f1f1f] pb-1 flex items-center justify-between">
          <span>TRACES // ACTIVE</span>
          <span className="text-[#333333]">[2/2]</span>
        </div>
        <div className="flex flex-col gap-1 pt-0.5">
          {trails.map((t) => (
            <div
              key={t.playerName}
              className="flex items-center justify-between gap-3 text-[11px]"
            >
              <span className="text-[#ededed] font-medium">{t.playerName}</span>
              <span className="text-[#71717a] font-mono text-[10px]">
                {t.currentLocation
                  ? `[${t.currentLocation.x}, ${t.currentLocation.z}]`
                  : "LINKED"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
