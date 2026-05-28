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

/* ─── Per-tool palette — unified warm base, rarity via accents ── */
/* All cards share the same cream surface. Tool identity lives in:
   · 3px accent bar (always present, dims when unavailable)
   · radial orb behind the icon
   · border tint
   · ambient shadow
   No full-bleed color blocks.                                      */
const TOOL: Record<TacticalToolId, {
  dot:       string;   // colored dot in ready badge
  bar:       string;   // top accent bar gradient
  orb:       string;   // radial glow behind icon
  iconColor: string;   // icon tint (default/inactive state)
  iconReady: string;   // icon tint when ready
  border:    string;   // card border
  borderReady: string; // card border when ready
  shadow:    string;   // ambient shadow
  shadowReady: string; // shadow when ready
}> = {
  extra_time: {
    dot:         "oklch(0.62 0.12 158)",
    bar:         "linear-gradient(90deg, oklch(0.62 0.12 158), oklch(0.50 0.12 168))",
    orb:         "radial-gradient(circle at 50% 58%, oklch(0.80 0.10 158 / .46) 0%, transparent 64%)",
    iconColor:   "oklch(0.55 0.08 158)",
    iconReady:   "oklch(0.46 0.12 160)",
    border:      "oklch(0.84 0.05 70 / .38)",
    borderReady: "oklch(0.72 0.08 158 / .50)",
    shadow:      "0 2px 8px rgba(0,0,0,0.04)",
    shadowReady: "0 3px 16px oklch(0.60 0.10 158 / .14), 0 1px 3px rgba(0,0,0,0.04)",
  },
  time_pressure: {
    dot:         "oklch(0.60 0.18 22)",
    bar:         "linear-gradient(90deg, oklch(0.62 0.18 22), oklch(0.50 0.18 18))",
    orb:         "radial-gradient(circle at 50% 58%, oklch(0.82 0.14 22 / .40) 0%, transparent 64%)",
    iconColor:   "oklch(0.55 0.10 24)",
    iconReady:   "oklch(0.48 0.16 22)",
    border:      "oklch(0.84 0.05 70 / .38)",
    borderReady: "oklch(0.72 0.10 22 / .46)",
    shadow:      "0 2px 8px rgba(0,0,0,0.04)",
    shadowReady: "0 3px 16px oklch(0.58 0.14 22 / .13), 0 1px 3px rgba(0,0,0,0.04)",
  },
  extra_question: {
    dot:         "oklch(0.68 0.16 68)",
    bar:         "linear-gradient(90deg, oklch(0.72 0.16 72), oklch(0.60 0.18 58))",
    orb:         "radial-gradient(circle at 50% 58%, oklch(0.88 0.14 72 / .46) 0%, transparent 64%)",
    iconColor:   "oklch(0.55 0.10 65)",
    iconReady:   "oklch(0.50 0.14 66)",
    border:      "oklch(0.84 0.05 70 / .38)",
    borderReady: "oklch(0.76 0.10 68 / .50)",
    shadow:      "0 2px 8px rgba(0,0,0,0.04)",
    shadowReady: "0 3px 16px oklch(0.64 0.12 66 / .14), 0 1px 3px rgba(0,0,0,0.04)",
  },
  shield: {
    dot:         "oklch(0.56 0.14 238)",
    bar:         "linear-gradient(90deg, oklch(0.60 0.14 238), oklch(0.50 0.14 230))",
    orb:         "radial-gradient(circle at 50% 58%, oklch(0.78 0.12 238 / .42) 0%, transparent 64%)",
    iconColor:   "oklch(0.55 0.08 238)",
    iconReady:   "oklch(0.46 0.14 236)",
    border:      "oklch(0.84 0.05 70 / .38)",
    borderReady: "oklch(0.70 0.10 236 / .46)",
    shadow:      "0 2px 8px rgba(0,0,0,0.04)",
    shadowReady: "0 3px 16px oklch(0.56 0.12 236 / .13), 0 1px 3px rgba(0,0,0,0.04)",
  },
};

