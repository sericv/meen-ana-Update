"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { memo, useCallback, useRef, useState } from "react";
import { GameplaySheet } from "@/components/game/play/GameplaySheets";
import { TacticalToolIcon } from "@/components/game/play/TacticalToolIcons";
import {
  TacticalActivationOverlay,
  type TacticalActivation,
} from "@/components/game/play/TacticalActivationOverlay";
import { GP } from "@/components/game/play/tokens";
import { canUseTacticalTool } from "@/lib/match/tactical-availability";
import {
  TACTICAL_SHOP_ITEMS,
  TACTICAL_TOOL_IDS,
  type TacticalInventory,
  type TacticalToolId,
} from "@/lib/profile/tactical-tools";
import { SPRING_UI, EASE_OUT } from "@/lib/motion";
import type { MatchState } from "@/types";

/* ─── Per-tool rich palette ─────────────────────────────────── */
const TOOL_ACCENT: Record<
  TacticalToolId,
  {
    bg: string;
    bgReady: string;
    glow: string;
    glowStrong: string;
    border: string;
    badge: string;
    hue1: string;
    hue2: string;
    iconBg: string;
    iconBgReady: string;
    label: string;
  }
> = {
  extra_time: {
    bg:         "linear-gradient(160deg, rgba(255,255,255,0.94), rgba(248,252,250,0.97))",
    bgReady:    "linear-gradient(160deg, rgba(240,250,245,0.96), rgba(228,245,238,0.98))",
    glow:       "rgba(80,160,120,0.14)",
    glowStrong: "rgba(80,160,120,0.28)",
    border:     "rgba(120,190,155,0.38)",
    badge:      "linear-gradient(135deg, oklch(0.60 0.10 158), oklch(0.46 0.10 165))",
    hue1:       "oklch(0.60 0.10 158)",
    hue2:       "oklch(0.46 0.10 165)",
    iconBg:     "linear-gradient(160deg, #eef5f1, #dceee5)",
    iconBgReady:"linear-gradient(135deg, oklch(0.60 0.10 158), oklch(0.46 0.10 165))",
    label:      "وقت إضافي",
  },
  time_pressure: {
    bg:         "linear-gradient(160deg, rgba(255,255,255,0.94), rgba(252,249,248,0.97))",
    bgReady:    "linear-gradient(160deg, rgba(252,244,242,0.96), rgba(248,234,232,0.98))",
    glow:       "rgba(180,80,70,0.12)",
    glowStrong: "rgba(180,80,70,0.24)",
    border:     "rgba(200,110,100,0.32)",
    badge:      "linear-gradient(135deg, oklch(0.52 0.14 22), oklch(0.40 0.14 18))",
    hue1:       "oklch(0.52 0.14 22)",
    hue2:       "oklch(0.40 0.14 18)",
    iconBg:     "linear-gradient(160deg, #f5ecea, #ecdcda)",
    iconBgReady:"linear-gradient(135deg, oklch(0.52 0.14 22), oklch(0.40 0.14 18))",
    label:      "ضغط الوقت",
  },
  extra_question: {
    bg:         "linear-gradient(160deg, rgba(255,255,255,0.94), rgba(253,251,246,0.97))",
    bgReady:    "linear-gradient(160deg, rgba(253,248,238,0.96), rgba(250,241,222,0.98))",
    glow:       "rgba(190,140,40,0.14)",
    glowStrong: "rgba(190,140,40,0.28)",
    border:     "rgba(210,160,60,0.32)",
    badge:      "linear-gradient(135deg, oklch(0.62 0.12 68), oklch(0.48 0.14 55))",
    hue1:       "oklch(0.62 0.12 68)",
    hue2:       "oklch(0.48 0.14 55)",
    iconBg:     "linear-gradient(160deg, #f5eedc, #ece0c4)",
    iconBgReady:"linear-gradient(135deg, oklch(0.62 0.12 68), oklch(0.48 0.14 55))",
    label:      "سؤال إضافي",
  },
  shield: {
    bg:         "linear-gradient(160deg, rgba(255,255,255,0.94), rgba(248,249,253,0.97))",
    bgReady:    "linear-gradient(160deg, rgba(242,245,252,0.96), rgba(232,238,250,0.98))",
    glow:       "rgba(80,110,180,0.12)",
    glowStrong: "rgba(80,110,180,0.24)",
    border:     "rgba(110,140,205,0.32)",
    badge:      "linear-gradient(135deg, oklch(0.52 0.10 238), oklch(0.40 0.10 232))",
    hue1:       "oklch(0.52 0.10 238)",
    hue2:       "oklch(0.40 0.10 232)",
    iconBg:     "linear-gradient(160deg, #eaecf5, #d8dcee)",
    iconBgReady:"linear-gradient(135deg, oklch(0.52 0.10 238), oklch(0.40 0.10 232))",
    label:      "الدرع",
  },
};

