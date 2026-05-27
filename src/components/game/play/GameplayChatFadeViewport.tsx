"use client";

import type { ReactNode } from "react";
import { GP } from "@/components/game/play/tokens";

/**
 * GameplayChatFadeViewport — message area with soft top fade.
 *
 * Performance: pure CSS mask + gradient overlay.
 * No backdrop-filter (expensive repaint on every scroll).
 * No box-shadows stacking on individual messages.
 * `overscroll-behavior: contain` prevents rubber-band scroll bleeding.
 */
export function GameplayChatFadeViewport({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative flex min-h-0 min-w-0 flex-1 flex-col justify-end overflow-hidden"
      style={{
        // CSS mask for soft top fade — GPU composited, zero repaint cost
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.15) 12%, black 26%, black 100%)",
        maskImage:
          "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.15) 12%, black 26%, black 100%)",
      }}
    >
      {/*
       * Top fade-in gradient overlay.
       * Uses a solid color gradient (no blur) — cheap and smooth.
       * pointer-events:none so it never blocks taps on messages.
       */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-10"
        style={{
          height: 80,
          background: `linear-gradient(to bottom, ${GP.cream} 0%, rgba(255,241,221,0.82) 50%, transparent 100%)`,
          // promote to own layer so scrolling under it is GPU-composited
          willChange: "opacity",
        }}
      />
      {children}
    </div>
  );
}
