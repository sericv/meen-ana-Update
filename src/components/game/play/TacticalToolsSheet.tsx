"use client";

import { AnimatePresence, motion } from "framer-motion";
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
import { EASE_OUT } from "@/lib/motion";
import type { MatchState } from "@/types";

/* ─── Per-tool palette ───────────────────────────────────────── */
const TOOL: Record<TacticalToolId, {
  dot:         string;
  bar:         string;
  orb:         string;
  iconColor:   string;
  iconReady:   string;
  dotGlow:     string;
  border:      string;
  borderReady: string;
  shadow:      string;
  shadowReady: string;
}> = {
  extra_time: {
    dot:         "oklch(0.58 0.14 158)",
    bar:         "linear-gradient(90deg, oklch(0.62 0.12 158), oklch(0.50 0.12 168))",
    orb:         "radial-gradient(circle at 50% 58%, oklch(0.80 0.10 158 / .50) 0%, transparent 68%)",
    iconColor:   "oklch(0.55 0.08 158)",
    iconReady:   "oklch(0.44 0.13 160)",
    dotGlow:     "oklch(0.58 0.14 158 / .50)",
    border:      "oklch(0.86 0.04 70 / .36)",
    borderReady: "oklch(0.68 0.10 158 / .55)",
    shadow:      "0 1px 4px rgba(0,0,0,0.04)",
    shadowReady: "0 3px 14px oklch(0.58 0.10 158 / .16), 0 1px 3px rgba(0,0,0,0.04)",
  },
  time_pressure: {
    dot:         "oklch(0.56 0.20 22)",
    bar:         "linear-gradient(90deg, oklch(0.62 0.18 22), oklch(0.50 0.18 18))",
    orb:         "radial-gradient(circle at 50% 58%, oklch(0.82 0.14 22 / .44) 0%, transparent 68%)",
    iconColor:   "oklch(0.54 0.10 24)",
    iconReady:   "oklch(0.46 0.18 22)",
    dotGlow:     "oklch(0.56 0.20 22 / .50)",
    border:      "oklch(0.86 0.04 70 / .36)",
    borderReady: "oklch(0.68 0.12 22 / .50)",
    shadow:      "0 1px 4px rgba(0,0,0,0.04)",
    shadowReady: "0 3px 14px oklch(0.56 0.14 22 / .15), 0 1px 3px rgba(0,0,0,0.04)",
  },
  extra_question: {
    dot:         "oklch(0.62 0.18 68)",
    bar:         "linear-gradient(90deg, oklch(0.72 0.16 72), oklch(0.60 0.18 58))",
    orb:         "radial-gradient(circle at 50% 58%, oklch(0.88 0.14 72 / .48) 0%, transparent 68%)",
    iconColor:   "oklch(0.54 0.10 65)",
    iconReady:   "oklch(0.48 0.15 66)",
    dotGlow:     "oklch(0.62 0.18 68 / .50)",
    border:      "oklch(0.86 0.04 70 / .36)",
    borderReady: "oklch(0.72 0.12 68 / .55)",
    shadow:      "0 1px 4px rgba(0,0,0,0.04)",
    shadowReady: "0 3px 14px oklch(0.62 0.12 66 / .16), 0 1px 3px rgba(0,0,0,0.04)",
  },
  shield: {
    dot:         "oklch(0.52 0.16 238)",
    bar:         "linear-gradient(90deg, oklch(0.60 0.14 238), oklch(0.50 0.14 230))",
    orb:         "radial-gradient(circle at 50% 58%, oklch(0.78 0.12 238 / .44) 0%, transparent 68%)",
    iconColor:   "oklch(0.54 0.08 238)",
    iconReady:   "oklch(0.44 0.16 236)",
    dotGlow:     "oklch(0.52 0.16 238 / .50)",
    border:      "oklch(0.86 0.04 70 / .36)",
    borderReady: "oklch(0.66 0.12 236 / .50)",
    shadow:      "0 1px 4px rgba(0,0,0,0.04)",
    shadowReady: "0 3px 14px oklch(0.52 0.12 236 / .14), 0 1px 3px rgba(0,0,0,0.04)",
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

  const [activation, setActivation] = useState<TacticalActivation | null>(null);
  const activationKeyRef = useRef(0);

  const handleUse = useCallback((toolId: TacticalToolId) => {
    onUse(toolId);
    activationKeyRef.current += 1;
    setActivation({
      toolId,
      actor: "me",
      key: activationKeyRef.current,
      myName,
      opponentName,
    });
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
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.26, ease: EASE_OUT }}
                  className="mb-3 overflow-hidden rounded-xl px-3 py-2 text-center text-[11px] font-extrabold"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,159,10,0.12), rgba(255,200,80,0.08))",
                    border: "1px solid rgba(255,159,10,0.32)",
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
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.24, ease: EASE_OUT }}
                  className="mb-3 overflow-hidden rounded-xl px-3 py-2 text-center text-[11px] font-bold"
                  style={{
                    background: "rgba(255,240,238,0.97)",
                    border: "1px solid rgba(229,82,77,0.26)",
                    color: GP.roseDeep,
                  }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tool cards */}
            <div className="flex flex-col gap-2">
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
  const t = TOOL[toolId];
  const empty = count < 1;

  const handleClick = useCallback(() => {
    if (!disabled) onClick();
  }, [disabled, onClick]);

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.34, ease: [0.18, 1, 0.36, 1] }}
      whileTap={disabled ? {} : { scale: 0.965 }}
      className="relative w-full overflow-hidden text-right disabled:cursor-not-allowed"
      style={{
        background: "linear-gradient(168deg, rgba(255,255,255,0.99) 0%, oklch(0.963 0.014 76) 100%)",
        borderRadius: 16,
        border: `1.5px solid ${ready ? t.borderReady : t.border}`,
        padding: "11px 12px",
        boxShadow: `inset 0 1.5px 0 rgba(255,255,255,0.88), ${ready ? t.shadowReady : t.shadow}`,
        opacity: empty ? 0.44 : 1,
        willChange: "transform",
        contain: "layout style",
        transition: "box-shadow 0.24s cubic-bezier(0.23,1,0.32,1), border-color 0.24s cubic-bezier(0.23,1,0.32,1), opacity 0.20s",
      }}
    >
      {/* ── Accent bar — CSS transition, no Framer Motion ── */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: 2.5,
          background: t.bar,
          borderRadius: "16px 16px 0 0",
          opacity: ready ? 1 : empty ? 0 : 0.30,
          pointerEvents: "none",
          transition: "opacity 0.24s cubic-bezier(0.23,1,0.32,1)",
        }}
      />

      {/* ── Top gloss ── */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 16,
          background: "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, transparent 42%)",
          pointerEvents: "none",
        }}
      />

      {/* ── Ready indicator dot — replaces text badge, CSS only ── */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: 9,
          right: 11,
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: t.dot,
          opacity: ready ? 1 : 0,
          transform: ready ? "scale(1)" : "scale(0.4)",
          boxShadow: ready ? `0 0 6px ${t.dotGlow}` : "none",
          pointerEvents: "none",
          transition: "opacity 0.22s, transform 0.22s cubic-bezier(0.23,1,0.32,1), box-shadow 0.22s",
        }}
      />

      {/* ── Press flash ── */}
      <motion.span
        aria-hidden
        initial={{ opacity: 0 }}
        whileTap={disabled ? {} : { opacity: 1 }}
        transition={{ duration: 0.08 }}
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 16,
          background: t.orb,
          pointerEvents: "none",
        }}
      />

      <div className="flex items-center gap-3">
        {/* ── Icon bubble ── */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          {/* Static orb — CSS opacity transition, no continuous animation */}
          <span
            aria-hidden
            style={{
              position: "absolute",
              inset: -5,
              borderRadius: 18,
              background: t.orb,
              opacity: ready ? 0.65 : 0,
              pointerEvents: "none",
              transition: "opacity 0.26s",
            }}
          />

          {/* Icon container */}
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 13,
              background: "linear-gradient(160deg, oklch(0.975 0.020 78), oklch(0.942 0.026 74))",
              display: "grid",
              placeItems: "center",
              position: "relative",
              overflow: "hidden",
              boxShadow: ready
                ? `inset 0 1.5px 0 rgba(255,255,255,0.75), inset 0 -1px 0 rgba(0,0,0,0.06), 0 2px 8px ${t.dotGlow}`
                : "inset 0 1.5px 0 rgba(255,255,255,0.70), inset 0 -1px 0 rgba(0,0,0,0.05)",
              color: ready ? t.iconReady : t.iconColor,
              transition: "box-shadow 0.24s, color 0.22s",
            }}
          >
            {/* Orb inside bubble */}
            <span
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                background: t.orb,
                opacity: ready ? 0.65 : 0.28,
                transition: "opacity 0.24s",
                pointerEvents: "none",
              }}
            />
            {/* Specular streak */}
            <span
              aria-hidden
              style={{
                position: "absolute",
                top: 1,
                left: "14%",
                right: "14%",
                height: "34%",
                borderRadius: "13px 13px 50% 50%",
                background: "linear-gradient(180deg, rgba(255,255,255,0.40) 0%, transparent 100%)",
                pointerEvents: "none",
              }}
            />
            <div style={{ position: "relative", zIndex: 1 }}>
              <TacticalToolIcon id={toolId} size={22} />
            </div>
          </div>
        </div>

        {/* ── Text block ── */}
        <div className="min-w-0 flex-1">
          <p
            style={{
              fontFamily: "var(--display)",
              fontWeight: 800,
              fontSize: 13.5,
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
              color: busy ? GP.inkSoft : ready ? GP.ink : "oklch(0.42 0.05 52)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              transition: "color 0.20s",
            }}
          >
            {busy ? "جاري التفعيل…" : title}
          </p>
          <p
            style={{
              fontSize: 11,
              marginTop: 3,
              lineHeight: 1.3,
              color: "oklch(0.54 0.05 56)",
              opacity: ready ? 0.90 : 0.62,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              transition: "opacity 0.20s",
            }}
          >
            {subtitle}
          </p>
        </div>

        {/* ── Stock count ── */}
        <div
          style={{
            flexShrink: 0,
            minWidth: 28,
            textAlign: "center",
            borderRadius: 8,
            padding: "4px 8px",
            fontSize: 11,
            fontWeight: 800,
            fontVariantNumeric: "tabular-nums",
            background: count > 0
              ? ready ? "oklch(0.94 0.03 70 / .88)" : "oklch(0.92 0.02 70 / .65)"
              : "oklch(0.90 0.02 70 / .45)",
            color: count > 0
              ? ready ? "oklch(0.32 0.07 52)" : "oklch(0.50 0.05 56)"
              : "oklch(0.64 0.03 58)",
            border: `1px solid ${count > 0
              ? ready ? "oklch(0.78 0.06 68 / .38)" : "oklch(0.84 0.04 68 / .30)"
              : "oklch(0.84 0.02 68 / .22)"
            }`,
            transition: "background 0.22s, color 0.22s, border-color 0.22s",
          }}
        >
          {count > 0 ? `×${count}` : "—"}
        </div>
      </div>

      {/* ── Busy shimmer ── */}
      {busy && (
        <motion.div
          aria-hidden
          animate={{ x: ["-130%", "130%"] }}
          transition={{ duration: 0.90, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 16,
            background: "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.48) 50%, transparent 80%)",
            pointerEvents: "none",
          }}
        />
      )}
    </motion.button>
  );
});
