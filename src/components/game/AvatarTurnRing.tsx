"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type Density = "comfortable" | "compact";

/** Largest frame overlay scale in cosmetics — ring must clear this. */
const MAX_FRAME_OVERLAY = 1.18;

const DEFAULT_INNER: Record<Density, number> = {
  /** md avatar (52) + p-0.5 wrapper (4) */
  compact: 56,
  /** lg avatar (72) + light wrapper */
  comfortable: 76,
};

const STROKE: Record<Density, number> = {
  comfortable: 5.5,
  compact: 4.5,
};

function ringGeometry(innerPx: number, density: Density) {
  const stroke = STROKE[density];
  const contentDiameter = Math.ceil(innerPx * MAX_FRAME_OVERLAY);
  const ringInset = density === "compact" ? 5 : 6;
  const r = contentDiameter / 2 + ringInset;
  const dim = Math.ceil(2 * (r + stroke + 3));
  return { dim, r, stroke, contentDiameter, cx: dim / 2 };
}

/** Countdown ring around an avatar — active player gets a live arc + layered glow. */
export function AvatarTurnRing({
  showTimer,
  emphasize,
  secLeft,
  maxSec,
  density = "comfortable",
  innerPx,
  children,
}: {
  showTimer: boolean;
  emphasize: boolean;
  secLeft: number | null;
  maxSec: number;
  density?: Density;
  /** Outer footprint of avatar + border padding (px). */
  innerPx?: number;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  const footprint = innerPx ?? DEFAULT_INNER[density];
  const { dim, r, stroke, contentDiameter, cx } = ringGeometry(footprint, density);
  const circumference = 2 * Math.PI * r;
  const safeSec = secLeft ?? 0;
  const hasCountdown = showTimer && secLeft !== null && maxSec > 0;
  const pct = hasCountdown ? Math.max(0, Math.min(1, safeSec / maxSec)) : 1;
  const dash = circumference * pct;
  const urgent = hasCountdown && safeSec <= 5;

  const trackStroke = emphasize
    ? "rgba(255,255,255,0.45)"
    : "rgba(244,196,141,0.40)";

  const progressStroke = urgent
    ? "#ef4444"
    : emphasize
      ? "rgba(255,255,255,0.92)"
      : "rgba(200,150,100,0.45)";

  const outerRingColor = urgent
    ? "rgba(239,68,68,0.18)"
    : emphasize
      ? "rgba(255,159,10,0.18)"
      : "transparent";

  const ring = (
    <svg
      className="pointer-events-none absolute left-1/2 top-1/2"
      width={dim}
      height={dim}
      viewBox={`0 0 ${dim} ${dim}`}
      style={{ transform: "translate(-50%, -50%) rotate(-90deg)" }}
      aria-hidden
    >
      {emphasize ? (
        <circle
          cx={cx}
          cy={cx}
          r={r + stroke + 1}
          fill="none"
          stroke={outerRingColor}
          strokeWidth={2.5}
        />
      ) : null}
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke={trackStroke}
        strokeWidth={stroke}
      />
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke={progressStroke}
        strokeWidth={stroke}
        strokeDasharray={
          hasCountdown ? `${dash} ${circumference}` : `${circumference} 0`
        }
        strokeLinecap="round"
        style={{
          transition: "stroke-dasharray 0.2s linear, stroke 0.35s ease",
          filter: emphasize
            ? urgent
              ? "drop-shadow(0 0 4px rgba(239,68,68,0.7))"
              : "drop-shadow(0 0 5px rgba(255,210,100,0.65))"
            : "none",
        }}
        opacity={hasCountdown || emphasize ? 1 : 0.5}
      />
    </svg>
  );

  return (
    <motion.div
      layout={false}
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: dim, height: dim }}
    >
      {emphasize && !reduced ? (
        <motion.div
          aria-hidden
          animate={{ opacity: [0.3, 0.72, 0.3] }}
          transition={{
            duration: urgent ? 0.75 : 2.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="pointer-events-none absolute inset-0 rounded-full blur-xl"
          style={{
            background: urgent
              ? "rgba(239,68,68,0.50)"
              : "rgba(255,149,0,0.48)",
          }}
        />
      ) : emphasize ? (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full opacity-45 blur-xl"
          style={{
            background: urgent
              ? "rgba(239,68,68,0.42)"
              : "rgba(255,149,0,0.40)",
          }}
        />
      ) : null}

      {emphasize && !reduced && !urgent ? (
        <motion.div
          aria-hidden
          animate={{ opacity: [0, 0.4, 0] }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
          className="pointer-events-none absolute inset-1 rounded-full blur-md"
          style={{ background: "rgba(255,200,80,0.30)" }}
        />
      ) : null}

      {ring}
      <motion.div
        layout={false}
        className="relative z-[1] flex shrink-0 items-center justify-center"
        style={{ width: contentDiameter, height: contentDiameter }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
