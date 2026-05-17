"use client";

import { xpProgressInCurrentLevel } from "@/lib/profile/level";

type Props = {
  xp: number;
  size?: "sm" | "md";
  showBar?: boolean;
  className?: string;
};

export function PlayerLevelBadge({ xp, size = "sm", showBar = false, className = "" }: Props) {
  const { level, xpInLevel, xpToNext, pct } = xpProgressInCurrentLevel(xp);
  const compact = size === "sm";

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span
        className={`inline-flex w-fit items-center gap-1 rounded-full font-extrabold ${
          compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
        }`}
        style={{
          background: "linear-gradient(180deg, #FFE8A8 0%, #F2C14E 100%)",
          color: "#5e3011",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55), 0 2px 8px rgba(200,130,20,0.2)",
        }}
      >
        <span aria-hidden>⭐</span>
        المستوى {level}
      </span>
      {showBar ? (
        <div className="w-full min-w-[88px]">
          <div className="mb-0.5 flex justify-between text-[9px] font-bold tabular-nums text-[#a16231]">
            <span>خبرة</span>
            <span>
              {xpInLevel} / {xpToNext}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#f4e0c8]/90">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg, #F2B544, #E0660A)",
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
