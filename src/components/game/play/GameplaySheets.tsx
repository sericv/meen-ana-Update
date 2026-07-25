"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { memo, useCallback } from "react";
import { GameplayLetterRow } from "@/components/game/play/GameplayLetterRow";

/* ── Base Bottom Sheet wrapper ── */
export function GameplaySheet({
  title,
  accent = "#7C3AED",
  onClose,
  children,
}: {
  title: string;
  accent?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-[70] flex items-end justify-center bg-slate-900/70 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 400, damping: 35, mass: 0.85 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-[32px] border border-b-0 px-[18px] pb-7 pt-2 bg-white/95 shadow-2xl"
        style={{
          outline: "1px solid rgba(255,255,255,0.85)",
          willChange: "transform",
          borderTop: `2.5px solid ${accent}`,
        }}
      >
        {/* drag handle */}
        <div className="mx-auto mb-4 w-10 h-1.5 rounded-full bg-slate-200" />

        {/* header */}
        <div className="mb-4 flex items-center justify-between">
          <h2
            className="text-sm font-black"
            style={{ color: accent }}
          >
            {title}
          </h2>
          <motion.button
            type="button"
            onClick={onClose}
            whileTap={{ scale: 0.93 }}
            className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/50 flex items-center justify-center text-slate-400"
            aria-label="إغلاق"
            style={{ cursor: "pointer" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </motion.button>
        </div>

        {children}
      </motion.div>
    </motion.div>
  );
}

/* ── Hidden Card / Hint Sheet ── */
export function MyHiddenCardSheet({
  open,
  letters,
  revealedIdx,
  countRevealed,
  hintsLeft,
  bonusLetterHints,
  bonusCountHints,
  hintUsed,
  busy,
  onClose,
  onUseHint,
}: {
  open: boolean;
  letters: string[];
  revealedIdx: number[];
  countRevealed: boolean;
  hintsLeft: number;
  bonusLetterHints: number;
  bonusCountHints: number;
  hintUsed?: boolean;
  busy?: boolean;
  onClose: () => void;
  onUseHint: (kind: "letter" | "count") => void;
}) {
  const used = hintUsed || countRevealed || revealedIdx.length > 0;

  const statusNote = used
    ? "لقد استخدمت تلميحك المتاح في هذه الجولة."
    : bonusLetterHints + bonusCountHints > 0
      ? `رصيدك الفعال: ${bonusLetterHints} كشف حرف · ${bonusCountHints} كشف عدد`
      : "لا تملك تلميحات إضافية في رصيدك حالياً.";

  return (
    <AnimatePresence>
      {open ? (
        <GameplaySheet title="كرتك والتلميحات" onClose={onClose}>
          
          <p className="mb-4 text-[9px] font-bold text-slate-400 text-right pr-1">
            {statusNote}
          </p>

          {/* hidden card display */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="game-card-outer w-full max-w-[200px] mx-auto mb-4"
          >
            <div className="game-card-inner p-3 bg-slate-900 border border-slate-950 rounded-2xl flex items-center justify-center min-h-[72px]">
              {letters.length > 0 ? (
                <GameplayLetterRow letters={letters} revealedIdx={revealedIdx} compact />
              ) : (
                <span className="text-2xl font-black text-slate-400">؟</span>
              )}
            </div>
          </motion.div>

          {/* hint options */}
          <div className="flex flex-col gap-3">
            <HintCard
              title="كشف عدد الأحرف"
              subtitle="يكشف عدد مربعات اسمك المخفي"
              available={bonusCountHints > 0 || hintsLeft > 0}
              used={used}
              busy={busy}
              onClick={() => onUseHint("count")}
            />
            <HintCard
              title="كشف حرف عشوائي"
              subtitle="يكشف حرفاً واحداً من الاسم في مكانه الصحيح"
              available={bonusLetterHints > 0 || hintsLeft > 0}
              used={used}
              recommended
              busy={busy}
              onClick={() => onUseHint("letter")}
            />
          </div>

          <p className="mt-4 text-center text-[8px] font-bold text-slate-400">
            يُسمح باستخدام تلميح واحد فقط لكل جولة لعب — اختر بحكمة!
          </p>
        </GameplaySheet>
      ) : null}
    </AnimatePresence>
  );
}

export const HintSheet = MyHiddenCardSheet;

/* ── Interactive Option Card ── */
const HintCard = memo(function HintCard({
  title,
  subtitle,
  available,
  used,
  recommended,
  busy,
  onClick,
}: {
  title: string;
  subtitle: string;
  available: boolean;
  used?: boolean;
  recommended?: boolean;
  busy?: boolean;
  onClick: () => void;
}) {
  const disabled = busy || used || !available;
  const active = available && !used;

  const handleClick = useCallback(() => {
    if (!disabled) onClick();
  }, [disabled, onClick]);

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      whileTap={disabled ? {} : { scale: 0.98 }}
      className={`w-full text-right transition-opacity ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <div className="game-card-outer w-full">
        <div className={`game-card-inner p-3 bg-white border rounded-[20px] flex items-center gap-3 ${recommended && active ? "border-amber-200 bg-amber-50/10" : "border-slate-100"}`}>
          
          {/* icon indicator */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${recommended && active ? "bg-amber-50 text-[#FFE600]" : "bg-purple-50 text-[#7C3AED]"}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .6 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
              <path d="M9 18h6" />
              <path d="M10 22h4" />
            </svg>
          </div>

          {/* text */}
          <div className="flex-1 min-w-0" style={{ lineHeight: 1.15 }}>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-slate-800">{title}</span>
              {recommended && active && (
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full text-white shadow-sm" style={{ background: "linear-gradient(135deg, #FFE600, #E5CC00)" }}>
                  الأفضل
                </span>
              )}
            </div>
            <span className="text-[9px] text-slate-400 font-bold block mt-0.5 leading-tight">
              {subtitle}
            </span>
          </div>

          {/* status pill */}
          <div className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black border ${
            used 
              ? "bg-slate-50 border-slate-200/50 text-slate-400" 
              : active 
                ? recommended 
                  ? "bg-[#FFF8E0] border-[#FFE600]/30 text-[#B3A000]" 
                  : "bg-purple-50 border-purple-100 text-[#7C3AED]" 
                : "bg-slate-50 border-slate-200/50 text-slate-400"
          }`}>
            {used ? "مستخدم" : active ? "متاح" : "لا يوجد"}
          </div>

        </div>
      </div>
    </motion.button>
  );
});
