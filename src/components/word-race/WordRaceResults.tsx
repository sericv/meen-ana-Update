"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { WordRaceRoom, WordRaceMatch } from "@/types/word-race";
import { WORD_RACE_CATEGORIES, evaluateWordRaceMatch } from "@/lib/game/word-race-data";
import {
  CATEGORY_SVG_MAP,
  SvgTrophyIcon,
  SvgSparklesIcon,
  SvgCheckIcon,
  SvgCrossIcon,
  SvgDuplicateIcon,
  SvgEmptyIcon,
  SvgHomeIcon,
  SvgRepeatIcon,
  SvgArrowRightIcon,
  SvgStarIcon,
  SvgShieldIcon,
  SvgLightningIcon,
} from "@/lib/game/word-race-svgs";

interface WordRaceResultsProps {
  room: WordRaceRoom;
  match: WordRaceMatch;
  myUid: string;
  onRematchVote: () => void;
  onReturnHome: () => void;
}

export const WordRaceResults: React.FC<WordRaceResultsProps> = ({
  room,
  match,
  myUid,
  onRematchVote,
  onReturnHome,
}) => {
  const activeCategories = WORD_RACE_CATEGORIES.filter((c) => room.settings.categories.includes(c.id));
  
  const evaluated = match.results && match.scores
    ? { results: match.results, scores: match.scores }
    : evaluateWordRaceMatch(room.settings.categories, match.letterAssignment, match.answers, match.finisherUid);

  // Verification intro sequence phase (0s -> 2.7s) before starting reveal
  const [isVerifying, setIsVerifying] = useState<boolean>(true);
  const [verifySubPhase, setVerifySubPhase] = useState<"checking" | "calculating">("checking");
  const [revealStep, setRevealStep] = useState<number>(0);
  const [showFinalSummary, setShowFinalSummary] = useState<boolean>(false);

  useEffect(() => {
    // Phase 1 -> Phase 2 (Calculating results & rewards)
    const calcTimer = setTimeout(() => {
      setVerifySubPhase("calculating");
    }, 1300);

    // End verification & start category reveal
    const endVerifyTimer = setTimeout(() => {
      setIsVerifying(false);
    }, 2700);

    return () => {
      clearTimeout(calcTimer);
      clearTimeout(endVerifyTimer);
    };
  }, []);

  const myScore = evaluated.scores[myUid] || { totalPoints: 0, validCount: 0, duplicateCount: 0, unansweredCount: 0, xpEarned: 0, coinsEarned: 0 };
  const opponentUid = room.players.find((p) => p.uid !== myUid)?.uid || "";
  const opponentScore = evaluated.scores[opponentUid] || { totalPoints: 0, validCount: 0, duplicateCount: 0, unansweredCount: 0, xpEarned: 0, coinsEarned: 0 };

  const isWinner = myScore.totalPoints > opponentScore.totalPoints;
  const isTie = myScore.totalPoints === opponentScore.totalPoints;

  const isAbandoned = Boolean(match.forfeitedByUid);
  const opponentForfeited = isAbandoned && match.forfeitedByUid === opponentUid;

  const p1 = room.players.find((p) => p.uid === myUid) || { displayName: "أنت" };
  const p2 = room.players.find((p) => p.uid === opponentUid) || { displayName: "الخصم" };

  const handleNextReveal = () => {
    if (revealStep < activeCategories.length - 1) {
      setRevealStep((prev) => prev + 1);
    } else {
      setShowFinalSummary(true);
    }
  };

  const currentRevealCat = activeCategories[revealStep];
  const targetLetter = currentRevealCat ? (match.letterAssignment[currentRevealCat.id] || "أ") : "أ";
  const myRes = currentRevealCat ? (evaluated.results[myUid]?.[currentRevealCat.id] || { word: "لم يجب", isValid: false, isDuplicate: false, points: 0 }) : null;
  const oppRes = currentRevealCat ? (evaluated.results[opponentUid]?.[currentRevealCat.id] || { word: "لم يجب", isValid: false, isDuplicate: false, points: 0 }) : null;

  const IconComponent = currentRevealCat ? (CATEGORY_SVG_MAP[currentRevealCat.icon] || SvgSparklesIcon) : SvgSparklesIcon;

  // 1. Abandoned Match (Victory By Forfeit or Defeat By Forfeit) Screen
  if (isAbandoned) {
    return (
      <div className="game-card-outer w-full dir-rtl select-none my-auto" style={{ direction: "rtl" }}>
        <div className="game-card-inner p-8 sm:p-10 bg-white/95 border border-black/5 rounded-[32px] shadow-2xl text-slate-800 space-y-7 max-w-lg mx-auto text-center relative overflow-hidden my-auto">
          
          {/* Ambient Glow */}
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
            {opponentForfeited ? <SvgTrophyIcon size={40} /> : <SvgShieldIcon size={40} />}
          </motion.div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
              {opponentForfeited ? "انسحاب المنافس" : "تمت المغادرة"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              {opponentForfeited ? "فوز مستحق بالانسحاب!" : "خسارة بالانسحاب"}
            </h2>
            <p className="text-xs text-slate-500 font-bold leading-relaxed max-w-xs mx-auto">
              {opponentForfeited
                ? `لقد غادر ${p2.displayName} المباراة، وتم احتساب الفوز لك كاملاً!`
                : "لقد غادرت المباراة قبل اكتمالها واحتُسبت النتيجة لصالح منافسك."}
            </p>
          </div>

          {opponentForfeited && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-purple-50/80 border border-purple-200 rounded-2xl flex items-center justify-center gap-4 text-xs font-bold shadow-xs"
            >
              <div className="flex items-center gap-1.5 text-purple-900 font-sans">
                <SvgStarIcon size={16} className="text-amber-500" />
                <span>+150 XP</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5 text-purple-900 font-sans">
                <SvgSparklesIcon size={16} className="text-[#7C3AED]" />
                <span>+50 كوينز</span>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onReturnHome}
              className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <SvgHomeIcon size={16} />
              <span>الرئيسية</span>
            </button>
            <button
              onClick={onRematchVote}
              className="flex-1 py-3 rounded-2xl bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-black shadow-lg shadow-purple-200 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <SvgRepeatIcon size={16} />
              <span>إعادة اللعب فوراً</span>
            </button>
          </div>

        </div>
      </div>
    );
  }

  // 2. Premium 2.7-Second Match Finish Cinematic Verification Sequence
  if (isVerifying) {
    return (
      <div className="game-card-outer w-full dir-rtl select-none my-auto" style={{ direction: "rtl" }}>
        <div className="game-card-inner p-8 sm:p-10 bg-white/95 border border-black/5 rounded-[32px] shadow-2xl text-slate-800 space-y-7 max-w-lg mx-auto text-center relative overflow-hidden my-auto">
          
          {/* Ambient Glow */}
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

          {/* Animated Verification Spinner Badge */}
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

          {/* Verification Status Title & Subtitle */}
          <div className="space-y-2">
            <span className="px-3.5 py-1 rounded-full bg-purple-100 border border-purple-200 text-[#7C3AED] text-[10px] font-black uppercase tracking-wider">
              انتهت المباراة
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
                  جارٍ التحقق من الإجابات...
                </motion.h2>
              ) : (
                <motion.h2
                  key="calculating"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="text-xl sm:text-2xl font-black text-slate-900"
                >
                  يتم احتساب النتائج والمكافآت...
                </motion.h2>
              )}
            </AnimatePresence>

            <p className="text-xs text-slate-400 font-bold">تأكد من إجابات اللاعبين وحفظ الحصيلة النهائية</p>
          </div>

          {/* Animated 100% Filled Progress Bars */}
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

  // 3. Normal Reveal & Final Summary
  return (
    <div className="game-card-outer w-full dir-rtl select-none my-auto" style={{ direction: "rtl" }}>
      <div className="game-card-inner p-6 sm:p-8 bg-white/95 border border-black/5 rounded-[28px] shadow-xl text-slate-800 space-y-6">
        
        {/* Step-by-Step Manual Reveal Sequence */}
        {!showFinalSummary ? (
          <div className="space-y-6 text-center animate-fade-in">
            <div className="flex flex-col items-center gap-1.5">
              <div className="px-3.5 py-1 rounded-full bg-purple-100 border border-purple-200 text-[#7C3AED] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <SvgSparklesIcon size={14} />
                <span>كشف إجابات الفئات خطوة بخطوة</span>
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
                    
                    {/* My Answer */}
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

                    {/* Opponent Answer */}
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
            
            <div className="flex flex-col items-center gap-2">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-18 h-18 rounded-full bg-[#FFE600] border-2 border-black/10 flex items-center justify-center text-slate-900 shadow-lg"
              >
                <SvgTrophyIcon size={36} />
              </motion.div>

              <h1 className="h-display text-2xl sm:text-3xl font-black text-slate-900">
                {isWinner ? "انتصار ساحق ومبارك" : isTie ? "تعادل حماسي ومميز" : "خسارة بشرف وأداء رائع"}
              </h1>
              <p className="text-xs text-slate-400 font-bold">الجدول الموحد النهائي لحصيلة مباراة اسم حيوان نبات</p>
            </div>

            {/* Scores Comparison Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
              <div className={`p-5 rounded-2xl border text-center space-y-3 ${
                isWinner ? "bg-purple-50/90 border-purple-300 ring-2 ring-purple-300 shadow-sm" : "bg-slate-50 border-slate-200"
              }`}>
                <div className="text-xs text-slate-500 font-bold">{p1.displayName} (أنت)</div>
                <div className="text-3xl font-black text-[#7C3AED] font-sans">{myScore.totalPoints} <span className="text-xs text-slate-400 font-normal">نقطة</span></div>
                
                <div className="bg-white border border-purple-200 rounded-xl p-2 text-xs font-bold text-purple-900 flex items-center justify-center gap-2 font-sans">
                  <SvgStarIcon size={14} className="text-amber-500" />
                  <span>+{myScore.xpEarned} XP</span>
                  <span>•</span>
                  <span>+{myScore.coinsEarned} كوينز</span>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border text-center space-y-3 ${
                !isWinner && !isTie ? "bg-purple-50/90 border-purple-300 ring-2 ring-purple-300 shadow-sm" : "bg-slate-50 border-slate-200"
              }`}>
                <div className="text-xs text-slate-500 font-bold">{p2.displayName}</div>
                <div className="text-3xl font-black text-[#7C3AED] font-sans">{opponentScore.totalPoints} <span className="text-xs text-slate-400 font-normal">نقطة</span></div>

                <div className="bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700 flex items-center justify-center gap-2 font-sans">
                  <SvgStarIcon size={14} className="text-amber-500" />
                  <span>+{opponentScore.xpEarned} XP</span>
                  <span>•</span>
                  <span>+{opponentScore.coinsEarned} كوينز</span>
                </div>
              </div>
            </div>

            {/* Comprehensive Summary Table */}
            <div className="space-y-3 max-w-2xl mx-auto">
              <h3 className="text-xs font-black uppercase text-purple-700 tracking-wider text-right flex items-center gap-1.5">
                <SvgSparklesIcon size={16} />
                <span>جدول الإجابات والنقاط الإجمالي:</span>
              </h3>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dir-rtl">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-purple-50/80 border-b border-purple-100 text-purple-900 font-black">
                      <th className="p-3">الفئة</th>
                      <th className="p-3">الحرف</th>
                      <th className="p-3">إجابتي</th>
                      <th className="p-3">إجابة الخصم</th>
                      <th className="p-3 text-center">نقاطك</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                    {activeCategories.map((cat) => {
                      const letter = match.letterAssignment[cat.id] || "أ";
                      const r1 = evaluated.results[myUid]?.[cat.id] || { word: "لم يجب", points: 0 };
                      const r2 = evaluated.results[opponentUid]?.[cat.id] || { word: "لم يجب", points: 0 };
                      const IconComponent = CATEGORY_SVG_MAP[cat.icon] || SvgSparklesIcon;

                      const isR1Unanswered = !r1.word || r1.word === "لم يجب" || r1.word === "لم أعرف";
                      const isR2Unanswered = !r2.word || r2.word === "لم يجب" || r2.word === "لم أعرف";

                      return (
                        <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 flex items-center gap-2 font-black">
                            <IconComponent size={16} className={cat.color} />
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
            <div className="flex items-center justify-center gap-3 pt-3 max-w-xl mx-auto">
              <button
                onClick={onReturnHome}
                className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <SvgHomeIcon size={16} />
                <span>العودة لغرفة المبارايات</span>
              </button>
              <button
                onClick={onRematchVote}
                className="flex-1 py-3 rounded-2xl bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-black shadow-lg shadow-purple-200 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <SvgRepeatIcon size={16} />
                <span>العودة للصالة وإعادة اللعب</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
