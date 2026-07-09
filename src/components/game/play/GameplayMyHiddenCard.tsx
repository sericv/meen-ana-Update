"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconHintBulb } from "@/components/game/play/icons";
import { GP } from "@/components/game/play/tokens";
import { SPRING_UI } from "@/lib/motion";

type Props = {
  hintsLeft: number;
  bonusLetterHints?: number;
  bonusCountHints?: number;
  hintUsed?: boolean;
  /** kept for sheet — not shown on the compact button */
  revealedIdx?: number[];
  letters?: string[];
  size?: "compact" | "voice";
  onPress: () => void;
};

/** زر تلميحات موحّد — لمبة دائماً، النتائج داخل الورقة فقط */
export const GameplayMyHiddenCard = memo(function GameplayMyHiddenCard({
  hintsLeft,
  bonusLetterHints = 0,
  bonusCountHints = 0,
  hintUsed = false,
  size = "compact",
  onPress,
}: Props) {
  const voice = size === "voice";
  const w = voice ? 76 : 68;
  const h = voice ? 96 : 88;
  const hasStoreHint = bonusLetterHints + bonusCountHints > 0;
  const badge = hintUsed ? 0 : hasStoreHint ? 1 : hintsLeft;
  const bulbSize = voice ? 34 : 30;
  const hasBadge = badge > 0;

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.93 }}
      transition={SPRING_UI}
      onClick={onPress}
      className="relative flex flex-col overflow-hidden text-center"
      style={{
        width: w,
        height: h,
        borderRadius: 18,
        border: "1.5px solid rgba(251, 146, 60, 0.28)",
        background: "linear-gradient(135deg, #FFFDF8 0%, #FFEFC4 100%)",
        boxShadow: [
          "0 2px 6px rgba(180, 100, 30, 0.05)",
          "0 8px 20px rgba(180, 100, 30, 0.08)",
          "inset 0 1.5px 0.5px #ffffff",
        ].join(", "),
        willChange: "transform",
      }}
      aria-label="كرتك والتلميحات"
    >
      {/* Ambient inner glow on press */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[13px]"
        initial={{ opacity: 0 }}
        whileTap={{ opacity: 1 }}
        transition={{ duration: 0.12 }}
        style={{
          background: `radial-gradient(circle at 50% 40%, ${GP.gold}55 0%, transparent 70%)`,
        }}
      />

      {/* Badge */}
      <AnimatePresence>
        {hasBadge && (
          <motion.span
            key="badge"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={SPRING_UI}
            className="absolute right-0.5 top-0.5 z-10 inline-flex min-w-[22px] items-center justify-center gap-0.5 rounded-full px-1.5 py-px text-[8px] font-extrabold tabular-nums"
            style={{
              background: `linear-gradient(160deg, ${GP.gold} 0%, ${GP.goldDeep} 100%)`,
              color: GP.ink,
              boxShadow: `0 2px 6px rgba(120,70,10,0.3), inset 0 1px 0 rgba(255,255,255,0.4)`,
            }}
          >
            {badge}
          </motion.span>
        )}
      </AnimatePresence>

      <div className="flex flex-1 flex-col items-center justify-center px-1 pb-0.5 pt-3">
        {/* Bulb glow halo — CSS animation (compositor thread, no JS loop) */}
        <div
          className="bulb-halo-pulse grid place-items-center rounded-full"
          style={{
            width: bulbSize + 14,
            height: bulbSize + 14,
            background: `radial-gradient(circle, ${GP.gold}55 0%, transparent 70%)`,
          }}
        >
          <IconHintBulb size={bulbSize} variant="illustrated" />
        </div>
      </div>

      <span
        className="shrink-0 py-1 text-[7.5px] font-extrabold leading-tight"
        style={{
          background: "linear-gradient(180deg, #FFEAB2 0%, #F5BE50 100%)",
          color: "#4f260a",
          letterSpacing: "0.03em",
          borderTop: "1px solid rgba(251, 146, 60, 0.2)",
        }}
      >
        تلميحات
      </span>
    </motion.button>
  );
});
