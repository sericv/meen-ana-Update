"use client";

import { motion } from "framer-motion";
import type { PlayerCosmetic } from "@/lib/profile/cosmetics";

export type TurnNotificationProps = {
  active: boolean;
  isMyTurn: boolean;
  myCosmetic?: PlayerCosmetic | null;
  opponentCosmetic?: PlayerCosmetic | null;
  myName?: string;
  opponentName?: string;
};

export function TurnNotification({
  active,
  isMyTurn,
}: TurnNotificationProps) {
  if (!active) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/15 backdrop-blur-[1.5px] pointer-events-none"
      dir="rtl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 25 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0 
        }}
        exit={{ opacity: 0, scale: 0.9, y: -15 }}
        transition={{ 
          type: "spring", 
          stiffness: 380, 
          damping: 24,
        }}
        className="game-card-outer w-full max-w-[260px] shadow-2xl relative pointer-events-auto"
      >
        {/* Continuous breathing glow loop */}
        <motion.div
          animate={{ scale: [1, 1.015, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="game-card-inner p-5 bg-white/95 rounded-[26px] border border-slate-100 flex flex-col items-center gap-3.5 text-center"
        >
          {/* Micro Animation: Sparkles in corners */}
          <motion.span
            animate={{ rotate: 360, scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className={`absolute top-3.5 right-3.5 text-xs font-black ${isMyTurn ? "text-purple-400/60" : "text-slate-400/50"}`}
          >
            ✦
          </motion.span>
          <motion.span
            animate={{ rotate: -360, scale: [1.2, 0.8, 1.2] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className={`absolute bottom-3.5 left-3.5 text-xs font-black ${isMyTurn ? "text-purple-400/60" : "text-slate-400/50"}`}
          >
            ✦
          </motion.span>

          {/* Vector Icon Area inside a soft badge */}
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
            isMyTurn ? "bg-purple-50 border border-purple-100/50" : "bg-slate-50 border border-slate-200/50"
          }`}>
            {isMyTurn ? (
              /* Target Vector Icon */
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            ) : (
              /* Hourglass / Timer Vector Icon */
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 animate-spin" style={{ animationDuration: "10s" }}>
                <path d="M5 2h14" />
                <path d="M5 22h14" />
                <path d="M19 2v4c0 3.3-2.7 6-6 6s-6-2.7-6-6V2" />
                <path d="M5 22v-4c0-3.3 2.7-6 6-6s6 2.7 6 6v4" />
              </svg>
            )}
          </div>

          {/* Title and Description Row */}
          <div className="flex flex-col items-center gap-1.5 text-center mt-1">
            <h2 className={`h-display text-sm font-black ${isMyTurn ? "text-purple-900" : "text-slate-800"}`}>
              {isMyTurn ? "دورك الآن" : "دور الخصم"}
            </h2>
            
            <p className="text-[10px] text-slate-400 font-bold max-w-[200px] leading-relaxed">
              {isMyTurn 
                ? "ابدأ بطرح سؤالك أو استخدم إحدى الأدوات" 
                : "انتظر حتى ينهي الخصم حركته"}
            </p>
          </div>

        </motion.div>
      </motion.div>
    </motion.div>
  );
}
