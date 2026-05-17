"use client";

import { GP } from "@/components/game/play/tokens";

type Props = {
  amount: number | string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: { icon: "h-6 w-6 text-sm", text: "text-sm" },
  md: { icon: "h-8 w-8 text-base", text: "text-lg" },
  lg: { icon: "h-9 w-9 text-lg", text: "text-2xl" },
};

export function CoinDisplay({ amount, size = "md", className = "" }: Props) {
  const s = sizes[size];
  return (
    <span className={`inline-flex items-center gap-1.5 font-black tabular-nums ${className}`}>
      <span
        className={`grid shrink-0 place-items-center rounded-xl ${s.icon}`}
        style={{
          background: `linear-gradient(180deg, ${GP.gold} 0%, ${GP.goldDeep} 100%)`,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55), 0 3px 8px rgba(200,130,20,0.22)",
          color: GP.ink,
        }}
        aria-hidden
      >
        🪙
      </span>
      <span className={s.text} style={{ color: GP.ink }}>
        {amount}
      </span>
    </span>
  );
}
