"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type Density = "comfortable" | "compact";

const RING: Record<Density, { dim: number; r: number; stroke: number }> = {
  comfortable: { dim: 124, r: 52, stroke: 5 },
  compact: { dim: 88, r: 36, stroke: 4 },
};

/** Countdown ring around an avatar — active player gets a live arc + glow. */
export function AvatarTurnRing({
  showTimer,
  emphasize,
  secLeft,
  maxSec,
  density = "comfortable",
  children,
}: {
  showTimer: boolean;
  emphasize: boolean;
  secLeft: number | null;
  maxSec: number;
  density?: Density;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  const { dim, r, stroke } = RING[density];
  const cx = dim / 2;
  const circumference = 2 * Math.PI * r;
  const safeSec = secLeft ?? 0;
  const hasCountdown = showTimer && secLeft !== null && maxSec > 0;
  const pct = hasCountdown ? Math.max(0, Math.min(1, safeSec / maxSec)) : 1;
  const dash = circumference * pct;
  const urgent = hasCountdown && safeSec <= 5;

  const trackStroke = emphasize ? "rgba(255,255,255,0.55)" : "rgba(244,196,141,0.55)";
  const glowStroke = urgent ? "#ef4444" : emphasize ? "#fff" : "rgba(200,150,100,0.55)";

  const ring = (
    <svg
      className="pointer-events-none absolute inset-0 -rotate-90"
      width={dim}
      height={dim}
      viewBox={`0 0 ${dim} ${dim}`}
      aria-hidden
    >
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={trackStroke} strokeWidth={stroke} />
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke={glowStroke}
        strokeWidth={stroke}
        strokeDasharray={hasCountdown ? `${dash} ${circumference}` : `${circumference} 0`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.2s linear, stroke 0.35s" }}
        opacity={hasCountdown || emphasize ? 1 : 0.55}
      />
    </svg>
  );

  const glowPad = density === "compact" ? "-inset-1" : "-inset-2";

  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: dim, height: dim }}>
      {emphasize && !reduced ? (
        <motion.div
          aria-hidden
          animate={{ opacity: [0.35, 0.75, 0.35], scale: [0.92, 1.06, 0.92] }}
          transition={{ duration: urgent ? 0.85 : 2.1, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute ${glowPad} rounded-full blur-xl`}
          style={{
            background: urgent ? "rgba(248,113,113,0.55)" : "rgba(255,149,0,0.5)",
          }}
        />
      ) : emphasize ? (
        <div
          aria-hidden
          className={`absolute ${glowPad} rounded-full opacity-50 blur-xl`}
          style={{ background: urgent ? "rgba(248,113,113,0.45)" : "rgba(255,149,0,0.42)" }}
        />
      ) : null}
      {ring}
      <div className="relative z-[1] flex items-center justify-center">{children}</div>
    </div>
  );
}
