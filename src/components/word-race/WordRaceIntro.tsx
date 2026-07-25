"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { WordRaceRoom, WordRaceMatch } from "@/types/word-race";
import { SvgSparklesIcon, SvgLightningIcon } from "@/lib/game/word-race-svgs";

interface WordRaceIntroProps {
  room: WordRaceRoom;
  match: WordRaceMatch;
  onFinishIntro: () => void;
}

const ELEGANT_ARABIC_LETTERS = [
  { char: "أ", x: -120, y: -100, rot: -15, delay: 0 },
  { char: "ب", x: 110, y: -90, rot: 12, delay: 0.08 },
  { char: "ج", x: -130, y: 70, rot: -10, delay: 0.12 },
  { char: "د", x: 120, y: 90, rot: 14, delay: 0.16 },
  { char: "س", x: -70, y: -130, rot: -20, delay: 0.2 },
  { char: "م", x: 80, y: -120, rot: 8, delay: 0.24 },
  { char: "ن", x: -140, y: -10, rot: -8, delay: 0.28 },
  { char: "هـ", x: 130, y: 10, rot: 18, delay: 0.32 },
  { char: "و", x: -60, y: 130, rot: -12, delay: 0.36 },
  { char: "ي", x: 70, y: 140, rot: 10, delay: 0.4 },
];

export const WordRaceIntro: React.FC<WordRaceIntroProps> = ({
  room,
  match,
  onFinishIntro,
}) => {
  const [phase, setPhase] = useState<"float" | "align" | "reveal">("float");

  // Determine target letter
  const targetLetter = Object.values(match.letterAssignment)[0] || "أ";

  useEffect(() => {
    // Phase 1 -> Phase 2 (Center Alignment)
    const alignTimer = setTimeout(() => {
      setPhase("align");
    }, 1000);

    // Phase 2 -> Phase 3 (Target Letter Reveal)
    const revealTimer = setTimeout(() => {
      setPhase("reveal");
    }, 1700);

    // Final finish transition into gameplay
    const finishTimer = setTimeout(() => {
      onFinishIntro();
    }, 2700);

    return () => {
      clearTimeout(alignTimer);
      clearTimeout(revealTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinishIntro]);

  const p1 = room.players[0] || { displayName: "لاعب 1" };
  const p2 = room.players[1] || { displayName: "لاعب 2" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-2xl text-slate-800 p-6 dir-rtl overflow-hidden select-none" style={{ direction: "rtl" }}>
      
      {/* Background Ambient Soft Radial Glow */}
      <div 
        className="absolute pointer-events-none rounded-full" 
        style={{
          width: 320,
          height: 320,
          background: "radial-gradient(circle, rgba(124, 58, 237, 0.12) 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          filter: "blur(40px)",
        }}
      />

      {/* Subtle Floating Sparkles */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-1/4 left-1/4 animate-pulse"><SvgSparklesIcon size={18} className="text-purple-400" /></div>
        <div className="absolute top-1/3 right-1/4 animate-pulse"><SvgSparklesIcon size={14} className="text-amber-400" /></div>
        <div className="absolute bottom-1/4 left-1/3 animate-pulse"><SvgSparklesIcon size={16} className="text-purple-500" /></div>
      </div>

      {/* Cinematic Intro Wrapper */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center my-auto w-full max-w-md">
        
        {/* Top Header Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 px-4 py-1.5 rounded-full bg-purple-100/80 border border-purple-200 text-[#7C3AED] text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-2xs"
        >
          <SvgLightningIcon size={14} />
          <span>اسم حيوان نبات • تحدي الحروف</span>
        </motion.div>

        {/* Hero Stage: Ambient Floating & Aligning Arabic Letters */}
        <AnimatePresence>
          {phase !== "reveal" && (
            <div className="relative w-64 h-64 flex items-center justify-center">
              {ELEGANT_ARABIC_LETTERS.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{
                    opacity: 0,
                    x: item.x * 1.3,
                    y: item.y * 1.3,
                    scale: 0.6,
                    rotate: item.rot,
                  }}
                  animate={
                    phase === "align"
                      ? { opacity: 0, x: 0, y: 0, scale: 0.3, rotate: 0 }
                      : { opacity: 0.65, x: item.x, y: item.y, scale: 1, rotate: item.rot }
                  }
                  transition={{
                    duration: phase === "align" ? 0.6 : 0.75,
                    delay: phase === "align" ? 0 : item.delay,
                    ease: "easeInOut",
                  }}
                  className="absolute text-3xl font-sans font-black text-[#7C3AED]/70 drop-shadow-xs"
                >
                  {item.char}
                </motion.div>
              ))}

              {/* VS Players Badge */}
              <motion.div
                animate={{ opacity: phase === "align" ? 0 : 1 }}
                className="flex items-center gap-3.5 bg-white/90 border border-purple-200/80 rounded-2xl px-5 py-2.5 shadow-xs"
              >
                <span className="font-extrabold text-xs text-slate-800">{p1.displayName}</span>
                <span className="w-6.5 h-6.5 rounded-full bg-[#FFE600] border border-black/10 flex items-center justify-center text-[11px] font-black text-slate-950">VS</span>
                <span className="font-extrabold text-xs text-slate-800">{p2.displayName}</span>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Target Letter Reveal Stage */}
        <AnimatePresence>
          {phase === "reveal" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.75, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
              className="flex flex-col items-center gap-5 my-auto"
            >
              {/* Radial Light Aura Ring */}
              <div className="relative">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-[#7C3AED] to-purple-900 p-1 shadow-2xl ring-8 ring-purple-500/20">
                  <div className="w-full h-full rounded-[22px] bg-white flex items-center justify-center shadow-inner">
                    <span className="text-6xl font-black text-[#7C3AED] font-sans leading-none">
                      {targetLetter}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subtitle Label */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="space-y-1"
              >
                <div className="text-lg font-black text-slate-900 flex items-center justify-center gap-2">
                  <span>ابدأ بالحرف</span>
                  <span className="px-3 py-0.5 rounded-lg bg-[#FFE600] text-slate-950 font-sans font-black text-xl shadow-2xs">
                    ({targetLetter})
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-bold">استعد للإجابة!</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
