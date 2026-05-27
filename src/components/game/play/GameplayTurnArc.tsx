"use client";

import { motion, useReducedMotion } from "framer-motion";
import { GP } from "@/components/game/play/tokens";

type Props = {
  secLeft: number | null;
  maxSec: number;
  active: boolean;
};

/**
 * Center timer arc — premium version.
 *
 * Urgency tiers:
 * - Normal (>50%): gold stroke, standard glow
 * - Warning (20-50%): amber deepening
 * - Critical (≤5s): rose/red, urgency pulse animation
 *
 * All animation via CSS for off-main-thread performance.
 */
export function GameplayTurnArc({ secLeft, maxSec, active }: Props) {
  const reduced = useReducedMotion();
  const safeMax = maxSec > 0 ? maxSec : 30;
  const display = secLeft ?? 0;
  const pct = Math.max(0, Math.min(1, display / safeMax));

  // Urgency tiers
  const isCritical = display <= 5 && active;
  const isWarning = pct <= 0.35 && pct > 0.15 && active;

  const stroke = isCritical
    ? GP.rose
    : isWarning
    ? "#E8902A"
    : active
    ? GP.gold
    : GP.rose;

  const r = 22;
  const c = 2 * Math.PI * r;

  return (
    <div
      className="relative shrink-0"
      style={{ width: 54, height: 54 }}
    >
      {/* Ambient outer glow ring — breathes with the arc */}
      {active && !reduced && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full"
          animate={{
            boxShadow: isCritical
              ? [`0 0 0 2px ${GP.rose}22`, `0 0 0 8px ${GP.rose}44`, `0 0 0 2px ${GP.rose}22`]
              : [`0 0 0 2px ${GP.gold}18`, `0 0 0 6px ${GP.gold}35`, `0 0 0 2px ${GP.gold}18`],
          }}
          transition={{ duration: isCritical ? 0.8 : 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <svg width="54" height="54" viewBox="0 0 54 54" className="-rotate-90" aria-hidden>
        {/* Track */}
        <circle
          cx="27" cy="27" r={r}
          stroke={isCritical ? `${GP.rose}25` : "#E8D4BC"}
          strokeWidth="3.5"
          fill="none"
        />
        {/* Progress arc */}
        <motion.circle
          cx="27" cy="27" r={r}
          stroke={stroke}
          strokeWidth="3.5"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 0.35s linear, stroke 0.4s cubic-bezier(0.23,1,0.32,1)",
            filter: isCritical
              ? `drop-shadow(0 0 8px ${GP.rose}) drop-shadow(0 0 16px ${GP.rose}88)`
              : `drop-shadow(0 0 6px ${stroke}cc)`,
          }}
        />
      </svg>

      {/* Timer number */}
      <span
        className={`absolute inset-0 flex items-center justify-center font-mono text-lg font-extrabold tabular-nums ${isCritical && !reduced ? "urgency-pulse" : ""}`}
        style={{
          color: stroke,
          textShadow: isCritical
            ? `0 0 14px ${GP.rose}cc`
            : `0 0 10px ${stroke}88`,
          transition: "color 0.4s cubic-bezier(0.23,1,0.32,1)",
        }}
      >
        {display}
      </span>
    </div>
  );
}
