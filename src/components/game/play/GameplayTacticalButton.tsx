"use client";

import { motion } from "framer-motion";
import { TacticalToolIcon } from "@/components/game/play/TacticalToolIcons";
import { GP } from "@/components/game/play/tokens";
import { TACTICAL_TOOL_IDS, type TacticalInventory } from "@/lib/profile/tactical-tools";

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

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onPress}
      className="relative flex flex-col overflow-hidden rounded-[12px] border text-center"
      style={{
        width: w,
        height: h,
        borderColor: "rgba(120,160,210,0.55)",
        background:
          "repeating-linear-gradient(45deg, #2a4568 0 5px, #223a58 5px 10px)",
        boxShadow: "0 6px 14px -4px rgba(20,40,70,0.35)",
      }}
      aria-label="الأدوات التكتيكية"
    >
      <span
        className="absolute right-0.5 top-0.5 z-10 inline-flex min-w-[22px] items-center justify-center rounded-full px-1.5 py-px text-[8px] font-extrabold tabular-nums"
        style={{
          background: `linear-gradient(180deg, #8eb8e8 0%, #5a8fc4 100%)`,
          color: "#fff",
          boxShadow: "0 2px 6px rgba(20,50,90,0.3)",
        }}
      >
        {badge}
      </span>

      <div className="flex flex-1 flex-col items-center justify-center px-1 pb-0.5 pt-3">
        <motion.div
          className="grid place-items-center rounded-full"
          style={{
            width: iconSize + 14,
            height: iconSize + 14,
            background: "radial-gradient(circle, rgba(160,200,255,0.4) 0%, transparent 70%)",
            color: "#e8f2ff",
          }}
        >
          <TacticalToolIcon id="shield" size={iconSize} />
        </motion.div>
      </div>

      <span
        className="shrink-0 py-0.5 text-[7px] font-extrabold leading-tight"
        style={{ background: "rgba(26,42,68,0.94)", color: "#e8f0ff" }}
      >
        أدوات
      </span>
    </motion.button>
  );
}
