"use client";

import { motion } from "framer-motion";
import { GP } from "@/components/game/play/tokens";

type Props = {
  secLeft: number | null;
  maxSec: number;
  active: boolean;
};

/** Center timer arc — matches gameplay.jsx TurnArc */
export function GameplayTurnArc({ secLeft, maxSec, active }: Props) {
  const safeMax = maxSec > 0 ? maxSec : 30;
  const display = secLeft ?? 0;
  const pct = Math.max(0, Math.min(1, display / safeMax));
  const r = 22;
  const c = 2 * Math.PI * r;
  const stroke = active ? GP.gold : GP.rose;

  return (
    <motion.div className="relative h-[54px] w-[54px] shrink-0">
      <svg width="54" height="54" viewBox="0 0 54 54" className="-rotate-90" aria-hidden>
        <circle cx="27" cy="27" r={r} stroke="#E8D4BC" strokeWidth="3" fill="none" />
        <circle
          cx="27"
          cy="27"
          r={r}
          stroke={stroke}
          strokeWidth="3"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 0.35s linear",
            filter: `drop-shadow(0 0 6px ${stroke})`,
          }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-mono text-lg font-extrabold tabular-nums"
        style={{ color: stroke }}
      >
        {display}
      </span>
    </motion.div>
  );
}