/* ─── Types ─────────────────────────────────────────────────── */
type Props = {
  open: boolean;
  match: MatchState | null;
  uid: string | null;
  myTurn: boolean;
  phase: string;
  inventory: TacticalInventory;
  busy: TacticalToolId | null;
  error?: string | null;
  myName?: string;
  opponentName?: string;
  onClose: () => void;
  onUse: (toolId: TacticalToolId) => void;
};

/* ─── Sheet ─────────────────────────────────────────────────── */
export function TacticalToolsSheet({
  open,
  match,
  uid,
  myTurn,
  phase,
  inventory,
  busy,
  error,
  myName,
  opponentName,
  onClose,
  onUse,
}: Props) {
  const myTactical = uid ? match?.tacticalByUid?.[uid] : undefined;
  const extraQActive =
    myTurn &&
    phase === "question" &&
    (myTactical?.questionQuota ?? 1) >= 2 &&
    (myTactical?.questionsThisTurn ?? 0) < (myTactical?.questionQuota ?? 1);

  const totalOwned = TACTICAL_TOOL_IDS.reduce((s, id) => s + (inventory[id] ?? 0), 0);

  // Local activation state — triggers cinematic overlay
  const [activation, setActivation] = useState<TacticalActivation | null>(null);
  const activationKeyRef = useRef(0);

  const handleUse = useCallback((toolId: TacticalToolId) => {
    // Fire our Firebase write immediately
    onUse(toolId);
    // Launch local cinematic (purely cosmetic)
    activationKeyRef.current += 1;
    setActivation({
      toolId,
      actor: "me",
      key: activationKeyRef.current,
      myName,
      opponentName,
    });
    // Close sheet after a short delay so overlay takes center stage
    setTimeout(onClose, 300);
  }, [onUse, onClose, myName, opponentName]);

  const handleOverlayComplete = useCallback(() => {
    setActivation(null);
  }, []);

  return (
    <>
      <AnimatePresence>
        {open && (
          <GameplaySheet title="الأدوات التكتيكية" accent="#3d6a9e" onClose={onClose}>
            {/* Inventory summary */}
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              className="mb-3 text-xs font-semibold"
              style={{ color: GP.inkSoft }}
            >
              {totalOwned > 0
                ? `${totalOwned} أداة في المخزون · مرة واحدة لكل أداة`
                : "لا توجد أدوات — اشترِها من المتجر"}
            </motion.p>

            {/* Extra-Q active banner */}
            <AnimatePresence>
              {extraQActive && (
                <motion.div
                  key="extra-q-banner"
                  initial={{ opacity: 0, height: 0, y: -4 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.26, ease: EASE_OUT }}
                  className="mb-3 overflow-hidden rounded-xl px-3 py-2 text-center text-[11px] font-extrabold"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,159,10,0.14), rgba(255,200,80,0.10))",
                    border: "1px solid rgba(255,159,10,0.35)",
                    color: GP.orangeDeep,
                  }}
                >
                  سؤالان هذا الدور — اسأل مرتين ثم يجيب الخصم
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  key="err-banner"
                  initial={{ opacity: 0, height: 0, y: -4 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.24, ease: EASE_OUT }}
                  className="mb-3 overflow-hidden rounded-xl px-3 py-2 text-center text-[11px] font-bold"
                  style={{
                    background: "rgba(255,240,238,0.97)",
                    border: "1px solid rgba(229,82,77,0.28)",
                    color: GP.roseDeep,
                  }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tool cards */}
            <div className="flex flex-col gap-3">
              {TACTICAL_SHOP_ITEMS.map((item, i) => {
                const count = inventory[item.id] ?? 0;
                const { ok } = canUseTacticalTool({
                  toolId: item.id,
                  match,
                  uid,
                  myTurn,
                  phase,
                  inventory,
                });
                const disabled = !ok || busy !== null || count < 1;
                const isBusy = busy === item.id;
                return (
                  <TacticalCard
                    key={item.id}
                    toolId={item.id}
                    title={item.nameAr}
                    subtitle={item.subtitleAr}
                    count={count}
                    ready={ok && count > 0}
                    disabled={disabled}
                    busy={isBusy}
                    index={i}
                    onClick={() => handleUse(item.id)}
                  />
                );
              })}
            </div>
          </GameplaySheet>
        )}
      </AnimatePresence>

      {/* Cinematic activation overlay — sits above sheet, clears itself */}
      <TacticalActivationOverlay
        activation={activation}
        onComplete={handleOverlayComplete}
      />
    </>
  );
}

