"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { WordRaceRoom, WordRaceMatch } from "@/types/word-race";
import { ARABIC_ALPHABET } from "@/lib/game/word-race-data";
import { SvgSparklesIcon, SvgLightningIcon } from "@/lib/game/word-race-svgs";
import { playReelTick, playReelLanding } from "@/lib/audio/game-sounds";

interface WordRaceIntroProps {
  room: WordRaceRoom;
  match: WordRaceMatch;
  onFinishIntro: () => void;
}

// Multi-phase interval progression (in milliseconds per step)
// Phase 1 — Fast Spin (~0-0.55s): [50, 50, 55, 60, 65, 70, 75, 85, 95]
// Phase 2 — Early Slowdown (~0.55-1.07s): [110, 130, 150, 180]
// Phase 3 — Visible Deceleration (~1.07-1.92s): [220, 280, 350]
// Phase 4 — Final Crawl (~1.92-3.02s): [480, 620]
const STEP_INTERVALS = [
  50, 50, 55, 60, 65, 70, 75, 85, 95,
  110, 130, 150, 180,
  220, 280, 350,
  480, 620,
];

export const WordRaceIntro: React.FC<WordRaceIntroProps> = ({
  room,
  match,
  onFinishIntro,
}) => {
  // Single source of truth for the round's target letter
  const firstCatId = room.settings.categories[0] || "name";
  const targetLetter = match.letterAssignment[firstCatId] || Object.values(match.letterAssignment)[0] || "أ";

  // Current step index in the reel (0 -> STEP_INTERVALS.length = 18)
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [reelPhase, setReelPhase] = useState<"spinning" | "landed">("spinning");

  // Create cosmetic letter sequence ending strictly with targetLetter
  const reelSequence = useMemo(() => {
    const cosmetics: string[] = [];
    const pool = ARABIC_ALPHABET.filter((l) => l !== targetLetter);
    for (let i = 0; i < STEP_INTERVALS.length; i++) {
      const randLetter = pool[Math.floor(Math.random() * pool.length)];
      cosmetics.push(randLetter);
    }
    cosmetics.push(targetLetter);
    return cosmetics;
  }, [targetLetter]);

  // Step-by-step deceleration sequence with synced tick audio
  useEffect(() => {
    let timerId: NodeJS.Timeout;

    const runStep = (step: number) => {
      if (step < STEP_INTERVALS.length) {
        setCurrentStepIndex(step);
        // Play mechanical tick synced to letter switch
        playReelTick(step / STEP_INTERVALS.length);

        const delay = STEP_INTERVALS[step];
        timerId = setTimeout(() => {
          runStep(step + 1);
        }, delay);
      } else {
        // Final landing step (target letter locked in)
        setCurrentStepIndex(STEP_INTERVALS.length);
        setReelPhase("landed");
        playReelLanding();

        // Exact 4.0-second static hold before starting gameplay
        timerId = setTimeout(() => {
          onFinishIntro();
        }, 4000);
      }
    };

    // Start step sequence
    runStep(0);

    return () => {
      clearTimeout(timerId);
    };
  }, [onFinishIntro]);

  const p1 = room.players[0] || { displayName: "لاعب 1" };
  const p2 = room.players[1] || { displayName: "لاعب 2" };

  // Calculate y offset: Item height = 80px (h-20).
  const itemHeight = 80;
  const currentYOffset = -(currentStepIndex * itemHeight);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-2xl text-slate-800 p-6 dir-rtl overflow-hidden select-none" style={{ direction: "rtl" }}>
      
      {/* Ambient Background Radial Glow */}
      <div 
        className="absolute pointer-events-none rounded-full" 
        style={{
          width: 340,
          height: 340,
          background: reelPhase === "landed"
            ? "radial-gradient(circle, rgba(124, 58, 237, 0.22) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          filter: "blur(40px)",
          transition: "background 0.5s ease",
        }}
      />

      {/* Subtle Floating Sparkles */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-1/4 left-1/4 animate-pulse"><SvgSparklesIcon size={18} className="text-purple-400" /></div>
        <div className="absolute top-1/3 right-1/4 animate-pulse"><SvgSparklesIcon size={14} className="text-amber-400" /></div>
        <div className="absolute bottom-1/4 left-1/3 animate-pulse"><SvgSparklesIcon size={16} className="text-purple-500" /></div>
      </div>

      {/* Main Container Wrapper */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center my-auto w-full max-w-md space-y-6">
        
        {/* Top Header Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-1.5 rounded-full bg-purple-100/90 border border-purple-200 text-[#7C3AED] text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-2xs"
        >
          <SvgLightningIcon size={14} />
          <span>اسم حيوان نبات • دولاب اختيار الحروف</span>
        </motion.div>

        {/* Players vs Matchup Header Pill */}
        <div className="flex items-center gap-3 bg-white/90 border border-purple-200/80 rounded-2xl px-5 py-2 shadow-xs">
          <span className="font-black text-xs text-slate-800">{p1.displayName}</span>
          <span className="w-6 h-6 rounded-full bg-[#FFE600] border border-black/10 flex items-center justify-center text-[10px] font-black text-slate-950">VS</span>
          <span className="font-black text-xs text-slate-800">{p2.displayName}</span>
        </div>

        {/* SLOT MACHINE CARD CONTAINER (SINGLE SOURCE OF TRUTH FOR THE LETTER) */}
        <div className="game-card-outer w-72 sm:w-80 shadow-2xl">
          <div className="game-card-inner p-4 bg-white/95 border border-purple-200/80 rounded-[30px] flex flex-col items-center justify-center relative overflow-hidden h-48 sm:h-56">
            
            {/* Top & Bottom Gradient Overlay Masks */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-white via-white/80 to-transparent z-20" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white via-white/80 to-transparent z-20" />

            {/* Target Slot Center Guidelines */}
            <div className="pointer-events-none absolute inset-x-4 h-20 top-1/2 -translate-y-1/2 border-y-2 border-purple-300/60 bg-purple-50/40 rounded-2xl z-10" />

            {/* VERTICAL SCROLLING REEL WINDOW */}
            <div className="h-20 overflow-hidden relative z-0 w-full flex items-center justify-center">
              <motion.div
                animate={{ y: currentYOffset }}
                transition={{ duration: 0.12, ease: "easeOut" }}
                className="absolute top-0 inset-x-0 w-full flex flex-col items-center justify-start"
              >
                {reelSequence.map((letter, idx) => {
                  const isFinalTarget = idx === STEP_INTERVALS.length;
                  const isCurrent = idx === currentStepIndex;

                  return (
                    <div
                      key={idx}
                      className="h-20 flex items-center justify-center shrink-0 w-full"
                    >
                      {isFinalTarget && reelPhase === "landed" ? (
                        <motion.div
                          initial={{ scale: 1 }}
                          animate={{ scale: [1, 1.25, 0.98, 1] }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                          className="w-16 h-16 rounded-2xl bg-[#7C3AED] text-white flex items-center justify-center shadow-lg ring-8 ring-purple-500/30"
                        >
                          <span className="text-4xl sm:text-5xl font-black font-sans leading-none">
                            {letter}
                          </span>
                        </motion.div>
                      ) : (
                        <span
                          className={`text-4xl sm:text-5xl font-black font-sans leading-none transition-all ${
                            isCurrent ? "text-[#7C3AED]" : "text-slate-300"
                          }`}
                        >
                          {letter}
                        </span>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            </div>

          </div>
        </div>

        {/* Dynamic Motivational Status Label */}
        <div className="h-10 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {reelPhase === "landed" ? (
              <motion.div
                key="landed"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-0.5"
              >
                <div className="text-sm font-black text-slate-900">
                  استعد للسباق والتحدي! 🚀
                </div>
                <p className="text-[11px] text-purple-700 font-extrabold">العداد سينطلق الآن مباشرةً</p>
              </motion.div>
            ) : (
              <motion.div
                key="spinning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs font-black text-slate-500 flex items-center gap-1.5"
              >
                <span className="animate-spin text-[#7C3AED]">🌀</span>
                <span>جاري سحب واختيار حرف الجولة...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};
