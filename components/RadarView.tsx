"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Compass,
  Plus,
  Minus,
  Navigation,
  Eye,
  EyeOff,
  Crosshair,
  User,
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
  telemetry?: {
    tps: number;
    mspt: number;
    cpu: number;
  } | null;
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
    telemetry: null,
    count: 0,
    updatedAt: null,
  });

  const [zoom, setZoom] = useState(0.5);
  const [offset, setOffset] = useState({ x: 0, z: 0 });
  const [selectedDimension, setSelectedDimension] = useState<string>("overworld");
  const [showTrails, setShowTrails] = useState(true);
  const [hasAutoCentered, setHasAutoCentered] = useState(false);

  // Dragging interaction state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; offsetX: number; offsetZ: number }>({
    mouseX: 0,
    mouseY: 0,
    offsetX: 0,
    offsetZ: 0,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Center camera on specific world coordinates
  const centerOnCoordinates = useCallback(
    (worldX: number, worldZ: number) => {
      setOffset({
        x: -worldX * zoom,
        z: -worldZ * zoom,
      });
    },
    [zoom]
  );

  // Fetch /api/radar every 2.5 seconds
  useEffect(() => {
    let isMounted = true;

    const fetchRadar = async () => {
      try {
        const res = await fetch("/api/radar");
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.data) {
            setData(json.data);

            // Auto-center on the first online player on initial load
            if (!hasAutoCentered && json.data.players && json.data.players.length > 0) {
              const p = json.data.players[0];
              setOffset({
                x: -p.x * 0.5,
                z: -p.z * 0.5,
              });
              setHasAutoCentered(true);
            }
          }
        }
      } catch {
        // Fallback
      }
    };

    fetchRadar();
    const interval = setInterval(fetchRadar, 2500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [hasAutoCentered]);

  // Mouse / Touch drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      offsetX: offset.x,
      offsetZ: offset.z,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;
    setOffset({
      x: dragStartRef.current.offsetX + dx,
      z: dragStartRef.current.offsetZ + dy,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        mouseX: e.touches[0].clientX,
        mouseY: e.touches[0].clientY,
        offsetX: offset.x,
        offsetZ: offset.z,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartRef.current.mouseX;
    const dy = e.touches[0].clientY - dragStartRef.current.mouseY;
    setOffset({
      x: dragStartRef.current.offsetX + dx,
      z: dragStartRef.current.offsetZ + dy,
    });
  };

  const handleTouchEnd = () => setIsDragging(false);

  const handleZoomIn = () => setZoom((z) => Math.min(2.0, z + 0.2));
  const handleZoomOut = () => setZoom((z) => Math.max(0.15, z - 0.2));
  const handleResetSpawn = () => setOffset({ x: 0, z: 0 });

  const activePlayers = data.players.filter((p) =>
    selectedDimension === "all"
      ? true
      : p.dimension.toLowerCase().includes(selectedDimension)
  );

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full h-full bg-[#07090e] overflow-hidden select-none cursor-${
        isDragging ? "grabbing" : "grab"
      }`}
    >
      {/* Background High-Tech Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `linear-gradient(to right, #38bdf820 1px, transparent 1px), linear-gradient(to bottom, #38bdf820 1px, transparent 1px)`,
          backgroundSize: `${50 * zoom}px ${50 * zoom}px`,
          backgroundPosition: `${offset.x % (50 * zoom)}px ${offset.z % (50 * zoom)}px`,
        }}
      />

      {/* Stealth Alert */}
      {isGameActive && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-amber-500/15 border border-amber-500/40 text-amber-300 px-5 py-2 rounded-full backdrop-blur-md shadow-2xl flex items-center gap-2 text-xs font-semibold animate-pulse">
          <span>🕵️</span>
          <span>ПРЯТКИ АКТИВНЫ: Местоположение игроков засекречено</span>
        </div>
      )}

      {/* Online Player Quick Focus Chips (Top Left) */}
      {!isGameActive && data.players.length > 0 && (
        <div className="absolute top-20 left-6 z-20 flex flex-wrap gap-2 max-w-sm pointer-events-auto">
          {data.players.map((p) => {
            const isSoroqn = p.name.toLowerCase().includes("soroqn");
            return (
              <button
                key={p.name}
                onClick={(e) => {
                  e.stopPropagation();
                  centerOnCoordinates(p.x, p.z);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono backdrop-blur-md border shadow-lg transition-all active:scale-95 ${
                  isSoroqn
                    ? "bg-cyan-950/80 border-cyan-500/40 text-cyan-200 hover:bg-cyan-900"
                    : "bg-orange-950/80 border-orange-500/40 text-orange-200 hover:bg-orange-900"
                }`}
                title="Нажми для центрирования камеры на игроке"
              >
                <User className="w-3.5 h-3.5" />
                <span className="font-bold">{p.name}</span>
                <span className="text-[10px] opacity-75">
                  [{p.x}, {p.z}]
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 2D Tactical Radar SVG Canvas */}
      <svg className="w-full h-full absolute inset-0 pointer-events-none">
        <g
          transform={`translate(${
            (containerRef.current?.clientWidth ?? 800) / 2 + offset.x
          }, ${
            (containerRef.current?.clientHeight ?? 600) / 2 + offset.z
          })`}
        >
          {/* Distance Rings from Spawn */}
          {[250, 500, 1000, 2000, 3000].map((radius) => (
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

          {/* Coordinate Crosshairs */}
          <line x1="-10000" y1="0" x2="10000" y2="0" stroke="#1e293b" strokeWidth="1" />
          <line x1="0" y1="-10000" x2="0" y2="10000" stroke="#1e293b" strokeWidth="1" />

          {/* Cardinal Directions */}
          <text x="0" y={-500 * zoom} textAnchor="middle" fill="#06b6d4" fontSize="12" fontWeight="bold">N (-Z)</text>
          <text x="0" y={520 * zoom} textAnchor="middle" fill="#64748b" fontSize="11">S (+Z)</text>
          <text x={520 * zoom} y="4" textAnchor="start" fill="#64748b" fontSize="11">E (+X)</text>
          <text x={-520 * zoom} y="4" textAnchor="end" fill="#64748b" fontSize="11">W (-X)</text>

          {/* Spawn Marker */}
          <g>
            <circle r="4" fill="#64748b" />
            <circle r="8" fill="none" stroke="#64748b" strokeWidth="1" />
            <text x="12" y="4" fill="#94a3b8" fontSize="10" fontFamily="monospace">
              Спавн [0, 0]
            </text>
          </g>

          {/* Trails */}
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
                strokeWidth="2.5"
                strokeOpacity="0.45"
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Players */}
          {!isGameActive && activePlayers.map((player) => {
            const isSoroqn = player.name.toLowerCase().includes("soroqn");
            const pinColor = isSoroqn ? "#06b6d4" : "#f97316";

            return (
              <g
                key={player.name}
                transform={`translate(${player.x * zoom}, ${player.z * zoom})`}
              >
                {/* Ping wave */}
                <circle
                  r="18"
                  fill="none"
                  stroke={pinColor}
                  strokeWidth="1.5"
                  className="animate-ping opacity-75"
                />
                <circle r="10" fill={pinColor} fillOpacity="0.25" />
                <circle r="5" fill={pinColor} />

                {/* Badge Tag */}
                <g transform="translate(12, -12)">
                  <rect
                    x="-6"
                    y="-14"
                    width={player.name.length * 8 + 70}
                    height="22"
                    rx="5"
                    fill="#0a0f1d"
                    fillOpacity="0.9"
                    stroke={pinColor}
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

      {/* Floating Radar Controls (Top Right) */}
      <div className="absolute top-20 right-6 z-20 flex flex-col gap-2 bg-slate-900/80 backdrop-blur-md border border-slate-800 p-2 rounded-2xl shadow-xl pointer-events-auto">
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
          onClick={handleResetSpawn}
          className="p-2.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          title="Центр на спавн"
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

      {/* Dimension Switcher (Bottom Left) */}
      <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1.5 rounded-2xl shadow-xl pointer-events-auto">
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

      {/* Telemetry & Coordinates Bar (Bottom Right) */}
      <div className="absolute bottom-6 right-6 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-mono text-slate-300 pointer-events-auto">
        <div className="flex items-center gap-1.5 text-cyan-400">
          <Navigation className="w-3.5 h-3.5" />
          <span>RADAR // LIVE</span>
        </div>
        <span className="text-slate-600">|</span>
        <span>Онлайн: {data.count}</span>
        {data.telemetry && (
          <>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-bold">TPS: {data.telemetry.tps}</span>
            <span className="text-slate-600">|</span>
            <span>CPU: {data.telemetry.cpu}%</span>
          </>
        )}
        <span className="text-slate-600">|</span>
        <span>Зум: {Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
}
