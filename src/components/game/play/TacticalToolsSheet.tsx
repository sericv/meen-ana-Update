"use client";

import { AnimatePresence, motion } from "framer-motion";
import { memo, useCallback } from "react";
import { GameplaySheet } from "@/components/game/play/GameplaySheets";
import { TacticalToolIcon } from "@/components/game/play/TacticalToolIcons";
import { GP } from "@/components/game/play/tokens";
import { canUseTacticalTool } from "@/lib/match/tactical-availability";
import {
  TACTICAL_SHOP_ITEMS,
  TACTICAL_TOOL_IDS,
  type TacticalInventory,
  type TacticalToolId,
} from "@/lib/profile/tactical-tools";
import type { MatchState } from "@/types";

/* ─── per-tool accent palette ─── */
const TOOL_ACCENT: Record<TacticalToolId, { bg: string; glow: string; border: string; badge: string }> = {
  extra_time: {
    bg:    "linear-gradient(160deg, oklch(0.96 0.08 80 / .9), oklch(0.88 0.06 74 / .95))",
    glow:  "oklch(0.78 0.18 78 / .45)",
    border:"oklch(0.78 0.14 76 / .7)",
    badge: "linear-gradient(135deg, oklch(0.84 0.18 78), oklch(0.70 0.20 65))",
  },
  time_pressure: {
    bg:    "linear-gradient(160deg, oklch(0.96 0.06 22 / .9), oklch(0.88 0.05 18 / .95))",
    glow:  "oklch(0.62 0.22 22 / .45)",
    border:"oklch(0.62 0.20 22 / .7)",
    badge: "linear-gradient(135deg, oklch(0.58 0.22 22), oklch(0.48 0.20 18))",
  },
  extra_question: {
    bg:    "linear-gradient(160deg, oklch(0.95 0.07 150 / .9), oklch(0.88 0.05 145 / .95))",
    glow:  "oklch(0.68 0.18 145 / .45)",
    border:"oklch(0.68 0.16 148 / .7)",
    badge: "linear-gradient(135deg, oklch(0.64 0.18 148), oklch(0.52 0.16 144))",
  },
  shield: {
    bg:    "linear-gradient(160deg, oklch(0.94 0.07 235 / .9), oklch(0.87 0.05 228 / .95))",
    glow:  "oklch(0.68 0.18 235 / .45)",
    border:"oklch(0.68 0.16 238 / .7)",
    badge: "linear-gradient(135deg, oklch(0.64 0.18 238), oklch(0.52 0.16 232))",
  },
};

/* ─── Types ─── */
type Props = {
  open: boolean;
  match: MatchState | null;
  uid: string | null;
  myTurn: boolean;
  phase: string;
  inventory: TacticalInventory;
  busy: TacticalToolId | null;
  error?: string | null;
  onClose: () => void;
  onUse: (toolId: TacticalToolId) => void;
};

/* ─── Sheet ─── */
export function TacticalToolsSheet({
  open,
  match,
  uid,
  myTurn,
  phase,
  inventory,
  busy,
  error,
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

  return (
    <AnimatePresence>
      {open ? (
        <GameplaySheet title="الأدوات التكتيكية" accent="#3d6a9e" onClose={onClose}>

          {/* status line */}
          <p className="text-xs font-semibold mb-3" style={{ color: GP.inkSoft }}>
            {totalOwned > 0
              ? `${totalOwned} أداة في المخزون · مرة واحدة لكل أداة`
              : "لا توجد أدوات — اشترِها من المتجر"}
          </p>

          {/* extra-Q banner */}
          <AnimatePresence>
            {extraQActive && (
              <motion.p
                key="extra-q"
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -4, height: 0 }}
                className="mb-3 rounded-xl px-3 py-2 text-center text-[11px] font-extrabold"
                style={{ background: "rgba(255,159,10,0.15)", color: GP.orangeDeep }}
              >
                سؤالان هذا الدور — اسأل مرتين ثم يجيب الخصم
              </motion.p>
            )}
          </AnimatePresence>

          {/* error banner */}
          <AnimatePresence>
            {error && (
              <motion.p
                key="err"
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -4, height: 0 }}
                className="mb-3 rounded-xl px-3 py-2 text-center text-[11px] font-bold"
                style={{ background: "rgba(255,240,235,0.95)", color: GP.roseDeep }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* tool grid */}
          <div className="flex flex-col gap-2.5">
            {TACTICAL_SHOP_ITEMS.map((item, i) => {
              const count = inventory[item.id] ?? 0;
              const { ok } = canUseTacticalTool({ toolId: item.id, match, uid, myTurn, phase, inventory });
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
                  onClick={() => onUse(item.id)}
                />
              );
            })}
          </div>
        </GameplaySheet>
      ) : null}
    </AnimatePresence>
  );
}

