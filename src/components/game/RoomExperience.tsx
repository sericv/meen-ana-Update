"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import type { MouseEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
import {
  playCountdownTick,
  playDefeatTone,
  playGuessChime,
  playMessagePop,
  playTurnCue,
  playWinSparkle,
  resumeAudioContext,
} from "@/lib/audio/game-sounds";
import { postGame } from "@/lib/api/game-client";
import {
  ANSWER_PHASE_SECONDS,
  QUESTION_PHASE_SECONDS,
} from "@/lib/game/constants";
import { setPlayerReady } from "@/lib/firestore/rooms.client";
import { useRoomWire } from "@/hooks/useRoomWire";
import { useRouter } from "next/navigation";
import { ConfettiBurst } from "@/components/game/ConfettiBurst";

type Props = { roomId: string };

const CARD_PLACEHOLDER = "/cards/_placeholder.svg";

function CardImage({ src, alt }: { src: string; alt: string }) {
  const [errored, setErrored] = useState(false);
  const finalSrc = errored || !src ? CARD_PLACEHOLDER : src;
  return (
    <Image
      src={finalSrc}
      alt={alt}
      fill
      className="object-cover"
      sizes="(max-width: 512px) 100vw, 512px"
      unoptimized
      onError={() => setErrored(true)}
    />
  );
}

function CircularTimer({
  secLeft,
  maxSec,
  active,
}: {
  secLeft: number;
  maxSec: number;
  active: boolean;
}) {
  const r = 28;
  const circumference = 2 * Math.PI * r;
  const pct = maxSec > 0 ? Math.max(0, Math.min(1, secLeft / maxSec)) : 0;
  const dash = circumference * pct;
  const urgent = secLeft <= 5 && active;

  return (
    <div className="relative h-[68px] w-[68px] shrink-0">
      <svg
        className="absolute inset-0 -rotate-90"
        width="68"
        height="68"
        viewBox="0 0 68 68"
      >
        <circle
          cx="34"
          cy="34"
          r={r}
          fill="none"
          stroke={active ? "rgba(255,255,255,0.35)" : "#e8d5b5"}
          strokeWidth="6"
        />
        <circle
          cx="34"
          cy="34"
          r={r}
          fill="none"
          stroke={urgent ? "#ef4444" : active ? "white" : "#c5a77a"}
          strokeWidth="6"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.2s linear, stroke 0.4s" }}
        />
      </svg>
      <div
        className={`absolute inset-0 flex items-center justify-center font-mono text-xl font-black tabular-nums ${
          urgent ? "text-red-400" : active ? "text-white" : "text-[#9b8060]"
        }`}
      >
        {secLeft}
      </div>
    </div>
  );
}

