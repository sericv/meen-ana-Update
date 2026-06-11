"use client";

/**
 * SideActionRail — right-of-card vertical rail
 *
 * Two stacked capsule tabs:
 *   • الأدوات  — flyout listing the 4 tactical tools, turn-gated
 *   • التلميحات — flyout with count/letter hints + mini name preview
 *
 * Visual design from action-rail.jsx reference.
 * All logic/data from existing project systems (no fake values).
 */

import { AnimatePresence, motion } from "framer-motion";
import { memo, useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { canUseTacticalTool } from "@/lib/match/tactical-availability";
import {
  TACTICAL_SHOP_ITEMS,
  type TacticalInventory,
  type TacticalToolId,
} from "@/lib/profile/tactical-tools";
import { TacticalToolIcon } from "@/components/game/play/TacticalToolIcons";
import type { MatchState } from "@/types";

/* ── palette for each tool (warm identity) ──────────────────── */
const TOOL_PALETTE: Record<TacticalToolId, { hue1: string; hue2: string; glow: string }> = {
  extra_time:     { hue1: "oklch(0.70 0.14 165)", hue2: "oklch(0.52 0.14 175)", glow: "oklch(0.72 0.12 165 / .5)" },
  time_pressure:  { hue1: "oklch(0.68 0.20 22)",  hue2: "oklch(0.50 0.22 18)",  glow: "oklch(0.68 0.18 22 / .5)"  },
  extra_question: { hue1: "oklch(0.78 0.18 75)",  hue2: "oklch(0.60 0.20 58)",  glow: "oklch(0.78 0.16 70 / .5)"  },
  shield:         { hue1: "oklch(0.62 0.14 238)", hue2: "oklch(0.46 0.14 232)", glow: "oklch(0.64 0.12 235 / .5)"  },
};

/* ── types ───────────────────────────────────────────────────── */
export type SideActionRailProps = {
  match: MatchState | null;
  uid: string | null;
  myTurn: boolean;
  phase: string;
  inventory: TacticalInventory;
  tacticalBusy: TacticalToolId | null;
  /** Credits from shop purchases */
  bonusLetterHints: number;
  bonusCountHints: number;
  /** From useMatchHints */
  hintsLeft: number;
  hintUsed: boolean;
  letters: string[];
  revealedIdx: number[];
  hintBusy: boolean;
  onUseTactical: (toolId: TacticalToolId) => void;
  /** Called after firing so RoomExperience can show the cinematic at root level */
  onTacticalFired?: (toolId: TacticalToolId) => void;
  onUseHint: (kind: "letter" | "count") => void;
};

export const SideActionRail = memo(function SideActionRail({
  match,
  uid,
  myTurn,
  phase,
  inventory,
  tacticalBusy,
  bonusLetterHints,
  bonusCountHints,
  hintsLeft,
  hintUsed,
  letters,
  revealedIdx,
  hintBusy,
  onUseTactical,
  onTacticalFired,
  onUseHint,
}: SideActionRailProps) {
  const [open, setOpen] = useState<null | "tools" | "hints">(null);

  const toolsOwned = TACTICAL_SHOP_ITEMS.reduce((s, item) => s + (inventory[item.id] ?? 0), 0);
  const hasHints = hintsLeft > 0 || bonusLetterHints > 0 || bonusCountHints > 0;
  // badge = remaining usable hints (or 1 if shop credits exist but hintsLeft=0)
  const hintBadge = hintUsed ? 0 : hintsLeft > 0 ? hintsLeft : (bonusLetterHints + bonusCountHints > 0 ? 1 : 0);

  // close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const fireTool = useCallback((toolId: TacticalToolId) => {
    const { ok } = canUseTacticalTool({ toolId, match, uid, myTurn, phase, inventory });
    if (!ok || tacticalBusy) return;
    onUseTactical(toolId);
    // Bubble up so RoomExperience mounts the cinematic at the root level (no clip).
    onTacticalFired?.(toolId);
    setOpen(null);
  }, [match, uid, myTurn, phase, inventory, tacticalBusy, onUseTactical, onTacticalFired]);

  const useHint = useCallback((kind: "letter" | "count") => {
    if (hintBusy || (kind === "letter" && bonusLetterHints <= 0 && hintsLeft <= 0)) return;
    if (kind === "count" && bonusCountHints <= 0 && hintsLeft <= 0) return;
    onUseHint(kind);
    // Flyout stays open — player can use consecutive hints without reopening.
    // It will close only via backdrop click, Escape, or tab toggle.
  }, [hintBusy, hintsLeft, bonusLetterHints, bonusCountHints, onUseHint]);

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        right: 6,
        transform: "translateY(-50%)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        zIndex: 22,
      }}
    >
      {/* click-away backdrop */}
      {open && (
        <div
          onClick={() => setOpen(null)}
          style={{ position: "fixed", inset: 0, zIndex: 0 }}
        />
      )}

      {/* ── TOOLS TAB ── */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <RailTab
          icon={<ToolsIcon />}
          label="الأدوات"
          badge={toolsOwned}
          active={open === "tools"}
          onClick={() => setOpen((o) => (o === "tools" ? null : "tools"))}
        />
        <AnimatePresence>
          {open === "tools" && (
            <ToolsFlyout
              match={match}
              uid={uid}
              myTurn={myTurn}
              phase={phase}
              inventory={inventory}
              tacticalBusy={tacticalBusy}
              onFire={fireTool}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ── HINTS TAB ── */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <RailTab
          icon={<HintsIcon />}
          label="تلميحات"
          badge={hintBadge}
          amber
          active={open === "hints"}
          onClick={() => setOpen((o) => (o === "hints" ? null : "hints"))}
        />
        <AnimatePresence>
          {open === "hints" && (
            <HintsFlyout
              hintsLeft={hintsLeft}
              bonusLetterHints={bonusLetterHints}
              bonusCountHints={bonusCountHints}
              hintBusy={hintBusy}
              hasHints={hasHints}
              letters={letters}
              revealedIdx={revealedIdx}
              onUseHint={useHint}
            />
          )}
        </AnimatePresence>
      </div>

    </div>
  );
});

