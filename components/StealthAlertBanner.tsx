"use client";

import React from "react";

interface StealthAlertBannerProps {
  isActive: boolean;
  phase?: string;
  timeRemaining?: number;
}

export function StealthAlertBanner({
  isActive,
  phase = "HIDING",
  timeRemaining,
}: StealthAlertBannerProps) {
  if (!isActive) return null;

  return (
    <div className="w-full mb-3 border border-[#382a17] bg-[#141009] px-3.5 py-2.5 text-xs font-mono text-[#d49746] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 select-none">
      <div className="flex items-center gap-2.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#d49746] animate-pulse" />
        <span className="font-semibold tracking-wider uppercase text-[#f2be74]">
          INVARIANT ENFORCED: HIDE_AND_SEEK ACTIVE
        </span>
        <span className="text-[#6c512d] hidden md:inline">|</span>
        <span className="text-[#99774d] text-[11px] hidden md:inline">
          PHASE: {phase} &middot; PLAYER TRACES AND COORDINATES MASKED
        </span>
      </div>

      {timeRemaining !== undefined && timeRemaining > 0 && (
        <div className="text-[11px] font-mono text-[#f2be74] border border-[#4a361c] bg-[#1d160c] px-2 py-0.5">
          LOCK_TIMER: {Math.floor(timeRemaining / 60)}:
          {(timeRemaining % 60).toString().padStart(2, "0")}
        </div>
      )}
    </div>
  );
}
