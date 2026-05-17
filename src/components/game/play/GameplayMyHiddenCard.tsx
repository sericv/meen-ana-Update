"use client";

import { motion } from "framer-motion";
import { IconHintBulb } from "@/components/game/play/icons";
import { GP } from "@/components/game/play/tokens";

type Props = {
  hintsLeft: number;
  bonusHints?: number;
  /** kept for sheet — not shown on the compact button */
  revealedIdx?: number[];
  letters?: string[];
  size?: "compact" | "voice";
  onPress: () => void;
};

/** زر تلميحات موحّد — لمبة دائماً، النتائج داخل الورقة فقط */
export function GameplayMyHiddenCard({
  hintsLeft,
  bonusHints = 0,
  size = "compact",
  onPress,
}: Props) {
  const voice = size === "voice";
  const w = voice ? 76 : 68;
  const h = voice ? 96 : 88;
  const badge = hintsLeft + bonusHints;
  const bulbSize = voice ? 34 : 30;

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onPress}
      className="relative flex flex-col overflow-hidden rounded-[12px] border text-center"
      style={{
        width: w,
        height: h,
        borderColor: "rgba(255,190,100,0.55)",
        background:
          "repeating-linear-gradient(45deg, #8a4520 0 5px, #7a3c18 5px 10px)",
        boxShadow: "0 6px 14px -4px rgba(80,40,10,0.32)",
      }}
      aria-label="كرتك والتلميحات"
    >
      <span
        className="absolute right-0.5 top-0.5 z-10 inline-flex min-w-[22px] items-center justify-center gap-0.5 rounded-full px-1.5 py-px text-[8px] font-extrabold tabular-nums"
        style={{
          background: `linear-gradient(180deg, ${GP.gold} 0%, ${GP.goldDeep} 100%)`,
          color: GP.ink,
          boxShadow: "0 2px 6px rgba(120,70,10,0.25)",
        }}
      >
        {badge}
      </span>

      <div className="flex flex-1 flex-col items-center justify-center px-1 pb-0.5 pt-3">
        <div
          className="grid place-items-center rounded-full"
          style={{
            width: bulbSize + 14,
            height: bulbSize + 14,
            background: "radial-gradient(circle, rgba(255,230,160,0.45) 0%, transparent 70%)",
          }}
        >
          <IconHintBulb size={bulbSize} variant="illustrated" />
        </div>
      </div>

      <span
        className="shrink-0 py-0.5 text-[7px] font-extrabold leading-tight"
        style={{ background: "rgba(58,37,23,0.92)", color: "#fff7e8" }}
      >
        تلميحات
      </span>
    </motion.button>
  );
}
