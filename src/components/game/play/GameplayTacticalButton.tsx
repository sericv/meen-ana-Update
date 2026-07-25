"use client";

import { motion, AnimatePresence } from "framer-motion";
import { TacticalToolIcon } from "@/components/game/play/TacticalToolIcons";
import { TACTICAL_TOOL_IDS, type TacticalInventory } from "@/lib/profile/tactical-tools";
import { SPRING_UI } from "@/lib/motion";

type Props = {
  inventory: TacticalInventory;
  size?: "compact" | "voice";
  onPress: () => void;
};

/** زر الأدوات التكتيكية بتصميم Bezel المزدوج المحدث وهادئ ينسجم مع الهوية الجديدة */
export function GameplayTacticalButton({ inventory, size = "compact", onPress }: Props) {
  const voice = size === "voice";
  const w = voice ? 86 : 76;
  const h = voice ? 104 : 96;
  const badge = TACTICAL_TOOL_IDS.reduce((sum, id) => sum + (inventory[id] ?? 0), 0);
  const iconSize = voice ? 28 : 24;
  const hasBadge = badge > 0;
  const hasTools = badge > 0;

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      whileHover={{ scale: 1.02 }}
      transition={SPRING_UI}
      onClick={onPress}
      className="game-card-outer flex flex-col select-none relative"
      style={{
        width: w,
        height: h,
        padding: "4px",
        borderRadius: 20,
        cursor: "pointer",
      }}
      aria-label="الأدوات التكتيكية"
    >
      <div 
        className="game-card-inner flex-1 flex flex-col justify-between overflow-hidden relative w-full h-full"
        style={{
          borderRadius: 20 - 4,
          background: "linear-gradient(135deg, #FAF8FF 0%, #F5ECFF 100%)",
          border: "1.5px solid rgba(124, 58, 237, 0.15)",
        }}
      >
        {/* Specular highlights inside */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background: "linear-gradient(90deg, transparent, rgba(124, 58, 237, 0.3), transparent)",
            pointerEvents: "none",
          }}
        />

        {/* Badge — stock count */}
        <AnimatePresence>
          {hasBadge && (
            <motion.span
              key="badge"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={SPRING_UI}
              className="absolute right-1 top-1 z-10 inline-flex min-w-[20px] h-[20px] items-center justify-center rounded-full px-1.5 text-[9px] font-extrabold font-sans text-white"
              style={{
                background: "linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)",
                boxShadow: "0 2px 8px rgba(124, 58, 237, 0.35)",
              }}
            >
              {badge}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Icon zone */}
        <div className="flex-1 flex items-center justify-center pt-2">
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: iconSize + 12,
              height: iconSize + 12,
              background: "radial-gradient(circle, rgba(124, 58, 237, 0.18) 0%, transparent 75%)",
            }}
          >
            <TacticalToolIcon id="shield" size={iconSize} />
          </div>
        </div>

        {/* Bottom banner label */}
        <div
          className="py-1 text-center text-[9px] font-extrabold leading-tight text-white font-sans"
          style={{
            background: "linear-gradient(180deg, #7C3AED 0%, #5B21B6 100%)",
            borderTop: "1.2px solid rgba(124, 58, 237, 0.2)",
            borderRadius: `0 0 ${20 - 4}px ${20 - 4}px`,
          }}
        >
          أدوات
        </div>
      </div>
    </motion.button>
  );
}
