"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { WordRaceRoom, WordRaceMatch } from "@/types/word-race";
import { WORD_RACE_CATEGORIES } from "@/lib/game/word-race-data";
import {
  CATEGORY_SVG_MAP,
  SvgCheckIcon,
  SvgSparklesIcon,
  SvgLightningIcon,
  SvgShieldIcon,
  SvgCrossIcon,
  SvgEmptyIcon,
  SvgArrowRightIcon,
  SvgTimerIcon,
} from "@/lib/game/word-race-svgs";

interface WordRaceGameProps {
  room: WordRaceRoom;
  match: WordRaceMatch;
  myUid: string;
  onUpdateAnswers: (answers: Record<string, string>, isFinished: boolean) => void;
  onForfeitMatch?: () => void;
  onTimeExpired: () => void;
}

export const WordRaceGame: React.FC<WordRaceGameProps> = ({
  room,
  match,
  myUid,
  onUpdateAnswers,
  onForfeitMatch,
  onTimeExpired,
}) => {
  const activeCategories = WORD_RACE_CATEGORIES.filter((c) => room.settings.categories.includes(c.id));
  const myAnswers = match.answers[myUid] || {};

  const [answers, setAnswers] = useState<Record<string, string>>(myAnswers);
  const [activeCatIndex, setActiveCatIndex] = useState<number>(0);
  const [hasSkippedFinalCategory, setHasSkippedFinalCategory] = useState<boolean>(false);
  const [isConfirmLeaveOpen, setIsConfirmLeaveOpen] = useState<boolean>(false);

  // Server-Authoritative Timer Calculation
  const durationSec = match.durationSec || room.settings.timeLimitSec || 90;
  const matchStartedAt = match.startedAt || Date.now();

  const calculateRemainingSec = () => {
    const elapsedSec = Math.floor((Date.now() - matchStartedAt) / 1000);
    return Math.max(0, durationSec - elapsedSec);
  };

  const [timeLeft, setTimeLeft] = useState<number>(calculateRemainingSec);

  const opponentUid = room.players.find((p) => p.uid !== myUid)?.uid || "";
  const opponentProgress = match.progress[opponentUid] || 0;
  const opponentName = room.players.find((p) => p.uid !== myUid)?.displayName || "الخصم";

  const isMatchLocked = Boolean(match.finisherUid) || match.status === "revealing";
  const isLastCategory = activeCatIndex === activeCategories.length - 1;

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Sync initial answers on match ID load
  useEffect(() => {
    if (match.answers[myUid]) {
      setAnswers(match.answers[myUid]);
    }
  }, [match.id, myUid]);

  // Server-Authoritative Synced Timer Loop
  useEffect(() => {
    const updateTimer = () => {
      const remaining = calculateRemainingSec();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        onTimeExpired();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 500);
    return () => clearInterval(interval);
  }, [matchStartedAt, durationSec, onTimeExpired]);

  // Auto-focus input on category switch
  useEffect(() => {
    if (inputRef.current && !isMatchLocked && !hasSkippedFinalCategory) {
      inputRef.current.focus();
    }
  }, [activeCatIndex, isMatchLocked, hasSkippedFinalCategory]);

  // Handle Input Change
  const handleInputChange = (catId: string, val: string) => {
    if (isMatchLocked || hasSkippedFinalCategory) return;
    const nextAnswers = { ...answers, [catId]: val };
    setAnswers(nextAnswers);
    onUpdateAnswers(nextAnswers, false);
  };

  // CASE 1: Confirm Answer & Advance (ONLY allowed if valid non-empty answer typed)
  // Typing an answer on the last category allows immediate match finish!
  const handleConfirmAnswer = () => {
    if (isMatchLocked || hasSkippedFinalCategory) return;
    const currentCatId = activeCategories[activeCatIndex]?.id;
    if (!currentCatId) return;

    const typedVal = (answers[currentCatId] || "").trim();
    if (!typedVal || typedVal === "لم أعرف") return; // Prevent advancing if empty!

    const nextAnswers = { ...answers, [currentCatId]: typedVal };
    setAnswers(nextAnswers);

    if (!isLastCategory) {
      onUpdateAnswers(nextAnswers, false);
      setActiveCatIndex((prev) => prev + 1);
      inputRef.current?.focus();
    } else {
      // TYPED ANSWER ON LAST CATEGORY: ALLOW IMMEDIATE MATCH FINISH!
      onUpdateAnswers(nextAnswers, true);
    }
  };

  // CASE 2: "I don't know" button press
  // Skipping the last category DOES NOT allow immediate match finish! Places player in waiting state.
  const handleDontKnow = () => {
    if (isMatchLocked || hasSkippedFinalCategory) return;
    const currentCatId = activeCategories[activeCatIndex]?.id;
    if (!currentCatId) return;

    const nextAnswers = { ...answers, [currentCatId]: "لم أعرف" };
    setAnswers(nextAnswers);

    if (!isLastCategory) {
      onUpdateAnswers(nextAnswers, false);
      setActiveCatIndex((prev) => prev + 1);
      inputRef.current?.focus();
    } else {
      // SKIPPED LAST CATEGORY: DO NOT FINISH MATCH IMMEDIATELY!
      onUpdateAnswers(nextAnswers, false);
      setHasSkippedFinalCategory(true);
    }
  };

  const currentCategory = activeCategories[activeCatIndex];
  const targetLetter = match.letterAssignment[currentCategory?.id || ""] || "أ";
  const currentRawAnswer = answers[currentCategory?.id || ""] || "";
  const isCurrentAnswerTyped = currentRawAnswer.trim().length > 0 && currentRawAnswer !== "لم أعرف";

  const completedCount = Object.values(answers).filter((v) => (v || "").trim().length > 0).length;
  const myProgressPercent = Math.round((completedCount / activeCategories.length) * 100);
  const opponentProgressPercent = Math.round((opponentProgress / activeCategories.length) * 100);

  const IconComponent = currentCategory ? (CATEGORY_SVG_MAP[currentCategory.icon] || SvgSparklesIcon) : SvgSparklesIcon;

  // ─── Rounded Square Timer Calculations ─────────────────────────────────────
  const progressRatio = Math.max(0, Math.min(1, timeLeft / durationSec));
  const squarePerimeter = 328;
  const squareDashoffset = squarePerimeter * (1 - progressRatio);

  let borderColor = "#7C3AED"; // Default Purple
  if (timeLeft <= 8) {
    borderColor = "#E11D48";
  } else if (timeLeft <= 20) {
    borderColor = "#F97316";
  }

  const isFinalSeconds = timeLeft <= 5 && timeLeft > 0;

  return (
    <div className="game-card-outer w-full dir-rtl select-none my-auto" style={{ direction: "rtl" }}>
      <div className="game-card-inner p-4 sm:p-6 bg-white/95 border border-black/5 rounded-[28px] shadow-2xl text-slate-800 flex flex-col justify-between space-y-4 relative overflow-hidden min-h-[85vh]">
        
        {/* Subtle Background Arabic Letter Watermarks */}
        <div className="absolute inset-0 pointer-events-none opacity-5 flex items-center justify-between px-6 text-7xl font-sans font-black text-purple-900 select-none">
          <span className="transform -rotate-12">أ</span>
          <span className="transform rotate-12">م</span>
          <span className="transform -rotate-6">س</span>
        </div>

        {/* 1. TOP BAR: Leave Button & Status Badge */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 relative z-10">
          <button
            type="button"
            onClick={() => setIsConfirmLeaveOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-all flex items-center gap-1.5 active:scale-95 shadow-2xs cursor-pointer"
          >
            <SvgCrossIcon size={14} />
            <span>مغادرة</span>
          </button>

          <span className="px-3 py-1 rounded-full bg-purple-100 text-[#7C3AED] text-[10px] font-sans font-black uppercase tracking-wider">
            مباراة تنافسية مباشر
          </span>
        </div>

        {/* 2. PROGRESS SECTION: Streamlined Player vs Opponent Progress Bars */}
        <div className="grid grid-cols-2 gap-2.5 relative z-10 text-xs">
          {/* Player Progress Bar */}
          <div className="p-2.5 bg-purple-50/80 border border-purple-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-purple-950 flex items-center gap-1">
                <SvgSparklesIcon size={13} className="text-[#7C3AED]" />
                <span>أنت:</span>
              </span>
              <span className="font-sans font-black text-[#7C3AED] text-[11px]">
                {completedCount} / {activeCategories.length}
              </span>
            </div>
            <div className="w-full h-1.5 bg-purple-200/60 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#7C3AED] to-purple-600 rounded-full"
                animate={{ width: `${myProgressPercent}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>

          {/* Opponent Progress Bar */}
          <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-700 flex items-center gap-1">
                <SvgLightningIcon size={13} className="text-amber-500" />
                <span>{opponentName}:</span>
              </span>
              <span className="font-sans font-black text-slate-800 text-[11px]">
                {opponentProgress} / {activeCategories.length}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-500 to-indigo-600 rounded-full"
                animate={{ width: `${opponentProgressPercent}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        </div>

        {/* Lock Overlay Notice if Match Finished */}
        {isMatchLocked && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-sm animate-pulse relative z-10">
            <SvgShieldIcon size={16} className="text-amber-600" />
            <span>تم إرسال الحصيلة. جاري الانتقال لكشف الإجابات...</span>
          </div>
        )}

        {/* 3. GAMEPLAY ARENA CONTAINER */}
        <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm relative z-10 flex-1 flex flex-col justify-start">
          
          {/* SECTION A: ANIMATED CATEGORY & LETTER DISPLAY (Inside AnimatePresence for smooth slide transitions) */}
          <AnimatePresence mode="wait">
            {currentCategory && (
              <motion.div
                key={currentCategory.id}
                initial={{ opacity: 0, x: 25 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -25 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="space-y-3"
              >
                {/* Target Letter Container */}
                <div className="flex flex-col items-center justify-center pt-1 space-y-1 text-center">
                  <span className="text-[11px] text-purple-900/70 font-sans font-black uppercase tracking-wider">
                    الحرف المطلوب
                  </span>

                  <motion.div 
                    animate={{ scale: isFinalSeconds ? [1, 1.03, 1] : 1 }}
                    transition={{ repeat: isFinalSeconds ? Infinity : 0, duration: 0.8 }}
                    className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center mx-auto p-1"
                  >
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                      <rect
                        x="5"
                        y="5"
                        width="90"
                        height="90"
                        rx="18"
                        ry="18"
                        fill="none"
                        stroke="#E2E8F0"
                        strokeWidth="5"
                      />
                      <rect
                        x="5"
                        y="5"
                        width="90"
                        height="90"
                        rx="18"
                        ry="18"
                        fill="none"
                        stroke={borderColor}
                        strokeWidth="5.5"
                        strokeLinecap="round"
                        strokeDasharray={squarePerimeter}
                        strokeDashoffset={squareDashoffset}
                        style={{
                          transition: "stroke-dashoffset 0.5s linear, stroke 0.5s ease",
                        }}
                      />
                    </svg>

                    <div className="w-18 h-18 sm:w-20 sm:h-20 aspect-square rounded-2xl bg-gradient-to-br from-[#7C3AED] to-purple-900 p-0.5 shadow-md flex items-center justify-center z-10">
                      <div className="w-full h-full aspect-square rounded-[14px] bg-white flex items-center justify-center shadow-inner relative">
                        <span className="text-4xl sm:text-5xl font-black text-[#7C3AED] font-sans leading-none">
                          {targetLetter}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Standalone Round Timer Pill (Positioned between Target Letter Box & Category Card) */}
                <div className="flex justify-center my-1">
                  <div className={`px-3.5 py-1 rounded-full font-sans font-black text-xs flex items-center gap-1.5 border shadow-2xs transition-all ${
                    timeLeft <= 8
                      ? "bg-rose-50 border-rose-200 text-rose-700 animate-pulse"
                      : "bg-purple-50 border-purple-200 text-[#7C3AED]"
                  }`}>
                    <SvgTimerIcon size={14} className={timeLeft <= 8 ? "text-rose-600 animate-spin" : "text-[#7C3AED]"} />
                    <span>الوقت المتبقي:</span>
                    <span className="text-sm font-black tracking-tight">{timeLeft}ث</span>
                  </div>
                </div>

                {/* Category Card */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-xs flex items-center gap-3.5">
                  <div className={`p-3 rounded-2xl border bg-purple-50/60 border-purple-100 shadow-2xs flex items-center justify-center shrink-0 ${currentCategory.color}`}>
                    <IconComponent size={34} className="w-8.5 h-8.5" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base sm:text-lg font-black text-slate-900 truncate">
                        {currentCategory.nameAr}
                      </h3>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-sans font-extrabold shrink-0">
                        {activeCatIndex + 1} من {activeCategories.length}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-bold leading-tight">
                      {currentCategory.descriptionAr}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SECTION B: PERSISTENT STABLE INPUT AREA & BUTTONS (ATTACHED IMMEDIATELY BELOW CATEGORY CARD) */}
          {hasSkippedFinalCategory ? (
            /* SKIPPED FINAL CATEGORY WAITING BANNER */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-purple-50/90 border border-purple-200 rounded-2xl text-center space-y-2 shadow-xs"
            >
              <div className="flex items-center justify-center gap-2 text-purple-950 font-sans font-black text-sm">
                <SvgTimerIcon size={18} className="text-[#7C3AED] animate-spin" />
                <span>لقد أكملت جميع الفئات!</span>
              </div>
              <p className="text-xs text-slate-600 font-bold leading-relaxed">
                سيتم إنهاء المباراة وحساب النتائج تلقائياً عند انتهاء الخصم من إجاباته أو انتهاء الوقت.
              </p>
              <div className="text-[11px] font-sans font-extrabold text-[#7C3AED] bg-white px-3 py-1 rounded-xl border border-purple-200 inline-block shadow-2xs">
                بانتظار انتهاء الخصم...
              </div>
            </motion.div>
          ) : (
            <div className="space-y-2.5 pt-0 mt-0">
              {/* Input Header & Label */}
              <div className="flex items-center justify-between px-1">
                <label className="text-xs font-black text-purple-950">
                  أدخل إجابتك تبدأ بحرف ({targetLetter}):
                </label>
                {currentRawAnswer === "لم أعرف" && (
                  <span className="text-[9px] text-slate-400 font-bold bg-slate-200/60 px-2 py-0.5 rounded-md">
                    تم اختيار "لم أعرف"
                  </span>
                )}
              </div>
              
              {/* SINGLE PERSISTENT INPUT DOM NODE - font-size explicitly >= 16px to prevent mobile focus auto-zoom */}
              <input
                ref={inputRef}
                type="text"
                disabled={isMatchLocked}
                value={answers[currentCategory?.id || ""] === "لم أعرف" ? "" : answers[currentCategory?.id || ""] || ""}
                onChange={(e) => handleInputChange(currentCategory?.id || "", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && isCurrentAnswerTyped) {
                    handleConfirmAnswer();
                  }
                }}
                placeholder={currentCategory ? `اكتب كلمة تبدأ بحرف ${targetLetter}...` : "اكتب إجابتك..."}
                style={{ fontSize: "16px" }}
                className="w-full bg-white border border-slate-300 rounded-2xl px-4 py-3 sm:py-3.5 text-[16px] sm:text-lg font-black text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#7C3AED] focus:ring-4 focus:ring-purple-500/20 transition-all dir-rtl disabled:opacity-60 shadow-inner"
              />

              {/* Action Buttons */}
              {!isMatchLocked && (
                <div className="flex items-center gap-2 pt-0.5">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    type="button"
                    onClick={handleConfirmAnswer}
                    disabled={!isCurrentAnswerTyped}
                    className="flex-1 py-3 sm:py-3.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md bg-[#7C3AED] hover:bg-purple-700 text-white shadow-purple-200 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  >
                    <SvgCheckIcon size={16} />
                    <span>{isLastCategory ? "إنهاء المباراة" : "تأكيد الإجابة"}</span>
                    {!isLastCategory && <SvgArrowRightIcon size={14} />}
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handleDontKnow}
                    className="px-4 py-3 sm:py-3.5 rounded-2xl bg-slate-200/70 hover:bg-slate-300 text-slate-700 text-xs font-extrabold transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <SvgEmptyIcon size={14} />
                    <span>لم أعرف</span>
                  </motion.button>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Forfeit Confirmation Modal */}
      {isConfirmLeaveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in dir-rtl" style={{ direction: "rtl" }}>
          <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-[28px] p-6 shadow-2xl text-slate-800 space-y-5 text-center">
            
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <SvgShieldIcon size={28} />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-slate-900">مغادرة المباراة؟</h3>
              <p className="text-xs text-slate-500 font-bold leading-relaxed">
                إذا غادرت المباراة الآن ستعتبر خاسراً بالانسحاب، وسيتم احتساب الفوز لصالح منافسك!
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmLeaveOpen(false)}
                className="flex-1 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
              >
                البقاء في اللعبة
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmLeaveOpen(false);
                  if (onForfeitMatch) onForfeitMatch();
                }}
                className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-all shadow-md shadow-rose-200"
              >
                مغادرة وخسارة المباراة
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
