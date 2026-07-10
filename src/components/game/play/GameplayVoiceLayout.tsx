"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { usePlayerProfileModal } from "@/components/providers/PlayerProfileModalProvider";
import { PlayerTimerRing } from "@/components/game/play/PlayerTimerRing";
import { GameplayHeroCard } from "@/components/game/play/GameplayHeroCard";
import { GameplayMyHiddenCard } from "@/components/game/play/GameplayMyHiddenCard";
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
      <div className="game-card-outer w-full flex-shrink-0">
        <div className="game-card-inner p-3 bg-white/90 border border-slate-100 rounded-2xl flex items-center justify-between shadow-sm">
          
          {/* Active voice room badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-100 text-[#7C3AED]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
            <span className="text-[9px] font-black uppercase">التحدي الصوتي النشط</span>
          </div>

          {/* Guesses tracking */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[7.5px] font-black text-slate-400">تخميناتك</span>
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
              <span className="text-[7.5px] font-black text-slate-400">الخصم</span>
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
        <div
          className="game-card-outer flex-1 cursor-pointer select-none"
          onClick={myUid ? () => openProfile(myUid, { roomId, matchId, screen: "gameplay" }) : undefined}
        >
          <div className={`game-card-inner p-3 bg-white rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-2 text-center ${
            myTurn ? "border-purple-200 bg-purple-50/10 shadow-sm" : "border-slate-100"
          }`}>
            
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
              <span className="text-[10px] font-black text-slate-800 block truncate max-w-[90px]">{myName}</span>
              <span className={`text-[7.5px] font-black block mt-0.5 ${myTurn ? "text-purple-600" : "text-slate-400"}`}>
                {myTurn ? "🎙️ يتحدث الآن" : "🎧 يستمع"}
              </span>
            </div>

          </div>
        </div>

        {/* Opponent player card */}
        <div
          className="game-card-outer flex-1 cursor-pointer select-none"
          onClick={opponentUid ? () => openProfile(opponentUid, { roomId, matchId, screen: "gameplay" }) : undefined}
        >
          <div className={`game-card-inner p-3 bg-white rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-2 text-center ${
            !myTurn ? "border-rose-200 bg-rose-50/10 shadow-sm" : "border-slate-100"
          }`}>
            
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
              <span className="text-[10px] font-black text-slate-800 block truncate max-w-[90px]">{opponentName}</span>
              <span className={`text-[7.5px] font-black block mt-0.5 ${!myTurn ? "text-rose-600" : "text-slate-400"}`}>
                {!myTurn ? "🎙️ يتحدث الآن" : "🎧 يستمع"}
              </span>
            </div>

          </div>
        </div>

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
      <div className="w-full flex-shrink-0 flex items-center justify-center gap-3 border-t border-slate-100/50 pt-3">
        {myTurn ? (
          <>
            <motion.button
              type="button"
              disabled={passing}
              whileTap={{ scale: 0.96 }}
              onClick={onPassTurn}
              className="flex-1 py-4 px-6 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-purple-600 to-purple-400 border border-purple-800 shadow-md flex items-center justify-center gap-2 active:scale-95 transition-transform"
              style={{ cursor: "pointer" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span>انتهيت — مرّر الدور</span>
            </motion.button>
            
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={onGuess}
              className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform shadow-sm flex-shrink-0"
              style={{ cursor: "pointer" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
              <span className="text-[7.5px] font-black">خمّن</span>
            </motion.button>
          </>
        ) : (
          <>
            <div className="flex-1 py-4 px-6 rounded-2xl bg-slate-50 border border-slate-200/50 flex items-center justify-center gap-2 select-none">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 animate-spin">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span className="text-xs font-black text-slate-400">بانتظار دور الخصم...</span>
            </div>
            
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={onGuess}
              className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform shadow-sm flex-shrink-0"
              style={{ cursor: "pointer" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
              <span className="text-[7.5px] font-black">خمّن</span>
            </motion.button>
          </>
        )}
      </div>

    </motion.div>
  );
}
