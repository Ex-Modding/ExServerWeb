"use client";

import { useEffect, useState, useCallback } from "react";

export function useTelegramWebApp() {
  const [isTelegram, setIsTelegram] = useState(false);
  const [user, setUser] = useState<{ id: number; first_name: string } | null>(
    null,
  );

  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      setIsTelegram(true);
      tg.ready();
      tg.expand();

      if (tg.initDataUnsafe?.user) {
        setUser({
          id: tg.initDataUnsafe.user.id,
          first_name: tg.initDataUnsafe.user.first_name,
        });
      }
    }
  }, []);

  const triggerHaptic = useCallback(
    (style: "light" | "medium" | "heavy" | "rigid" | "soft" = "medium") => {
      if (
        typeof window !== "undefined" &&
        window.Telegram?.WebApp?.HapticFeedback
      ) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
      }
    },
    [],
  );

  const triggerNotification = useCallback(
    (type: "error" | "success" | "warning") => {
      if (
        typeof window !== "undefined" &&
        window.Telegram?.WebApp?.HapticFeedback
      ) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred(type);
      }
    },
    [],
  );

  return {
    isTelegram,
    user,
    triggerHaptic,
    triggerNotification,
  };
}