/* ─── Individual card ─── */
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
  const ac = TOOL_ACCENT[toolId];

  const handleClick = useCallback(() => {
    if (!disabled) onClick();
  }, [disabled, onClick]);

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.055, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      whileTap={disabled ? {} : { scale: 0.975 }}
      className="relative w-full text-right disabled:cursor-not-allowed"
      style={{
        background: ready ? ac.bg : "rgba(255,255,255,0.88)",
        borderRadius: 18,
        border: `1.5px solid ${ready ? ac.border : "rgba(244,196,141,0.35)"}`,
        padding: "12px 14px",
        boxShadow: ready
          ? `0 6px 20px ${ac.glow}, inset 0 1px 0 rgba(255,255,255,0.6)`
          : "0 2px 8px rgba(180,120,60,0.08), inset 0 1px 0 rgba(255,255,255,0.55)",
        opacity: disabled && !ready && count === 0 ? 0.52 : 1,
        willChange: "transform",
        contain: "layout style",
        transition: "box-shadow 0.2s, opacity 0.2s",
      }}
    >
      {/* "جاهزة" badge */}
      <AnimatePresence>
        {ready && (
          <motion.span
            key="ready"
            initial={{ opacity: 0, scale: 0.7, y: 3 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.22 }}
            className="absolute -top-2.5 right-3 rounded-full px-2 py-0.5 text-[9px] font-extrabold"
            style={{ background: ac.badge, color: "#fff", boxShadow: `0 2px 8px ${ac.glow}` }}
          >
            جاهزة
          </motion.span>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3">
        {/* Icon bubble */}
        <motion.div
          animate={ready ? { boxShadow: [`0 0 0 0 ${ac.glow}`, `0 0 0 6px transparent`] } : {}}
          transition={ready ? { duration: 1.6, repeat: Infinity, ease: "easeOut" } : {}}
          className="grid shrink-0 place-items-center rounded-[14px]"
          style={{
            width: 46,
            height: 46,
            background: ready
              ? ac.badge
              : "linear-gradient(180deg, #f5eadc 0%, #ecdac6 100%)",
            color: ready ? "#fff" : GP.inkSoft,
          }}
        >
          <TacticalToolIcon id={toolId} size={22} />
        </motion.div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <p
            className="font-extrabold leading-tight"
            style={{
              color: busy ? GP.inkSoft : GP.ink,
              fontSize: 14,
              transition: "color 0.2s",
            }}
          >
            {busy ? "جاري التفعيل…" : title}
          </p>
          <p className="mt-0.5 text-xs leading-snug" style={{ color: GP.inkSoft }}>
            {subtitle}
          </p>
        </div>

        {/* Stock pill */}
        <div
          className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold"
          style={{
            background: count > 0
              ? ready
                ? "rgba(255,255,255,0.55)"
                : "rgba(244,196,141,0.22)"
              : "rgba(220,180,140,0.18)",
            color: count > 0 ? (ready ? GP.ink : GP.inkSoft) : GP.inkSoft,
            border: count > 0
              ? `1px solid ${ready ? "rgba(255,255,255,0.5)" : "rgba(244,196,141,0.3)"}`
              : "1px solid rgba(220,180,140,0.2)",
          }}
        >
          {count > 0 ? `×${count}` : "—"}
        </div>
      </div>

      {/* busy shimmer */}
      {busy && (
        <motion.div
          animate={{ x: ["-120%", "120%"] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 18,
            background: "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.45) 50%, transparent 80%)",
            pointerEvents: "none",
            overflow: "hidden",
          }}
        />
      )}
    </motion.button>
  );
});
