"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLiveUserProfile } from "@/hooks/useLiveUserProfile";
import { getFirebaseDb } from "@/lib/firebase/client";
import { doc, setDoc, collection, query, where, getDocs, updateDoc, deleteDoc, arrayUnion, onSnapshot } from "firebase/firestore";
import type { WordRaceRoom, WordRaceMatch, WordRaceRoomSettings, WordRacePlayerStats } from "@/types/word-race";
import { generateMatchLetters } from "@/lib/game/word-race-data";
import { fetchWordRaceRoom } from "@/lib/firestore/word-race-rooms.client";
import { ShellFramedAvatar } from "@/components/shell/ShellFramedAvatar";
import { ShellCoin } from "@/components/shell/ShellCoin";
import { ActionGrid, ActionTile } from "@/components/shell/HomeScreenParts";
import { EASE_OUT } from "@/lib/motion";
import { WordRaceHeroBackground } from "@/components/word-race/WordRaceHeroBackground";
import { WordRaceRoomModal } from "@/components/word-race/WordRaceRoomModal";
import { WordRaceLobby } from "@/components/word-race/WordRaceLobby";
import { WordRaceIntro } from "@/components/word-race/WordRaceIntro";
import { WordRaceGame } from "@/components/word-race/WordRaceGame";
import { WordRaceResults } from "@/components/word-race/WordRaceResults";
import {
  SvgTrophyIcon,
  SvgFlameIcon,
  SvgSparklesIcon,
  SvgCrossIcon,
  SvgKeyJoinIcon,
  SvgRocketIcon,
} from "@/lib/game/word-race-svgs";

