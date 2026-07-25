"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { usePlayerProfileModal } from "@/components/providers/PlayerProfileModalProvider";
import { PlayerTimerRing } from "@/components/game/play/PlayerTimerRing";
import { GameplayHeroCard } from "@/components/game/play/GameplayHeroCard";
import { GameplayMyHiddenCard } from "@/components/game/play/GameplayMyHiddenCard";
import { SPRING_UI } from "@/lib/motion";
import type { PlayerCosmetic } from "@/lib/profile/cosmetics";
import type { GameCard } from "@/types";

export type GameplayVoiceLayoutProps = {
  myUid?: string | null;
  opponentUid?: string | null;
  myName: string;
  opponentName: string;
  myCosmetic?: PlayerCosmetic | null;
  opponentCosmetic?: PlayerCosmetic | null;
  myPhotoURL?: string | null;
  myTurn: boolean;
  secLeft: number | null;
  opponentCard: GameCard | null;
  categoryLabel: string | null;
  letters: string[];
  revealedIdx: number[];
  hintsLeft: number;
  bonusLetterHints?: number;
  bonusCountHints?: number;
  hintUsed?: boolean;
  busy: boolean;
  passing: boolean;
  onPassTurn: () => void;
  onGuess: () => void;
  onMyCardPress: () => void;
  tacticalButton?: ReactNode;
  myGuessRemaining: number;
  opponentGuessRemaining: number;
  roomId?: string | null;
  matchId?: string | null;
};

