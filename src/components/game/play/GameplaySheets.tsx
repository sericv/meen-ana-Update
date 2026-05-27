"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { memo, useCallback } from "react";
import { GameplayLetterRow } from "@/components/game/play/GameplayLetterRow";
import { IconClose, IconHintBulb } from "@/components/game/play/icons";
import { GP } from "@/components/game/play/tokens";

/* ═══════════════════════════════════════════════
   GameplaySheet — base bottom-sheet container
   ═══════════════════════════════════════════════ */
export function GameplaySheet({
  title,
  accent = GP.gold,
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
      className="absolute inset-0 z-[70] flex items-end"
      style={{ background: "rgba(58,37,23,0.48)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 400, damping: 38, mass: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-[28px] border border-b-0 px-[18px] pb-7 pt-2"
        style={{
          background: "linear-gradient(180deg, #fffaf3 0%, #fff1dd 100%)",
          borderColor: "rgba(244,196,141,0.48)",
          boxShadow: "0 -32px 64px -12px rgba(80,40,10,0.22)",
          willChange: "transform",
        }}
      >
        {/* drag handle */}
        <div
          className="mx-auto mb-4 h-[3px] w-10 rounded-full"
          style={{ background: "oklch(0.82 0.06 68 / .55)" }}
        />

        {/* header */}
        <div className="mb-4 flex items-center justify-between">
          <h2
            className="text-[17px] font-extrabold"
            style={{ color: accent, letterSpacing: "-0.01em" }}
          >
            {title}
          </h2>
          <motion.button
            type="button"
            whileTap={{ scale: 0.88 }}
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-[10px] border-0"
            style={{
              background: "oklch(0.90 0.04 68 / .6)",
              color: GP.inkSoft,
            }}
            aria-label="إغلاق"
          >
            <IconClose />
          </motion.button>
        </div>

        {children}
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   MyHiddenCardSheet  (= HintSheet)
   ═══════════════════════════════════════════════ */
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
    ? "استخدمت تلميحك في هذه المباراة"
    : bonusLetterHints + bonusCountHints > 0
      ? `رصيدك: ${bonusLetterHints} حرف · ${bonusCountHints} عدد`
      : "لا يوجد رصيد — اشترِ من المتجر";

  return (
    <AnimatePresence>
      {open ? (
        <GameplaySheet title="كرتك والتلميحات" onClose={onClose}>

          {/* status note */}
          <p className="mb-3 text-xs font-semibold" style={{ color: GP.inkSoft }}>
            {statusNote}
          </p>

          {/* hidden card display */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mb-4 grid min-h-[88px] w-full max-w-[220px] place-items-center rounded-2xl border-2 px-2 py-3"
            style={{
              background: "repeating-linear-gradient(45deg, #8a4520 0 6px, #7a3c18 6px 12px)",
              borderColor: "rgba(255,190,100,0.55)",
              boxShadow: "0 4px 16px rgba(80,30,10,0.22)",
            }}
          >
            {letters.length > 0 ? (
              <GameplayLetterRow letters={letters} revealedIdx={revealedIdx} compact />
            ) : (
              <span className="text-3xl font-black" style={{ color: "rgba(255,247,232,0.88)" }}>؟</span>
            )}
          </motion.div>

          {/* hint options */}
          <div className="flex flex-col gap-2.5">
            <HintCard
              kind="count"
              title="عدد الأحرف"
              subtitle="يكشف كم مربعًا في كرتك"
              available={bonusCountHints > 0}
              used={used}
              recommended
              busy={busy}
              onClick={() => onUseHint("count")}
            />
            <HintCard
              kind="letter"
              title="حرف واحد"
              subtitle="يكشف حرفًا عشوائيًا من كرتك"
              available={bonusLetterHints > 0}
              used={used}
              busy={busy}
              onClick={() => onUseHint("letter")}
            />
          </div>

          <p className="mt-3 text-center text-[11px] font-semibold" style={{ color: GP.inkSoft }}>
            تلميح واحد فقط في المباراة — اختر بحكمة
          </p>
        </GameplaySheet>
      ) : null}
    </AnimatePresence>
  );
}

export const HintSheet = MyHiddenCardSheet;

/* ═══════════════════════════════════════════════
   HintCard — premium interactive option card
   ═══════════════════════════════════════════════ */
const HintCard = memo(function HintCard({
  kind,
  title,
  subtitle,
  available,
  used,
  recommended,
  busy,
  onClick,
}: {
  kind: "letter" | "count";
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

  const iconColor = recommended ? GP.ink : GP.inkSoft;
  const bgActive = recommended
    ? "linear-gradient(160deg, oklch(0.98 0.04 82 / .95), oklch(0.92 0.07 76 / .98))"
    : "linear-gradient(160deg, oklch(0.97 0.02 80 / .95), oklch(0.92 0.03 72 / .98))";
  const borderActive = recommended
    ? "rgba(242,181,68,0.58)"
    : "rgba(244,196,141,0.42)";
  const glowActive = recommended
    ? "0 6px 18px rgba(242,181,68,0.22)"
    : "0 4px 12px rgba(200,160,80,0.12)";

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      whileTap={disabled ? {} : { scale: 0.975 }}
      className="relative w-full text-right"
      style={{
        background: active ? bgActive : "rgba(255,255,255,0.75)",
        borderRadius: 18,
        border: `1.5px solid ${active ? borderActive : "rgba(220,190,150,0.3)"}`,
        padding: "12px 14px",
        boxShadow: active
          ? `${glowActive}, inset 0 1px 0 rgba(255,255,255,0.7)`
          : "0 1px 4px rgba(180,130,60,0.08)",
        opacity: disabled ? 0.52 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        willChange: "transform",
        transition: "opacity 0.2s, box-shadow 0.2s",
      }}
    >
      {/* recommended badge */}
      <AnimatePresence>
        {recommended && active && (
          <motion.span
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            className="absolute -top-2.5 right-3 rounded-full px-2 py-0.5 text-[9px] font-extrabold"
            style={{
              background: `linear-gradient(135deg, ${GP.gold}, ${GP.goldDeep})`,
              color: GP.ink,
              boxShadow: "0 2px 8px rgba(242,181,68,0.4)",
            }}
          >
            الأفضل
          </motion.span>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3">
        {/* icon */}
        <motion.div
          animate={active && recommended ? {
            boxShadow: [
              "0 0 0 0 rgba(242,181,68,0)",
              "0 0 0 5px rgba(242,181,68,0)",
            ],
          } : {}}
          transition={{ duration: 1.8, repeat: Infinity }}
          className="grid shrink-0 place-items-center rounded-[14px]"
          style={{
            width: 44,
            height: 44,
            background: active
              ? recommended
                ? `linear-gradient(180deg, ${GP.gold} 0%, ${GP.goldDeep} 100%)`
                : "linear-gradient(180deg, oklch(0.88 0.06 72), oklch(0.78 0.08 66))"
              : GP.cream,
            color: active ? iconColor : GP.inkSoft,
          }}
        >
          <IconHintBulb size={22} variant="illustrated" />
        </motion.div>

        {/* text */}
        <div className="min-w-0 flex-1">
          <p
            className="font-extrabold leading-tight"
            style={{ color: GP.ink, fontSize: 13.5 }}
          >
            {title}
          </p>
          <p className="mt-0.5 text-xs leading-snug" style={{ color: GP.inkSoft }}>
            {subtitle}
          </p>
        </div>

        {/* status pill */}
        <div
          className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold"
          style={{
            background: used
              ? "rgba(200,180,140,0.18)"
              : available
                ? recommended
                  ? "rgba(242,181,68,0.18)"
                  : "rgba(200,220,170,0.22)"
                : "rgba(200,180,140,0.18)",
            color: used
              ? GP.inkSoft
              : available
                ? recommended ? GP.goldDeep : "oklch(0.42 0.14 148)"
                : GP.inkSoft,
            border: `1px solid ${used
              ? "rgba(200,180,140,0.2)"
              : available
                ? recommended ? "rgba(242,181,68,0.3)" : "rgba(120,180,120,0.25)"
                : "rgba(200,180,140,0.2)"}`,
          }}
        >
          {used ? "مستخدم" : available ? "متاح" : "لا يوجد"}
        </div>
      </div>
    </motion.button>
  );
});
