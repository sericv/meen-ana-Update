"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { FINAL_GUESS_LIMIT } from "@/lib/game/match-progression";
import { GP } from "@/components/game/play/tokens";

type Props = {
  remaining: number;
  compact?: boolean;
  className?: string;
};

/** Mobile-first final-guess attempts remaining (synced via match doc). */
export const GuessRemainingIndicator = memo(function GuessRemainingIndicator({ remaining, compact = false, className = "" }: Props) {
  const safe = Math.max(0, Math.min(FINAL_GUESS_LIMIT, Math.floor(remaining)));
  const used = FINAL_GUESS_LIMIT - safe;

  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      dir="rtl"
      role="status"
      aria-label={`محاولات التخمين المتبقية: ${safe}`}
    >
      {!compact ? (
        <span className="text-[11px] font-bold" style={{ color: GP.inkSoft }}>
          محاولات التخمين
        </span>
      ) : null}
      <div className="flex items-center gap-1">
        {Array.from({ length: FINAL_GUESS_LIMIT }, (_, i) => {
          const filled = i < used;
          const isLast = safe === 0 && i === FINAL_GUESS_LIMIT - 1;
          return (
            <motion.span
              key={i}
              layout
              className="block rounded-full"
              style={{
                width: compact ? 8 : 10,
                height: compact ? 8 : 10,
                background: filled
                  ? isLast
                    ? GP.roseDeep
                    : `linear-gradient(180deg, ${GP.orange}, ${GP.orangeDeep})`
                  : "rgba(58,37,23,0.12)",
                boxShadow: filled
                  ? "0 2px 6px rgba(224,102,10,0.35)"
                  : "inset 0 0 0 1px rgba(244,196,141,0.35)",
              }}
              animate={isLast ? { scale: [1, 1.15, 1] } : undefined}
              transition={isLast ? { duration: 0.9, repeat: Infinity } : undefined}
            />
          );
        })}
      </div>
      <span
        className={`tabular-nums font-black ${compact ? "text-[11px]" : "text-xs"}`}
        style={{ color: safe === 0 ? GP.roseDeep : GP.ink }}
      >
        {safe}/{FINAL_GUESS_LIMIT}
      </span>
    </div>
  );
});