export function GameplayVoiceLayout({
  myUid,
  opponentUid,
  myName,
  opponentName,
  myCosmetic,
  opponentCosmetic,
  myPhotoURL,
  myTurn,
  secLeft,
  opponentCard,
  categoryLabel,
  letters,
  revealedIdx,
  hintsLeft,
  bonusLetterHints = 0,
  bonusCountHints = 0,
  hintUsed = false,
  passing,
  onPassTurn,
  onGuess,
  onMyCardPress,
  tacticalButton = null,
  myGuessRemaining,
  opponentGuessRemaining,
  roomId,
  matchId,
}: GameplayVoiceLayoutProps) {
  const { openProfile } = usePlayerProfileModal();
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-0 flex-1 flex-col items-center justify-between w-full h-full max-w-md mx-auto p-4 gap-4"
      dir="rtl"
    >
      
      {/* ── Section 1: Header Dashboard Status ── */}
      <div className="game-card-outer w-full flex-shrink-0" style={{ padding: "4px", borderRadius: 20 }}>
        <div 
          className="game-card-inner p-3 bg-white flex items-center justify-between shadow-sm relative overflow-hidden w-full h-full"
          style={{
            borderRadius: 16,
            border: "1.5px solid rgba(124, 58, 237, 0.08)",
          }}
        >
          
          {/* Active voice room badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-100 text-[#7C3AED]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
            <span className="text-[9px] font-black uppercase font-sans">التحدي الصوتي النشط</span>
          </div>

          {/* Guesses tracking */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[7.5px] font-black text-slate-400 font-sans">تخميناتك</span>
              <div className="flex gap-1 mt-0.5">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <span
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full ${
                      idx < myGuessRemaining ? "bg-[#7C3AED]" : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="w-[1px] h-6 bg-slate-100" />

            <div className="flex flex-col items-start">
              <span className="text-[7.5px] font-black text-slate-400 font-sans">الخصم</span>
              <div className="flex gap-1 mt-0.5">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <span
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full ${
                      idx < opponentGuessRemaining ? "bg-rose-500" : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Section 2: Balanced Players Duel Arena ── */}
      <div className="flex gap-3 w-full flex-shrink-0">
        
        {/* Local player card */}
        <motion.button
          type="button"
          className="game-card-outer flex-1 select-none"
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
          transition={SPRING_UI}
          onClick={myUid ? () => openProfile(myUid, { roomId, matchId, screen: "gameplay" }) : undefined}
          style={{ cursor: "pointer", padding: "4px", borderRadius: 20, display: "flex", flexDirection: "column" }}
        >
          <div 
            className="game-card-inner p-3 flex flex-col items-center justify-center gap-2 text-center w-full h-full"
            style={{
              borderRadius: 16,
              border: myTurn ? "1.5px solid rgba(124, 58, 237, 0.25)" : "1.5px solid rgba(124, 58, 237, 0.08)",
              background: myTurn ? "linear-gradient(135deg, #FAF8FF 0%, #F5ECFF 100%)" : "#FFFFFF",
              boxShadow: myTurn ? "0 4px 12px rgba(124, 58, 237, 0.08)" : "none",
            }}
          >
            
            <div className="relative">
              <PlayerTimerRing active={myTurn} secLeft={secLeft} maxSec={30} size="lg">
                <ProfileAvatar
                  cosmetic={myCosmetic}
                  fallbackPhotoURL={myPhotoURL}
                  displayName={myName}
                  size="lg"
                  active={false}
                />
              </PlayerTimerRing>
              {myTurn && (
                <div className="absolute -bottom-1 -left-1 w-5.5 h-5.5 rounded-full bg-purple-500 text-white flex items-center justify-center border border-white shadow">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  </svg>
                </div>
              )}
            </div>

            <div style={{ lineHeight: 1.15 }}>
              <span className="text-[10px] font-black text-slate-800 block truncate max-w-[90px] font-sans">{myName}</span>
              <span className={`text-[7.5px] font-black block mt-0.5 flex items-center justify-center gap-1 font-sans ${myTurn ? "text-purple-600" : "text-slate-400"}`}>
                {myTurn ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                  </svg>
                ) : (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
                {myTurn ? "يتحدث الآن" : "يستمع"}
              </span>
            </div>

          </div>
        </motion.button>

        {/* Opponent player card */}
        <motion.button
          type="button"
          className="game-card-outer flex-1 select-none"
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
          transition={SPRING_UI}
          onClick={opponentUid ? () => openProfile(opponentUid, { roomId, matchId, screen: "gameplay" }) : undefined}
          style={{ cursor: "pointer", padding: "4px", borderRadius: 20, display: "flex", flexDirection: "column" }}
        >
          <div 
            className="game-card-inner p-3 flex flex-col items-center justify-center gap-2 text-center w-full h-full"
            style={{
              borderRadius: 16,
              border: !myTurn ? "1.5px solid rgba(244, 63, 94, 0.25)" : "1.5px solid rgba(124, 58, 237, 0.08)",
              background: !myTurn ? "linear-gradient(135deg, #FFF5F5 0%, #FFEBEB 100%)" : "#FFFFFF",
              boxShadow: !myTurn ? "0 4px 12px rgba(244, 63, 94, 0.08)" : "none",
            }}
          >
            
            <div className="relative">
              <PlayerTimerRing active={!myTurn} secLeft={secLeft} maxSec={30} size="lg">
                <ProfileAvatar
                  cosmetic={opponentCosmetic}
                  displayName={opponentName}
                  size="lg"
                  active={false}
                />
              </PlayerTimerRing>
              {!myTurn && (
                <div className="absolute -bottom-1 -right-1 w-5.5 h-5.5 rounded-full bg-rose-500 text-white flex items-center justify-center border border-white shadow">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  </svg>
                </div>
              )}
            </div>

            <div style={{ lineHeight: 1.15 }}>
              <span className="text-[10px] font-black text-slate-800 block truncate max-w-[90px] font-sans">{opponentName}</span>
              <span className={`text-[7.5px] font-black block mt-0.5 flex items-center justify-center gap-1 font-sans ${!myTurn ? "text-rose-600" : "text-slate-400"}`}>
                {!myTurn ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                  </svg>
                ) : (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
                {!myTurn ? "يتحدث الآن" : "يستمع"}
              </span>
            </div>

          </div>
        </motion.button>

      </div>

      {/* ── Section 3: Premium Mystery Card & Active Speaker Waveform ── */}
      <div className="relative flex-1 w-full flex flex-col items-center justify-center gap-3">
        
        {/* Dynamic Voice Waves surrounding the card */}
        <div className="absolute inset-0 flex justify-center items-center gap-1.5 pointer-events-none opacity-45">
          {Array.from({ length: 11 }).map((_, idx) => {
            const delay = idx * 0.08;
            const animateState = myTurn ? [12, 48, 12] : !myTurn ? [12, 38, 12] : [12, 12];
            return (
              <motion.span
                key={idx}
                animate={{ height: animateState }}
                transition={{ duration: 1.4, repeat: Infinity, delay, ease: "easeInOut" }}
                className={`w-1 rounded-full ${myTurn ? "bg-purple-500" : !myTurn ? "bg-rose-400" : "bg-slate-200"}`}
                style={{ height: 12 }}
              />
            );
          })}
        </div>

        {/* Collectible Hero Card */}
        <div className="relative z-10 scale-95">
          <GameplayHeroCard
            opponentCard={opponentCard}
            categoryLabel={categoryLabel}
            size="voice"
          />
        </div>

      </div>

      {/* ── Section 4: Collectible Deck (My Card & Tactical Button) ── */}
      <div className="flex items-center justify-center gap-4 w-full flex-shrink-0">
        
        {/* My Hidden Card hint button */}
        <div className="scale-95">
          <GameplayMyHiddenCard
            hintsLeft={hintsLeft}
            bonusLetterHints={bonusLetterHints}
            bonusCountHints={bonusCountHints}
            hintUsed={hintUsed}
            revealedIdx={revealedIdx}
            letters={letters}
            size="voice"
            onPress={onMyCardPress}
          />
        </div>

        {/* Tactical items Button */}
        {tacticalButton && (
          <div className="scale-95">
            {tacticalButton}
          </div>
        )}

      </div>

      {/* ── Section 5: Bottom Action CTAs ── */}
      <div className="w-full flex-shrink-0 flex items-center justify-center gap-3 border-t border-slate-100/50 pt-4">
        {myTurn ? (
          <>
            <motion.button
              type="button"
              disabled={passing}
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.015 }}
              transition={SPRING_UI}
              onClick={onPassTurn}
              className="flex-1 flex items-center justify-between p-1 bg-purple-50 hover:bg-purple-100/50 rounded-full border border-purple-200/60 shadow-sm group"
              style={{ cursor: "pointer" }}
            >
              <span className="text-[#7C3AED] text-[13px] font-black pr-4 leading-none font-sans">
                انتهيت — مرّر الدور
              </span>
              <div className="w-10 h-10 rounded-full bg-[#7C3AED] flex items-center justify-center shadow-md active:scale-95 transition-transform text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="transform rotate-180">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </div>
            </motion.button>
            
            <motion.button
              type="button"
              whileTap={{ scale: 0.93 }}
              whileHover={{ scale: 1.05 }}
              transition={SPRING_UI}
              onClick={onGuess}
              className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200/60 text-rose-600 flex items-center justify-center shadow-sm flex-shrink-0"
              style={{ cursor: "pointer" }}
              aria-label="تخمين"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </motion.button>
          </>
        ) : (
          <>
            <div className="flex-1 py-3.5 px-6 rounded-full bg-slate-50 border border-slate-200/50 flex items-center justify-center gap-2 select-none">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 animate-spin">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span className="text-[11px] font-black text-slate-400 font-sans">بانتظار دور الخصم...</span>
            </div>
            
            <motion.button
              type="button"
              whileTap={{ scale: 0.93 }}
              whileHover={{ scale: 1.05 }}
              transition={SPRING_UI}
              onClick={onGuess}
              className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200/60 text-rose-600 flex items-center justify-center shadow-sm flex-shrink-0"
              style={{ cursor: "pointer" }}
              aria-label="تخمين"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </motion.button>
          </>
        )}
      </div>

    </motion.div>
  );
}
