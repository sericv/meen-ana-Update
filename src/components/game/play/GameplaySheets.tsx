"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GameplayLetterRow } from "@/components/game/play/GameplayLetterRow";
import { IconClose, IconHintBulb } from "@/components/game/play/icons";
import { GP } from "@/components/game/play/tokens";

function Sheet({
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
      className="absolute inset-0 z-[70] flex items-end bg-[rgba(58,37,23,0.45)]"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 36 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-[26px] border border-b-0 border-[rgba(244,196,141,0.5)] px-[18px] pb-6 pt-2"
        style={{
          background: "linear-gradient(180deg, #fffaf3 0%, #fff1dd 100%)",
          boxShadow: "0 -30px 60px -10px rgba(80,40,10,0.25)",
        }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full" style={{ background: GP.creamDeep }} />
        <motion.div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold" style={{ color: accent }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[10px] border-0 bg-transparent p-2"
            aria-label="إغلاق"
          >
            <IconClose />
          </button>
        </motion.div>
        {children}
      </motion.div>
    </motion.div>
  );
}

export function MyHiddenCardSheet({
  open,
  letters,
  revealedIdx,
  countRevealed,
  hintsLeft,
  bonusLetterHints,
  bonusCountHints,
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
  busy?: boolean;
  onClose: () => void;
  onUseHint: (kind: "letter" | "count") => void;
}) {
  const freeNote =
    hintsLeft > 0
      ? `${hintsLeft} مجاني في هذه المباراة`
      : bonusLetterHints + bonusCountHints > 0
        ? `محفوظ: ${bonusLetterHints} حرف · ${bonusCountHints} عدد`
        : "اشترِ تلميحات من المتجر";

  return (
    <AnimatePresence>
      {open ? (
        <Sheet title="كرتك والتلميحات" onClose={onClose}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold" style={{ color: GP.inkSoft }}>
              {freeNote}
            </p>
          </div>

          <div
            className="mx-auto mt-3 grid min-h-[100px] w-full max-w-[240px] place-items-center rounded-xl border-2 px-2 py-3"
            style={{
              background:
                "repeating-linear-gradient(45deg, #8a4520 0 6px, #7a3c18 6px 12px)",
              borderColor: "rgba(255,190,100,0.55)",
            }}
          >
            {letters.length > 0 ? (
              <GameplayLetterRow letters={letters} revealedIdx={revealedIdx} compact />
            ) : (
              <span className="text-3xl font-black text-[#fff7e8]/90">؟</span>
            )}
          </div>

          <div className="mt-4">
            <p className="text-xs font-bold tracking-widest" style={{ color: GP.inkSoft }}>
              {countRevealed ? "كرتك — مربعات الأحرف" : "الأحرف المكشوفة من كرتك"}
            </p>
            {countRevealed ? (
              <GameplayLetterRow letters={letters} revealedIdx={revealedIdx} />
            ) : letters.length > 0 ? (
              <GameplayLetterRow letters={letters} revealedIdx={revealedIdx} />
            ) : (
              <p className="mt-2 text-center text-xs font-semibold" style={{ color: GP.inkSoft }}>
                اشترِ «عدد الأحرف» لعرض مربعات كرتك كاملة
              </p>
            )}
          </div>

          <p className="mt-3 text-center text-xs font-semibold" style={{ color: GP.inkSoft }}>
            اختر تلميحًا — النتيجة تظهر هنا فقط
          </p>

          <div className="mt-3 flex flex-col gap-2">
            <HintOption
              title="عدد الأحرف"
              subtitle="يكشف عدد مربعات كرتك"
              priceLabel={
                hintsLeft > 0 ? "مجاني" : bonusCountHints > 0 ? "محفوظ" : "من المتجر"
              }
              recommended
              disabled={busy || countRevealed || (hintsLeft <= 0 && bonusCountHints <= 0)}
              onClick={() => onUseHint("count")}
            />
            <HintOption
              title="حرف واحد"
              subtitle="يكشف حرفًا عشوائيًا"
              priceLabel={
                hintsLeft > 0 ? "مجاني" : bonusLetterHints > 0 ? "محفوظ" : "من المتجر"
              }
              disabled={busy || (hintsLeft <= 0 && bonusLetterHints <= 0)}
              onClick={() => onUseHint("letter")}
            />
          </div>
        </Sheet>
      ) : null}
    </AnimatePresence>
  );
}

export const HintSheet = MyHiddenCardSheet;

function HintOption({
  title,
  subtitle,
  priceLabel,
  recommended,
  disabled,
  onClick,
}: {
  title: string;
  subtitle: string;
  priceLabel: string;
  recommended?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="relative flex w-full items-center gap-3 rounded-2xl border p-3.5 text-right disabled:opacity-50"
      style={{
        background: recommended
          ? "linear-gradient(180deg, #fff4e0 0%, #ffe8c8 100%)"
          : "rgba(255,255,255,0.9)",
        borderColor: recommended ? "rgba(242,181,68,0.55)" : "rgba(244,196,141,0.4)",
      }}
    >
      {recommended ? (
        <span
          className="absolute -top-2 right-3 rounded-full px-2 py-0.5 text-[9px] font-extrabold"
          style={{ background: GP.gold, color: GP.ink }}
        >
          الأفضل
        </span>
      ) : null}
      <div
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
        style={{
          background: recommended
            ? `linear-gradient(180deg, ${GP.gold} 0%, ${GP.goldDeep} 100%)`
            : GP.cream,
          color: recommended ? GP.ink : GP.inkSoft,
        }}
      >
        <IconHintBulb size={24} variant="illustrated" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-extrabold" style={{ color: GP.ink }}>
          {title}
        </p>
        <p className="text-xs" style={{ color: GP.inkSoft }}>
          {subtitle}
        </p>
      </div>
      <span className="shrink-0 text-xs font-extrabold" style={{ color: GP.goldDeep }}>
        {priceLabel}
      </span>
    </button>
  );
}
