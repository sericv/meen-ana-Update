"use client";

import { AnimatePresence, motion } from "framer-motion";
import { memo, useCallback, useRef, useState } from "react";
import { GameplaySheet } from "@/components/game/play/GameplaySheets";
import { TacticalToolIcon } from "@/components/game/play/TacticalToolIcons";
import {
  TacticalActivationOverlay,
  type TacticalActivation,
} from "@/components/game/play/TacticalActivationOverlay";
import { canUseTacticalTool } from "@/lib/match/tactical-availability";
import {
  TACTICAL_SHOP_ITEMS,
  TACTICAL_TOOL_IDS,
  type TacticalInventory,
  type TacticalToolId,
} from "@/lib/profile/tactical-tools";
import { EASE_OUT } from "@/lib/motion";
import type { MatchState } from "@/types";

/* ─── Per-tool palette (project identity colors) ────────────── */
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
    dot:         "#7C3AED",
    bar:         "linear-gradient(90deg, #7C3AED, #5B21B6)",
    orb:         "radial-gradient(circle at 50% 58%, rgba(124,58,237,0.50) 0%, transparent 68%)",
    iconColor:   "#A78BFA",
    iconReady:   "#7C3AED",
    dotGlow:     "rgba(124,58,237,0.55)",
    border:      "rgba(124,58,237,0.15)",
    borderReady: "rgba(124,58,237,0.45)",
    shadow:      "0 1px 4px rgba(0,0,0,0.04)",
    shadowReady: "0 3px 14px rgba(124,58,237,0.16), 0 1px 3px rgba(0,0,0,0.04)",
  },
  time_pressure: {
    dot:         "#E5524D",
    bar:         "linear-gradient(90deg, #E5524D, #B8332E)",
    orb:         "radial-gradient(circle at 50% 58%, rgba(229,82,77,0.44) 0%, transparent 68%)",
    iconColor:   "#FB9A98",
    iconReady:   "#E5524D",
    dotGlow:     "rgba(229,82,77,0.55)",
    border:      "rgba(229,82,77,0.15)",
    borderReady: "rgba(229,82,77,0.45)",
    shadow:      "0 1px 4px rgba(0,0,0,0.04)",
    shadowReady: "0 3px 14px rgba(229,82,77,0.15), 0 1px 3px rgba(0,0,0,0.04)",
  },
  extra_question: {
    dot:         "#FFE600",
    bar:         "linear-gradient(90deg, #FFE600, #E5CC00)",
    orb:         "radial-gradient(circle at 50% 58%, rgba(255,230,0,0.48) 0%, transparent 68%)",
    iconColor:   "#E5D966",
    iconReady:   "#E5CC00",
    dotGlow:     "rgba(255,230,0,0.55)",
    border:      "rgba(255,230,0,0.15)",
    borderReady: "rgba(255,230,0,0.45)",
    shadow:      "0 1px 4px rgba(0,0,0,0.04)",
    shadowReady: "0 3px 14px rgba(255,200,0,0.16), 0 1px 3px rgba(0,0,0,0.04)",
  },
  shield: {
    dot:         "#5B21B6",
    bar:         "linear-gradient(90deg, #8B5CF6, #5B21B6)",
    orb:         "radial-gradient(circle at 50% 58%, rgba(91,33,182,0.44) 0%, transparent 68%)",
    iconColor:   "#A78BFA",
    iconReady:   "#8B5CF6",
    dotGlow:     "rgba(91,33,182,0.55)",
    border:      "rgba(91,33,182,0.15)",
    borderReady: "rgba(91,33,182,0.45)",
    shadow:      "0 1px 4px rgba(0,0,0,0.04)",
    shadowReady: "0 3px 14px rgba(91,33,182,0.14), 0 1px 3px rgba(0,0,0,0.04)",
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
          <GameplaySheet title="الأدوات التكتيكية" accent="#7C3AED" onClose={onClose}>

            {/* Inventory summary */}
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              className="mb-3 text-xs font-semibold"
              style={{ color: "#7A5A45" }}
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
                    background: "linear-gradient(135deg, rgba(255,230,0,0.12), rgba(255,200,0,0.06))",
                    border: "1px solid rgba(255,230,0,0.35)",
                    color: "#B3A000",
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
                    color: "#B8332E",
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

  let actionLabel = "غير متاح";
  let actionStyle = "bg-slate-50 border-slate-200/50 text-slate-400";

  if (empty) {
    actionLabel = "تحتاج شراء";
    actionStyle = "bg-amber-50 border-amber-200/60 text-amber-600";
  } else if (busy) {
    actionLabel = "تفعيل...";
    actionStyle = "bg-purple-50 border-purple-100 text-[#7C3AED]";
  } else if (ready) {
    actionLabel = "استخدام";
    actionStyle = "bg-[#7C3AED] border-purple-800 text-white shadow-sm hover:scale-102 active:scale-95";
  } else {
    actionLabel = "انتظر دورك";
    actionStyle = "bg-slate-50 border-slate-200/50 text-slate-400";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`game-card-outer w-full relative transition-all duration-200 ${empty ? "opacity-60" : ""}`}
      style={{ padding: "4px", borderRadius: 20 }}
    >
      <div 
        className={`game-card-inner p-3.5 bg-white flex items-center gap-3 justify-between relative overflow-hidden ${
          ready ? "border-purple-200 bg-purple-50/5" : "border-slate-100"
        }`}
        style={{
          borderRadius: 16,
          border: ready ? "1.5px solid rgba(124, 58, 237, 0.2)" : "1.5px solid rgba(0, 0, 0, 0.05)",
        }}
      >
        
        {/* Accent bar on top */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: 3,
            background: t.bar,
            borderRadius: "16px 16px 0 0",
            opacity: ready ? 1 : 0.3,
            pointerEvents: "none",
          }}
        />

        <div className="flex items-center gap-3 flex-1 min-w-0">
          
          {/* Tool Icon container */}
          <div className="relative flex-shrink-0">
            {ready && (
              <span
                aria-hidden
                className="absolute inset-[-4px] rounded-2xl bg-purple-100/40 blur-[4px] animate-pulse"
              />
            )}
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${
                ready 
                  ? "bg-purple-50 border-purple-200 text-[#7C3AED] shadow-sm" 
                  : "bg-slate-50 border-slate-200/40 text-slate-400"
              }`}
              style={{
                borderWidth: "1.2px",
              }}
            >
              <TacticalToolIcon id={toolId} size={24} />
            </div>
          </div>

          {/* Text block */}
          <div className="flex-1 min-w-0 text-right">
            <div className="flex items-center gap-2 justify-start flex-row-reverse">
              <span className="text-xs font-black text-slate-800 font-sans block truncate">{title}</span>
              {count > 0 && (
                <span className="text-[9px] font-black font-mono bg-purple-50 border border-purple-100/50 text-[#7C3AED] px-1.5 py-px rounded-full shrink-0">
                  {`×${count}`}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-bold block mt-1 leading-normal truncate font-sans">
              {subtitle}
            </p>
          </div>

        </div>

        {/* Action Button */}
        <motion.button
          type="button"
          disabled={disabled}
          onClick={handleClick}
          whileTap={disabled ? {} : { scale: 0.94 }}
          className={`shrink-0 rounded-xl px-3.5 py-2 text-[10px] font-black border transition-all font-sans ${actionStyle}`}
          style={{ cursor: disabled ? "not-allowed" : "pointer" }}
        >
          {actionLabel}
        </motion.button>

      </div>

      {/* Busy shimmer */}
      {busy && (
        <motion.div
          aria-hidden
          animate={{ x: ["-130%", "130%"] }}
          transition={{ duration: 0.90, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 20,
            background: "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.48) 50%, transparent 80%)",
            pointerEvents: "none",
          }}
        />
      )}
    </motion.div>
  );
});
