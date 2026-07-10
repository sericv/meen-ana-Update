"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";

type Props = {
  active: boolean;
  secLeft: number | null;
  maxSec?: number;
  size: "sm" | "lg";
  children: ReactNode;
};

const CFG = {
  sm: { outer: 54, r: 21, sw: 3, fontSize: 8 },
  lg: { outer: 96, r: 42, sw: 4, fontSize: 12 },
} as const;

function ringColor(pct: number): string {
  if (pct > 0.5) return "#8B5CF6";
  if (pct > 0.25) return "#FB7185";
  if (pct > 0.1) return "#FF8A3D";
  return "#E5524D";
}

export function PlayerTimerRing({ active, secLeft, maxSec, size, children }: Props) {
  const reduced = useReducedMotion();
  const cfg = CFG[size];
  const safeMax = maxSec && maxSec > 0 ? maxSec : 30;
  const display = secLeft ?? 0;
  const pct = Math.max(0, Math.min(1, display / safeMax));
  const c = 2 * Math.PI * cfg.r;
  const color = ringColor(pct);
  const isCritical = active && display <= 5;
  const isUrgent = active && pct <= 0.15;

  return (
    <div className="relative shrink-0" style={{ width: cfg.outer, height: cfg.outer }}>
      {/* Avatar */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>

      {active && (
        <>
          {/* Glow */}
          {!reduced && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full"
              animate={{
                boxShadow: isCritical
                  ? [`0 0 0 2px ${color}22`, `0 0 0 10px ${color}44`, `0 0 0 2px ${color}22`]
                  : [`0 0 0 1px ${color}15`, `0 0 0 5px ${color}28`, `0 0 0 1px ${color}15`],
              }}
              transition={{ duration: isCritical ? 0.8 : 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
          )}

          {/* Progress ring */}
          <svg
            width={cfg.outer}
            height={cfg.outer}
            viewBox={`0 0 ${cfg.outer} ${cfg.outer}`}
            className="absolute inset-0 -rotate-90"
            aria-hidden
          >
            <circle
              cx={cfg.outer / 2}
              cy={cfg.outer / 2}
              r={cfg.r}
              stroke={`${color}18`}
              strokeWidth={cfg.sw}
              fill="none"
            />
            <motion.circle
              cx={cfg.outer / 2}
              cy={cfg.outer / 2}
              r={cfg.r}
              stroke={color}
              strokeWidth={cfg.sw}
              fill="none"
              strokeDasharray={c}
              strokeDashoffset={c * (1 - pct)}
              strokeLinecap="round"
              animate={{ stroke: color }}
              transition={{ duration: 0.4, ease: EASE_OUT }}
              style={{
                transition: "stroke-dashoffset 0.35s linear",
                filter: isCritical
                  ? `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 12px ${color}88)`
                  : `drop-shadow(0 0 3px ${color}55)`,
              }}
            />
          </svg>

          {/* Countdown */}
          {!reduced && (
            <motion.span
              className="pointer-events-none absolute inset-0 flex items-center justify-center font-mono font-black tabular-nums select-none"
              style={{
                fontSize: cfg.fontSize,
                color,
                textShadow: isCritical
                  ? `0 0 10px ${color}cc`
                  : `0 0 4px ${color}44`,
              }}
              animate={isUrgent ? {
                scale: [1, 1.15, 1],
                transition: { duration: 0.7, repeat: Infinity, ease: "easeInOut" },
              } : {}}
            >
              {display}
            </motion.span>
          )}
        </>
      )}
    </div>
  );
}