/* ── Collapsed capsule tab ─────────────────────────────────── */
function RailTab({
  icon,
  label,
  badge,
  amber = false,
  active,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  badge: number;
  amber?: boolean;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      onClick={onClick}
      aria-label={label}
      style={{
        position: "relative",
        width: 54,
        padding: "9px 0 8px",
        borderRadius: 16,
        background: active
          ? "linear-gradient(180deg, oklch(0.94 0.07 75), oklch(0.88 0.10 65))"
          : "linear-gradient(180deg, oklch(0.98 0.014 80 / .96), oklch(0.94 0.026 76 / .96))",
        border: `1px solid ${active ? "oklch(0.74 0.13 60 / .6)" : "oklch(0.76 0.05 60 / .45)"}`,
        boxShadow: active
          ? "inset 0 1px 0 rgba(255,255,255,.6), 0 8px 18px -8px oklch(0.65 0.16 55 / .45)"
          : "inset 0 1px 0 rgba(255,255,255,.7), 0 6px 14px -8px oklch(0.50 0.08 50 / .3)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        cursor: "pointer",
      }}
    >
      {/* Icon orb */}
      <span
        style={{
          width: 30,
          height: 30,
          borderRadius: 10,
          display: "grid",
          placeItems: "center",
          background: amber
            ? "linear-gradient(180deg, oklch(0.82 0.16 78), oklch(0.72 0.18 62))"
            : "linear-gradient(180deg, oklch(0.40 0.05 45), oklch(0.30 0.04 42))",
          color: amber ? "oklch(0.24 0.05 40)" : "oklch(0.96 0.03 80)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.4)",
        }}
      >
        {icon}
      </span>

      {/* Label */}
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          fontFamily: "var(--display, system-ui)",
          color: active ? "oklch(0.36 0.10 50)" : "oklch(0.38 0.06 45)",
          letterSpacing: "-0.01em",
        }}
      >
        {label}
      </span>

      {/* Badge */}
      {badge > 0 && (
        <span
          style={{
            position: "absolute",
            top: -5,
            left: -5,
            minWidth: 18,
            height: 18,
            padding: "0 4px",
            borderRadius: 999,
            background: "linear-gradient(180deg, oklch(0.82 0.16 78), oklch(0.70 0.18 60))",
            color: "oklch(0.22 0.04 35)",
            border: "2px solid oklch(0.97 0.022 78)",
            fontFamily: "var(--mono, monospace)",
            fontWeight: 800,
            fontSize: 10,
            display: "grid",
            placeItems: "center",
            lineHeight: 1,
          }}
        >
          {badge}
        </span>
      )}

      {/* Caret toward flyout */}
      <span
        style={{
          position: "absolute",
          right: -4,
          top: "50%",
          width: 8,
          height: 8,
          transform: "translateY(-50%) rotate(45deg)",
          background: active ? "oklch(0.92 0.08 70)" : "oklch(0.97 0.018 80)",
          borderTop: `1px solid oklch(0.76 0.05 60 / .45)`,
          borderRight: `1px solid oklch(0.76 0.05 60 / .45)`,
          opacity: active ? 1 : 0,
          transition: "opacity .2s",
        }}
      />
    </motion.button>
  );
}

