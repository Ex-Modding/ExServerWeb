"use client";

import { useState } from "react";
import { Compass, ExternalLink, RefreshCw, Layers } from "lucide-react";
import { triggerHaptic } from "./TelegramMiniAppInit";

interface BlueMapViewProps {
  bluemapUrl?: string;
  isOnline: boolean;
  isGameActive?: boolean;
}

export default function BlueMapView({
  bluemapUrl,
  isOnline,
  isGameActive = false,
}: BlueMapViewProps) {
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const handleRefresh = () => {
    triggerHaptic("light");
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  // If BlueMap URL is not configured or server is offline, show fallback placeholder
  if (!bluemapUrl || !isOnline) {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#0a0c10] to-[#12161f] text-center p-6 select-none">
        {/* Background Grid Accent */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        <div className="relative z-10 max-w-md bg-card/80 backdrop-blur-md border border-border/80 rounded-2xl p-8 shadow-2xl flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-blue/10 border border-brand-blue/30 flex items-center justify-center text-brand-blue mb-4">
            <Compass className="w-8 h-8 animate-pulse" />
          </div>

          <h2 className="text-xl font-bold tracking-tight text-white mb-2">
            {!isOnline ? "Сервер сейчас спит" : "3D Карта BlueMap"}
          </h2>

          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            {!isOnline
              ? "Сервер выключен для экономии ресурсов. Нажмите кнопку в боте Telegram, чтобы разбудить его!"
              : "URL карты ещё не настроен в NEXT_PUBLIC_BLUEMAP_URL. Задайте порт веб-карты с Exaroton."}
          </p>

          <div className="flex items-center gap-2 text-xs text-gray-400 bg-background/60 px-4 py-2 rounded-xl border border-border">
            <Layers className="w-4 h-4 text-brand-purple" />
            <span>WebGL 3D Interactive Viewport</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-background">
      {/* Stealth Mode Overlay Banner */}
      {isGameActive && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-brand-yellow/10 border border-brand-yellow/30 text-brand-yellow px-4 py-2 rounded-full backdrop-blur-md shadow-xl flex items-center gap-2 text-xs font-semibold animate-pulse">
          <span>🕵️</span>
          <span>ПРЯТКИ АКТИВНЫ: Местоположение игроков засекречено для честной игры</span>
        </div>
      )}

      {/* BlueMap Interactive iframe */}
      <iframe
        key={iframeKey}
        src={bluemapUrl}
        className="w-full h-full border-0 select-none"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        onLoad={() => setIsLoading(false)}
      />

      {/* Floating Map Utility Controls */}
      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
        <button
          onClick={handleRefresh}
          className="p-3 bg-card/90 hover:bg-card text-gray-300 hover:text-white rounded-xl border border-border/80 shadow-lg backdrop-blur-md transition-all active:scale-95"
          title="Обновить карту"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>

        <a
          href={bluemapUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => triggerHaptic("light")}
          className="p-3 bg-card/90 hover:bg-card text-gray-300 hover:text-white rounded-xl border border-border/80 shadow-lg backdrop-blur-md transition-all active:scale-95 flex items-center gap-1.5 text-xs font-medium"
          title="Открыть в новой вкладке"
        >
          <ExternalLink className="w-4 h-4" />
          <span className="hidden sm:inline">В браузере</span>
        </a>
      </div>
    </div>
  );
}
