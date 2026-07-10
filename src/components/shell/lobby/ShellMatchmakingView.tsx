"use client";

import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShellIcon } from "@/components/shell/ShellIcons";
import { ShellLobbyPlayerAvatar } from "@/components/shell/lobby/ShellLobbyParts";
import type { PlayerCosmetic } from "@/lib/profile/cosmetics";
import { EASE_OUT, SPRING_DRAMATIC } from "@/lib/motion";
import { levelFromXp } from "@/lib/profile/level";

export type ShellMatchStage = "idle" | "searching" | "found" | "connecting";

function formatElapsed(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function PulseDot({ color }: { color: string }) {
  return (
    <motion.span
      aria-hidden
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: color,
        flexShrink: 0,
      }}
      animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

/* ── Vector Illustrations instead of Emojis ── */

const VectorStar = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

const VectorSpeechBubble = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const VectorMysteryCard = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} width="24" height="32" viewBox="0 0 24 32" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="28" rx="4" />
    <path d="M12 10v4" />
    <circle cx="12" cy="18" r="1" fill="currentColor" />
  </svg>
);

export function ShellMatchmakingView({
  stage,
  elapsedSec,
  chipLabel,
  myName,
  myCosmetic,
  myPhotoURL,
  myXp,
  myWins,
  opponentName,
  opponentCosmetic,
  opponentPhotoURL,
  opponentXp,
  opponentWins,
  statusTitle,
  statusSubtitle,
  searching,
  onClose,
  footer,
  error,
}: {
  stage: ShellMatchStage;
  elapsedSec: number;
  chipLabel: string;
  myName: string;
  myCosmetic?: PlayerCosmetic;
  myPhotoURL?: string | null;
  myXp?: number;
  myWins?: number;
  opponentName: string;
  opponentCosmetic?: PlayerCosmetic;
  opponentPhotoURL?: string | null;
  opponentXp?: number;
  opponentWins?: number;
  statusTitle: string;
  statusSubtitle: string;
  searching: boolean;
  onClose: () => void;
  footer: ReactNode;
  error?: string | null;
}) {
  const opponentHidden = stage === "idle" || stage === "searching";
  const isFound = stage === "found" || stage === "connecting";

  return (
    <div className="shell-screen relative memphis-grid" style={{ background: "transparent", overflow: "hidden" }}>
      {/* Premium vector floaters instead of emojis */}
      <VectorStar className="absolute text-purple-500/5 memphis-float" style={{ top: "15%", left: "8%" }} />
      <VectorSpeechBubble className="absolute text-purple-500/5 memphis-float-delayed" style={{ top: "45%", right: "8%" }} />
      <VectorMysteryCard className="absolute text-purple-500/5 memphis-float" style={{ bottom: "25%", left: "14%" }} />

      {/* Topbar navigation */}
      <div className="topbar px-4 pt-5 z-20">
        <button
          type="button"
          className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center active:scale-95 transition-transform"
          onClick={onClose}
          aria-label="إغلاق"
          style={{ cursor: "pointer" }}
        >
          <ShellIcon name="close" size={16} color="#64748B" />
        </button>
        <AnimatePresence mode="wait">
          <motion.span
            key={chipLabel}
            initial={{ opacity: 0, y: -4, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.92 }}
            transition={{ duration: 0.28, ease: EASE_OUT }}
            className={`px-3 py-1 rounded-full text-xs font-black select-none ${
              isFound ? "bg-emerald-500 text-white" : "bg-purple-50 text-[#7C3AED] border border-purple-100"
            }`}
          >
            {isFound && <PulseDot color="#FFFFFF" />}
            {chipLabel}
          </motion.span>
        </AnimatePresence>
        <div style={{ width: 32 }} />
      </div>

      <div className="f-1 col center justify-center px-6 gap-6 relative">
        
        {/* Duel Match Arena Hero */}
        <div className="flex flex-col items-center gap-6 w-full mt-4">
          
          {/* Main VS Row */}
          <div className="flex items-center justify-between w-full relative">
            
            {/* Player 1 Card (Me) */}
            <div className="game-card-outer w-[130px] flex-shrink-0">
              <div className="game-card-inner p-4 bg-white border border-slate-100 rounded-[22px] flex flex-col items-center gap-2.5 text-center">
                <div className="relative">
                  <ShellLobbyPlayerAvatar
                    displayName={myName}
                    cosmetic={myCosmetic}
                    photoURL={myPhotoURL}
                    size="lg"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border border-white animate-pulse" />
                </div>
                <div style={{ lineHeight: 1.15 }}>
                  <span className="text-xs font-black text-slate-800 block truncate max-w-[90px]">{myName}</span>
                  <span className="text-[9px] text-[#7C3AED] font-black bg-purple-50 px-1.5 py-0.5 rounded-full mt-1.5 inline-block select-none">
                    مستوى {levelFromXp(myXp ?? 0)}
                  </span>
                  {typeof myWins === "number" && (
                    <span className="text-[8px] text-slate-400 font-bold block mt-1">
                      {myWins} انتصارات
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Central Animated Duel connector */}
            <div className="flex-1 flex flex-col items-center justify-center relative h-20 min-w-[50px]">
              {/* Pulsing connection line */}
              <div className="w-full h-1 bg-gradient-to-r from-purple-200 via-[#FFE600] to-purple-200 rounded-full relative overflow-hidden">
                <motion.div
                  animate={{ left: ["-100%", "100%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-white to-transparent"
                />
              </div>

              {/* Central floating VS Badge */}
              <motion.div
                key={isFound ? "found" : "searching"}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={isFound ? SPRING_DRAMATIC : { duration: 0.28, ease: EASE_OUT }}
                className="absolute z-10"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shadow-md select-none border border-black/5"
                  style={{
                    background: isFound
                      ? "linear-gradient(135deg, #10B981 0%, #059669 100%)"
                      : "linear-gradient(135deg, #FFE600 0%, #EAB308 100%)",
                    color: isFound ? "#FFFFFF" : "#5e3011",
                    boxShadow: isFound ? "0 4px 12px rgba(16, 185, 129, 0.4)" : "0 4px 12px rgba(254, 240, 138, 0.4)",
                  }}
                >
                  VS
                </div>
              </motion.div>
            </div>

            {/* Player 2 Card (Opponent / Searching state) */}
            <div className="game-card-outer w-[130px] flex-shrink-0">
              <AnimatePresence mode="wait">
                {opponentHidden ? (
                  <motion.div
                    key="searching"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="game-card-inner p-4 bg-slate-50 border border-dashed border-slate-300 rounded-[22px] flex flex-col items-center justify-center gap-2.5 text-center min-h-[142px]"
                  >
                    {/* Animated searching avatar */}
                    <div className="w-12 h-12 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center relative overflow-hidden select-none animate-pulse">
                      <span className="text-xl font-black text-slate-400">؟</span>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-2 border-purple-500/20 border-t-purple-500 rounded-full"
                      />
                    </div>
                    <div style={{ lineHeight: 1.15 }}>
                      <span className="text-[10px] font-black text-slate-400 block animate-pulse">
                        جاري البحث...
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="found"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="game-card-inner p-4 bg-white border border-slate-100 rounded-[22px] flex flex-col items-center gap-2.5 text-center min-h-[142px]"
                  >
                    <div className="relative">
                      <ShellLobbyPlayerAvatar
                        displayName={opponentName}
                        cosmetic={opponentCosmetic}
                        photoURL={opponentPhotoURL}
                        size="lg"
                      />
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border border-white animate-pulse" />
                    </div>
                    <div style={{ lineHeight: 1.15 }}>
                      <span className="text-xs font-black text-slate-800 block truncate max-w-[90px]">{opponentName}</span>
                      <span className="text-[9px] text-[#7C3AED] font-black bg-purple-50 px-1.5 py-0.5 rounded-full mt-1.5 inline-block select-none">
                        مستوى {levelFromXp(opponentXp ?? 0)}
                      </span>
                      {typeof opponentWins === "number" && (
                        <span className="text-[8px] text-slate-400 font-bold block mt-1">
                          {opponentWins} انتصارات
                        </span>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>

          {/* Connection text */}
          {searching && (
            <motion.div
              className="text-[10px] text-purple-400 font-extrabold select-none"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            >
              البحث في طابور اللعب الجماعي...
            </motion.div>
          )}

        </div>

        {/* Status Card Panel (Bento-style details) */}
        <div className="game-card-outer w-full mt-4">
          <div
            className="game-card-inner p-5 text-right flex flex-col gap-3 rounded-[22px] border border-black/5 bg-white"
          >
            <div className="flex items-center gap-2 border-b border-purple-50 pb-2">
              <div className="flex flex-col" style={{ lineHeight: 1.15 }}>
                <span className={`text-xs font-black ${isFound ? "text-green-700" : "text-slate-800"}`}>
                  {statusTitle}
                </span>
                <span className="text-[9px] text-slate-400 font-bold">
                  {statusSubtitle}
                </span>
              </div>
            </div>

            {/* Real Matchmaking statistics only (no fake online count or wait time estimate) */}
            <div className="flex items-center justify-between w-full mt-1">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">الوقت المنقضي</span>
                <span className="text-xs font-black text-slate-700 block h-mono">
                  {formatElapsed(elapsedSec)}
                </span>
              </div>
            </div>

            {searching && (
              <div className="w-full bg-slate-50 border border-slate-100 rounded-full h-1.5 mt-1 overflow-hidden relative">
                <motion.div
                  animate={{ left: ["-100%", "100%"] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full"
                />
              </div>
            )}
          </div>
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="p-3 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold text-center w-full"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Action Footer button */}
      <div className="p-5 z-20 w-full max-w-[32rem] mx-auto">
        {footer}
      </div>
    </div>
  );
}
