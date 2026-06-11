"use client";

import { GP } from "@/components/game/play/tokens";

type Props = {
  letters: string[];
  revealedIdx: number[];
  compact?: boolean;
};

export function GameplayLetterRow({ letters, revealedIdx, compact }: Props) {
  const w = compact ? 30 : 36;
  const h = compact ? 38 : 44;
  const fs = compact ? 18 : 22;

  return (
    <div className="mt-2 flex flex-wrap justify-center gap-2">
      {letters.map((l, i) => {
        const revealed = revealedIdx.includes(i);
        return (
          <div
            key={i}
            className="grid place-items-center rounded-lg font-black transition-all duration-300"
            style={{
              width: w,
              height: h,
              fontSize: fs,
              background: revealed
                ? `linear-gradient(180deg, #FFD27A 0%, ${GP.goldDeep} 100%)`
                : GP.cream,
              border: `1px solid ${revealed ? "#C8881F" : "rgba(244,196,141,0.55)"}`,
              color: revealed ? GP.ink : GP.inkSoft,
              boxShadow: revealed
                ? "0 6px 14px -6px rgba(200,130,20,0.4), inset 0 1px 0 rgba(255,255,255,0.5)"
                : "inset 0 1px 0 rgba(255,255,255,0.6)",
            }}
          >
            {revealed ? l : "—"}
          </div>
        );
      })}
    </div>
  );
}
