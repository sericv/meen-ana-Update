"use client";

import type { ReactNode } from "react";
import { GP } from "@/components/game/play/tokens";

/** منطقة رسائل — تلاشي ناعم من الأعلى بدون حافة مقصوصة */
export function GameplayChatFadeViewport({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative flex min-h-0 min-w-0 flex-1 flex-col justify-end overflow-hidden"
      style={{
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.12) 10%, black 24%, black 100%)",
        maskImage:
          "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.12) 10%, black 24%, black 100%)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-28"
        style={{
          background: `linear-gradient(to bottom, ${GP.cream} 0%, rgba(255,241,221,0.88) 40%, transparent 100%)`,
        }}
      />
      {children}
    </div>
  );
}