/* ─── CSS keyframes ─────────────────────────────────────────── */
const TAC_CSS = `
  @keyframes tacOrb {
    0%, 100% { opacity: 0.55; transform: scale(1);    }
    50%       { opacity: 0.90; transform: scale(1.08); }
  }
`;

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
            <div className="flex flex-col gap-2.5">
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
  const reduced = useReducedMotion();
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
      /* Stagger entrance */
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.055, duration: 0.38, ease: [0.18, 1, 0.36, 1] }}
      whileTap={disabled ? {} : { scale: 0.963 }}
      className="relative w-full overflow-hidden text-right disabled:cursor-not-allowed"
      style={{
        /* Unified warm cream base — same for ALL tools */
        background: "linear-gradient(168deg, rgba(255,255,255,0.99) 0%, oklch(0.963 0.014 76) 100%)",
        borderRadius: 18,
        border: `1.5px solid ${ready ? t.borderReady : t.border}`,
        padding: "13px 13px 13px 13px",
        boxShadow: [
          `inset 0 1.5px 0 rgba(255,255,255,0.88)`,
          ready ? t.shadowReady : t.shadow,
        ].join(", "),
        opacity: empty ? 0.46 : 1,
        willChange: "transform",
        contain: "layout style",
        transition: "box-shadow 0.26s cubic-bezier(0.23,1,0.32,1), border-color 0.26s cubic-bezier(0.23,1,0.32,1), opacity 0.22s",
      }}
    >
      {/* ── Top accent bar — always present, dims when unavailable ── */}
      <motion.div
        aria-hidden
        animate={{ opacity: ready ? 1 : empty ? 0 : 0.35 }}
        initial={false}
        transition={{ duration: 0.30, ease: [0.23, 1, 0.32, 1] }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: t.bar,
          borderRadius: "18px 18px 0 0",
          pointerEvents: "none",
        }}
      />

      {/* ── Top gloss ── */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 18,
          background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 44%)",
          pointerEvents: "none",
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
          borderRadius: 18,
          background: `radial-gradient(ellipse at 50% 50%, ${t.orb.replace("radial-gradient(circle at 50% 58%, ", "").split(")")[0].trim()} 0%, transparent 65%)`,
          pointerEvents: "none",
        }}
      />

      {/* ── Ready badge — dot + text, spring pop ── */}
      <AnimatePresence>
        {ready && (
          <motion.span
            key="ready"
            initial={{ opacity: 0, scale: 0.62, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.62, y: 5 }}
            transition={SPRING_UI}
            style={{
              position: "absolute",
              top: -9,
              right: 13,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              borderRadius: 999,
              padding: "2px 8px 2px 6px",
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: "0.04em",
              background: "oklch(0.96 0.02 76 / .92)",
              border: "1px solid oklch(0.84 0.04 70 / .50)",
              color: "oklch(0.36 0.06 52)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.90)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
            }}
          >
            {/* Colored dot — tool identity signal */}
            <span
              aria-hidden
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: t.dot,
                flexShrink: 0,
                boxShadow: `0 0 5px ${t.dot}`,
              }}
            />
            جاهزة
          </motion.span>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3">
        {/* ── Icon bubble ── */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          {/* Ambient orb pulse — CSS, compositor */}
          {ready && !reduced && (
            <span
              aria-hidden
              style={{
                position: "absolute",
                inset: -7,
                borderRadius: 20,
                background: t.orb,
                animation: "tacOrb 2.4s ease-in-out infinite",
                pointerEvents: "none",
              }}
            />
          )}

          {/* Icon container — warm cream base always */}
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: 15,
              /* Unified warm base — orb provides the color accent */
              background: "linear-gradient(160deg, oklch(0.975 0.020 78), oklch(0.942 0.026 74))",
              display: "grid",
              placeItems: "center",
              position: "relative",
              overflow: "hidden",
              boxShadow: ready
                ? [
                    `inset 0 1.5px 0 rgba(255,255,255,0.75)`,
                    `inset 0 -1px 0 rgba(0,0,0,0.06)`,
                    `0 3px 10px ${t.orb.includes("oklch") ? t.orb.match(/oklch\([^)]+\)/)?.[0] ?? "transparent" : "transparent"} / .22)`.replace("/ .22)", "/ .22)"),
                  ].join(", ")
                : "inset 0 1.5px 0 rgba(255,255,255,0.70), inset 0 -1px 0 rgba(0,0,0,0.05)",
              transition: "box-shadow 0.26s cubic-bezier(0.23,1,0.32,1)",
              color: ready ? t.iconReady : t.iconColor,
            }}
          >
            {/* Inner orb behind icon */}
            <span
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                background: t.orb,
                opacity: ready ? 0.7 : 0.35,
                transition: "opacity 0.26s",
                pointerEvents: "none",
              }}
            />
            {/* Specular top streak */}
            <span
              aria-hidden
              style={{
                position: "absolute",
                top: 1,
                left: "14%",
                right: "14%",
                height: "36%",
                borderRadius: "15px 15px 50% 50%",
                background: "linear-gradient(180deg, rgba(255,255,255,0.42) 0%, transparent 100%)",
                pointerEvents: "none",
              }}
            />
            <div style={{ position: "relative", zIndex: 1 }}>
              <TacticalToolIcon id={toolId} size={24} />
            </div>
          </div>
        </div>

        {/* ── Text block ── */}
        <div className="min-w-0 flex-1">
          <p
            style={{
              fontFamily: "var(--display)",
              fontWeight: 800,
              fontSize: 14,
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
              color: busy ? GP.inkSoft : ready ? GP.ink : "oklch(0.40 0.05 52)",
              transition: "color 0.22s",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {busy ? "جاري التفعيل…" : title}
          </p>
          <p
            style={{
              fontSize: 10.5,
              marginTop: 2.5,
              lineHeight: 1.35,
              color: "oklch(0.54 0.05 56)",
              opacity: ready ? 0.92 : 0.70,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {subtitle}
          </p>
        </div>

        {/* ── Stock pill ── */}
        <div
          style={{
            flexShrink: 0,
            borderRadius: 999,
            padding: "4px 11px",
            fontSize: 11,
            fontWeight: 800,
            background: count > 0
              ? "oklch(0.94 0.02 70 / .80)"
              : "oklch(0.90 0.02 70 / .55)",
            color: count > 0
              ? ready ? "oklch(0.34 0.06 52)" : "oklch(0.50 0.05 56)"
              : "oklch(0.62 0.04 58)",
            border: `1px solid ${count > 0
              ? ready ? "oklch(0.80 0.06 68 / .40)" : "oklch(0.84 0.04 68 / .35)"
              : "oklch(0.84 0.02 68 / .28)"
            }`,
            transition: "background 0.22s, color 0.22s",
          }}
        >
          {count > 0 ? `×${count}` : "—"}
        </div>
      </div>

      {/* ── Busy shimmer sweep ── */}
      {busy && (
        <motion.div
          aria-hidden
          animate={{ x: ["-130%", "130%"] }}
          transition={{ duration: 0.88, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 18,
            background: "linear-gradient(105deg, transparent 18%, rgba(255,255,255,0.52) 50%, transparent 82%)",
            pointerEvents: "none",
          }}
        />
      )}

      <style>{TAC_CSS}</style>
    </motion.button>
  );
});