/* ── Base flyout container ─────────────────────────────────── */
function Flyout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 8, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 6, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 440, damping: 30 }}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "absolute",
        top: "50%",
        right: "calc(100% + 10px)",
        transform: "translateY(-50%)",
        transformOrigin: "right center",
        width: 234,
        padding: 14,
        borderRadius: 20,
        background: "linear-gradient(180deg, oklch(0.985 0.016 80), oklch(0.945 0.028 76))",
        border: "1px solid oklch(0.78 0.06 60 / .5)",
        boxShadow: "0 26px 52px -14px oklch(0.42 0.08 45 / .45), inset 0 1px 0 rgba(255,255,255,.7)",
        zIndex: 2,
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 10 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            fontFamily: "var(--display, system-ui)",
            color: "oklch(0.28 0.06 40)",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 10.5,
            color: "oklch(0.52 0.05 45)",
            marginTop: 1,
          }}
        >
          {subtitle}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {children}
      </div>

      {/* Pointer caret toward rail */}
      <div
        style={{
          position: "absolute",
          right: -6,
          top: "50%",
          transform: "translateY(-50%) rotate(45deg)",
          width: 12,
          height: 12,
          background: "oklch(0.965 0.024 78)",
          borderTop: "1px solid oklch(0.78 0.06 60 / .5)",
          borderRight: "1px solid oklch(0.78 0.06 60 / .5)",
        }}
      />
    </motion.div>
  );
}

/* ── Tools flyout ──────────────────────────────────────────── */
function ToolsFlyout({
  match,
  uid,
  myTurn,
  phase,
  inventory,
  tacticalBusy,
  onFire,
}: {
  match: MatchState | null;
  uid: string | null;
  myTurn: boolean;
  phase: string;
  inventory: TacticalInventory;
  tacticalBusy: TacticalToolId | null;
  onFire: (id: TacticalToolId) => void;
}) {
  const totalOwned = TACTICAL_SHOP_ITEMS.reduce((s, item) => s + (inventory[item.id] ?? 0), 0);
  return (
    <Flyout
      title="الأدوات"
      subtitle={totalOwned > 0 ? `${totalOwned} أداة في المخزون · مرة واحدة` : "لا أدوات — اشترِها من المتجر"}
    >
      {TACTICAL_SHOP_ITEMS.map((item) => {
        const count = inventory[item.id] ?? 0;
        const { ok, reason } = canUseTacticalTool({
          toolId: item.id,
          match,
          uid,
          myTurn,
          phase,
          inventory,
        });
        const isBusy = tacticalBusy === item.id;
        const pal = TOOL_PALETTE[item.id];
        return (
          <ToolRow
            key={item.id}
            toolId={item.id}
            nameAr={item.nameAr}
            subtitleAr={item.subtitleAr}
            count={count}
            ok={ok}
            reason={reason}
            busy={isBusy}
            palette={pal}
            onClick={() => onFire(item.id)}
          />
        );
      })}
    </Flyout>
  );
}

