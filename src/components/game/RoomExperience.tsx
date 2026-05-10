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
  const chatEndRef = useRef<HTMLDivElement>(null);
  const autoStartRef = useRef(false);
  const firedTimeoutForDeadline = useRef<number | null>(null);
  const prevMyTurn = useRef(false);
  const prevMsgCount = useRef(0);
  const lastTickSecond = useRef<number | null>(null);
  const confettiDone = useRef(false);
  const defeatPlayed = useRef(false);

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

  useEffect(() => {
    if (myTurn && !prevMyTurn.current && match?.status === "active") {
      playTurnCue();
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
            <p className="text-sm text-[#bc7a45]">غرفة انتظار · شارك الرمز مع صديقك</p>
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
                    <Button type="button" className="flex-1" onClick={() => void confirmLeave()}>
                      نعم
                    </Button>
                    <Button type="button" variant="ghost" className="flex-1" onClick={() => setLeaveConfirmOpen(false)}>
                      إلغاء
                    </Button>
                  </div>
                </Panel>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-4 sm:py-6">
      <ConfettiBurst active={ended && iWon && Boolean(winnerUid)} />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="ghost" className="min-h-[44px]" onClick={requestExit}>
          ← الرئيسية
        </Button>
      </div>

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

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
        <Panel className="order-1 flex min-h-[min(52vh,520px)] flex-col lg:order-2 lg:min-h-[560px]">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-lg font-black text-[#8a3f16] sm:text-xl">الدردشة</h3>
            {match?.status === "active" ? (
              <div className="flex flex-wrap items-center gap-2">
                <motion.span
                  layout
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
                    myTurn ? "bg-[#dcfce7] text-[#166534]" : "bg-[#fff2dd] text-[#a16231]"
                  }`}
                >
                  {myTurn
                    ? phase === "answer"
                      ? "دورك: إجابة"
                      : "دورك: سؤال"
                    : "دور الخصم"}
                </motion.span>
                {secLeft !== null && match.status === "active" ? (
                  <span className="rounded-xl bg-[#fff7ed] px-3 py-1.5 font-mono text-sm font-bold tabular-nums text-[#c2410c]">
                    {secLeft}ث / {maxPhaseSec}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[#c48652]">
            بالتناوب: {qSec}ث سؤال، ثم {aSec}ث إجابة.
          </p>

          <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto rounded-3xl border border-[#f5c99b] bg-[#fff6ea] p-3 overscroll-contain [-webkit-overflow-scrolling:touch]">
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
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 420, damping: 28 }}
                    className={`rounded-2xl px-3 py-2 text-sm shadow-sm ${
                      isSystem
                        ? "border border-[#f2d4b5] bg-[#fff0df] text-[#8a5a2a] text-center"
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
                        {isGuessMsg ? (
                          <span className="mr-1">{m.correct ? " 🎉" : ""}</span>
                        ) : null}
                      </div>
                    ) : null}
                    <div className="whitespace-pre-wrap break-words">{m.text}</div>
                  </motion.div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {!ended && match?.status === "active" ? (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={
                  !myTurn
                    ? "انتظر دور الخصم…"
                    : phase === "answer"
                      ? `إجابتك (${aSec}ث)`
                      : `سؤالك (${qSec}ث)`
                }
                disabled={!myTurn || busy}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && myTurn) void sendDraft();
                }}
                className="min-h-[48px] flex-1"
              />
              <Button
                type="button"
                className="min-h-[48px] shrink-0 px-6 active:scale-[0.98]"
                disabled={busy || !draft.trim() || !myTurn}
                onClick={() => void sendDraft()}
              >
                إرسال
              </Button>
            </div>
          ) : null}

          {!ended && match?.status === "active" && !myTurn ? (
            <p className="mt-2 text-center text-xs font-semibold text-[#bc7a45]">مفتاح الإدخال مقفول حتى دورك</p>
          ) : null}
        </Panel>

        <div className="order-2 space-y-3 lg:order-1">
          <Panel className="relative overflow-hidden">
            <div className="pointer-events-none absolute -left-6 -top-6 h-16 w-16 rounded-full bg-[#ffb96b]/40 blur-xl" />
            <p className="text-xs font-semibold uppercase tracking-wider text-[#bc7a45]">بطاقة خصمك</p>
            <h2 className="mt-1 text-lg font-black text-[#8a3f16] sm:text-xl">
              {opponentCard ? opponentCard.nameAr : "انتظار…"}
            </h2>
            <div className="mt-3 overflow-hidden rounded-3xl border-2 border-[#f5c99b] bg-[#fff7eb] shadow-[0_12px_24px_rgba(220,140,50,0.18)]">
              {opponentCard?.imageUrl ? (
                <motion.div layout className="relative aspect-[4/3] w-full max-h-[min(52vh,420px)]">
                  <Image
                    src={opponentCard.imageUrl}
                    alt={opponentCard.nameAr}
                    fill
                    className="object-cover"
                    sizes="100vw"
                    unoptimized
                  />
                </motion.div>
              ) : (
                <div className="flex aspect-[4/3] max-h-[40vh] items-center justify-center text-sm text-[#bc7a45]">
                  بعد بدء المباراة
                </div>
              )}
            </div>
          </Panel>

          <Panel>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#bc7a45]">بطاقتك الخفية</p>
            <h2 className="mt-1 text-xl font-black text-[#8a3f16]">؟؟؟</h2>
            <div className="mt-3 flex aspect-[4/3] w-full max-h-[min(40vh,320px)] items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-[#f5c99b] bg-gradient-to-br from-[#fff6ea] to-[#ffe8ca]">
              <div className="text-center">
                <div className="text-6xl">🃏</div>
                <p className="mt-3 text-sm font-bold text-[#bc7a45]">مخفية عنك</p>
              </div>
            </div>
            {match?.status === "active" ? (
              <Button
                type="button"
                className="mt-4 min-h-[52px] w-full text-lg active:scale-[0.99]"
                disabled={busy || !myTurn}
                onClick={openGuessFlow}
              >
                🎯 تخمين
              </Button>
            ) : null}
            {match?.status === "active" && !myTurn ? (
              <p className="mt-2 text-center text-xs text-[#c48652]">التخمين متاح في دورك فقط</p>
            ) : null}
          </Panel>
        </div>
      </div>

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
                  <Button type="button" className="min-h-[48px] flex-1" onClick={confirmGuessSure}>
                    تأكيد
                  </Button>
                  <Button type="button" variant="ghost" className="min-h-[48px] flex-1" onClick={() => setGuessSureOpen(false)}>
                    إلغاء
                  </Button>
                </div>
              </Panel>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

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
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void submitGuess();
                    }}
                  />
                  <div className="flex flex-wrap gap-3">
                    <Button type="button" className="min-h-[48px] flex-1" disabled={busy || !guessDraft.trim()} onClick={() => void submitGuess()}>
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

      <AnimatePresence>
        {leaveConfirmOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[56] flex items-center justify-center bg-[#6a3f1b]/45 px-4 backdrop-blur-sm"
            onClick={() => setLeaveConfirmOpen(false)}
          >
            <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} onClick={(e: MouseEvent) => e.stopPropagation()}>
              <Panel className="max-w-sm text-center">
                <p className="text-lg font-bold text-[#8a3f16]">هل أنت متأكد من الخروج؟</p>
                <div className="mt-5 flex gap-3">
                  <Button type="button" className="flex-1 min-h-[48px]" onClick={() => void confirmLeave()}>
                    نعم
                  </Button>
                  <Button type="button" variant="ghost" className="flex-1 min-h-[48px]" onClick={() => setLeaveConfirmOpen(false)}>
                    إلغاء
                  </Button>
                </div>
              </Panel>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