/* ─── Individual tool card ──────────────────────────────────── */
const TacticalCard = memo(function TacticalCard({
  toolId,
  title,
  subtitle,
  count,
  ready,
  disabled,
  busy,
  index,
  onClick,
}: {
  toolId: TacticalToolId;
  title: string;
  subtitle: string;
  count: number;
  ready: boolean;
  disabled: boolean;
  busy: boolean;
  index: number;
  onClick: () => void;
}) {
  const reduced = useReducedMotion();
  const ac = TOOL_ACCENT[toolId];

  const handleClick = useCallback(() => {
    if (!disabled) onClick();
  }, [disabled, onClick]);

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.07,
        duration: 0.32,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileTap={disabled ? {} : { scale: 0.962 }}
      className="relative w-full overflow-hidden text-right disabled:cursor-not-allowed"
      style={{
        background: ready ? ac.bgReady : ac.bg,
        borderRadius: 20,
        border: `1.5px solid ${ready ? ac.border : "rgba(244,196,141,0.32)"}`,
        outline: ready ? `1px solid rgba(255,255,255,0.45)` : "none",
        padding: "14px 14px",
        boxShadow: ready
          ? [
              `0 2px 4px rgba(0,0,0,0.04)`,
              `0 6px 18px ${ac.glow}`,
              `0 16px 36px ${ac.glow}`,
              `inset 0 1.5px 0 rgba(255,255,255,0.65)`,
              `inset 0 -1px 0 rgba(0,0,0,0.04)`,
            ].join(", ")
          : [
              "0 2px 6px rgba(180,120,60,0.06)",
              "inset 0 1.5px 0 rgba(255,255,255,0.58)",
            ].join(", "),
        opacity: disabled && count === 0 ? 0.48 : 1,
        willChange: "transform",
        contain: "layout style",
        transition: "box-shadow 0.25s cubic-bezier(0.23,1,0.32,1), opacity 0.22s",
      }}
    >
      {/* Top accent bar for ready state */}
      <AnimatePresence>
        {ready && (
          <motion.div
            key="accent-bar"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            aria-hidden
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: ac.badge,
              borderRadius: "20px 20px 0 0",
              transformOrigin: "left",
            }}
          />
        )}
      </AnimatePresence>

      {/* Inner gloss */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 20,
          background: "linear-gradient(180deg, rgba(255,255,255,0.20) 0%, transparent 48%)",
          pointerEvents: "none",
        }}
      />

      {/* "جاهزة" badge */}
      <AnimatePresence>
        {ready && (
          <motion.span
            key="ready-badge"
            initial={{ opacity: 0, scale: 0.6, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 4 }}
            transition={SPRING_UI}
            style={{
              position: "absolute",
              top: -10,
              right: 14,
              borderRadius: 999,
              padding: "3px 10px",
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: "0.05em",
              background: ac.badge,
              color: "#fff",
              boxShadow: `0 2px 10px ${ac.glowStrong}, inset 0 1px 0 rgba(255,255,255,0.35)`,
            }}
          >
            جاهزة
          </motion.span>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3">
        {/* Icon bubble */}
        <div style={{ position: "relative" }}>
          {/* Pulse ring for ready state — CSS only */}
          {ready && !reduced && (
            <span
              aria-hidden
              style={{
                position: "absolute",
                inset: -6,
                borderRadius: 18,
                background: `radial-gradient(closest-side, ${ac.glow}, transparent 70%)`,
                animation: "tacGlowPulse 2s ease-in-out infinite",
                pointerEvents: "none",
              }}
            />
          )}
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: 16,
              background: ready ? ac.iconBgReady : ac.iconBg,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              position: "relative",
              boxShadow: ready
                ? [
                    `inset 0 1.5px 0 rgba(255,255,255,0.5)`,
                    `inset 0 -1px 0 rgba(0,0,0,0.12)`,
                    `0 4px 12px ${ac.glow}`,
                  ].join(", ")
                : "inset 0 1.5px 0 rgba(255,255,255,0.45), inset 0 -1px 0 rgba(0,0,0,0.06)",
              color: ready ? "#fff" : GP.inkSoft,
              transition: "background 0.3s, box-shadow 0.3s",
            }}
          >
            <TacticalToolIcon id={toolId} size={24} />

            {/* Specular streak on icon */}
            <span
              aria-hidden
              style={{
                position: "absolute",
                top: 2,
                left: "12%",
                right: "12%",
                height: "38%",
                borderRadius: "16px 16px 50% 50%",
                background: "linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 100%)",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <p
            className="font-extrabold leading-tight"
            style={{
              color: busy ? GP.inkSoft : ready ? GP.ink : GP.inkSoft,
              fontSize: 14.5,
              letterSpacing: "-0.01em",
              transition: "color 0.22s",
            }}
          >
            {busy ? "جاري التفعيل…" : title}
          </p>
          <p
            className="mt-0.5 text-xs leading-snug"
            style={{ color: GP.inkSoft, opacity: ready ? 0.9 : 0.7 }}
          >
            {subtitle}
          </p>
        </div>

        {/* Stock pill */}
        <div
          style={{
            flexShrink: 0,
            borderRadius: 999,
            padding: "5px 11px",
            fontSize: 11,
            fontWeight: 800,
            background: count > 0
              ? ready
                ? "rgba(255,255,255,0.50)"
                : "rgba(244,196,141,0.18)"
              : "rgba(220,180,140,0.14)",
            color: count > 0 ? (ready ? GP.ink : GP.inkSoft) : GP.inkSoft,
            border: count > 0
              ? `1px solid ${ready ? "rgba(255,255,255,0.55)" : "rgba(244,196,141,0.28)"}`
              : "1px solid rgba(220,180,140,0.18)",
          }}
        >
          {count > 0 ? `×${count}` : "—"}
        </div>
      </div>

      {/* Busy shimmer sweep */}
      {busy && (
        <motion.div
          aria-hidden
          animate={{ x: ["-130%", "130%"] }}
          transition={{ duration: 0.85, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 20,
            background:
              "linear-gradient(105deg, transparent 18%, rgba(255,255,255,0.50) 50%, transparent 82%)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* CSS keyframe for icon glow pulse */}
      <style>{`
        @keyframes tacGlowPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%      { opacity: 0.88; transform: scale(1.06); }
        }
      `}</style>
    </motion.button>
  );
});
