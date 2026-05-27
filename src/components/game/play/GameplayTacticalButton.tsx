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

/**
 * Tactical card button — premium collectible device feel.
 *
 * Visual language:
 * - Dark navy diagonal stripe pattern (feels like classified/tactical)
 * - Blue glow halo that pulses when tools are available
 * - Badge pops in with spring when count > 0
 * - Press reveals inner radial flash (tactile depth)
 * - Shield icon with animated blue ambient halo
 */
export function GameplayTacticalButton({ inventory, size = "compact", onPress }: Props) {
  const voice = size === "voice";
  const w = voice ? 76 : 68;
  const h = voice ? 96 : 88;
  const badge = TACTICAL_TOOL_IDS.reduce((sum, id) => sum + (inventory[id] ?? 0), 0);
  const iconSize = voice ? 30 : 26;
  const hasBadge = badge > 0;
  const hasTools = badge > 0;

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.91 }}
      transition={SPRING_UI}
      onClick={onPress}
      aria-label="الأدوات التكتيكية"
      style={{
        position: "relative",
        width: w,
        height: h,
        padding: 0,
        borderRadius: 14,
        border: "1.5px solid rgba(100,160,230,0.62)",
        outline: "1px solid rgba(255,255,255,0.12)",
        background: "repeating-linear-gradient(45deg, #243554 0 5px, #1c2e48 5px 10px)",
        boxShadow: [
          "0 1px 1px rgba(0,0,0,0.14)",
          "0 4px 8px -2px rgba(16,36,68,0.35)",
          "0 12px 24px -6px rgba(16,36,68,0.30)",
          "inset 0 1.5px 0 rgba(120,175,255,0.20)",
          "inset 0 -1px 0 rgba(0,0,0,0.18)",
        ].join(", "),
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        cursor: "pointer",
        willChange: "transform",
      }}
    >
      {/* Outer ambient glow bloom — CSS animated, only when tools available */}
      {hasTools && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            inset: -10,
            borderRadius: 22,
            background: "radial-gradient(closest-side, rgba(80,140,255,0.38), transparent 70%)",
            filter: "blur(5px)",
            animation: "tacBtnPulse 2.6s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Inner press flash */}
      <motion.span
        aria-hidden
        initial={{ opacity: 0 }}
        whileTap={{ opacity: 1 }}
        transition={{ duration: 0.10 }}
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 13,
          background: "radial-gradient(circle at 50% 42%, rgba(100,170,255,0.48) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Top specular edge */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(140,200,255,0.55), transparent)",
          pointerEvents: "none",
        }}
      />

      {/* Badge — stock count */}
      <AnimatePresence>
        {hasBadge && (
          <motion.span
            key="badge"
            initial={{ scale: 0.4, opacity: 0, y: -2 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={SPRING_UI}
            style={{
              position: "absolute",
              top: 3,
              right: 3,
              zIndex: 10,
              minWidth: 22,
              height: 18,
              borderRadius: 999,
              padding: "0 5px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 8,
              fontWeight: 800,
              fontFamily: "var(--mono, monospace)",
              color: "#fff",
              background: "linear-gradient(160deg, #6ea8f8 0%, #3d78c8 100%)",
              boxShadow: [
                "0 2px 6px rgba(16,52,120,0.38)",
                "inset 0 1px 0 rgba(255,255,255,0.38)",
              ].join(", "),
            }}
          >
            {badge}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Icon zone */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 10,
          paddingBottom: 2,
          position: "relative",
        }}
      >
        {/* Icon halo */}
        <motion.div
          animate={hasTools ? { opacity: [0.4, 0.82, 0.4] } : { opacity: 0.25 }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            width: iconSize + 18,
            height: iconSize + 18,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(100,165,255,0.55) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        {/* Icon */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: iconSize + 6,
            height: iconSize + 6,
            display: "grid",
            placeItems: "center",
            color: hasTools ? "#c8e0ff" : "#7a9ec0",
            filter: hasTools
              ? "drop-shadow(0 0 6px rgba(100,170,255,0.7))"
              : "none",
            transition: "filter 0.3s, color 0.3s",
          }}
        >
          <TacticalToolIcon id="shield" size={iconSize} />
        </div>
      </div>

      {/* Label footer */}
      <div
        style={{
          flexShrink: 0,
          padding: "3px 0 4px",
          textAlign: "center",
          background: "rgba(14,26,48,0.95)",
          borderTop: "1px solid rgba(100,160,255,0.14)",
        }}
      >
        <span
          style={{
            fontSize: 7,
            fontWeight: 800,
            color: hasTools ? "#b0ccf0" : "#6080a0",
            letterSpacing: "0.06em",
            fontFamily: "var(--display, system-ui)",
            transition: "color 0.3s",
          }}
        >
          أدوات
        </span>
      </div>

      {/* CSS keyframes for ambient pulse */}
      <style>{`
        @keyframes tacBtnPulse {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50%      { opacity: 0.85; transform: scale(1.06); }
        }
      `}</style>
    </motion.button>
  );
}