export default function WordRacePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const uid = user?.uid || "";
  const displayName = user
    ? user.displayName || (user.isAnonymous ? "زائر" : (user.email?.split("@")[0] ?? "لاعب"))
    : "لاعب";

  const liveProfile = useLiveUserProfile(uid);
  const coins = liveProfile?.progress.coins ?? 0;

  const [activeRoom, setActiveRoom] = useState<WordRaceRoom | null>(null);
  const [activeMatch, setActiveMatch] = useState<WordRaceMatch | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [joinCodeInput, setJoinCodeInput] = useState<string>("");
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initial Room Loader from query param or session storage
  useEffect(() => {
    const paramRoomId = searchParams?.get("roomId");
    const sessionRoomId = typeof window !== "undefined" ? sessionStorage.getItem("active_word_race_room_id") : null;
    const targetRoomId = paramRoomId || sessionRoomId;

    if (targetRoomId && !activeRoom) {
      void fetchWordRaceRoom(targetRoomId).then((r) => {
        if (r) {
          setActiveRoom(r);
        }
      });
    }
  }, [searchParams, activeRoom]);

  // Real user stats loaded from profile or defaults
  const userXp = liveProfile?.progress.xp || 0;
  const userLevel = Math.floor(userXp / 100) + 1;
  const realStats: WordRacePlayerStats | null = liveProfile ? {
    xp: userXp,
    level: userLevel,
    rankTitleAr: userLevel > 5 ? "متسابق أبجدي" : "مبتدئ الأبجديات",
    rankIcon: "trophy",
    winRate: 0,
    matchesPlayed: 0,
    matchesWon: 0,
    bestStreak: 0,
    totalWordsFound: 0,
  } : null;

  // Real Room Snapshot Listener
  useEffect(() => {
    if (!activeRoom?.id) return;
    const db = getFirebaseDb();
    const unsub = onSnapshot(
      doc(db, "word_race_rooms", activeRoom.id),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as WordRaceRoom;
          setActiveRoom(data);
        }
      },
      (err) => {
        console.error("Room listener error:", err);
      }
    );
    return () => unsub();
  }, [activeRoom?.id]);

  // Real Match Snapshot Listener
  useEffect(() => {
    if (!activeRoom?.matchId) return;
    const db = getFirebaseDb();
    const unsub = onSnapshot(
      doc(db, "word_race_matches", activeRoom.matchId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as WordRaceMatch;
          setActiveMatch(data);
        }
      },
      (err) => {
        console.error("Match listener error:", err);
      }
    );
    return () => unsub();
  }, [activeRoom?.matchId]);

  // Utility to sanitize Firestore payload by replacing undefined with null
  const sanitizeDoc = <T extends Record<string, any>>(obj: T): T => {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined) {
        clean[key] = null;
      } else if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
        clean[key] = sanitizeDoc(value);
      } else {
        clean[key] = value;
      }
    }
    return clean as T;
  };

  // 1. Create OR Update Room Settings Handler
  const handleCreateRoom = async (settings: WordRaceRoomSettings) => {
    if (!uid) {
      setErrorMsg("يجب تسجيل الدخول أولاً لإنشاء أو تعديل الغرفة.");
      return;
    }

    // CRITICAL: If an active room already exists and current user is host -> UPDATE EXISTING ROOM DOCUMENT ONLY!
    if (activeRoom && activeRoom.hostUid === uid) {
      try {
        const db = getFirebaseDb();
        const roomRef = doc(db, "word_race_rooms", activeRoom.id);
        
        // Update ONLY settings & lastActivityAt. Room ID, code, hostUid, players, playerUids remain 100% UNCHANGED.
        await updateDoc(roomRef, {
          settings,
          lastActivityAt: Date.now(),
        });

        setIsModalOpen(false);
      } catch (err: any) {
        console.error("Failed to update existing room settings:", err);
        setErrorMsg("حدث خطأ أثناء تحديث إعدادات الغرفة الحالية.");
      }
      return;
    }

    // Creating a BRAND NEW Room (Only when no active room exists)
    setErrorMsg(null);
    const roomId = `wr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const roomData: WordRaceRoom = sanitizeDoc({
      id: roomId,
      code,
      hostUid: uid,
      status: "lobby",
      players: [
        {
          uid,
          displayName,
          ready: true,
          isHost: true,
          joinedAt: Date.now(),
        },
      ],
      playerUids: [uid],
      settings,
      matchId: null,
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
    });

    try {
      const db = getFirebaseDb();
      await setDoc(doc(db, "word_race_rooms", roomId), roomData);
      await setDoc(doc(db, "word_race_codes", code), { roomId });
      setActiveRoom(roomData);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Failed to create room:", err);
      if (err?.code === "permission-denied") {
        setErrorMsg("عذراً، تعذر إنشاء الغرفة بسبب عدم توفر الأذونات. يرجى تسجيل الدخول وإعادة المحاولة.");
      } else {
        setErrorMsg("حدث خطأ أثناء إنشاء الغرفة. يرجى المحاولة مرة أخرى.");
      }
    }
  };

  // 2. Join Room By Code Handler
  const handleJoinByCode = async () => {
    const cleanCode = joinCodeInput.trim();
    if (!cleanCode) return;

    if (!uid) {
      setErrorMsg("يجب تسجيل الدخول أولاً للانضمام للغرفة.");
      return;
    }

    setIsJoining(true);
    setErrorMsg(null);

    try {
      const db = getFirebaseDb();
      const roomsQ = query(collection(db, "word_race_rooms"), where("code", "==", cleanCode));
      const snap = await getDocs(roomsQ);

      if (snap.empty) {
        setErrorMsg("رمز الغرفة غير صحيح أو أن الغرفة غير موجودة.");
        setIsJoining(false);
        return;
      }

      const targetDoc = snap.docs[0];
      const roomData = targetDoc.data() as WordRaceRoom;

      if (roomData.status !== "lobby") {
        setErrorMsg("المباراة في هذه الغرفة بدأت بالفعل.");
        setIsJoining(false);
        return;
      }

      if (roomData.players.length >= roomData.settings.maxPlayers) {
        setErrorMsg("الغرفة ممتلئة بالكامل (بلغت الحد الأقصى للاعبين).");
        setIsJoining(false);
        return;
      }

      if (!roomData.playerUids.includes(uid)) {
        const newPlayer = {
          uid,
          displayName,
          ready: true,
          isHost: false,
          joinedAt: Date.now(),
        };

        await updateDoc(doc(db, "word_race_rooms", roomData.id), {
          players: [...roomData.players, newPlayer],
          playerUids: arrayUnion(uid),
          lastActivityAt: Date.now(),
        });
      }

      setActiveRoom(roomData);
      setJoinCodeInput("");
    } catch (err: any) {
      console.error("Failed to join room:", err);
      if (err?.code === "permission-denied") {
        setErrorMsg("عذراً، ليس لديك صلاحية الانضمام لهذه الغرفة.");
      } else {
        setErrorMsg("تعذر الانضمام للغرفة. يرجى التحقق من الكود والاتصال بالشبكة.");
      }
    } finally {
      setIsJoining(false);
    }
  };

  // 3. Start Match Handler
  const handleStartMatch = async () => {
    if (!activeRoom || activeRoom.hostUid !== uid) return;
    const matchId = `match_${Date.now()}`;
    const letterAssignment = generateMatchLetters(activeRoom.settings.categories, activeRoom.settings.letterMode);

    const matchData: WordRaceMatch = sanitizeDoc({
      id: matchId,
      roomId: activeRoom.id,
      status: "intro",
      startedAt: Date.now(),
      durationSec: activeRoom.settings.timeLimitSec,
      letterAssignment,
      answers: {},
      progress: {},
      finisherUid: null,
    });

    try {
      const db = getFirebaseDb();
      await setDoc(doc(db, "word_race_matches", matchId), matchData);
      await setDoc(
        doc(db, "word_race_rooms", activeRoom.id),
        { status: "intro", matchId },
        { merge: true }
      );
      setActiveMatch(matchData);
    } catch (err) {
      console.error("Failed to start match:", err);
      setErrorMsg("حدث خطأ أثناء بدء المباراة.");
    }
  };

  // 4. Update Answers Handler
  const handleUpdateAnswers = async (answers: Record<string, string>, isFinished: boolean) => {
    if (!activeMatch || !uid || !activeRoom) return;
    const totalCatCount = activeRoom.settings.categories.length;
    const completedCount = Object.keys(answers).length; // Both typed answers and "لم أعرف" skips count as processed categories

    const nextAnswers = { ...activeMatch.answers, [uid]: answers };
    const nextProgress = { ...activeMatch.progress, [uid]: completedCount };

    // Check if ALL players in the room have completed all categories
    const allPlayersCompleted = activeRoom.playerUids.every(
      (playerUid) => (nextProgress[playerUid] || 0) >= totalCatCount
    );

    let nextStatus = activeMatch.status;
    let finisherUid = activeMatch.finisherUid ?? null;

    if ((isFinished || allPlayersCompleted) && nextStatus !== "revealing") {
      finisherUid = finisherUid || uid;
      nextStatus = "revealing";
    }

    const updatedMatch: WordRaceMatch = sanitizeDoc({
      ...activeMatch,
      status: nextStatus,
      finisherUid,
      answers: nextAnswers,
      progress: nextProgress,
    });

    setActiveMatch(updatedMatch);

    try {
      const db = getFirebaseDb();
      await setDoc(doc(db, "word_race_matches", activeMatch.id), updatedMatch, { merge: true });
      if (nextStatus === "revealing") {
        await setDoc(doc(db, "word_race_rooms", activeRoom.id), { status: "revealing" }, { merge: true });
      }
    } catch (err) {
      console.error("Failed to update answers:", err);
    }
  };

  // Forfeit Match Handler
  const handleForfeitMatch = async () => {
    if (!activeMatch || !uid || !activeRoom) return;
    const opponentUid = activeRoom.playerUids.find((u) => u !== uid) || "";

    const updatedMatch: WordRaceMatch = sanitizeDoc({
      ...activeMatch,
      status: "revealing",
      forfeitedByUid: uid,
      finisherUid: opponentUid || uid,
    });

    try {
      const db = getFirebaseDb();
      await setDoc(doc(db, "word_race_matches", activeMatch.id), updatedMatch, { merge: true });
      await setDoc(doc(db, "word_race_rooms", activeRoom.id), { status: "revealing" }, { merge: true });
    } catch (err) {
      console.error("Failed to forfeit match:", err);
    }
  };

  // Explicit Room Leave Handler (Removes player in realtime from Firestore doc)
  const handleLeaveRoom = async () => {
    if (!activeRoom || !uid) {
      setActiveRoom(null);
      setActiveMatch(null);
      return;
    }

    try {
      const db = getFirebaseDb();
      const updatedPlayers = activeRoom.players.filter((p) => p.uid !== uid);
      const updatedUids = activeRoom.playerUids.filter((id) => id !== uid);

      if (updatedPlayers.length === 0) {
        await deleteDoc(doc(db, "word_race_rooms", activeRoom.id));
      } else {
        const nextHostUid = activeRoom.hostUid === uid ? updatedPlayers[0].uid : activeRoom.hostUid;
        await updateDoc(doc(db, "word_race_rooms", activeRoom.id), {
          players: updatedPlayers,
          playerUids: updatedUids,
          hostUid: nextHostUid,
          lastActivityAt: Date.now(),
        });
      }
    } catch (err) {
      console.error("Failed to leave room:", err);
    }

    setActiveRoom(null);
    setActiveMatch(null);
  };

  return (
    <div className="shell-screen relative memphis-grid min-h-[100dvh] overflow-y-auto" style={{ background: "#FAF9FF" }}>
      {/* Light Theme Floating Particles Canvas */}
      <WordRaceHeroBackground />

      {/* Floating Double-Bezel Top Header (HIDDEN during active match flow) */}
      {!activeRoom && (
        <div className="mx-4 mt-5 p-1 bg-slate-900/5 ring-1 ring-black/5 rounded-[22px] relative z-20">
          <div className="bg-white/95 rounded-[17px] p-2 flex items-center justify-between shadow-[inset_0_1px_0px_rgba(255,255,255,0.8)]">
            <button
              type="button"
              className="flex items-center gap-2 text-right p-1 hover:bg-slate-50 rounded-xl active:scale-[0.98] transition-transform"
              onClick={() => router.push("/profile")}
            >
              <ShellFramedAvatar
                cosmetic={liveProfile?.cosmetic}
                fallbackPhotoURL={user?.photoURL}
                displayName={displayName}
                size={34}
                frame="simple"
              />
              <div className="flex flex-col text-right justify-center" style={{ lineHeight: 1.15 }}>
                <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider">مرحبًا بك</span>
                <span className="h-display text-xs font-black text-slate-800">{loading ? "…" : displayName}</span>
              </div>
            </button>

            <div className="flex items-center gap-2">
              <div className="bg-[#FFE600]/10 border border-[#FFE600]/30 px-3 py-1.5 rounded-full flex items-center gap-1.5 min-w-[70px]">
                <ShellCoin value={coins} compact />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast Message */}
      {errorMsg && (
        <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-2xl flex items-center justify-between shadow-md relative z-30 animate-fade-in dir-rtl">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="p-1 text-red-500 hover:text-red-800">
            <SvgCrossIcon size={16} />
          </button>
        </div>
      )}

      {/* Main Content Area (Natural Document Scroll) */}
      <div
        className={`relative z-10 mx-auto px-3 dir-rtl pb-24 ${
          activeRoom ? "max-w-[440px] w-full py-4" : "max-w-4xl pt-6 space-y-6"
        }`}
        style={{ direction: "rtl" }}
      >
        
        {activeRoom ? (
          <div>
            {activeRoom.status === "lobby" && (
              <WordRaceLobby
                room={activeRoom}
                myUid={uid}
                onStartMatch={handleStartMatch}
                onLeaveRoom={handleLeaveRoom}
                onOpenEditSettings={() => setIsModalOpen(true)}
              />
            )}

            {activeRoom.status === "intro" && activeMatch && (
              <WordRaceIntro
                room={activeRoom}
                match={activeMatch}
                onFinishIntro={async () => {
                  try {
                    const db = getFirebaseDb();
                    const nowMs = Date.now();
                    await setDoc(doc(db, "word_race_rooms", activeRoom.id), { status: "playing" }, { merge: true });
                    await setDoc(doc(db, "word_race_matches", activeMatch.id), { status: "playing", startedAt: nowMs }, { merge: true });
                  } catch (err) {
                    console.error("Failed to update status to playing:", err);
                  }
                  setActiveRoom((prev) => prev ? { ...prev, status: "playing" } : null);
                }}
              />
            )}

            {activeRoom.status === "playing" && activeMatch && (
              <WordRaceGame
                room={activeRoom}
                match={activeMatch}
                myUid={uid}
                onUpdateAnswers={handleUpdateAnswers}
                onForfeitMatch={handleForfeitMatch}
                onTimeExpired={() => {
                  setActiveRoom((prev) => prev ? { ...prev, status: "revealing" } : null);
                }}
              />
            )}

            {activeRoom.status === "revealing" && activeMatch && (
              <WordRaceResults
                room={activeRoom}
                match={activeMatch}
                myUid={uid}
                onRematchVote={async () => {
                  try {
                    const db = getFirebaseDb();
                    await setDoc(doc(db, "word_race_rooms", activeRoom.id), { status: "lobby", matchId: null, lastActivityAt: Date.now() }, { merge: true });
                  } catch (err) {
                    console.error("Failed to return to room lobby:", err);
                  }
                  setActiveRoom((prev) => prev ? { ...prev, status: "lobby", matchId: null } : null);
                }}
                onReturnHome={async () => {
                  try {
                    const db = getFirebaseDb();
                    await setDoc(doc(db, "word_race_rooms", activeRoom.id), { status: "lobby", matchId: null, lastActivityAt: Date.now() }, { merge: true });
                  } catch (err) {
                    console.error("Failed to return to room lobby:", err);
                  }
                  setActiveRoom((prev) => prev ? { ...prev, status: "lobby", matchId: null } : null);
                }}
              />
            )}
          </div>
        ) : (
          
          /* Clean & Focused Word Race Main Landing (Zero Emojis, Zero Clutter!) */
          <div className="space-y-6 animate-fade-in">
            
            {/* 1. Official Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.45, ease: EASE_OUT }}
              className="game-card-outer w-full text-center relative overflow-hidden"
            >
              <div 
                className="game-card-inner p-6 flex flex-col items-center justify-between relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)",
                  color: "#FFFFFF",
                }}
              >
                <div 
                  className="absolute pointer-events-none rounded-full" 
                  style={{
                    width: 160,
                    height: 160,
                    background: "radial-gradient(circle, rgba(255, 230, 0, 0.25) 0%, transparent 70%)",
                    top: -30,
                    right: -30,
                    filter: "blur(20px)",
                  }}
                />

                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-extrabold tracking-wider text-purple-200 uppercase px-2.5 py-1 rounded bg-white/10 border border-white/20 select-none flex items-center gap-1.5">
                    <SvgRocketIcon size={12} />
                    <span>تحدي السرعة والأبجديات</span>
                  </span>

                  <h1 
                    className="h-display text-4xl font-black mt-4 text-white tracking-tight select-none"
                    style={{ textShadow: "0 2px 4px rgba(0,0,0,0.15)" }}
                  >
                    اسم حيوان نبات
                  </h1>

                  <p className="text-xs text-purple-200 max-w-[280px] mt-1.5 font-bold select-none leading-relaxed">
                    تحدى أصدقاءك في سباق سرعة خاطف لإيجاد الكلمات العربية قبل انتهاء المؤقت!
                  </p>
                </div>

                <div className="my-5 w-full flex items-center justify-center">
                  <svg width="220" height="70" viewBox="0 0 220 70" className="opacity-95">
                    <g transform="translate(60, 35) rotate(-8)">
                      <rect x="-22" y="-28" width="44" height="54" rx="8" fill="#22C55E" stroke="#000000" strokeWidth="1.5" />
                      <text x="0" y="8" fontSize="16" fontWeight="900" textAnchor="middle" fill="#FFFFFF">اسم</text>
                    </g>
                    <g transform="translate(110, 31) rotate(6)">
                      <rect x="-22" y="-28" width="44" height="54" rx="8" fill="#FFE600" stroke="#000000" strokeWidth="1.5" />
                      <text x="0" y="10" fontSize="22" fontWeight="900" textAnchor="middle" fill="#000000">س</text>
                    </g>
                    <g transform="translate(160, 37) rotate(2)">
                      <rect x="-20" y="-26" width="40" height="50" rx="8" fill="#00F0FF" stroke="#000000" strokeWidth="1.5" />
                      <text x="0" y="8" fontSize="16" fontWeight="900" textAnchor="middle" fill="#000000">أ</text>
                    </g>
                  </svg>
                </div>
              </div>
            </motion.div>

            {/* 2. TWO LARGE EQUAL ACTION CARDS (Desktop: 2 cols, Mobile: 1 col) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              
              {/* CARD 1: إنشاء غرفة خاصة */}
              <motion.div
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
                className="game-card-outer w-full flex flex-col justify-between"
              >
                <div className="game-card-inner p-6 bg-white/95 border border-black/5 rounded-[24px] shadow-md flex flex-col justify-between h-full space-y-6 text-right">
                  <div className="space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-100 text-[#7C3AED] flex items-center justify-center shadow-xs">
                      <SvgSparklesIcon size={28} />
                    </div>
                    <div>
                      <h2 className="h-display text-lg font-black text-slate-900">إنشاء غرفة خاصة</h2>
                      <p className="text-xs text-slate-500 font-bold mt-1 leading-relaxed">
                        خصص الفئات ونمط الحروف ووقت الجولات والعب مع أصدقائك في غرفة خاصة بمميزات كاملة.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => router.push("/play/word-race/create")}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-purple-800 text-white text-xs font-black shadow-[0_6px_20px_rgba(124,58,237,0.3)] hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <SvgRocketIcon size={16} />
                    <span>إنشاء غرفة</span>
                  </button>
                </div>
              </motion.div>

              {/* CARD 2: الانضمام لغرفة */}
              <motion.div
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
                className="game-card-outer w-full flex flex-col justify-between"
              >
                <div className="game-card-inner p-6 bg-white/95 border border-black/5 rounded-[24px] shadow-md flex flex-col justify-between h-full space-y-6 text-right">
                  <div className="space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shadow-xs">
                      <SvgKeyJoinIcon size={28} />
                    </div>
                    <div>
                      <h2 className="h-display text-lg font-black text-slate-900">الانضمام لغرفة</h2>
                      <p className="text-xs text-slate-500 font-bold mt-1 leading-relaxed">
                        ادخل رمز الغرفة الخاصة للانضمام المباشر إلى مباراة أصدقائك وبدء التحدي الأبجدي.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsJoinModalOpen(true)}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-black shadow-[0_6px_20px_rgba(245,158,11,0.3)] hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <SvgKeyJoinIcon size={16} />
                    <span>انضمام</span>
                  </button>
                </div>
              </motion.div>

            </div>

          </div>
        )}

      </div>

      {/* Room Customization Modal */}
      <WordRaceRoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateRoom={handleCreateRoom}
        initialSettings={activeRoom?.settings}
        isEditing={Boolean(activeRoom)}
      />

      {/* DEDICATED JOIN ROOM MODAL */}
      <AnimatePresence>
        {isJoinModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm dir-rtl"
            style={{ direction: "rtl" }}
            onClick={() => setIsJoinModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 16 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="game-card-outer w-full">
                <div className="game-card-inner p-6 bg-white rounded-[24px] border border-slate-100 shadow-2xl space-y-5 text-right">
                  
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                        <SvgKeyJoinIcon size={20} />
                      </div>
                      <div>
                        <h3 className="h-display text-base font-black text-slate-900">الانضمام إلى غرفة</h3>
                        <p className="text-[10px] text-slate-400 font-bold">أدخل رمز الغرفة المكون من 6 أرقام</p>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => setIsJoinModalOpen(false)}
                      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <SvgCrossIcon size={16} />
                    </button>
                  </div>

                  {/* Input & Paste Field */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 block">رمز الغرفة:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={joinCodeInput}
                        onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                        placeholder="مثال: 489201"
                        className="flex-1 bg-slate-50 border-2 border-purple-200 focus:border-[#7C3AED] rounded-xl px-4 py-3 text-base font-sans font-black text-slate-900 text-center tracking-widest uppercase focus:outline-none transition-colors"
                        maxLength={6}
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const text = await navigator.clipboard.readText();
                            if (text) setJoinCodeInput(text.trim().toUpperCase());
                          } catch (err) {
                            console.error("Paste failed", err);
                          }
                        }}
                        className="px-3.5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition-all active:scale-95 whitespace-nowrap cursor-pointer"
                      >
                        لصق
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsJoinModalOpen(false)}
                      className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                    >
                      إلغاء
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        handleJoinByCode();
                        setIsJoinModalOpen(false);
                      }}
                      disabled={isJoining || !joinCodeInput.trim()}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-purple-800 text-white text-xs font-black shadow-md hover:shadow-lg transition-all disabled:opacity-40 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                    >
                      <SvgKeyJoinIcon size={16} />
                      <span>{isJoining ? "جاري الدخول..." : "انضمام للغرفة"}</span>
                    </button>
                  </div>

                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