export function RoomExperience({ roomId }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const uid = user?.uid ?? null;
  const displayName = user?.displayName || user?.email || "زائر";

  const { room, match, messages, opponentCard, wireError } = useRoomWire(roomId, uid);

  const [draft, setDraft] = useState("");
  const [guessSureOpen, setGuessSureOpen] = useState(false);
  const [guessInputOpen, setGuessInputOpen] = useState(false);
  const [guessDraft, setGuessDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [turnPopup, setTurnPopup] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const autoStartRef = useRef(false);
  const firedTimeoutForDeadline = useRef<number | null>(null);
  const prevMyTurn = useRef(false);
  const prevMsgCount = useRef(0);
  const lastTickSecond = useRef<number | null>(null);
  const confettiDone = useRef(false);
  const defeatPlayed = useRef(false);
  const turnPopupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setClock(Date.now()), 200);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const me = room?.players.find((p) => p.uid === uid);
  const isHost = Boolean(uid && room?.hostUid === uid);
  const bothReady = Boolean(room?.players?.length === 2 && room.players.every((p) => p.ready));
  const voiceMode = Boolean(room?.voiceMode && !room?.randomMatch);

  const ended = room?.status === "ended" || match?.status === "ended";
  const winnerUid = match?.winnerUid ?? null;
  const iWon = Boolean(winnerUid && winnerUid === uid);
  const forfeitWin = Boolean(iWon && match?.winReason === "forfeit");

  const myTurn =
    Boolean(match?.status === "active" && match.actorUid && uid && match.actorUid === uid);
  const phase = match?.chatPhase ?? "question";
  const msLeft =
    match?.turnDeadline && typeof match.turnDeadline.toMillis === "function"
      ? match.turnDeadline.toMillis() - clock
      : null;
  const secLeft = msLeft !== null ? Math.max(0, Math.ceil(msLeft / 1000)) : null;
  const qSec = match?.questionSeconds ?? QUESTION_PHASE_SECONDS;
  const aSec = match?.answerSeconds ?? ANSWER_PHASE_SECONDS;
  const maxPhaseSec = phase === "answer" ? aSec : qSec;

  useEffect(() => {
    firedTimeoutForDeadline.current = null;
  }, [match?.turnDeadline]);

  useEffect(() => {
    if (!match || match.status !== "active" || ended || !uid) return;
    const dl = match.turnDeadline?.toMillis?.();
    if (!dl) return;
    if (match.actorUid !== uid) return;
    if (clock <= dl + 400) return;
    if (firedTimeoutForDeadline.current === dl) return;
    firedTimeoutForDeadline.current = dl;
    void postGame("/api/game/timeout", { roomId, matchId: match.id }).catch(() => {
      firedTimeoutForDeadline.current = null;
    });
  }, [clock, match, ended, uid, roomId]);

  useEffect(() => {
    if (!room || room.status !== "lobby" || !room.randomMatch) return;
    if (room.players.length < 2) return;
    if (!isHost) return;
    if (autoStartRef.current) return;
    autoStartRef.current = true;
    void (async () => {
      try {
        await postGame("/api/game/start", { roomId: room.id });
      } catch {
        autoStartRef.current = false;
      }
    })();
  }, [room, isHost]);

  useEffect(() => {
    resumeAudioContext();
  }, []);

  // Combined turn change: audio cue + transition popup
  useEffect(() => {
    const wasMyTurn = prevMyTurn.current;
    if (match?.status === "active" && myTurn !== wasMyTurn) {
      if (myTurn) playTurnCue();
      if (turnPopupTimer.current) clearTimeout(turnPopupTimer.current);
      setTurnPopup(myTurn ? "دورك الآن!" : "دور الخصم");
      turnPopupTimer.current = setTimeout(() => setTurnPopup(null), 1800);
    }
    prevMyTurn.current = myTurn;
  }, [myTurn, match?.status]);

  useEffect(() => {
    const n = messages.length;
    if (n > prevMsgCount.current && prevMsgCount.current > 0) {
      const last = messages[n - 1];
      if (last && last.senderUid !== uid && last.senderUid !== "system") {
        playMessagePop();
      }
    }
    prevMsgCount.current = n;
  }, [messages, uid]);

  useEffect(() => {
    if (!myTurn || secLeft === null || match?.status !== "active") {
      lastTickSecond.current = null;
      return;
    }
    if (secLeft > 5 || secLeft < 1) {
      lastTickSecond.current = null;
      return;
    }
    if (lastTickSecond.current !== secLeft) {
      lastTickSecond.current = secLeft;
      playCountdownTick(secLeft);
    }
  }, [secLeft, myTurn, match?.status]);

  useEffect(() => {
    if (!room?.lobbyLeftByUid || !uid) return;
    if (room.lobbyLeftByUid === uid) return;
    setBanner("اللاعب الآخر قام بالمغادرة.");
    window.setTimeout(() => router.replace("/"), 2200);
  }, [room?.lobbyLeftByUid, uid, router]);

  useEffect(() => {
    if (!ended || !iWon || !winnerUid) return;
    if (!confettiDone.current) {
      confettiDone.current = true;
      playWinSparkle();
    }
  }, [ended, iWon, winnerUid]);

  useEffect(() => {
    if (!ended || !forfeitWin) return;
    const t = window.setTimeout(() => router.replace("/"), 3200);
    return () => window.clearTimeout(t);
  }, [ended, forfeitWin, router]);

  useEffect(() => {
    if (!ended || iWon || !winnerUid) return;
    if (!defeatPlayed.current) {
      defeatPlayed.current = true;
      playDefeatTone();
    }
  }, [ended, iWon, winnerUid]);

  useEffect(() => {
    return () => {
      if (turnPopupTimer.current) clearTimeout(turnPopupTimer.current);
    };
  }, []);

  const startMatch = useCallback(async () => {
    if (!room) return;
    setBusy(true);
    setBanner(null);
    try {
      await postGame("/api/game/start", { roomId: room.id });
    } catch (e) {
      setBanner(e instanceof Error ? e.message : "تعذر بدء المباراة");
    } finally {
      setBusy(false);
    }
  }, [room]);

  const toggleReady = useCallback(async () => {
    if (!room || !uid || !me) return;
    setBusy(true);
    try {
      await setPlayerReady(room.id, uid, !me.ready);
    } finally {
      setBusy(false);
    }
  }, [room, uid, me]);

  const sendDraft = useCallback(async () => {
    if (!room || !match || !draft.trim()) return;
    if (!myTurn) {
      setBanner("انتظر دورك");
      return;
    }
    setBusy(true);
    setBanner(null);
    try {
      await postGame("/api/game/chat", {
        roomId: room.id,
        matchId: match.id,
        text: draft,
        displayName,
      });
      setDraft("");
    } catch (e) {
      setBanner(e instanceof Error ? e.message : "تعذر الإرسال");
    } finally {
      setBusy(false);
    }
  }, [room, match, draft, displayName, myTurn]);

  const sendVoiceAck = useCallback(async () => {
    if (!room || !match || !myTurn) return;
    setBusy(true);
    setBanner(null);
    try {
      await postGame("/api/game/chat", {
        roomId: room.id,
        matchId: match.id,
        text: phase === "question" ? "(سؤال صوتي)" : "(إجابة صوتية)",
        displayName,
      });
    } catch (e) {
      setBanner(e instanceof Error ? e.message : "تعذر التقدم");
    } finally {
      setBusy(false);
    }
  }, [room, match, myTurn, phase, displayName]);

  const submitGuess = useCallback(async () => {
    if (!room || !match || !guessDraft.trim()) return;
    setBusy(true);
    setBanner(null);
    try {
      await postGame("/api/game/guess", {
        roomId: room.id,
        matchId: match.id,
        guess: guessDraft,
        displayName,
      });
      setGuessDraft("");
      setGuessInputOpen(false);
      setGuessSureOpen(false);
    } catch (e) {
      setBanner(e instanceof Error ? e.message : "تعذر إرسال التخمين");
    } finally {
      setBusy(false);
    }
  }, [room, match, guessDraft, displayName]);

  const copyCode = useCallback(async () => {
    if (!room) return;
    try {
      await navigator.clipboard.writeText(room.code);
      setBanner("تم نسخ الرمز ✓");
      window.setTimeout(() => setBanner(null), 1800);
    } catch {
      setBanner("تعذر النسخ");
    }
  }, [room]);

  const requestExit = useCallback(() => {
    resumeAudioContext();
    setLeaveConfirmOpen(true);
  }, []);

  const confirmLeave = useCallback(async () => {
    setLeaveConfirmOpen(false);
    try {
      if (room?.status === "playing" && match?.status === "active") {
        await postGame("/api/game/leave", { roomId: room.id });
      } else if (room?.status === "lobby") {
        await postGame("/api/game/leave", { roomId: room.id });
      }
    } catch {
      // still navigate home
    }
    router.replace("/");
  }, [room, match, router]);

  const openGuessFlow = useCallback(() => {
    resumeAudioContext();
    if (!myTurn) {
      setBanner("يمكن التخمين فقط في دورك");
      return;
    }
    setGuessSureOpen(true);
  }, [myTurn]);

  const confirmGuessSure = useCallback(() => {
    playGuessChime();
    setGuessSureOpen(false);
    setGuessInputOpen(true);
  }, []);

  if (!uid) return null;

  if (!room) {
    return (
      <div className="mx-auto flex min-h-[50vh] w-full max-w-lg flex-col justify-center px-4 py-10 text-center">
        <Panel>
          <p className="text-base text-[#a16231]">
            {wireError ? `خطأ: ${wireError}` : "جاري تحميل الغرفة أو لم تعد موجودة."}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button type="button" variant="ghost" onClick={() => router.push("/")}>
              الرئيسية
            </Button>
          </div>
        </Panel>
      </div>
    );
  }

  // ─── LOBBY ──────────────────────────────────────────────────────────────────
  if (room.status === "lobby") {
    const randomLobby = Boolean(room.randomMatch);
    return (
      <div className="mx-auto min-h-[100dvh] w-full max-w-lg space-y-4 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6 sm:px-4 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button type="button" variant="ghost" className="min-h-[44px]" onClick={requestExit}>
            ← الرئيسية
          </Button>
        </div>

        <AnimatePresence>
          {banner ? (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Panel className="border-[#f4c48d] bg-[#fff2de] text-[#9a5f2d]">{banner}</Panel>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {randomLobby ? (
          <Panel className="border-[#ffc982] bg-gradient-to-br from-[#fff8ee] to-[#ffe8ca]">
            <p className="text-sm font-bold text-[#c2410c]">مطابقة عشوائية</p>
            <p className="mt-2 text-sm text-[#a16231]">تم إيجاد خصمك — لا حاجة لرمز.</p>
          </Panel>
        ) : (
          <Panel>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-[#bc7a45]">غرفة انتظار · شارك الرمز مع صديقك</p>
              {voiceMode ? (
                <span className="shrink-0 rounded-xl bg-[#fff2dd] px-2.5 py-1 text-xs font-bold text-[#c2410c]">
                  🎙 وضع المكالمة
                </span>
              ) : null}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1 rounded-2xl border-2 border-[#f4be84] bg-[#fff6ea] px-4 py-3 text-center text-2xl font-black tracking-[0.35em] text-[#8a3f16] sm:text-3xl">
                {room.code}
              </div>
              <Button type="button" variant="ghost" className="min-h-[44px] shrink-0" onClick={() => void copyCode()}>
                نسخ
              </Button>
            </div>
            <p className="mt-3 text-sm text-[#a16231]">صديقك يدخل من «دخول برمز».</p>
          </Panel>
        )}

        <Panel>
          <h2 className="text-xl font-black text-[#8a3f16]">اللاعبون ({room.players.length}/2)</h2>
          <ul className="mt-3 space-y-2">
            {room.players.map((p) => (
              <li
                key={p.uid}
                className="flex min-h-[48px] items-center justify-between gap-2 rounded-2xl border border-[#f5cda4] bg-[#fff6ea] px-4 py-3 text-base"
              >
                <span className="min-w-0 truncate font-semibold text-[#8f4d1f]">
                  {p.displayName}
                  {p.uid === room.hostUid ? <span className="mr-2 text-xs text-[#c48652]">مضيف</span> : null}
                </span>
                <span className={`shrink-0 text-sm font-bold ${p.ready ? "text-[#16a34a]" : "text-[#bc7a45]"}`}>
                  {p.ready ? "✓ جاهز" : "غير جاهز"}
                </span>
              </li>
            ))}
            {room.players.length < 2 ? (
              <li className="rounded-2xl border border-dashed border-[#f5cda4] px-4 py-3 text-sm text-[#c48652]">
                بانتظار اللاعب الثاني…
              </li>
            ) : null}
          </ul>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button type="button" className="min-h-[48px]" disabled={busy} onClick={() => void toggleReady()}>
              {me?.ready ? "إلغاء الجاهزية" : "أنا جاهز ✓"}
            </Button>
            {!randomLobby && isHost ? (
              <Button type="button" className="min-h-[48px]" disabled={busy || !bothReady} onClick={() => void startMatch()}>
                بدء المباراة
              </Button>
            ) : null}
            {!randomLobby && !isHost ? (
              <p className="self-center text-sm text-[#bc7a45]">انتظر المضيف ليبدأ اللعب.</p>
            ) : null}
            {randomLobby && !isHost ? (
              <p className="self-center text-sm text-[#bc7a45]">جاري البدء تلقائياً…</p>
            ) : null}
          </div>
        </Panel>

        <AnimatePresence>
          {leaveConfirmOpen ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-[#6a3f1b]/45 px-4 backdrop-blur-sm"
              onClick={() => setLeaveConfirmOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.92 }}
                animate={{ scale: 1 }}
                onClick={(e: MouseEvent) => e.stopPropagation()}
              >
                <Panel className="max-w-sm text-center">
                  <p className="text-lg font-bold text-[#8a3f16]">هل أنت متأكد من الخروج؟</p>
                  <div className="mt-5 flex gap-3">
                    <Button type="button" className="flex-1" onClick={() => void confirmLeave()}>نعم</Button>
                    <Button type="button" variant="ghost" className="flex-1" onClick={() => setLeaveConfirmOpen(false)}>إلغاء</Button>
                  </div>
                </Panel>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }

  // ─── PLAYING / ENDED ────────────────────────────────────────────────────────

  const bannerText = match?.status === "active"
    ? myTurn
      ? voiceMode
        ? phase === "question" ? "اسأل الآن بصوتك!" : "أجب الآن بصوتك!"
        : phase === "question" ? "دورك — اسأل بسرعة!" : "أجب على السؤال"
      : voiceMode
        ? phase === "question" ? "الخصم يسألك… استمع" : "الخصم يجيب… انتظر"
        : phase === "question" ? "بانتظار سؤال الخصم" : "بانتظار إجابة الخصم"
    : null;

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col px-3 pb-[max(5.5rem,env(safe-area-inset-bottom))] pt-4">
      <ConfettiBurst active={ended && iWon && Boolean(winnerUid)} />

      {/* Nav */}
      <div className="mb-3 flex items-center justify-between">
        <Button type="button" variant="ghost" className="min-h-[44px]" onClick={requestExit}>
          ← الرئيسية
        </Button>
      </div>

      {/* Error/info banner */}
      <AnimatePresence>
        {banner ? (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Panel className="mb-3 border-[#f4c48d] bg-[#fff2de] text-[#9a5f2d]">{banner}</Panel>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {room.status === "playing" && !match ? (
        <Panel className="mb-3 border-[#f4d4af] bg-[#fff9ef] text-sm text-[#a16231]">
          جاري مزامنة حالة المباراة…
        </Panel>
      ) : null}

      {/* ── TURN BANNER ────────────────────────────────────── */}
      {match?.status === "active" && !ended ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${myTurn ? "mine" : "theirs"}-${phase}`}
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className={`mb-4 flex items-center justify-between gap-3 rounded-3xl px-5 py-4 ${
              myTurn
                ? "bg-[#ea8c2f] shadow-[0_6px_28px_rgba(234,140,47,0.5)]"
                : "border-2 border-[#f5c99b] bg-[#fff6ea]"
            }`}
          >
            <span
              className={`text-xl font-black leading-snug sm:text-2xl ${
                myTurn ? "text-white" : "text-[#8a3f16]"
              }`}
            >
              {bannerText}
            </span>
            {secLeft !== null ? (
              <CircularTimer secLeft={secLeft} maxSec={maxPhaseSec} active={myTurn} />
            ) : null}
          </motion.div>
        </AnimatePresence>
      ) : null}

      {/* ── OPPONENT CARD ───────────────────────────────────── */}
      <div className="mb-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#bc7a45]">
          بطاقة خصمك
        </p>
        <div className="relative overflow-hidden rounded-3xl border-2 border-[#f5c99b] bg-[#fff7eb] shadow-[0_12px_36px_rgba(220,140,50,0.24)]">
          <div className="pointer-events-none absolute -left-8 -top-8 h-24 w-24 rounded-full bg-[#ffb96b]/25 blur-2xl" />
          {opponentCard?.imageUrl ? (
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="relative aspect-[4/3] w-full"
            >
              <CardImage
                src={opponentCard.imageUrl}
                alt={opponentCard.nameAr}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-4 pb-4 pt-10">
                <h2 className="text-xl font-black text-white sm:text-2xl">
                  {opponentCard.nameAr}
                </h2>
              </div>
            </motion.div>
          ) : (
            <div className="flex aspect-[4/3] max-h-[44vh] items-center justify-center text-sm text-[#bc7a45]">
              بعد بدء المباراة
            </div>
          )}
        </div>
      </div>

      {/* ── VOICE MODE ACTIONS ──────────────────────────────── */}
      {voiceMode && match?.status === "active" && !ended ? (
        <div className="mb-4">
          {myTurn ? (
            <motion.button
              whileTap={{ scale: 0.96 }}
              disabled={busy}
              onClick={() => void sendVoiceAck()}
              className="w-full rounded-3xl bg-[#ea8c2f] py-6 text-2xl font-black text-white shadow-xl shadow-[#ea8c2f]/30 transition-opacity disabled:opacity-60 active:scale-95"
            >
              {phase === "question" ? "✓ تم السؤال" : "✓ تمت الإجابة"}
            </motion.button>
          ) : (
            <div className="rounded-3xl border-2 border-dashed border-[#f5c99b] bg-[#fff9ef] py-6 text-center text-lg font-bold text-[#bc7a45]">
              {phase === "question" ? "⏳ بانتظار سؤال الخصم…" : "⏳ بانتظار إجابة الخصم…"}
            </div>
          )}
        </div>
      ) : null}

      {/* ── CHAT (non-voice mode) ───────────────────────────── */}
      {!voiceMode && match?.status === "active" && !ended ? (
        <div className="mb-4 flex flex-col overflow-hidden rounded-3xl border border-[#f5c99b] bg-[#fff6ea]">
          {/* Chat header */}
          <div className="flex items-center justify-between px-4 pb-2 pt-3">
            <h3 className="text-sm font-bold text-[#8a3f16]">الدردشة</h3>
            <span
              className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                myTurn ? "bg-[#dcfce7] text-[#166534]" : "bg-[#fff2dd] text-[#a16231]"
              }`}
            >
              {myTurn
                ? phase === "answer" ? "دورك: إجابة" : "دورك: سؤال"
                : "دور الخصم"}
            </span>
          </div>

          {/* Messages */}
          <div className="min-h-[110px] max-h-[200px] space-y-2 overflow-y-auto px-3 pb-2 overscroll-contain [-webkit-overflow-scrolling:touch]">
            {messages.length === 0 ? (
              <p className="text-sm text-[#c48652]">لا رسائل بعد.</p>
            ) : (
              messages.map((m) => {
                const isMe = m.senderUid === uid;
                const isSystem = m.senderUid === "system";
                const isGuessMsg = m.type === "guess";
                const isQuestion = m.type === "question";
                return (
                  <motion.div
                    key={m.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 420, damping: 28 }}
                    className={`rounded-2xl px-3 py-2 text-sm shadow-sm ${
                      isSystem
                        ? "border border-[#f2d4b5] bg-[#fff0df] text-center text-[#8a5a2a]"
                        : isGuessMsg
                          ? m.correct
                            ? "border-2 border-[#16a34a] bg-[#dcfce7] text-[#14532d]"
                            : "border border-[#fca5a5] bg-[#fee2e2] text-[#7f1d1d]"
                          : isQuestion
                            ? "border border-[#93c5fd] bg-[#eff6ff] text-[#1e3a5f]"
                            : isMe
                              ? "border border-[#f0bf8a] bg-[#ffd7a8] text-[#6f3714]"
                              : "border border-[#e8d5b5] bg-white text-[#6f3714]"
                    }`}
                  >
                    {!isSystem ? (
                      <div className={`mb-1 text-xs font-semibold ${isMe ? "text-[#bc7a45]" : "text-[#9b6338]"}`}>
                        {isMe ? "أنت" : m.senderName}
                        {isQuestion ? " · سؤال" : null}
                        {isGuessMsg && m.correct ? " 🎉" : null}
                      </div>
                    ) : null}
                    <div className="whitespace-pre-wrap break-words">{m.text}</div>
                  </motion.div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-[#f5c99b] p-3">
            {myTurn ? (
              <div className="flex gap-2">
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={phase === "answer" ? `إجابتك (${aSec}ث)` : `سؤالك (${qSec}ث)`}
                  disabled={busy}
                  onKeyDown={(e) => { if (e.key === "Enter" && !busy) void sendDraft(); }}
                  className="min-h-[44px] flex-1"
                />
                <Button
                  type="button"
                  className="min-h-[44px] shrink-0 px-5"
                  disabled={busy || !draft.trim()}
                  onClick={() => void sendDraft()}
                >
                  إرسال
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 py-2 text-sm font-semibold text-[#c48652]">
                <span className="animate-pulse">●</span>
                <span>بانتظار دورك…</span>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* ── FLOATING GUESS BUTTON ────────────────────────────── */}
      {match?.status === "active" && !ended ? (
        <div className="fixed bottom-6 right-4 z-40">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={openGuessFlow}
            className={`flex items-center gap-1.5 rounded-2xl px-5 py-3.5 text-base font-bold shadow-lg transition-all duration-200 ${
              myTurn
                ? "bg-[#ea8c2f] text-white shadow-[#ea8c2f]/40"
                : "bg-[#f0e0cc] text-[#bc7a45]"
            }`}
          >
            🎯 <span>تخمين</span>
          </motion.button>
        </div>
      ) : null}

      {/* ── TURN TRANSITION POPUP ───────────────────────────── */}
      <AnimatePresence>
        {turnPopup ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.75, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.75, y: 24 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              className="rounded-3xl bg-[#ea8c2f] px-10 py-6 text-3xl font-black text-white shadow-2xl"
            >
              {turnPopup}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ── ENDED MODAL ─────────────────────────────────────── */}
      <AnimatePresence>
        {ended ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#6a3f1b]/50 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.88, y: 24 }}
              animate={
                iWon
                  ? { scale: 1, y: 0 }
                  : { scale: 1, y: 0, x: [0, -5, 5, -4, 4, 0], opacity: [1, 0.92, 1] }
              }
              transition={
                iWon
                  ? { type: "spring", stiffness: 240, damping: 22 }
                  : { duration: 0.55, times: [0, 0.2, 0.4, 0.6, 0.8, 1] }
              }
            >
              <Panel className="w-full max-w-sm text-center">
                <div className="text-6xl">{iWon ? "🏆" : "😅"}</div>
                <h2 className="mt-4 text-3xl font-black text-[#8a3f16] sm:text-4xl">
                  {winnerUid ? (iWon ? "فزت!" : "خسرت") : "انتهت المباراة"}
                </h2>
                <p className="mt-2 text-base text-[#a16231]">
                  {forfeitWin
                    ? "اللاعب الآخر قام بالمغادرة."
                    : iWon
                      ? "أحسنت!"
                      : winnerUid
                        ? "لا بأس — جرّب جولة أخرى!"
                        : "انتهت الجولة."}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Button type="button" className="min-h-[48px]" onClick={() => router.push("/play/random")}>
                    لعب عشوائي
                  </Button>
                  <Button type="button" variant="ghost" className="min-h-[48px]" onClick={() => router.push("/")}>
                    الرئيسية
                  </Button>
                </div>
              </Panel>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ── GUESS: ARE YOU SURE ──────────────────────────────── */}
      <AnimatePresence>
        {guessSureOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[55] flex items-center justify-center bg-[#6a3f1b]/45 px-4 backdrop-blur-sm"
            onClick={() => setGuessSureOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 14 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              onClick={(e: MouseEvent) => e.stopPropagation()}
            >
              <Panel className="max-w-sm text-center">
                <p className="text-xl font-black text-[#8a3f16]">هل أنت متأكد؟</p>
                <p className="mt-2 text-sm text-[#a16231]">سيتم استخدام محاولة التخمين في دورك الحالي.</p>
                <div className="mt-6 flex gap-3">
                  <Button type="button" className="min-h-[48px] flex-1" onClick={confirmGuessSure}>تأكيد</Button>
                  <Button type="button" variant="ghost" className="min-h-[48px] flex-1" onClick={() => setGuessSureOpen(false)}>إلغاء</Button>
                </div>
              </Panel>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ── GUESS: INPUT ─────────────────────────────────────── */}
      <AnimatePresence>
        {guessInputOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[54] flex items-center justify-center bg-[#6a3f1b]/40 px-4 backdrop-blur-sm"
            onClick={() => setGuessInputOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 18 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              onClick={(e: MouseEvent) => e.stopPropagation()}
            >
              <Panel className="w-full max-w-sm">
                <h3 className="text-2xl font-black text-[#8a3f16]">🎯 تخمين</h3>
                <p className="mt-2 text-sm text-[#a16231]">ما اسم بطاقتك؟</p>
                <div className="mt-4 space-y-3">
                  <Input
                    value={guessDraft}
                    onChange={(e) => setGuessDraft(e.target.value)}
                    placeholder="مثال: جوال، قطة…"
                    className="min-h-[48px]"
                    onKeyDown={(e) => { if (e.key === "Enter") void submitGuess(); }}
                  />
                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      className="min-h-[48px] flex-1"
                      disabled={busy || !guessDraft.trim()}
                      onClick={() => void submitGuess()}
                    >
                      تأكيد التخمين
                    </Button>
                    <Button type="button" variant="ghost" className="min-h-[48px]" onClick={() => setGuessInputOpen(false)}>
                      إلغاء
                    </Button>
                  </div>
                </div>
              </Panel>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ── LEAVE CONFIRM ───────────────────────────────────── */}
      <AnimatePresence>
        {leaveConfirmOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[56] flex items-center justify-center bg-[#6a3f1b]/45 px-4 backdrop-blur-sm"
            onClick={() => setLeaveConfirmOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              onClick={(e: MouseEvent) => e.stopPropagation()}
            >
              <Panel className="max-w-sm text-center">
                <p className="text-lg font-bold text-[#8a3f16]">هل أنت متأكد من الخروج؟</p>
                <div className="mt-5 flex gap-3">
                  <Button type="button" className="min-h-[48px] flex-1" onClick={() => void confirmLeave()}>نعم</Button>
                  <Button type="button" variant="ghost" className="min-h-[48px] flex-1" onClick={() => setLeaveConfirmOpen(false)}>إلغاء</Button>
                </div>
              </Panel>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
