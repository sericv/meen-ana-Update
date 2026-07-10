"use client";

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

export type SideActionRailProps = {
  match: MatchState | null;
  uid: string | null;
  myTurn: boolean;
  phase: string;
  inventory: TacticalInventory;
  tacticalBusy: TacticalToolId | null;
  bonusLetterHints: number;
  bonusCountHints: number;
  hintsLeft: number;
  hintUsed: boolean;
  letters: string[];
  revealedIdx: number[];
  hintBusy: boolean;
  onUseTactical: (toolId: TacticalToolId) => void;
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
  const hintBadge = hintUsed ? 0 : hintsLeft > 0 ? hintsLeft : (bonusLetterHints + bonusCountHints > 0 ? 1 : 0);

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
    onTacticalFired?.(toolId);
    setOpen(null);
  }, [match, uid, myTurn, phase, inventory, tacticalBusy, onUseTactical, onTacticalFired]);

  const useHint = useCallback((kind: "letter" | "count") => {
    if (hintBusy || (kind === "letter" && bonusLetterHints <= 0 && hintsLeft <= 0)) return;
    if (kind === "count" && bonusCountHints <= 0 && hintsLeft <= 0) return;
    onUseHint(kind);
  }, [hintBusy, hintsLeft, bonusLetterHints, bonusCountHints, onUseHint]);

  return (
    <div
      className="absolute top-1/2 left-3 -translate-y-1/2 flex flex-col gap-3 z-30"
      dir="rtl"
    >
      {open && (
        <div
          onClick={() => setOpen(null)}
          className="fixed inset-0 z-10"
        />
      )}

      {/* Tools Tab */}
      <div className="relative z-20">
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

      {/* Hints Tab */}
      <div className="relative z-20">
        <RailTab
          icon={<HintsIcon />}
          label="تلميحات"
          badge={hintBadge}
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

/* ── Rail tab button ── */
function RailTab({
  icon,
  label,
  badge,
  active,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  badge: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      aria-label={label}
      className={`game-card-outer select-none ${active ? "ring-2 ring-[#7C3AED]" : ""}`}
      style={{ cursor: "pointer" }}
    >
      <div className="game-card-inner p-2 rounded-xl bg-white border border-slate-100 flex flex-col items-center gap-1 w-12 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.06)]">
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? "bg-purple-100 text-[#7C3AED]" : "bg-slate-50 text-slate-400"}`}>
          {icon}
        </span>
        <span className={`text-[9px] font-black ${active ? "text-[#7C3AED]" : "text-slate-500"}`}>
          {label}
        </span>
        {badge > 0 && (
          <span className="absolute -top-1.5 -left-1.5 min-w-5 h-5 px-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-[8px] font-black flex items-center justify-center border-2 border-white shadow-sm">
            {badge}
          </span>
        )}
      </div>
    </motion.button>
  );
}

/* ── Base flyout container ── */
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
      initial={{ opacity: 0, x: -8, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -6, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 450, damping: 32 }}
      onClick={(e) => e.stopPropagation()}
      className="absolute top-1/2 left-16 -translate-y-1/2 w-60 z-20"
      style={{ transformOrigin: "left center" }}
    >
      <div className="game-card-outer w-full">
        <div className="game-card-inner p-4 bg-white/95 rounded-[22px] border border-slate-100 shadow-xl flex flex-col gap-3 text-right">
          <div>
            <h3 className="h-display text-xs font-black text-slate-800">{title}</h3>
            <p className="text-[9px] text-slate-400 font-bold mt-0.5 leading-tight">{subtitle}</p>
          </div>
          <div className="flex flex-col gap-2">
            {children}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Tools list ── */
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
      title="الأدوات التكتيكية"
      subtitle={totalOwned > 0 ? `متبقي ${totalOwned} أداة · تستخدم لمرة واحدة` : "لا تملك أي أدوات حالياً"}
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
  onClick,
}: {
  toolId: TacticalToolId;
  nameAr: string;
  subtitleAr: string;
  count: number;
  ok: boolean;
  reason?: string;
  busy: boolean;
  onClick: () => void;
}) {
  const empty = count < 1;
  const dim = empty || !ok || busy;

  return (
    <motion.button
      type="button"
      whileTap={!dim ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={dim}
      className={`w-full text-right transition-opacity ${dim ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <div className="game-card-outer w-full">
        <div className={`game-card-inner p-2.5 bg-white border rounded-xl flex items-center gap-2.5 ${empty ? "border-slate-100 bg-slate-50/50" : "border-purple-100"}`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${empty ? "bg-slate-100 text-slate-400" : "bg-purple-50 text-[#7C3AED]"}`}>
            <TacticalToolIcon id={toolId} size={16} />
          </div>
          <div className="flex-1 min-w-0" style={{ lineHeight: 1.15 }}>
            <div className="flex items-center gap-1.5 justify-start">
              <span className="text-[11px] font-black text-slate-800">{nameAr}</span>
              {empty ? (
                <span className="text-[8px] font-bold text-slate-400">(0/1)</span>
              ) : (
                <span className="text-[8px] font-black text-purple-600">(1/1)</span>
              )}
            </div>
            <span className="text-[8.5px] text-slate-400 font-bold block mt-0.5 leading-tight truncate">
              {subtitleAr}
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

/* ── Hints list ── */
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
      title="مساعد التخمين"
      subtitle={totalHints > 0 ? `متبقي ${totalHints} تلميح للاستخدام` : "لا تملك أي تلميحات متبقية"}
    >
      {/* Name preview */}
      {letters.length > 0 && (
        <div className="mb-2">
          <span className="text-[8px] font-black text-slate-400 block mb-1">اسمك المخفي حالياً:</span>
          <MiniLetters letters={letters} revealedIdx={revealedIdx} />
        </div>
      )}

      {/* Count Hint */}
      <HintRow
        icon={<CountIcon />}
        title="كشف عدد الأحرف"
        blurb="يكشف عدد حروف اسمك المخفي"
        credits={bonusCountHints}
        disabled={countDisabled}
        onClick={() => onUseHint("count")}
      />

      {/* Letter Hint */}
      <HintRow
        icon={<LetterIcon />}
        title="كشف حرف عشوائي"
        blurb="يكشف حرفاً واحداً من الاسم في مكانه الصحيح"
        credits={bonusLetterHints}
        recommended
        disabled={letterDisabled}
        onClick={() => onUseHint("letter")}
      />

      <p className="text-[8px] font-bold text-slate-400 text-center mt-1">
        تظهر التلميحات لك وحدك بشكل سري تماماً.
      </p>
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
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-right transition-opacity ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <div className="game-card-outer w-full">
        <div className={`game-card-inner p-2.5 bg-white border rounded-xl flex items-center gap-2.5 ${recommended ? "border-amber-200 bg-amber-50/10" : "border-slate-100"}`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${recommended ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400"}`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0" style={{ lineHeight: 1.15 }}>
            <span className="text-[11px] font-black text-slate-800 block">{title}</span>
            <span className="text-[8.5px] text-slate-400 font-bold block mt-0.5 leading-tight truncate">
              {blurb}
            </span>
          </div>
          {credits > 0 && (
            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-purple-50 text-[#7C3AED] border border-purple-100 flex-shrink-0">
              {credits}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

/* ── Mini letters preview ── */
function MiniLetters({ letters, revealedIdx }: { letters: string[]; revealedIdx: number[] }) {
  return (
    <div className="flex gap-1 justify-center flex-wrap" dir="rtl">
      {letters.map((l, i) => {
        const revealed = revealedIdx.includes(i);
        return (
          <span
            key={i}
            className={`w-6 h-8 rounded-lg border text-sm font-black flex items-center justify-center shadow-sm ${
              revealed 
                ? "bg-purple-50 text-[#7C3AED] border-purple-200" 
                : "bg-slate-50 text-slate-400 border-slate-100"
            }`}
          >
            {revealed ? l : "—"}
          </span>
        );
      })}
    </div>
  );
}

/* ── Icons ── */
function ToolsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function HintsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6L15 17H9l-.7-2A7 7 0 0 1 5 9a7 7 0 0 1 7-7z" />
    </svg>
  );
}

function CountIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 6h16M4 10h16M4 14h8"/>
      <circle cx="17" cy="17" r="4"/>
    </svg>
  );
}

function LetterIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 20 L12 4 L20 20"/>
      <path d="M7 14h10"/>
    </svg>
  );
}
