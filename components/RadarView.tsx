"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Compass,
  Plus,
  Minus,
  Navigation,
  Layers,
  Eye,
  EyeOff,
  Crosshair,
} from "lucide-react";

interface PlayerRadarPoint {
  name: string;
  x: number;
  y: number;
  z: number;
  dimension: string;
  updatedAt: number;
}

interface PlayerTrail {
  playerName: string;
  color: string;
  points: Array<{ x: number; z: number; timestamp: number }>;
  currentLocation?: { x: number; y: number; z: number; dimension: string };
}

interface RadarData {
  players: PlayerRadarPoint[];
  trails: PlayerTrail[];
  count: number;
  updatedAt: number | null;
}

interface RadarViewProps {
  isOnline: boolean;
  isGameActive?: boolean;
}

export default function RadarView({ isOnline, isGameActive = false }: RadarViewProps) {
  const [data, setData] = useState<RadarData>({
    players: [],
    trails: [],
    count: 0,
    updatedAt: null,
  });

  const [zoom, setZoom] = useState(0.8); // Scale factor
  const [offset, setOffset] = useState({ x: 0, z: 0 }); // Center offset
  const [selectedDimension, setSelectedDimension] = useState<string>("overworld");
  const [showTrails, setShowTrails] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Poll /api/radar every 3 seconds
  useEffect(() => {
    let isMounted = true;

    const fetchRadar = async () => {
      try {
        const res = await fetch("/api/radar");
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.data) {
            setData(json.data);
          }
        }
      } catch {
        // Fallback
      }
    };

    fetchRadar();
    const interval = setInterval(fetchRadar, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleZoomIn = () => setZoom((z) => Math.min(2.5, z + 0.25));
  const handleZoomOut = () => setZoom((z) => Math.max(0.2, z - 0.25));
  const handleResetCenter = () => setOffset({ x: 0, z: 0 });

  const activePlayers = data.players.filter((p) =>
    selectedDimension === "all"
      ? true
      : p.dimension.toLowerCase().includes(selectedDimension)
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#0a0c10] overflow-hidden select-none"
    >
      {/* Background Tech Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `linear-gradient(to right, #38bdf820 1px, transparent 1px), linear-gradient(to bottom, #38bdf820 1px, transparent 1px)`,
          backgroundSize: `${40 * zoom}px ${40 * zoom}px`,
          backgroundPosition: `${offset.x % (40 * zoom)}px ${offset.z % (40 * zoom)}px`,
        }}
      />

      {/* Stealth Mode Alert Banner */}
      {isGameActive && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-amber-500/10 border border-amber-500/40 text-amber-300 px-5 py-2 rounded-full backdrop-blur-md shadow-2xl flex items-center gap-2 text-xs font-semibold animate-pulse">
          <span>🕵️</span>
          <span>ПРЯТКИ АКТИВНЫ: Местоположение игроков засекречено</span>
        </div>
      )}

      {/* Offline HUD State */}
      {!isOnline && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 animate-pulse">
            <Compass className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Сервер офлайн</h2>
          <p className="text-sm text-gray-400 max-w-sm">
            Запусти сервер через пульт в Telegram-боте, и здесь появится тактический радар игроков.
          </p>
        </div>
      )}

      {/* 2D Tactical Radar SVG Canvas */}
      <svg className="w-full h-full absolute inset-0">
        <defs>
          {/* Radar Center Glow */}
          <radialGradient id="radarPulse" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Dynamic Center Translation */}
        <g
          transform={`translate(${
            (containerRef.current?.clientWidth ?? 800) / 2 + offset.x
          }, ${
            (containerRef.current?.clientHeight ?? 600) / 2 + offset.z
          })`}
        >
          {/* Range Distance Circles */}
          {[100, 250, 500, 1000].map((radius) => (
            <g key={radius}>
              <circle
                r={radius * zoom}
                fill="none"
                stroke="#1e293b"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={radius * zoom + 4}
                y={-4}
                fill="#475569"
                fontSize="9"
                fontFamily="monospace"
              >
                {radius}m
              </text>
            </g>
          ))}

          {/* Coordinate Crosshair Axes */}
          <line x1="-3000" y1="0" x2="3000" y2="0" stroke="#1e293b" strokeWidth="1" />
          <line x1="0" y1="-3000" x2="0" y2="3000" stroke="#1e293b" strokeWidth="1" />

          {/* Cardinal Directions */}
          <text x="0" y={-260 * zoom} textAnchor="middle" fill="#06b6d4" fontSize="11" fontWeight="bold">N (-Z)</text>
          <text x="0" y={270 * zoom} textAnchor="middle" fill="#64748b" fontSize="10">S (+Z)</text>
          <text x={270 * zoom} y="4" textAnchor="start" fill="#64748b" fontSize="10">E (+X)</text>
          <text x={-275 * zoom} y="4" textAnchor="end" fill="#64748b" fontSize="10">W (-X)</text>

          {/* World Spawn Point (0, 0) */}
          <g>
            <circle r="4" fill="#64748b" />
            <circle r="8" fill="none" stroke="#64748b" strokeWidth="1" />
            <text x="12" y="4" fill="#94a3b8" fontSize="10" fontFamily="monospace">
              Спавн [0, 0]
            </text>
          </g>

          {/* Breadcrumb Trail Lines (if not stealth) */}
          {!isGameActive && showTrails && data.trails.map((trail) => {
            if (trail.points.length < 2) return null;
            const pathData = trail.points
              .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x * zoom} ${p.z * zoom}`)
              .join(" ");

            return (
              <path
                key={trail.playerName}
                d={pathData}
                fill="none"
                stroke={trail.color}
                strokeWidth="2"
                strokeOpacity="0.4"
                strokeDasharray="3 3"
              />
            );
          })}

          {/* Active Player Pins (masked during Hide & Seek) */}
          {!isGameActive && activePlayers.map((player) => {
            const isSoroqn = player.name.toLowerCase().includes("soroqn");
            const pinColor = isSoroqn ? "#06b6d4" : "#f97316";

            return (
              <g
                key={player.name}
                transform={`translate(${player.x * zoom}, ${player.z * zoom})`}
                className="transition-all duration-500 ease-out"
              >
                {/* Radar Ping Ripple */}
                <circle
                  r="14"
                  fill="none"
                  stroke={pinColor}
                  strokeWidth="1.5"
                  className="animate-ping opacity-75"
                />
                {/* Outer Glow */}
                <circle r="8" fill={pinColor} fillOpacity="0.3" />
                {/* Core Player Dot */}
                <circle r="4" fill={pinColor} />

                {/* Player Tag Box */}
                <g transform="translate(10, -10)">
                  <rect
                    x="-4"
                    y="-12"
                    width={player.name.length * 8 + 65}
                    height="20"
                    rx="4"
                    fill="#0f172a"
                    fillOpacity="0.85"
                    stroke="#334155"
                    strokeWidth="1"
                  />
                  <text
                    x="2"
                    y="2"
                    fill="#f8fafc"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {player.name}
                  </text>
                  <text
                    x={player.name.length * 8 + 8}
                    y="2"
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    Y:{player.y}
                  </text>
                </g>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Floating HUD Controls (Top Right) */}
      <div className="absolute top-20 right-6 z-20 flex flex-col gap-2 bg-slate-900/80 backdrop-blur-md border border-slate-800 p-2 rounded-2xl shadow-xl">
        <button
          onClick={handleZoomIn}
          className="p-2.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          title="Приблизить"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          title="Отдалить"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetCenter}
          className="p-2.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          title="Центрировать на спавне"
        >
          <Crosshair className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowTrails((v) => !v)}
          className={`p-2.5 rounded-xl transition-all ${
            showTrails ? "text-cyan-400 bg-cyan-950/40" : "text-slate-500 hover:bg-slate-800"
          }`}
          title="Показывать следы"
        >
          {showTrails ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>

      {/* Floating Dimension Switcher (Bottom Left) */}
      <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1.5 rounded-2xl shadow-xl">
        <button
          onClick={() => setSelectedDimension("overworld")}
          className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all ${
            selectedDimension === "overworld"
              ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          🌲 Overworld
        </button>
        <button
          onClick={() => setSelectedDimension("the_nether")}
          className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all ${
            selectedDimension === "the_nether"
              ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          🔥 Nether
        </button>
        <button
          onClick={() => setSelectedDimension("the_end")}
          className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all ${
            selectedDimension === "the_end"
              ? "bg-purple-500 text-white shadow-md shadow-purple-500/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          🌌 The End
        </button>
      </div>

      {/* Live Coordinates Readout (Bottom Right) */}
      <div className="absolute bottom-6 right-6 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-mono text-slate-300">
        <div className="flex items-center gap-1.5 text-cyan-400">
          <Navigation className="w-3.5 h-3.5" />
          <span>RADAR // LIVE</span>
        </div>
        <span className="text-slate-600">|</span>
        <span>Онлайн: {data.count}</span>
        <span className="text-slate-600">|</span>
        <span>Зум: {Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
}
