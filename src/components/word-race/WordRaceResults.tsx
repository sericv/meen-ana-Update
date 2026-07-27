"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { WordRaceRoom, WordRaceMatch } from "@/types/word-race";
import { WORD_RACE_CATEGORIES, evaluateWordRaceMatch, computeCumulativeScores } from "@/lib/game/word-race-data";
import { WordRaceVictoryConfetti } from "@/components/word-race/WordRaceVictoryConfetti";
import { shareOrDownloadWordRaceResult } from "@/lib/game/word-race-share-card";
import {
  CATEGORY_SVG_MAP,
  SvgTrophyIcon,
  SvgSparklesIcon,
  SvgCrossIcon,
  SvgHomeIcon,
  SvgRepeatIcon,
  SvgArrowRightIcon,
  SvgLightningIcon,
  SvgRocketIcon,
  SvgTimerIcon,
} from "@/lib/game/word-race-svgs";

interface WordRaceResultsProps {
  room: WordRaceRoom;
  match: WordRaceMatch;
  myUid: string;
  onRematchVote: () => void;
  onReturnHome: () => void;
  onNextRound?: () => void;
}

export const WordRaceResults: React.FC<WordRaceResultsProps> = ({
  room,
  match,
  myUid,
  onRematchVote,
  onReturnHome,
  onNextRound,
}) => {
  const activeCategories = WORD_RACE_CATEGORIES.filter((c) => room.settings.categories.includes(c.id));
  
  const currentRoundNum = match.currentRound || 1;
  const totalRoundsNum = match.totalRounds || room.settings.roundsCount || 1;
  const isMultiRound = totalRoundsNum > 1;
  const isFinalRound = currentRoundNum >= totalRoundsNum;

  const evaluated = match.results && match.scores
    ? { results: match.results, scores: match.scores }
    : evaluateWordRaceMatch(room.settings.categories, match.letterAssignment, match.answers, match.finisherUid);

  // Cumulative score across all completed rounds + current evaluated round
  const cumulativeScores = computeCumulativeScores(match.roundHistory || [], evaluated.scores);

  // Verification intro sequence phase (0s -> 2.7s)
  const [isVerifying, setIsVerifying] = useState<boolean>(true);
  const [verifySubPhase, setVerifySubPhase] = useState<"checking" | "calculating">("checking");
  const [showAnnouncement, setShowAnnouncement] = useState<boolean>(false);
  const [showCountdown, setShowCountdown] = useState<boolean>(false);
  const [countdownSec, setCountdownSec] = useState<number>(3);
  const [revealStep, setRevealStep] = useState<number>(0);
  const [showFinalSummary, setShowFinalSummary] = useState<boolean>(false);
  const [selectedRoundTab, setSelectedRoundTab] = useState<number | "grand">(totalRoundsNum > 1 ? "grand" : 1);
  const [isSharing, setIsSharing] = useState<boolean>(false);

  // Store onNextRound in a ref to prevent effect cleanup on parent re-renders
  const onNextRoundRef = useRef(onNextRound);
  useEffect(() => {
    onNextRoundRef.current = onNextRound;
  }, [onNextRound]);

  useEffect(() => {
    // Phase 1 -> Phase 2 (Calculating results & rewards)
    const calcTimer = setTimeout(() => {
      setVerifySubPhase("calculating");
    }, 1300);

    // End verification & show announcement screen
    const endVerifyTimer = setTimeout(() => {
      setIsVerifying(false);
      setShowAnnouncement(true);
    }, 2700);

    return () => {
      clearTimeout(calcTimer);
      clearTimeout(endVerifyTimer);
    };
  }, []);

  // Auto-advance announcement after 4.5s
  useEffect(() => {
    if (showAnnouncement) {
      const autoTimer = setTimeout(() => {
        handleProceedFromAnnouncement();
      }, 4500);
      return () => clearTimeout(autoTimer);
    }
  }, [showAnnouncement]);

  const handleProceedFromAnnouncement = () => {
    setShowAnnouncement(false);
    if (isMultiRound && !isFinalRound) {
      setShowCountdown(true);
    }
  };

  // Robust 3-2-1 Countdown Timer Effect (1000ms per number hold)
  useEffect(() => {
    if (!showCountdown || isFinalRound) return;

    setCountdownSec(3);

    const t1 = setTimeout(() => {
      setCountdownSec(2);
    }, 1000);

    const t2 = setTimeout(() => {
      setCountdownSec(1);
    }, 2000);

    const t3 = setTimeout(() => {
      setCountdownSec(0);
      onNextRoundRef.current?.();
    }, 3000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [showCountdown, isFinalRound]);

  const opponentUid = room.players.find((p) => p.uid !== myUid)?.uid || "";
  const p1 = room.players.find((p) => p.uid === myUid) || { displayName: "أنت" };
  const p2 = room.players.find((p) => p.uid === opponentUid) || { displayName: "الخصم" };

  // Current Round Scores
  const myRoundScore = evaluated.scores[myUid] || { totalPoints: 0, validCount: 0, duplicateCount: 0, unansweredCount: 0, xpEarned: 0, coinsEarned: 0 };
  const oppRoundScore = evaluated.scores[opponentUid] || { totalPoints: 0, validCount: 0, duplicateCount: 0, unansweredCount: 0, xpEarned: 0, coinsEarned: 0 };

  // Cumulative Totals
  const myCumulative = cumulativeScores[myUid] || myRoundScore;
  const oppCumulative = cumulativeScores[opponentUid] || oppRoundScore;

  const isWinner = isFinalRound 
    ? myCumulative.totalPoints > oppCumulative.totalPoints 
    : myRoundScore.totalPoints > oppRoundScore.totalPoints;
    
  const isTie = isFinalRound 
    ? myCumulative.totalPoints === oppCumulative.totalPoints 
    : myRoundScore.totalPoints === oppRoundScore.totalPoints;

  const isAbandoned = Boolean(match.forfeitedByUid);
  const opponentForfeited = isAbandoned && match.forfeitedByUid === opponentUid;

  // Match-End Reason Detection
  const totalCatCount = activeCategories.length;
  const finisherUid = match.finisherUid;
  const finisherPlayer = finisherUid ? room.players.find((p) => p.uid === finisherUid) : null;
  const finisherProgress = finisherUid ? (match.progress[finisherUid] || 0) : 0;

  const isPlayerFinishedEnd = Boolean(finisherPlayer && finisherProgress >= totalCatCount);
  const finisherDisplayName = finisherPlayer
    ? (finisherPlayer.uid === myUid ? "أنت" : finisherPlayer.displayName || "منافسك")
    : "";

  const handleNextReveal = () => {
    if (revealStep < activeCategories.length - 1) {
      setRevealStep((prev) => prev + 1);
    } else {
      setShowFinalSummary(true);
    }
  };

  const handleShareResult = async () => {
    if (isSharing) return;
    setIsSharing(true);
    try {
      const isGrand = selectedRoundTab === "grand";
      const targetRoundNum = typeof selectedRoundTab === "number" ? selectedRoundTab : currentRoundNum;

      const letterMap = typeof selectedRoundTab === "number" && selectedRoundTab !== currentRoundNum
        ? (match.roundHistory?.find((r) => r.roundNumber === selectedRoundTab)?.letterAssignment || match.letterAssignment)
        : match.letterAssignment;

      const heroLetter = letterMap[activeCategories[0]?.id] || "أ";

      const activeMyScore = isGrand ? myCumulative : (displayScores[myUid] || { totalPoints: 0, validCount: 0, duplicateCount: 0 });
      const activeOppScore = isGrand ? oppCumulative : (displayScores[opponentUid] || { totalPoints: 0, validCount: 0, duplicateCount: 0 });

      const categoryReports = activeCategories.map((cat) => {
        const letter = letterMap[cat.id] || heroLetter;
        const r1 = displayResults[myUid]?.[cat.id] || { word: "لم يجب", points: 0 };
        const r2 = displayResults[opponentUid]?.[cat.id] || { word: "لم يجب", points: 0 };
        return {
          catName: cat.nameAr,
          letter,
          myWord: r1.word,
          oppWord: r2.word,
          myPoints: r1.points,
        };
      });

      await shareOrDownloadWordRaceResult({
        playerName: p1.displayName || "اللاعب",
        totalPoints: myCumulative.totalPoints,
        myRoundPoints: activeMyScore.totalPoints,
        oppRoundPoints: activeOppScore.totalPoints,
        validCount: activeMyScore.validCount,
        duplicateCount: activeMyScore.duplicateCount,
        roundNumber: isGrand ? "grand" : targetRoundNum,
        totalRounds: totalRoundsNum,
        heroLetter,
        isWinner,
        isTie,
        opponentName: p2.displayName,
        opponentPoints: oppCumulative.totalPoints,
        categoryReports,
      });
    } catch (err) {
      console.error("Failed to generate share image:", err);
    } finally {
      setIsSharing(false);
    }
  };

  const currentRevealCat = activeCategories[revealStep];
  const targetLetter = currentRevealCat ? (match.letterAssignment[currentRevealCat.id] || "أ") : "أ";
  const myRes = currentRevealCat ? (evaluated.results[myUid]?.[currentRevealCat.id] || { word: "لم يجب", isValid: false, isDuplicate: false, points: 0 }) : null;
  const oppRes = currentRevealCat ? (evaluated.results[opponentUid]?.[currentRevealCat.id] || { word: "لم يجب", isValid: false, isDuplicate: false, points: 0 }) : null;

  const IconComponent = currentRevealCat ? (CATEGORY_SVG_MAP[currentRevealCat.icon] || SvgSparklesIcon) : SvgSparklesIcon;

  // 1. Abandoned Match Screen
  if (isAbandoned) {
    return (
      <div className="game-card-outer w-full dir-rtl select-none my-auto" style={{ direction: "rtl" }}>
        <div className="game-card-inner p-8 sm:p-10 bg-white/95 border border-black/5 rounded-[32px] shadow-2xl text-slate-800 space-y-7 max-w-lg mx-auto text-center relative overflow-hidden my-auto">
          <div 
            className="absolute pointer-events-none rounded-full" 
            style={{
              width: 220,
              height: 220,
              background: opponentForfeited
                ? "radial-gradient(circle, rgba(234, 179, 8, 0.15) 0%, transparent 70%)"
                : "radial-gradient(circle, rgba(225, 29, 72, 0.15) 0%, transparent 70%)",
              top: -40,
              left: "50%",
              transform: "translateX(-50%)",
              filter: "blur(30px)",
            }}
          />

          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center shadow-xl ring-8 ${
              opponentForfeited
                ? "bg-gradient-to-br from-[#FFE600] to-amber-500 text-slate-950 ring-amber-400/20"
                : "bg-rose-100 text-rose-600 ring-rose-400/20"
            }`}
          >
            {opponentForfeited ? <SvgTrophyIcon size={40} /> : <SvgCrossIcon size={40} />}
          </motion.div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              {opponentForfeited ? "انسحب المنافس! فوز مستحق 🎉" : "لقد انسحبت من المباراة"}
            </h2>
            <p className="text-xs text-slate-500 font-bold leading-relaxed max-w-xs mx-auto">
              {opponentForfeited
                ? `غادر ${p2.displayName} المباراة أثناء اللعب، مما أدى لإنهائها واحتساب الفوز لك.`
                : "قمت بإنهاء المباراة مبكراً وإعلان الانسحاب."}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onReturnHome}
              className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <SvgHomeIcon size={16} />
              <span>الرئيسية</span>
            </button>
            <button
              onClick={onRematchVote}
              className="flex-1 py-3 rounded-2xl bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-black shadow-lg shadow-purple-200 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <SvgRepeatIcon size={16} />
              <span>إعادة اللعب فوراً</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Verification Sequence Screen
  if (isVerifying) {
    return (
      <div className="game-card-outer w-full dir-rtl select-none my-auto" style={{ direction: "rtl" }}>
        <div className="game-card-inner p-8 sm:p-10 bg-white/95 border border-black/5 rounded-[32px] shadow-2xl text-slate-800 space-y-7 max-w-lg mx-auto text-center relative overflow-hidden my-auto">
          <div 
            className="absolute pointer-events-none rounded-full" 
            style={{
              width: 260,
              height: 260,
              background: "radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%)",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              filter: "blur(35px)",
            }}
          />

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-20 h-20 mx-auto"
          >
            <div className="w-full h-full rounded-3xl bg-gradient-to-br from-[#7C3AED] to-purple-900 p-1 shadow-xl ring-8 ring-purple-500/10 flex items-center justify-center">
              <div className="w-full h-full rounded-[22px] bg-white flex items-center justify-center shadow-inner">
                <SvgSparklesIcon size={36} className="text-[#7C3AED] animate-pulse" />
              </div>
            </div>
          </motion.div>

          <div className="space-y-2">
            <span className="px-3.5 py-1 rounded-full bg-purple-100 border border-purple-200 text-[#7C3AED] text-[10px] font-black uppercase tracking-wider">
              {isMultiRound ? `الجولة ${currentRoundNum} من ${totalRoundsNum}` : "انتهت الجولة"}
            </span>
            
            <AnimatePresence mode="wait">
              {verifySubPhase === "checking" ? (
                <motion.h2
                  key="checking"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="text-xl sm:text-2xl font-black text-slate-900"
                >
                  جارٍ التحقق من إجابات الجولة...
                </motion.h2>
              ) : (
                <motion.h2
                  key="calculating"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="text-xl sm:text-2xl font-black text-slate-900"
                >
                  يتم احتساب النقاط الحالية...
                </motion.h2>
              )}
            </AnimatePresence>

            <p className="text-xs text-slate-400 font-bold">تأكد من إجابات اللاعبين وحفظ نتائج الجولة</p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-3 bg-purple-50/80 border border-purple-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-purple-950 flex items-center gap-1.5">
                  <SvgSparklesIcon size={14} className="text-[#7C3AED]" />
                  <span>{p1.displayName} (أنت)</span>
                </span>
                <span className="text-[#7C3AED] font-sans font-black">مكتمل 100%</span>
              </div>
              <div className="w-full h-2 bg-purple-200/60 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: "60%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-[#7C3AED] to-purple-600 rounded-full"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <SvgLightningIcon size={14} className="text-amber-500" />
                  <span>{p2.displayName}</span>
                </span>
                <span className="text-slate-800 font-sans font-black">مكتمل 100%</span>
              </div>
              <div className="w-full h-2 bg-slate-200/70 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: "50%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-amber-500 to-indigo-600 rounded-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Announcement Screen (End of Round Notice)
  if (showAnnouncement) {
    return (
      <div className="game-card-outer w-full dir-rtl select-none my-auto" style={{ direction: "rtl" }}>
        <div className="game-card-inner p-8 sm:p-10 bg-white/95 border border-black/5 rounded-[32px] shadow-2xl text-slate-800 space-y-7 max-w-lg mx-auto text-center relative overflow-hidden my-auto">
          <div 
            className="absolute pointer-events-none rounded-full" 
            style={{
              width: 240,
              height: 240,
              background: isPlayerFinishedEnd
                ? "radial-gradient(circle, rgba(124, 58, 237, 0.18) 0%, transparent 70%)"
                : "radial-gradient(circle, rgba(245, 158, 11, 0.18) 0%, transparent 70%)",
              top: "40%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              filter: "blur(35px)",
            }}
          />

          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`w-22 h-22 mx-auto rounded-3xl flex items-center justify-center shadow-xl ring-8 ${
              isPlayerFinishedEnd
                ? "bg-gradient-to-br from-[#7C3AED] to-purple-900 text-white ring-purple-500/20"
                : "bg-gradient-to-br from-amber-400 to-orange-500 text-white ring-amber-400/20"
            }`}
          >
            {isPlayerFinishedEnd ? (
              <SvgRocketIcon size={44} />
            ) : (
              <SvgTimerIcon size={44} className="animate-pulse" />
            )}
          </motion.div>

          <div className="space-y-2.5">
            <span className={`px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
              isPlayerFinishedEnd
                ? "bg-purple-100 border border-purple-200 text-[#7C3AED]"
                : "bg-amber-100 border border-amber-200 text-amber-900"
            }`}>
              {isPlayerFinishedEnd ? `إنهاء مبكر للجولة ${currentRoundNum} 🚀` : `انتهاء وقت الجولة ${currentRoundNum} ⏳`}
            </span>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              {isPlayerFinishedEnd
                ? `${finisherDisplayName} أنهى الجولة أولاً!`
                : "انتهى الوقت المحدد للجولة!"}
            </h2>

            <p className="text-xs text-slate-500 font-bold leading-relaxed max-w-xs mx-auto">
              {isPlayerFinishedEnd
                ? `أكمل ${finisherDisplayName} جميع الفئات المطلوب إجابتها بالجولة ${currentRoundNum}، مما أدى لإغلاق الجولة.`
                : `انتهت الثواني المخصصة للجولة ${currentRoundNum} قبل إكمال الفئات.`}
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 4.5, ease: "linear" }}
                className={`h-full ${isPlayerFinishedEnd ? "bg-[#7C3AED]" : "bg-amber-500"}`}
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleProceedFromAnnouncement}
              className="w-full py-3.5 rounded-2xl bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-black shadow-lg shadow-purple-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isMultiRound && !isFinalRound ? "المتابعة للجولة التالية ➔" : "عرض النتائج والتحليل التفصيلي"}</span>
              <SvgArrowRightIcon size={16} />
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // 4. NON-FINAL ROUNDS STRICT GUARD & 3-2-1 COUNTDOWN (NO SCORES OR ANSWERS EVER MOUNTED HERE)
  if (!isFinalRound) {
    const upcomingRound = currentRoundNum + 1;
    return (
      <div className="game-card-outer w-full dir-rtl select-none my-auto" style={{ direction: "rtl" }}>
        <div className="game-card-inner p-8 sm:p-10 bg-white/95 border border-black/5 rounded-[32px] shadow-2xl text-slate-800 space-y-7 max-w-lg mx-auto text-center relative overflow-hidden my-auto">
          
          {/* Ambient Purple Glow */}
          <div 
            className="absolute pointer-events-none rounded-full" 
            style={{
              width: 250,
              height: 250,
              background: "radial-gradient(circle, rgba(124, 58, 237, 0.18) 0%, transparent 70%)",
              top: "45%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              filter: "blur(35px)",
            }}
          />

          {/* Upcoming Round Badge Header */}
          <span className="px-4 py-1.5 rounded-full bg-purple-100 border border-purple-200 text-[#7C3AED] text-xs font-black uppercase tracking-wider inline-flex items-center gap-2 shadow-2xs">
            <SvgLightningIcon size={15} />
            <span>الجولة {upcomingRound} من {totalRoundsNum}</span>
          </span>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              الجولة التالية تبدأ خلال...
            </h2>
            <p className="text-xs text-slate-500 font-bold">
              استعد لدولاب اختيارات الحروف الجديدة للجولة القادمة
            </p>
          </div>

          {/* Big Animated 3-2-1 Countdown Number Orb */}
          <div className="py-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={countdownSec}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ type: "spring", stiffness: 350, damping: 22 }}
                className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-[#7C3AED] to-purple-900 text-white font-sans font-black text-5xl flex items-center justify-center shadow-xl ring-8 ring-purple-500/20"
              >
                {Math.max(1, countdownSec)}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Action Button: Skip countdown immediately */}
          <div className="pt-2">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => onNextRoundRef.current?.()}
              className="w-full py-4 rounded-2xl bg-[#7C3AED] hover:bg-purple-700 text-white text-xs sm:text-sm font-black shadow-lg shadow-purple-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>بدء الجولة {upcomingRound} فوراً ⚡</span>
            </motion.button>
          </div>

        </div>
      </div>
    );
  }

  // 5. Final Match Breakdown (Mounted ONLY after the final round completes)
  const selectedHistoryRound = typeof selectedRoundTab === "number" 
    ? (selectedRoundTab === currentRoundNum 
        ? evaluated 
        : match.roundHistory?.find((r) => r.roundNumber === selectedRoundTab))
    : null;

  const displayResults = selectedHistoryRound ? selectedHistoryRound.results : evaluated.results;
  const displayScores = selectedHistoryRound ? selectedHistoryRound.scores : cumulativeScores;

  return (
    <div className="game-card-outer w-full dir-rtl select-none my-auto" style={{ direction: "rtl" }}>
      <div className="game-card-inner p-6 sm:p-8 bg-white/95 border border-black/5 rounded-[28px] shadow-xl text-slate-800 space-y-6">
        
        {/* Step-by-Step Manual Reveal Sequence */}
        {!showFinalSummary ? (
          <div className="space-y-6 text-center animate-fade-in">
            <div className="flex flex-col items-center gap-1.5">
              <div className="px-3.5 py-1 rounded-full bg-purple-100 border border-purple-200 text-[#7C3AED] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <SvgSparklesIcon size={14} />
                <span>
                  {isMultiRound ? `كشف الجولة ${currentRoundNum} من ${totalRoundsNum}` : "كشف إجابات الفئات خطوة بخطوة"}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                الفئة {revealStep + 1} من {activeCategories.length}: {currentRevealCat?.nameAr}
              </h2>
            </div>

            {/* Active Reveal Card */}
            <AnimatePresence mode="wait">
              {currentRevealCat && myRes && oppRes && (
                <motion.div
                  key={currentRevealCat.id}
                  initial={{ opacity: 0, scale: 0.96, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -12 }}
                  transition={{ duration: 0.3 }}
                  className="p-6 rounded-2xl bg-purple-50/80 border border-purple-300 shadow-md ring-2 ring-purple-300/40 max-w-xl mx-auto space-y-5"
                >
                  <div className="flex items-center justify-between border-b border-purple-200/80 pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-2xl border bg-white border-slate-200 ${currentRevealCat.color}`}>
                        <IconComponent size={24} />
                      </div>
                      <div className="text-right">
                        <span className="font-black text-base text-slate-900">{currentRevealCat.nameAr}</span>
                        <p className="text-xs text-slate-500 font-medium">{currentRevealCat.descriptionAr}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center bg-white border border-purple-200 rounded-xl px-3 py-1 text-xs">
                      <span className="text-[9px] text-slate-400 font-bold">الحرف</span>
                      <span className="font-sans font-black text-[#7C3AED] text-base">{targetLetter}</span>
                    </div>
                  </div>

                  {/* Answers Comparison Rows */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
                    <div className="p-3.5 rounded-xl bg-white border border-purple-200 space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold">{p1.displayName} (أنت)</span>
                      <div className="flex items-center justify-between">
                        {!myRes.word || myRes.word === "لم يجب" || myRes.word === "لم أعرف" ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black inline-flex items-center gap-1">
                            <SvgCrossIcon size={12} className="text-rose-600" />
                            <span>لم يجب</span>
                          </span>
                        ) : (
                          <span className="font-black text-slate-900 text-sm break-words">{myRes.word}</span>
                        )}
                        <span className="text-xs font-sans font-black text-purple-900">+{myRes.points} pt</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold">{p2.displayName}</span>
                      <div className="flex items-center justify-between">
                        {!oppRes.word || oppRes.word === "لم يجب" || oppRes.word === "لم أعرف" ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black inline-flex items-center gap-1">
                            <SvgCrossIcon size={12} className="text-rose-600" />
                            <span>لم يجب</span>
                          </span>
                        ) : (
                          <span className="font-black text-slate-900 text-sm break-words">{oppRes.word}</span>
                        )}
                        <span className="text-xs font-sans font-black text-slate-700">+{oppRes.points} pt</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Next Reveal Step Button */}
            <div className="pt-3">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleNextReveal}
                className="px-8 py-3 rounded-2xl bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-black shadow-lg shadow-purple-200 transition-all flex items-center gap-2 mx-auto cursor-pointer"
              >
                <span>{revealStep < activeCategories.length - 1 ? "الفئة التالية" : "عرض النتيجة النهائية"}</span>
                <SvgArrowRightIcon size={16} />
              </motion.button>
            </div>
          </div>
        ) : (

          /* Final Results Summary Page & Comprehensive Table */
          <div className="space-y-6 animate-fade-in text-center">
            {showFinalSummary && isWinner && !isTie && <WordRaceVictoryConfetti />}
            
            <div className="flex flex-col items-center gap-2">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-18 h-18 rounded-full bg-[#FFE600] border-2 border-black/10 flex items-center justify-center text-slate-900 shadow-lg"
              >
                <SvgTrophyIcon size={36} />
              </motion.div>

              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full bg-purple-100 text-[#7C3AED] text-[10px] font-black uppercase tracking-wider">
                  {isMultiRound ? `النتيجة النهائية الكبرى (${totalRoundsNum} جولات)` : "النتيجة النهائية للمباراة"}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                  {isTie ? "مباراة متعادلة! 🤝" : isWinner ? "فوز مستحق بالمركز الأول! 🎉" : "خسارة بشرف 👏"}
                </h2>
                <p className="text-xs text-slate-500 font-bold">
                  {isWinner ? "أحسنت! قدمت أداءً مذهلاً وسريعاً في جميع الإجابات." : "مباراة قوية! حاول مرة أخرى في الجولات القادمة."}
                </p>
              </div>
            </div>

            {/* GRAND TOTAL SCORES CARD */}
            <div className="grid grid-cols-2 gap-3 max-w-xl mx-auto text-right">
              <div className="p-4 rounded-2xl bg-purple-50/90 border border-purple-200 space-y-1.5 shadow-xs">
                <span className="text-xs font-black text-slate-800">{p1.displayName} (أنت)</span>
                <div className="text-2xl font-sans font-black text-[#7C3AED]">
                  {myCumulative.totalPoints} <span className="text-xs font-bold text-slate-500">نقطة</span>
                </div>
                <div className="text-[10px] text-slate-500 font-bold pt-1 border-t border-purple-200/50 flex items-center justify-between">
                  <span>إجابات صحيحة: {myCumulative.validCount}</span>
                  <span>مكررة: {myCumulative.duplicateCount}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 shadow-xs">
                <span className="text-xs font-black text-slate-700">{p2.displayName}</span>
                <div className="text-2xl font-sans font-black text-slate-800">
                  {oppCumulative.totalPoints} <span className="text-xs font-bold text-slate-500">نقطة</span>
                </div>
                <div className="text-[10px] text-slate-500 font-bold pt-1 border-t border-slate-200/50 flex items-center justify-between">
                  <span>إجابات صحيحة: {oppCumulative.validCount}</span>
                  <span>مكررة: {oppCumulative.duplicateCount}</span>
                </div>
              </div>
            </div>

            {/* MULTI-ROUND BREAKDOWN TABS */}
            {isMultiRound && (
              <div className="space-y-3 max-w-xl mx-auto">
                <div className="text-xs font-black text-slate-700 text-right">تفاصيل الجولات:</div>
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-2xl overflow-x-auto custom-scrollbar">
                  <button
                    type="button"
                    onClick={() => setSelectedRoundTab("grand")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedRoundTab === "grand"
                        ? "bg-[#7C3AED] text-white font-black shadow-xs"
                        : "text-slate-600 hover:bg-slate-200/60"
                    }`}
                  >
                    المجموع الكلي
                  </button>

                  {Array.from({ length: totalRoundsNum }, (_, i) => i + 1).map((roundNum) => (
                    <button
                      key={roundNum}
                      type="button"
                      onClick={() => setSelectedRoundTab(roundNum)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        selectedRoundTab === roundNum
                          ? "bg-[#7C3AED] text-white font-black shadow-xs"
                          : "text-slate-600 hover:bg-slate-200/60"
                      }`}
                    >
                      الجولة {roundNum}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PER-CATEGORY RESULTS TABLE */}
            <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-4 space-y-3 max-w-xl mx-auto text-right shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <h3 className="font-black text-xs text-slate-900">
                  {selectedRoundTab === "grand"
                    ? "جدول الإجابات والنقاط الإجمالي"
                    : `جدول إجابات الجولة ${selectedRoundTab}`}
                </h3>
                <span className="text-[10px] font-sans font-black text-purple-700">
                  {activeCategories.length} فئات
                </span>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-extrabold text-[10px]">
                      <th className="p-2">الفئة</th>
                      <th className="p-2">الحرف</th>
                      <th className="p-2">{p1.displayName} (أنت)</th>
                      <th className="p-2">{p2.displayName}</th>
                      <th className="p-2 text-center">النقاط</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60">
                    {activeCategories.map((cat) => {
                      const letter = typeof selectedRoundTab === "number" && selectedRoundTab !== currentRoundNum
                        ? (match.roundHistory?.find((r) => r.roundNumber === selectedRoundTab)?.letterAssignment[cat.id] || "أ")
                        : (match.letterAssignment[cat.id] || "أ");

                      const r1 = displayResults[myUid]?.[cat.id] || { word: "لم يجب", points: 0 };
                      const r2 = displayResults[opponentUid]?.[cat.id] || { word: "لم يجب", points: 0 };
                      const IconComp = CATEGORY_SVG_MAP[cat.icon] || SvgSparklesIcon;

                      const isR1Unanswered = !r1.word || r1.word === "لم يجب" || r1.word === "لم أعرف";
                      const isR2Unanswered = !r2.word || r2.word === "لم يجب" || r2.word === "لم أعرف";

                      return (
                        <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 flex items-center gap-2 font-black">
                            <IconComp size={16} className={cat.color} />
                            <span>{cat.nameAr}</span>
                          </td>
                          <td className="p-3 font-sans font-black text-[#7C3AED]">{letter}</td>
                          <td className="p-3">
                            {isR1Unanswered ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-black inline-flex items-center gap-1">
                                <SvgCrossIcon size={11} className="text-rose-600" />
                                <span>لم يجب</span>
                              </span>
                            ) : (
                              <span className="font-black text-slate-900 break-words">{r1.word}</span>
                            )}
                          </td>
                          <td className="p-3">
                            {isR2Unanswered ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-black inline-flex items-center gap-1">
                                <SvgCrossIcon size={11} className="text-rose-600" />
                                <span>لم يجب</span>
                              </span>
                            ) : (
                              <span className="font-black text-slate-700 break-words">{r2.word}</span>
                            )}
                          </td>
                          <td className="p-3 text-center font-sans font-black text-purple-900">
                            +{r1.points} pt
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Action Footer */}
            <div className="space-y-3 pt-3 max-w-xl mx-auto">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleShareResult}
                disabled={isSharing}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs sm:text-sm font-black shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-75"
              >
                <SvgSparklesIcon size={18} />
                <span>{isSharing ? "جاري تجهيز بطاقة المشاركة..." : "مشاركة النتيجة"}</span>
              </motion.button>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={onReturnHome}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <SvgHomeIcon size={16} />
                  <span>العودة لغرفة المبارايات</span>
                </button>
                <button
                  onClick={onRematchVote}
                  className="flex-1 py-3 rounded-2xl bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-black shadow-lg shadow-purple-200 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <SvgRepeatIcon size={16} />
                  <span>العودة للصالة وإعادة اللعب</span>
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
