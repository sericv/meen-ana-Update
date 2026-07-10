"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type MatchTransitionPlayer = { name: string };

type Props = {
  player: MatchTransitionPlayer;
  opponent: MatchTransitionPlayer;
  subtitle?: string;
  onDone: () => void;
};

export function MatchTransition({ player, opponent, subtitle = "تبدأ المباراة", onDone }: Props) {
  const [showContent, setShowContent] = useState(false);
  const skippedRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    // Play transition chime sound
    playTransitionCue();

    // Show the components sequentially
    const contentTimer = setTimeout(() => setShowContent(true), 200);

    // Call onDone automatically after 2.6 seconds
    const doneTimer = setTimeout(() => {
      if (!skippedRef.current) {
        onDoneRef.current();
      }
    }, 2600);

    return () => {
      clearTimeout(contentTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  const skip = () => {
    if (skippedRef.current) return;
    skippedRef.current = true;
    onDoneRef.current();
  };

  return (
    <div
      onClick={skip}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#FAFAF8] memphis-grid overflow-hidden cursor-pointer select-none"
      dir="rtl"
    >
      {/* Background floaters with low opacity */}
      <div className="absolute inset-0 pointer-events-none select-none z-0">
        <div className="bg-shape text-3xl memphis-float absolute opacity-5" style={{ top: "12%", left: "10%" }}>🕵️‍♂️</div>
        <div className="bg-shape text-3xl memphis-float-delayed absolute opacity-5" style={{ top: "45%", right: "8%" }}>✨</div>
        <div className="bg-shape text-2xl memphis-float absolute opacity-5" style={{ top: "75%", left: "15%" }}>💬</div>
        <div className="bg-shape text-3xl memphis-float absolute opacity-5" style={{ top: "15%", right: "20%" }}>⭐</div>
      </div>

      <AnimatePresence>
        {showContent && (
          <div className="flex flex-col items-center justify-center gap-6 relative z-10 w-full max-w-sm px-6">
            
            {/* Versus header */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="flex items-center justify-center gap-4 w-full"
            >
              <span className="text-sm font-black text-slate-700 truncate max-w-[100px]">{player.name || "أنت"}</span>
              <div className="w-8 h-8 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 text-[10px] font-black shadow-sm">VS</div>
              <span className="text-sm font-black text-slate-700 truncate max-w-[100px]">{opponent.name || "الخصم"}</span>
            </motion.div>

            {/* Collectible Mystery Card */}
            <motion.div
              initial={{ scale: 0.6, y: 30, rotate: -8 }}
              animate={{ 
                scale: 1, 
                y: [0, -6, 0], 
                rotate: 0 
              }}
              transition={{
                scale: { type: "spring", stiffness: 350, damping: 25 },
                y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 0.4 }
              }}
              className="game-card-outer w-48 h-68 shadow-2xl relative"
            >
              {/* Outer decorative card highlights */}
              <div className="absolute inset-0 rounded-[28px] border-2 border-purple-400/20 animate-pulse z-0" />
              
              <div className="game-card-inner h-full p-4 bg-white border border-slate-100 rounded-[22px] flex flex-col justify-between items-center relative z-10">
                <span className="text-[8px] font-black text-[#7C3AED] bg-purple-50 px-2 py-0.5 rounded-full">
                  بطاقة سرية
                </span>

                {/* Mystery center question mark */}
                <div className="relative w-20 h-20 rounded-full bg-purple-50/50 border border-purple-100/50 flex items-center justify-center">
                  <motion.span 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="text-4xl font-black text-[#7C3AED]"
                  >
                    ؟
                  </motion.span>
                </div>

                <div style={{ lineHeight: 1.15 }}>
                  <h4 className="text-[10px] font-black text-slate-800">الخصم ينتظرك</h4>
                  <span className="text-[7.5px] font-bold text-slate-400 block mt-0.5">من وراء هذه البطاقة؟</span>
                </div>
              </div>
            </motion.div>

            {/* Main title and subtitle */}
            <div className="text-center flex flex-col gap-1.5" style={{ lineHeight: 1.25 }}>
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="h-display text-lg font-black text-slate-800"
              >
                الغموض يبدأ الآن
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="text-[10px] font-bold text-slate-400"
              >
                {subtitle}... استعد لبدء الجولة الأولى
              </motion.p>
            </div>

            {/* Animated Loading Dots */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-1.5"
            >
              {[0, 0.15, 0.3].map((delay, i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce"
                  style={{ animationDelay: `${delay}s`, animationDuration: "0.8s" }}
                />
              ))}
            </motion.div>

            {/* Skip Text */}
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: 0.6 }}
              className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-2"
            >
              اضغط على الشاشة للتخطّي
            </motion.span>

          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Web Audio API Transition Sound ── */
let _mtAc: AudioContext | null = null;

function getMtAc(): AudioContext | null {
  if (_mtAc) return _mtAc;
  const AC = typeof window !== "undefined" ? (window.AudioContext ?? (window as any).webkitAudioContext) : undefined;
  if (!AC) return null;
  _mtAc = new AC();
  return _mtAc;
}

function mtTone(ctx: AudioContext, freq: number, when: number, dur: number, gain: number, type: OscillatorType = "sine") {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, when);
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(gain, when + dur * 0.2);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  o.connect(g);
  g.connect(ctx.destination);
  o.start(when);
  o.stop(when + dur + 0.05);
}

function playTransitionCue() {
  try {
    const ctx = getMtAc();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();
    const t = ctx.currentTime;
    
    // Whoosh / sweep tone chord
    mtTone(ctx, 196.00, t, 1.2, 0.04, "sine");
    mtTone(ctx, 293.66, t + 0.1, 1.0, 0.04, "sine");
    mtTone(ctx, 440.00, t + 0.2, 0.8, 0.03, "triangle");
  } catch {
    // Fail silently
  }
}
