"use client";

import { useEffect } from "react";

export function triggerHaptic(style: "light" | "medium" | "heavy" = "medium") {
  if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
    window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
  }
}

export default function TelegramMiniAppInit() {
  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, []);

  return null;
}
