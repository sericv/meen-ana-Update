"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { EASE_OUT, SPRING_UI, WHILE_TAP } from "@/lib/motion";

type Props = {
  uid: string | null;
  opponent?: { uid: string; displayName: string; ready: boolean } | null;
  lobbyCustomName: string;
  setLobbyCustomName: (v: string) => void;
  lobbyCustomPreview: string | null;
  lobbyCustomBusy: boolean;
  lobbyCustomFileRef: React.RefObject<HTMLInputElement | null>;
  customSavePulse: number;
  tileImageSrc: string | null;
  showCardSuccessVisual: boolean;
  showDraftEditVisual: boolean;
  dirtyAgainstServer: boolean;
  mePickDone: boolean;
  oppPickDone: boolean;
  bothPickedCustom: boolean;
  isHost: boolean;
  bothReady: boolean;
  myReadyOptimistic: boolean;
  generateGuessAliasesFn: (name: string) => string[];
  onUploadClick: () => void;
  onSave: () => void;
};

const INPUT_MAX = 60;

export function CustomMysteryPanel({
  opponent,
  lobbyCustomName,
  setLobbyCustomName,
  lobbyCustomBusy,
  customSavePulse,
  tileImageSrc,
  showCardSuccessVisual,
  showDraftEditVisual,
  dirtyAgainstServer,
  mePickDone,
  oppPickDone,
  bothPickedCustom,
  isHost,
  bothReady,
  myReadyOptimistic,
  generateGuessAliasesFn,
  onUploadClick,
  onSave,
}: Props) {
  const hasImage = Boolean(tileImageSrc);
  const inputChars = lobbyCustomName.length;
  const overLimit = inputChars > INPUT_MAX;
  const canSave = !lobbyCustomBusy && hasImage && lobbyCustomName.trim().length > 0 && !overLimit;

  const [isFocused, setIsFocused] = useState(false);
  const [attemptedSave, setAttemptedSave] = useState(false);
  
  const showFloating = isFocused || inputChars > 0;
  const missingImage = attemptedSave && !hasImage;
  const missingAnswer = attemptedSave && lobbyCustomName.trim().length === 0;

  function handleSave() {
    setAttemptedSave(true);
    if (canSave) onSave();
  }

  return (
    <section className="relative mt-6" dir="rtl">
      
      {/* Background Magic Particles */}
      <div aria-hidden className="pointer-events-none absolute inset-0 select-none overflow-hidden">
        <span className="absolute right-[8%] top-[6%] text-xl text-purple-500/5 animate-pulse">✦</span>
        <span className="absolute left-[12%] top-[18%] text-xs text-purple-500/5">✦</span>
        <span className="absolute right-[20%] bottom-[12%] text-lg text-purple-500/5 animate-pulse">✦</span>
      </div>

      <div className="game-card-outer">
        <div className="game-card-inner p-5 bg-white border border-slate-100 rounded-[28px] shadow-sm flex flex-col gap-4">
          
          {/* Header Title Row */}
          <div className="flex items-start gap-3">
            <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-400 text-white shadow-sm">
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
            </span>
            <div className="min-w-0 flex-1 text-right" style={{ lineHeight: 1.25 }}>
              <h2 className="h-display text-sm font-black text-slate-800">بطاقة الخصم المخصصة</h2>
              <p className="text-[10px] text-slate-400 font-bold mt-1.5 leading-normal">
                قم برفع صورة واحدة فقط، ثم اكتب الإجابة الصحيحة التي سيحاول خصمك اكتشافها أثناء المباراة.
              </p>
            </div>
          </div>

          {/* Readiness Indicators */}
          <div className="flex gap-2">
            <ReadinessPill
              label="أنت"
              ready={myReadyOptimistic}
              cardDone={mePickDone}
            />
            <ReadinessPill
              label={opponent ? opponent.displayName : "بانتظار خصم"}
              ready={Boolean(opponent?.ready)}
              cardDone={oppPickDone}
            />
          </div>

          {/* Warning banner when unsaved edits are present */}
          <AnimatePresence mode="wait">
            {dirtyAgainstServer ? (
              <motion.div
                key="dirty"
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                transition={{ duration: 0.22, ease: EASE_OUT }}
                className="rounded-xl px-3 py-2 text-center text-[10px] font-bold bg-amber-50 border border-amber-200/50 text-amber-700 leading-normal"
              >
                عدّلت الصورة أو الإجابة — اضغط «حفظ البطاقة» لتحديث اختيارك.
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Two-Column Form Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
            
            {/* RIGHT SIDE: Upload Zone / Collectible Preview */}
            <div className="flex flex-col items-center justify-center gap-2.5">
              <motion.div
                key={customSavePulse}
                initial={customSavePulse === 0 ? false : { scale: 0.93, opacity: 0.86 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 24 }}
                className="relative w-full max-w-[170px] aspect-[3/4]"
              >
                {/* Glowing ring under saved cards */}
                {showCardSuccessVisual && !lobbyCustomBusy && (
                  <motion.div
                    aria-hidden
                    animate={{ opacity: [0.25, 0.55, 0.25], scale: [0.97, 1.02, 0.97] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                    className="pointer-events-none absolute -inset-3 -z-10 rounded-[28px] bg-purple-500/10 blur-md"
                  />
                )}

                <motion.button
                  type="button"
                  disabled={lobbyCustomBusy}
                  onClick={onUploadClick}
                  whileHover={lobbyCustomBusy ? {} : { scale: 1.02, rotate: -1 }}
                  whileTap={lobbyCustomBusy ? {} : { scale: 0.98 }}
                  className="game-card-outer w-full h-full relative overflow-hidden"
                  style={{ cursor: lobbyCustomBusy ? "wait" : "pointer" }}
                >
                  <div
                    className={`game-card-inner relative flex h-full w-full flex-col items-center justify-center overflow-hidden p-0.5 border bg-slate-50 transition-all ${
                      hasImage ? "border-slate-100" : "border-dashed border-purple-200"
                    }`}
                  >
                    {hasImage ? (
                      <ImagePreviewCard
                        src={tileImageSrc!}
                        word={lobbyCustomName}
                        showSuccess={showCardSuccessVisual && !lobbyCustomBusy}
                      />
                    ) : (
                      <EmptyCardPlaceholder />
                    )}

                    {lobbyCustomBusy && <LoadingOverlay />}

                    {hasImage && !lobbyCustomBusy && (
                      <span className="absolute bottom-2.5 inset-x-2.5 z-10 rounded-xl px-2 py-1 text-[9px] font-black text-center backdrop-blur-md bg-slate-900/60 text-white border border-white/10 active:scale-95 transition-transform">
                        {showCardSuccessVisual ? "تغيير البطاقة" : "تغيير الصورة"}
                      </span>
                    )}
                  </div>
                </motion.button>
              </motion.div>

              {/* Upload Validation */}
              <AnimatePresence>
                {missingImage && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-[9.5px] font-black text-red-500 flex items-center gap-1 mt-1"
                  >
                    ⚠️ الرجاء رفع صورة للبطاقة
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* LEFT SIDE: Answer Input & Save Action */}
            <div className="flex flex-col gap-3.5 justify-center">
              
              {/* Floating Input field */}
              <div className="relative">
                <motion.span
                  initial={false}
                  animate={{
                    y: showFloating ? -23 : 0,
                    scale: showFloating ? 0.82 : 1,
                  }}
                  transition={{ duration: 0.2, ease: EASE_OUT }}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 origin-right pointer-events-none z-10 transition-colors ${
                    showFloating 
                      ? (overLimit ? "text-red-500" : "text-purple-500 font-extrabold") 
                      : "text-slate-400 font-bold"
                  }`}
                  style={{ fontSize: 13 }}
                >
                  الإجابة الصحيحة للبطاقة
                </motion.span>

                <input
                  dir="rtl"
                  value={lobbyCustomName}
                  onChange={(ev) => {
                    if (ev.target.value.length <= INPUT_MAX + 10) {
                      setLobbyCustomName(ev.target.value);
                    }
                    if (attemptedSave && ev.target.value.trim().length > 0) {
                      setAttemptedSave(false);
                    }
                  }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className={`w-full transition-all duration-200 bg-slate-50 rounded-2xl px-4 pt-5 pb-1.5 text-xs font-black text-slate-800 focus:outline-none focus:bg-white border ${
                    overLimit || missingAnswer
                      ? "border-red-500 focus:border-red-500"
                      : isFocused
                        ? "border-purple-500 shadow-[0_0_10px_rgba(124,58,237,0.15)]"
                        : "border-slate-200/60"
                  }`}
                  style={{ minHeight: 52 }}
                  placeholder={isFocused ? "اكتب الإجابة الصحيحة التي سيخمنها خصمك" : ""}
                />
              </div>

              {/* Character Limit and Warnings */}
              <div className="-mt-2 flex items-center justify-between px-1 text-[9.5px] font-black">
                <span className={overLimit ? "text-red-500" : "text-slate-400"}>
                  {inputChars}/{INPUT_MAX}
                </span>
                
                <AnimatePresence mode="wait">
                  {overLimit ? (
                    <motion.span
                      key="over"
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -4 }}
                      className="text-red-500"
                    >
                      ⚠️ تجاوزت الحد المسموح
                    </motion.span>
                  ) : missingAnswer ? (
                    <motion.span
                      key="missing"
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -4 }}
                      className="text-red-500"
                    >
                      ⚠️ الرجاء كتابة الإجابة
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </div>

              {/* Guesses Aliases Preview */}
              <AnimatePresence mode="popLayout">
                {lobbyCustomName.trim().length > 0 && !overLimit && (
                  <motion.div
                    key="aliases"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex flex-wrap gap-1 mt-1"
                  >
                    {generateGuessAliasesFn(lobbyCustomName.trim())
                      .slice(0, 5)
                      .map((alias, idx) => (
                        <motion.span
                          key={`${alias}-${idx}`}
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.02, duration: 0.15 }}
                          className="rounded-lg px-2 py-0.5 text-[8.5px] font-extrabold bg-purple-50 border border-purple-100 text-purple-600 leading-none"
                        >
                          {alias}
                        </motion.span>
                      ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Button */}
              <motion.button
                type="button"
                disabled={!canSave}
                onClick={handleSave}
                whileHover={canSave ? { scale: 1.01 } : {}}
                whileTap={canSave ? { scale: 0.98 } : {}}
                className="w-full py-3.5 rounded-2xl text-xs font-black text-white shadow-sm flex items-center justify-center gap-1.5 transition-all"
                style={{
                  background: canSave
                    ? "linear-gradient(to right, #7C3AED, #9F7AEA)"
                    : "#E2E8F0",
                  cursor: canSave ? "pointer" : "not-allowed",
                  color: canSave ? "#FFFFFF" : "#A0AEC0",
                }}
              >
                {lobbyCustomBusy ? (
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="animate-spin">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                ) : showCardSuccessVisual && !dirtyAgainstServer ? (
                  <>
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>تم الحفظ</span>
                  </>
                ) : (
                  <span>حفظ البطاقة</span>
                )}
              </motion.button>

              {/* Ready status confirmation panel */}
              <AnimatePresence>
                {showCardSuccessVisual && !dirtyAgainstServer && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="rounded-2xl p-2.5 text-center bg-emerald-50 border border-emerald-100 flex items-center justify-center gap-1.5 mt-1"
                  >
                    <span className="text-[10px] font-black text-emerald-700 flex items-center gap-1.5">
                      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" className="animate-pulse">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      البطاقة جاهزة ✓
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>

          </div>

          {/* Lobby wait status helper banner */}
          <AnimatePresence mode="wait">
            {!bothPickedCustom && (
              <motion.p
                key="wait"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-[9.5px] font-black text-purple-600 leading-normal border-t border-purple-50 pt-3 mt-1"
              >
                {isHost && bothReady && !bothPickedCustom
                  ? "كل اللاعبين جاهزون — احفظ بطاقتك للخصم ليظهر زر البدء."
                  : "انتظر حتى يختار كل منكما بطاقة للآخر، ثم يمكن للمضيف بدء المباراة."}
              </motion.p>
            )}
          </AnimatePresence>

        </div>
      </div>

    </section>
  );
}

function EmptyCardPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center p-3 text-center gap-1.5">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2.2" className="animate-pulse">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
      <span className="h-display text-xs font-black text-purple-600">
        رفع صورة
      </span>
      <span className="text-[8px] font-bold text-slate-400">
        PNG · JPG · WEBP
      </span>
    </div>
  );
}

function ImagePreviewCard({
  src,
  word,
  showSuccess,
}: {
  src: string;
  word: string;
  showSuccess: boolean;
}) {
  return (
    <div className="absolute inset-0 flex flex-col p-1.5 bg-white rounded-xl shadow-inner">
      <div className="relative flex-1 w-full rounded-lg overflow-hidden border border-slate-100 bg-slate-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        <span className="absolute top-1.5 right-1.5 rounded-full px-2 py-0.5 text-[7.5px] font-black bg-gradient-to-r from-purple-600 to-purple-400 text-white shadow-sm">
          بطاقة مخصصة
        </span>

        {showSuccess && (
          <span className="absolute top-1.5 left-1.5 grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-white shadow-md">
            <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="3.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        )}

        {word.trim() && (
          <div className="absolute bottom-1.5 inset-x-2 text-right">
            <span className="text-[10px] font-black text-white leading-none block truncate drop-shadow-md">
              {word.trim()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingOverlay() {
  return (
    <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-[1px] flex flex-col items-center justify-center gap-1.5">
      <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="3" className="animate-spin">
        <circle cx="12" cy="12" r="10" />
      </svg>
      <span className="text-[8.5px] font-black text-purple-600">
        جاري الرفع…
      </span>
    </div>
  );
}

function ReadinessPill({
  label,
  ready,
  cardDone,
}: {
  label: string;
  ready: boolean;
  cardDone: boolean;
}) {
  return (
    <div 
      className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-[9.5px] font-black transition-all ${
        cardDone
          ? "bg-purple-50 border border-purple-100 text-purple-700"
          : "bg-slate-50 border border-slate-200/50 text-slate-500"
      }`}
    >
      <span className="truncate max-w-[70px]">{label}</span>
      <span className="flex items-center gap-1">
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${ready ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}
        />
        {cardDone ? (
          <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <span>⋯</span>
        )}
      </span>
    </div>
  );
}
