"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { WordRaceRoom } from "@/types/word-race";
import { WORD_RACE_CATEGORIES } from "@/lib/game/word-race-data";
import {
  CATEGORY_SVG_MAP,
  SvgUsersIcon,
  SvgCheckIcon,
  SvgLightningIcon,
  SvgSparklesIcon,
  SvgPlayIcon,
  SvgRocketIcon,
  SvgSettingsIcon,
  SvgShieldIcon,
  SvgKeyJoinIcon,
} from "@/lib/game/word-race-svgs";

interface WordRaceLobbyProps {
  room: WordRaceRoom;
  myUid: string;
  onStartMatch: () => void;
  onLeaveRoom: () => void;
  onOpenEditSettings?: () => void;
  isStarting?: boolean;
}

// ─── Web Audio API Synthesizer for Player Leave UI Sound ──────────────────────
const playPlayerLeaveSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // Ignore audio context autoplay restrictions gracefully
  }
};

export const WordRaceLobby: React.FC<WordRaceLobbyProps> = ({
  room,
  myUid,
  onStartMatch,
  onLeaveRoom,
  onOpenEditSettings,
  isStarting = false,
}) => {
  const isHost = room.hostUid === myUid;
  const activeCategories = WORD_RACE_CATEGORIES.filter((c) => room.settings.categories.includes(c.id));
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const [settingsUpdatedNotice, setSettingsUpdatedNotice] = useState<boolean>(false);
  const [playerLeftNotice, setPlayerLeftNotice] = useState<string | null>(null);

  const prevSettingsRef = useRef(room.settings);
  const prevPlayersCountRef = useRef(room.players.length);

  // Monitor Settings Updates
  useEffect(() => {
    if (JSON.stringify(prevSettingsRef.current) !== JSON.stringify(room.settings)) {
      prevSettingsRef.current = room.settings;
      setSettingsUpdatedNotice(true);
      const timer = setTimeout(() => setSettingsUpdatedNotice(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [room.settings]);

  // Monitor Realtime Player Leave Events
  useEffect(() => {
    if (room.players.length < prevPlayersCountRef.current) {
      playPlayerLeaveSound();
      setPlayerLeftNotice("غادر أحد المتنافسين الغرفة.");
      const toastTimer = setTimeout(() => setPlayerLeftNotice(null), 3000);
      return () => clearTimeout(toastTimer);
    }
    prevPlayersCountRef.current = room.players.length;
  }, [room.players]);

  const handleCopyCode = () => {
    if (room.code) {
      navigator.clipboard.writeText(room.code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const p1 = room.players[0];
  const p2 = room.players[1];
  const isMatchReady = room.players.length >= 2;

  return (
    <div className="game-card-outer w-full max-w-4xl mx-auto dir-rtl select-none my-auto" style={{ direction: "rtl" }}>
      <div className="game-card-inner p-5 sm:p-7 bg-white/95 border border-black/5 rounded-[28px] shadow-xl text-slate-800 space-y-6 relative">
        
        {/* Realtime Player Leave Toast Notification */}
        <AnimatePresence>
          {playerLeftNotice && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-30 px-4 py-1.5 rounded-full bg-rose-500 text-white text-xs font-black shadow-lg flex items-center gap-2 border border-rose-400"
            >
              <SvgUsersIcon size={14} />
              <span>{playerLeftNotice}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. Header Bar: Room Info & Code */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-200 text-[#7C3AED] flex items-center justify-center shadow-xs">
              <SvgRocketIcon size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7C3AED] text-[10px] font-black uppercase">
                  صالة الانتظار
                </span>
                {room.settings.isPrivate ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black flex items-center gap-1">
                    <SvgShieldIcon size={11} />
                    <span>غرفة خاصة</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-black">
                    غرفة عامة
                  </span>
                )}
              </div>
              <h1 className="h-display text-lg font-black text-slate-900 mt-1">
                جاهزية المتنافسين • {room.players.length} من أصل {room.settings.maxPlayers} لاعبين
              </h1>
            </div>
          </div>

          {/* Copyable Room Code Box */}
          <div className="flex items-center gap-3 bg-purple-50/90 border border-purple-200/90 rounded-2xl px-4 py-2 shadow-xs w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex flex-col text-right">
              <span className="text-[9px] text-slate-400 font-extrabold uppercase">رمز الغرفة للتحدي:</span>
              <span className="text-base font-sans font-black text-[#7C3AED] tracking-widest">{room.code}</span>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-3 py-1.5 rounded-xl bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-black transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <SvgKeyJoinIcon size={14} />
              <span>{isCopied ? "تم النسخ!" : "نسخ الكود"}</span>
            </button>
          </div>
        </div>

        {/* 2. Responsive 2-Column Grid (Desktop: 12 cols, Mobile: 1 col) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
          
          {/* Left Column: VS Matchup Arena (7 cols) */}
          <div className="md:col-span-7 bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
              <h3 className="text-xs font-black uppercase text-purple-700 tracking-wider flex items-center gap-1.5">
                <SvgUsersIcon size={16} />
                <span>ساحة التحدي المباشر</span>
              </h3>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${isMatchReady ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800 animate-pulse"}`}>
                {isMatchReady ? "جاهزون للبدء" : "بانتظار المنافس..."}
              </span>
            </div>

            <div className="space-y-3">
              {/* Player 1 Card (Host) */}
              <AnimatePresence mode="popLayout">
                {p1 && (
                  <motion.div
                    key={p1.uid}
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12, scale: 0.9 }}
                    transition={{ duration: 0.28, ease: "easeInOut" }}
                    className="p-3.5 rounded-2xl bg-white border-2 border-purple-200 shadow-sm flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7C3AED] to-purple-800 p-0.5 shadow-sm">
                        <div className="w-full h-full rounded-[10px] bg-white flex items-center justify-center text-lg font-black text-[#7C3AED]">
                          {p1.displayName?.slice(0, 1) || "P1"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-sm text-slate-900">{p1.displayName || "لاعب 1"}</h3>
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-100 border border-amber-200 text-amber-900 font-black">
                            المستضيف 👑
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-extrabold">{p1.uid === myUid ? "أنت" : "متنافس"}</span>
                      </div>
                    </div>

                    <div className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-black flex items-center gap-1.5">
                      <SvgCheckIcon size={14} className="text-emerald-600" />
                      <span>جاهز للنزال</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Central VS Badge */}
              <div className="flex items-center justify-center py-1">
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-11 h-11 rounded-full bg-[#FFE600] border-2 border-black/10 flex items-center justify-center font-black text-sm text-slate-950 shadow-md"
                >
                  VS
                </motion.div>
              </div>

              {/* Player 2 Card OR Animated Live Pulse Waiting Slot */}
              <AnimatePresence mode="popLayout">
                {p2 ? (
                  <motion.div
                    key={p2.uid}
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12, scale: 0.9 }}
                    transition={{ duration: 0.28, ease: "easeInOut" }}
                    className="p-3.5 rounded-2xl bg-white border-2 border-blue-200 shadow-sm flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5 shadow-sm">
                        <div className="w-full h-full rounded-[10px] bg-white flex items-center justify-center text-lg font-black text-blue-600">
                          {p2.displayName?.slice(0, 1) || "P2"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-sm text-slate-900">{p2.displayName || "لاعب 2"}</h3>
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-100 border border-blue-200 text-blue-900 font-black">
                            الضيف ⚔️
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-extrabold">{p2.uid === myUid ? "أنت" : "متنافس"}</span>
                      </div>
                    </div>

                    <div className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-black flex items-center gap-1.5">
                      <SvgCheckIcon size={14} className="text-emerald-600" />
                      <span>جاهز للنزال</span>
                    </div>
                  </motion.div>
                ) : (
                  /* Animated Live Waiting Slot */
                  <motion.div
                    key="empty-slot"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="p-4 rounded-2xl border-2 border-dashed border-purple-300 bg-purple-50/30 flex items-center justify-between animate-pulse"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-purple-100 border border-purple-200 text-[#7C3AED] flex items-center justify-center">
                        <SvgUsersIcon size={24} />
                      </div>
                      <div className="text-right">
                        <div className="font-black text-xs text-slate-800">بانتظار انضمام منافس...</div>
                        <span className="text-[10px] text-slate-500 font-bold mt-0.5">شارك كود الغرفة ({room.code}) مع أصدقائك</span>
                      </div>
                    </div>

                    <div className="px-3 py-1 rounded-xl bg-purple-100 text-[#7C3AED] text-[10px] font-black">
                      جاري الانتظار 🌀
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Column: Match Settings Summary Panel (5 cols) */}
          <div className="md:col-span-5 bg-purple-50/40 border border-purple-100 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
            
            <div className="space-y-3">
              {/* Settings Updated Toast Notice */}
              {settingsUpdatedNotice && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="p-2.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-950 text-xs font-black text-center flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <SvgSparklesIcon size={14} className="text-amber-600" />
                  <span>تم تحديث إعدادات المباراة!</span>
                </motion.div>
              )}

              <div className="flex items-center justify-between border-b border-purple-100 pb-2.5">
                <h3 className="text-xs font-black uppercase text-purple-700 tracking-wider flex items-center gap-1.5">
                  <SvgLightningIcon size={16} />
                  <span>إعدادات المباراة</span>
                </h3>
                {isHost && onOpenEditSettings && (
                  <button
                    onClick={onOpenEditSettings}
                    className="text-xs font-black text-[#7C3AED] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <SvgSettingsIcon size={14} />
                    <span>تعديل</span>
                  </button>
                )}
              </div>

              {/* Setting Badges */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                  <span className="text-slate-500 font-bold text-[11px]">مؤقت الجولة:</span>
                  <span className="font-black text-[#7C3AED] font-mono text-xs">{room.settings.timeLimitSec}ث</span>
                </div>

                <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                  <span className="text-slate-500 font-bold text-[11px]">نمط الحروف:</span>
                  <span className="font-black text-[#7C3AED] text-xs">
                    {room.settings.letterMode === "SINGLE_UNIVERSAL" ? "موحد" : "عشوائي"}
                  </span>
                </div>
              </div>

              {/* Active Category Chips (Wrapping Gracefully) */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block">
                  الفئات المختارة ({activeCategories.length}):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto custom-scrollbar p-0.5">
                  {activeCategories.map((cat) => {
                    const IconComponent = CATEGORY_SVG_MAP[cat.icon] || SvgSparklesIcon;
                    return (
                      <div
                        key={cat.id}
                        className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-1.5 shadow-2xs"
                      >
                        <IconComponent size={13} className={cat.color} />
                        <span>{cat.nameAr}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick Match Tip Banner */}
            <div className="p-3 bg-white/90 border border-purple-100 rounded-xl text-right">
              <span className="text-[10px] text-purple-700 font-black block">💡 معلومة سريعة:</span>
              <span className="text-[10px] text-slate-500 font-bold leading-tight block mt-0.5">
                الفائز هو المتسابق الذي يجمع أكبر عدد من النقاط ويجيب أولاً على كافة الفئات المطلوبة!
              </span>
            </div>

          </div>

        </div>

        {/* 3. Primary & Secondary CTA Action Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onLeaveRoom}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition-all active:scale-95 cursor-pointer"
          >
            مغادرة الغرفة
          </button>

          {isHost ? (
            <motion.button
              type="button"
              whileHover={{ scale: isMatchReady ? 1.02 : 1 }}
              whileTap={{ scale: isMatchReady ? 0.96 : 1 }}
              onClick={onStartMatch}
              disabled={isStarting || !isMatchReady}
              className="w-full sm:flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-purple-900 text-white text-xs font-black shadow-[0_6px_20px_rgba(124,58,237,0.35)] hover:shadow-lg transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
            >
              <SvgPlayIcon size={16} />
              <span>{isStarting ? "جاري بدء المباراة..." : !isMatchReady ? "بانتظار انضمام منافس لبدء المباراة" : "بدء المباراة الآن"}</span>
            </motion.button>
          ) : (
            <div className="w-full sm:flex-1 py-3 text-center text-xs font-black text-slate-600 bg-slate-100 rounded-xl border border-slate-200">
              بانتظار أن يبدأ المضيف المباراة...
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