function ToolRow({
  toolId,
  nameAr,
  subtitleAr,
  count,
  ok,
  reason,
  busy,
  palette: pal,
  onClick,
}: {
  toolId: TacticalToolId;
  nameAr: string;
  subtitleAr: string;
  count: number;
  ok: boolean;
  reason?: string;
  busy: boolean;
  palette: { hue1: string; hue2: string; glow: string };
  onClick: () => void;
}) {
  const empty = count < 1;
  const dim = empty || !ok || busy;

  return (
    <motion.button
      type="button"
      whileTap={!dim ? { scale: 0.97 } : {}}
      onClick={onClick}
      disabled={dim}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: 9,
        borderRadius: 13,
        textAlign: "right",
        width: "100%",
        background: empty ? "oklch(0.93 0.018 78)" : "oklch(0.985 0.012 80)",
        border: `1px solid ${empty ? "oklch(0.78 0.04 65 / .35)" : `${pal.hue2}40`}`,
        opacity: dim ? 0.58 : 1,
        cursor: dim ? "default" : "pointer",
        transition: "opacity .18s",
      }}
    >
      {/* Icon orb */}
      <span
        style={{
          flexShrink: 0,
          width: 38,
          height: 38,
          borderRadius: 11,
          display: "grid",
          placeItems: "center",
          background: empty
            ? "linear-gradient(180deg, oklch(0.85 0.02 70), oklch(0.78 0.02 65))"
            : `linear-gradient(180deg, ${pal.hue1}, ${pal.hue2})`,
          color: empty ? "oklch(0.56 0.04 50)" : "oklch(0.98 0.02 80)",
          boxShadow: empty ? "none" : `inset 0 1px 0 rgba(255,255,255,.4), 0 5px 11px -5px ${pal.glow}`,
          filter: empty ? "saturate(.3)" : "none",
        }}
      >
        <TacticalToolIcon id={toolId} size={19} />
      </span>

      {/* Text */}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "var(--display, system-ui)",
              color: "oklch(0.28 0.06 40)",
            }}
          >
            {nameAr}
          </span>
          {empty && (
            <span
              style={{
                fontSize: 9,
                fontFamily: "var(--mono, monospace)",
                color: "oklch(0.54 0.04 45)",
              }}
            >
              لا يوجد
            </span>
          )}
          {!empty && !ok && reason && (
            <span
              style={{
                fontSize: 9,
                fontFamily: "var(--mono, monospace)",
                color: "oklch(0.55 0.16 22)",
              }}
            >
              {reason}
            </span>
          )}
        </span>
        <span
          style={{
            display: "block",
            fontSize: 10.5,
            lineHeight: 1.4,
            marginTop: 1,
            color: "oklch(0.50 0.05 45)",
          }}
        >
          {subtitleAr}
        </span>
      </span>
    </motion.button>
  );
}

/* ── Hints flyout ──────────────────────────────────────────── */
function HintsFlyout({
  hintsLeft,
  bonusLetterHints,
  bonusCountHints,
  hintBusy,
  hasHints,
  letters,
  revealedIdx,
  onUseHint,
}: {
  hintsLeft: number;
  bonusLetterHints: number;
  bonusCountHints: number;
  hintBusy: boolean;
  hasHints: boolean;
  letters: string[];
  revealedIdx: number[];
  onUseHint: (kind: "letter" | "count") => void;
}) {
  const letterDisabled = hintBusy || (bonusLetterHints <= 0 && hintsLeft <= 0);
  const countDisabled = hintBusy || (bonusCountHints <= 0 && hintsLeft <= 0);
  const totalHints = hintsLeft + bonusLetterHints + bonusCountHints;

  return (
    <Flyout
      title="التلميحات"
      subtitle={totalHints > 0 ? `متبقي ${totalHints} تلميح` : "لا تلميحات متبقية"}
    >
      {/* Mini hidden-name preview */}
      {letters.length > 0 && (
        <div style={{ margin: "2px 0 10px" }}>
          <div
            style={{
              fontSize: 9,
              letterSpacing: ".18em",
              color: "oklch(0.54 0.05 45)",
              marginBottom: 6,
              textTransform: "uppercase",
              fontFamily: "var(--mono, monospace)",
            }}
          >
            اسمك المخفي
          </div>
          <MiniLetters letters={letters} revealedIdx={revealedIdx} />
        </div>
      )}

      {/* عدد الأحرف */}
      <HintRow
        icon={<CountIcon />}
        title="عدد الأحرف"
        blurb="يكشف عدد أحرف اسمك"
        credits={bonusCountHints}
        disabled={countDisabled}
        onClick={() => onUseHint("count")}
      />

      {/* حرف واحد */}
      <HintRow
        icon={<LetterIcon />}
        title="حرف واحد"
        blurb="يكشف حرفاً عشوائياً من اسمك"
        credits={bonusLetterHints}
        recommended
        disabled={letterDisabled}
        onClick={() => onUseHint("letter")}
      />

      <div
        style={{
          opacity: 0.6,
          marginTop: 8,
          fontSize: 10,
          color: "oklch(0.52 0.05 45)",
          textAlign: "center",
        }}
      >
        التلميحات تُكشف لك وحدك — لا يراها خصمك.
      </div>
    </Flyout>
  );
}

