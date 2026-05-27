"use client";

import { motion, AnimatePresence } from "framer-motion";
import { TacticalToolIcon } from "@/components/game/play/TacticalToolIcons";
import { GP } from "@/components/game/play/tokens";
import { TACTICAL_TOOL_IDS, type TacticalInventory } from "@/lib/profile/tactical-tools";
import { SPRING_UI } from "@/lib/motion";

type Props = {
  inventory: TacticalInventory;
  size?: "compact" | "voice";
  onPress: () => void;
};

/** زر أدوات تكتيكية — مرآة زر التلميحات على الجهة المقابلة */
export function GameplayTacticalButton({ inventory, size = "compact", onPress }: Props) {
  const voice = size === "voice";
  const w = voice ? 76 : 68;
  const h = voice ? 96 : 88;
  const badge = TACTICAL_TOOL_IDS.reduce((sum, id) => sum + (inventory[id] ?? 0), 0);
  const iconSize = voice ? 30 : 26;
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
        borderRadius: 14,
        border: "1.5px solid rgba(120,160,220,0.65)",
        outline: "1px solid rgba(255,255,255,0.14)",
        background:
          "repeating-linear-gradient(45deg, #2a4568 0 5px, #203a55 5px 10px)",
        boxShadow: [
          "0 1px 1px rgba(0,0,0,0.12)",
          "0 4px 8px -2px rgba(20,40,70,0.32)",
          "0 12px 24px -6px rgba(20,40,70,0.28)",
          "inset 0 1.5px 0 rgba(140,180,255,0.18)",
        ].join(", "),
        willChange: "transform",
      }}
      aria-label="الأدوات التكتيكية"
    >
      {/* Ambient inner glow on press */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[13px]"
        initial={{ opacity: 0 }}
        whileTap={{ opacity: 1 }}
        transition={{ duration: 0.12 }}
        style={{
          background: "radial-gradient(circle at 50% 40%, rgba(100,160,255,0.5) 0%, transparent 70%)",
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
            className="absolute right-0.5 top-0.5 z-10 inline-flex min-w-[22px] items-center justify-center rounded-full px-1.5 py-px text-[8px] font-extrabold tabular-nums"
            style={{
              background: `linear-gradient(160deg, #8eb8e8 0%, #4e88c4 100%)`,
              color: "#fff",
              boxShadow: "0 2px 6px rgba(20,50,90,0.35), inset 0 1px 0 rgba(255,255,255,0.35)",
            }}
          >
            {badge}
          </motion.span>
        )}
      </AnimatePresence>

      <div className="flex flex-1 flex-col items-center justify-center px-1 pb-0.5 pt-3">
        {/* Icon glow halo */}
        <motion.div
          className="grid place-items-center rounded-full"
          animate={{ opacity: [0.45, 0.85, 0.45] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: iconSize + 14,
            height: iconSize + 14,
            background: "radial-gradient(circle, rgba(120,175,255,0.55) 0%, transparent 70%)",
            color: "#d0e8ff",
          }}
        >
          <TacticalToolIcon id="shield" size={iconSize} />
        </motion.div>
      </div>

      <span
        className="shrink-0 py-0.5 text-[7px] font-extrabold leading-tight"
        style={{
          background: "rgba(18,34,58,0.95)",
          color: "#d8eaff",
          letterSpacing: "0.03em",
        }}
      >
        أدوات
      </span>
    </motion.button>
  );
}
