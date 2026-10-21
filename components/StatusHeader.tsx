"use client";

import { useState } from "react";
import { Copy, Check, Users, Shield, Radio } from "lucide-react";
import { triggerHaptic } from "./TelegramMiniAppInit";

interface StatusHeaderProps {
  online: boolean;
  statusText: string;
  address: string;
  playerCount: number;
  maxPlayers: number;
  playerList: string[];
}

export default function StatusHeader({
  online,
  statusText,
  address,
  playerCount,
  maxPlayers,
  playerList,
}: StatusHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    triggerHaptic("light");
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const getStatusBadge = () => {
    switch (statusText) {
      case "online":
        return {
          dot: "bg-brand-green animate-pulse shadow-[0_0_8px_#2ea043]",
          text: "В сети",
          badge: "bg-brand-green/10 border-brand-green/30 text-green-400",
        };
      case "starting":
        return {
          dot: "bg-brand-yellow animate-ping",
          text: "Запуск...",
          badge: "bg-brand-yellow/10 border-brand-yellow/30 text-yellow-400",
        };
      default:
        return {
          dot: "bg-gray-500",
          text: "Спит",
          badge: "bg-gray-800/60 border-border text-gray-400",
        };
    }
  };

  const statusStyle = getStatusBadge();

  return (
    <header className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
      {/* Brand & State Pill */}
      <div className="flex items-center gap-2 pointer-events-auto bg-card/85 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-border/80 shadow-xl">
        <div className="flex items-center gap-2 font-bold text-sm tracking-wide text-white">
          <Shield className="w-4 h-4 text-brand-blue" />
          <span>FoMe</span>
          <span className="text-[10px] text-gray-500 font-mono bg-background/80 px-1.5 py-0.5 rounded border border-border">
            1.21.1
          </span>
        </div>

        <div className="h-3 w-px bg-border mx-1" />

        <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl border ${statusStyle.badge}`}>
          <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
          <span>{statusStyle.text}</span>
        </div>
      </div>

      {/* Server Address & Players */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Address Chip */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 bg-card/85 hover:bg-card active:scale-95 text-xs font-mono text-gray-300 px-3.5 py-2 rounded-2xl border border-border/80 shadow-xl backdrop-blur-md transition-all"
          title="Нажмите, чтобы скопировать адрес"
        >
          <Radio className="w-3.5 h-3.5 text-brand-purple" />
          <span className="font-semibold text-white">{address}</span>
          {copied ? (
            <Check className="w-3.5 h-3.5 text-brand-green" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-gray-400 hover:text-white" />
          )}
        </button>

        {/* Players Online Pill */}
        <div className="flex items-center gap-2 bg-card/85 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-border/80 shadow-xl text-xs font-medium text-gray-300">
          <Users className="w-3.5 h-3.5 text-brand-blue" />
          <span className="text-white font-bold">{playerCount}</span>
          <span className="text-gray-500">/ {maxPlayers}</span>

          {playerList.length > 0 && (
            <div className="hidden sm:flex items-center gap-1 ml-1 pl-2 border-l border-border">
              {playerList.slice(0, 3).map((name) => (
                <span
                  key={name}
                  className="bg-background/80 border border-border text-[11px] text-gray-300 px-1.5 py-0.5 rounded"
                >
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