function HintRow({
  icon,
  title,
  blurb,
  credits,
  recommended = false,
  disabled,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  blurb: string;
  credits: number;
  recommended?: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileTap={!disabled ? { scale: 0.97 } : {}}
      onClick={onClick}
      disabled={disabled}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: 9,
        borderRadius: 13,
        textAlign: "right",
        width: "100%",
        background: recommended
          ? "linear-gradient(180deg, oklch(0.95 0.07 75), oklch(0.90 0.09 66))"
          : "oklch(0.985 0.012 80)",
        border: `1px solid ${recommended ? "oklch(0.75 0.13 60 / .55)" : "oklch(0.78 0.04 65 / .4)"}`,
        opacity: disabled ? 0.48 : 1,
        cursor: disabled ? "default" : "pointer",
        transition: "opacity .18s",
      }}
    >
      {recommended && (
        <span
          style={{
            position: "absolute",
            top: -8,
            right: 10,
            fontSize: 8.5,
            padding: "2px 7px",
            borderRadius: 999,
            background: "linear-gradient(180deg, oklch(0.82 0.16 78), oklch(0.70 0.18 62))",
            color: "oklch(0.22 0.04 35)",
            fontWeight: 800,
            fontFamily: "var(--mono, monospace)",
            border: "1.5px solid oklch(0.97 0.022 78)",
          }}
        >
          الأفضل
        </span>
      )}

      {/* Icon orb */}
      <span
        style={{
          flexShrink: 0,
          width: 36,
          height: 36,
          borderRadius: 11,
          display: "grid",
          placeItems: "center",
          background: recommended
            ? "linear-gradient(180deg, oklch(0.82 0.16 78), oklch(0.70 0.18 62))"
            : "oklch(0.92 0.04 75)",
          color: recommended ? "oklch(0.24 0.05 40)" : "oklch(0.42 0.10 50)",
          boxShadow: recommended ? "0 4px 12px -4px oklch(0.72 0.16 65 / .45)" : "none",
        }}
      >
        {icon}
      </span>

      {/* Text */}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: "block",
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "var(--display, system-ui)",
            color: "oklch(0.28 0.06 40)",
          }}
        >
          {title}
        </span>
        <span style={{ fontSize: 10.5, lineHeight: 1.35, color: "oklch(0.50 0.05 45)" }}>
          {blurb}
        </span>
      </span>

      {/* Credit badge */}
      {credits > 0 && (
        <span
          style={{
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            padding: "3px 7px 3px 5px",
            borderRadius: 999,
            background: "oklch(0.97 0.02 80)",
            border: "1px solid oklch(0.75 0.06 60 / .5)",
            fontFamily: "var(--mono, monospace)",
            fontWeight: 700,
            fontSize: 11,
            color: "oklch(0.32 0.06 42)",
          }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "radial-gradient(circle at 35% 30%, oklch(0.96 0.13 90), oklch(0.72 0.17 60))",
              boxShadow: "inset 0 -1px 0 oklch(0.52 0.15 45)",
              flexShrink: 0,
            }}
          />
          {credits}
        </span>
      )}
    </motion.button>
  );
}

/* ── Mini letters preview ─────────────────────────────────── */
function MiniLetters({ letters, revealedIdx }: { letters: string[]; revealedIdx: number[] }) {
  return (
    <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap" }}>
      {letters.map((l, i) => {
        const revealed = revealedIdx.includes(i);
        return (
          <span
            key={i}
            style={{
              width: 26,
              height: 32,
              borderRadius: 7,
              background: revealed
                ? "linear-gradient(180deg, oklch(0.82 0.14 70), oklch(0.72 0.17 55))"
                : "oklch(0.92 0.04 75)",
              border: `1px solid ${revealed ? "oklch(0.62 0.17 55)" : "oklch(0.72 0.06 60 / .5)"}`,
              display: "grid",
              placeItems: "center",
              fontFamily: "var(--display, system-ui)",
              fontWeight: 800,
              fontSize: 16,
              color: revealed ? "oklch(0.22 0.04 35)" : "oklch(0.62 0.05 50)",
              boxShadow: revealed
                ? "inset 0 1px 0 rgba(255,255,255,.5)"
                : "inset 0 1px 0 rgba(255,255,255,.6)",
            }}
          >
            {revealed ? l : "—"}
          </span>
        );
      })}
    </div>
  );
}

/* ── Inline SVG icons (no external dependency) ────────────── */
function ToolsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HintsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 18h6M10 22h4M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6L15 17H9l-.7-2A7 7 0 0 1 5 9a7 7 0 0 1 7-7z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CountIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 6h16M4 10h16M4 14h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="17" cy="17" r="4" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M17 15.5v3M15.8 17h2.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function LetterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 20 L12 4 L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 14h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}
