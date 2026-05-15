"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { CSSProperties, MouseEvent } from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useOptimistic,
  useRef,
  useState,
  startTransition,
  type ChangeEvent,
} from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { isFullAccountUser } from "@/lib/auth/google-user";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
import {
  playCorrectGuess,
  playCountdownTick,
  playDefeatTone,
  playGuessChime,
  playMessagePop,
  playMessageSend,
  playReadyTap,
  playRoomJoin,
  playRoomReady,
  playTurnCue,
  playUIButton,
  playWinSparkle,
  playWrongGuess,
  resumeAudioContext,
} from "@/lib/audio/game-sounds";
import { postGame } from "@/lib/api/game-client";
import { isOpponentCustomCardComplete } from "@/lib/custom-cards/opponent-card-gate";
import { processCardImageFile } from "@/lib/custom-cards/process-image";
import {
  ANSWER_PHASE_SECONDS,
  QUESTION_PHASE_SECONDS,
} from "@/lib/game/constants";
import { generateGuessAliases } from "@/lib/game/guess-alias-generator";
import { setPlayerReady } from "@/lib/firestore/rooms.client";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { usePlayerCosmetics } from "@/hooks/usePlayerCosmetics";
import { useGamePresenceReporter } from "@/hooks/useGamePresenceReporter";
import { useSocialInboxDeclineToast } from "@/hooks/useSocialInboxDeclineToast";
import { useRoomWire } from "@/hooks/useRoomWire";
import { useVisualKeyboardOverlapPx } from "@/hooks/useVisualViewport";
import { useRouter } from "next/navigation";
import { ConfettiBurst } from "@/components/game/ConfettiBurst";
import { MatchResultScreen } from "@/components/game/MatchResultScreen";
import { MatchVsIntroOverlay } from "@/components/game/MatchVsIntroOverlay";
import { GameplaySocialSurface } from "@/components/game/GameplaySocialSurface";
import { VoiceModePlayingPanel } from "@/components/game/VoiceModePlayingPanel";
import { RoomInviteFriendsPanel } from "@/components/social/RoomInviteFriendsPanel";

type Props = { roomId: string };

// ─── ROOM EXPERIENCE ────────────────────────────────────────────────────────

export function RoomExperience({ roomId }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const uid = user?.uid ?? null;
  const displayName = user?.displayName || user?.email || "زائر";

  const { room, match, messages, opponentCard, wireError } = useRoomWire(roomId, uid);

  const cosmeticUids = useMemo(
    () => (room?.players ?? []).map((p) => p.uid).filter(Boolean) as string[],
    [room?.players],
  );
  const cosmeticsMap = usePlayerCosmetics(cosmeticUids);

  const opponentPlayer = useMemo(
    () => (room && uid ? room.players.find((p) => p.uid !== uid) : undefined),
    [room, uid],
  );
  const opponentNameForVs = opponentPlayer?.displayName ?? "الخصم";

  const [draft, setDraft] = useState("");
  const [guessSureOpen, setGuessSureOpen] = useState(false);
  const [guessInputOpen, setGuessInputOpen] = useState(false);
  const [guessDraft, setGuessDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [turnPopup, setTurnPopup] = useState<string | null>(null);
  const [vsIntroOpen, setVsIntroOpen] = useState(false);
  const vsIntroGen = useRef(0);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const [composerFocused, setComposerFocused] = useState(false);
  const keyboardOverlapPx = useVisualKeyboardOverlapPx(composerFocused);
  const autoStartRef = useRef(false);
  const firedTimeoutForDeadline = useRef<number | null>(null);
  const prevMyTurn = useRef(false);
  const prevMsgCount = useRef(0);
  const lastTickSecond = useRef<number | null>(null);
  const confettiDone = useRef(false);
  const defeatPlayed = useRef(false);
  const turnPopupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevRoomStatusRef = useRef<string | null>(null);
  const prevLobbyPlayerCount = useRef<number | null>(null);
  const prevLobbyAllReady = useRef<boolean | null>(null);
  const seenGuessMessageIds = useRef(new Set<string>());
  const guessSoundBootstrapped = useRef(false);
  const lobbyCustomFileRef = useRef<HTMLInputElement>(null);
  const [lobbyCustomName, setLobbyCustomName] = useState("");
  const [lobbyCustomPreview, setLobbyCustomPreview] = useState<string | null>(null);
  const [lobbyCustomBusy, setLobbyCustomBusy] = useState(false);
  const [friendInviteOpen, setFriendInviteOpen] = useState(false);
  const [customSavePulse, setCustomSavePulse] = useState(0);

  const [clock, setClock] = useState(() => Date.now());
  const needLiveClock = Boolean(match?.status === "active" && room?.status === "playing");
  useEffect(() => {
    const bump = () => setClock(Date.now());
    const onVis = () => {
      if (document.visibilityState === "visible") bump();
    };
    window.addEventListener("focus", bump);
    document.addEventListener("visibilitychange", onVis);
    // RAF was throttled heavily on desktop background tabs and some browsers,
    // which froze the turn timer. A short interval stays aligned with
    // `turnDeadline` updates from Firestore on both mobile and desktop.
    const tickMs = needLiveClock ? 200 : 1000;
    bump();
    const id = window.setInterval(bump, tickMs);
    return () => {
      window.removeEventListener("focus", bump);
      document.removeEventListener("visibilitychange", onVis);
      window.clearInterval(id);
    };
  }, [needLiveClock, match?.status, room?.status]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const snapChatToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const el = chatScrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior });
    });
  }, []);

  /** While the composer is focused, keep the message list pinned to the bottom
   *  when the VisualViewport shrinks (soft keyboard) so nothing “jumps away”. */
  useEffect(() => {
    if (!composerFocused) return;
    const vv = window.visualViewport;
    const onVv = () => snapChatToBottom("auto");
    vv?.addEventListener("resize", onVv);
    vv?.addEventListener("scroll", onVv);
    window.addEventListener("resize", onVv);
    onVv();
    return () => {
      vv?.removeEventListener("resize", onVv);
      vv?.removeEventListener("scroll", onVv);
      window.removeEventListener("resize", onVv);
    };
  }, [composerFocused, snapChatToBottom]);

  const me = room?.players.find((p) => p.uid === uid);
  const [myReadyOptimistic, addMyReadyOptimistic] = useOptimistic(
    Boolean(me?.ready),
    (_current: boolean, next: boolean) => next,
  );
  const isHost = Boolean(uid && room?.hostUid === uid);
  const googleSoc = isFullAccountUser(user);
  useGamePresenceReporter({
    uid: googleSoc ? uid : null,
    enabled: Boolean(googleSoc && uid && room),
    presence:
      room?.status === "lobby" ? "in_lobby" : room?.status === "playing" ? "in_match" : "online",
    roomId: room?.id ?? null,
    resetOnUnmount: true,
  });

  const declineTimerRef = useRef<number | null>(null);
  const toastDecline = useCallback((msg: string) => {
    if (declineTimerRef.current) window.clearTimeout(declineTimerRef.current);
    setBanner(msg);
    declineTimerRef.current = window.setTimeout(() => {
      setBanner(null);
      declineTimerRef.current = null;
    }, 5500);
  }, []);
  useSocialInboxDeclineToast(
    uid,
    Boolean(googleSoc && isHost && room?.status === "lobby"),
    toastDecline,
  );

  const bothReady = Boolean(
    room?.playerUids?.length === 2 &&
      room.playerUids.every((pid) =>
        pid === uid
          ? myReadyOptimistic
          : room.players.some((p) => p.uid === pid && p.ready),
      ),
  );
  const voiceMode = Boolean(room?.voiceMode && !room?.randomMatch);

  const ended = room?.status === "ended" || match?.status === "ended";

  useEffect(() => {
    if (!room || room.status !== "playing" || !match || match.status !== "active" || ended) return;
    const startedMs = match.startedAt?.toMillis?.() ?? 0;
    if (startedMs > 0 && Date.now() - startedMs > 12000) return;

    vsIntroGen.current += 1;
    const gen = vsIntroGen.current;
    setVsIntroOpen(true);
    const t = window.setTimeout(() => {
      if (vsIntroGen.current === gen) setVsIntroOpen(false);
    }, 2600);
    return () => {
      vsIntroGen.current += 1;
      window.clearTimeout(t);
    };
  }, [room?.status, match?.id, match?.status, ended]);

  useEffect(() => {
    if (ended) setVsIntroOpen(false);
  }, [ended]);

  useEffect(() => {
    if (!room || room.status !== "playing") setVsIntroOpen(false);
  }, [room?.id, room?.status]);

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

  // Bot tick: when playing against a bot and it's the bot's turn, poll the
  // server to advance the bot's move. Only the host drives this loop so the
  // server doesn't get spammed from multiple clients (there's only one human
  // in a bot room anyway, but we guard defensively).
  useEffect(() => {
    if (!room?.vsBot || !isHost) return;
    if (match?.status !== "active") return;
    const botUid = room.botUid;
    if (!botUid) return;
    if (match.actorUid !== botUid) return;

    // Humanize: wait 900-1800ms before the bot moves so it feels natural.
    const delay = 900 + Math.floor(Math.random() * 900);
    const t = window.setTimeout(() => {
      void postGame("/api/game/bot-tick", { roomId: room.id }).catch(() => undefined);
    }, delay);
    return () => window.clearTimeout(t);
  }, [room?.vsBot, room?.botUid, room?.id, isHost, match?.status, match?.actorUid]);

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
    seenGuessMessageIds.current.clear();
    guessSoundBootstrapped.current = false;
  }, [roomId]);

  useEffect(() => {
    if (!guessSoundBootstrapped.current) {
      for (const m of messages) {
        if (m.type === "guess") seenGuessMessageIds.current.add(m.id);
      }
      guessSoundBootstrapped.current = true;
      return;
    }
    for (const m of messages) {
      if (m.type !== "guess") continue;
      if (seenGuessMessageIds.current.has(m.id)) continue;
      seenGuessMessageIds.current.add(m.id);
      resumeAudioContext();
      if (m.correct) playCorrectGuess();
      else playWrongGuess();
    }
  }, [messages]);

  useEffect(() => {
    if (room?.status !== "lobby") {
      prevLobbyPlayerCount.current = null;
      return;
    }
    const n = room.players.length;
    if (prevLobbyPlayerCount.current === null) {
      prevLobbyPlayerCount.current = n;
      return;
    }
    if (n > prevLobbyPlayerCount.current) {
      resumeAudioContext();
      playRoomJoin();
    }
    prevLobbyPlayerCount.current = n;
  }, [room?.status, room?.players]);

  useEffect(() => {
    if (room?.status !== "lobby") {
      prevLobbyAllReady.current = null;
      return;
    }
    const allReady = Boolean(
      room.playerUids?.length === 2 &&
        room.playerUids.every((pid) => room.players.some((p) => p.uid === pid && p.ready)),
    );
    if (prevLobbyAllReady.current === null) {
      prevLobbyAllReady.current = allReady;
      return;
    }
    if (allReady && !prevLobbyAllReady.current) {
      resumeAudioContext();
      playRoomReady();
    }
    prevLobbyAllReady.current = allReady;
  }, [room?.status, room?.players, room?.playerUids]);

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
    const s = room?.status;
    if (!s) return;
    const wasEnded = prevRoomStatusRef.current === "ended";
    prevRoomStatusRef.current = s;
    if (s === "lobby" && wasEnded) {
      confettiDone.current = false;
      defeatPlayed.current = false;
      autoStartRef.current = false;
      setLobbyCustomName("");
      setLobbyCustomPreview(null);
    }
  }, [room?.status]);

  useEffect(() => {
    if (!ended || !iWon || !winnerUid) return;
    if (!confettiDone.current) {
      confettiDone.current = true;
      playWinSparkle();
    }
  }, [ended, iWon, winnerUid]);

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

  const handleReplay = useCallback(async () => {
    if (!room) return;
    resumeAudioContext();
    if (room.randomMatch) {
      router.push("/play/random");
      return;
    }
    setBusy(true);
    setBanner(null);
    try {
      await postGame("/api/game/replay", { roomId: room.id });
    } catch (e) {
      setBanner(e instanceof Error ? e.message : "تعذر إعادة اللعب");
    } finally {
      setBusy(false);
    }
  }, [room, router]);

  const myLobbyPickId =
    uid && room?.customOpponentSelections?.[uid]
      ? room.customOpponentSelections[uid].id
      : undefined;

  useEffect(() => {
    if (room?.status !== "lobby" || !uid) return;
    const mine = room.customOpponentSelections?.[uid];
    if (!mine) {
      setLobbyCustomName("");
      setLobbyCustomPreview(null);
      return;
    }
    setLobbyCustomName(mine.nameAr);
    setLobbyCustomPreview(mine.imageUrl);
  }, [room?.status, uid, myLobbyPickId]);

  const onLobbyCustomFile = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLobbyCustomBusy(true);
    try {
      const url = await processCardImageFile(file);
      setLobbyCustomPreview(url);
    } catch (err) {
      setBanner(err instanceof Error ? err.message : "تعذر معالجة الصورة");
    } finally {
      setLobbyCustomBusy(false);
    }
  }, []);

  const submitLobbyOpponentCard = useCallback(async () => {
    if (!room || !uid || !lobbyCustomPreview || !lobbyCustomName.trim()) return;
    setLobbyCustomBusy(true);
    setBanner(null);
    try {
      const existingId = room.customOpponentSelections?.[uid]?.id;
      await postGame("/api/game/opponent-custom-card", {
        roomId: room.id,
        card: {
          ...(existingId ? { id: existingId } : {}),
          nameAr: lobbyCustomName.trim(),
          imageUrl: lobbyCustomPreview,
          aliases: [...new Set(generateGuessAliases(lobbyCustomName.trim()))],
        },
      });
      setCustomSavePulse((n) => n + 1);
      setBanner("تم حفظ بطاقتك لخصمك ✓");
      window.setTimeout(() => setBanner(null), 2400);
    } catch (e) {
      setBanner(e instanceof Error ? e.message : "تعذر الحفظ");
    } finally {
      setLobbyCustomBusy(false);
    }
  }, [room, uid, lobbyCustomPreview, lobbyCustomName]);

  const toggleReady = useCallback(async () => {
    if (!room || !uid || !me) return;
    resumeAudioContext();
    playReadyTap();
    setBusy(true);
    const next = !me.ready;
    startTransition(async () => {
      addMyReadyOptimistic(next);
      try {
        await setPlayerReady(room.id, uid, next);
      } finally {
        setBusy(false);
      }
    });
  }, [room, uid, me, addMyReadyOptimistic]);

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
      resumeAudioContext();
      playMessageSend();
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

  const renderMessage = useCallback((m: (typeof messages)[number]) => {
    const isMe = m.senderUid === uid;
    const isSystem = m.senderUid === "system";
    const isGuessMsg = m.type === "guess";
    // Some flows tag explicit "answer" messages; current backend uses "chat"
    // for the post-question reply, but we keep this branch for forward compat.
    const isAnswer = (m.type as string) === "answer";
    const isQuestion = m.type === "question";

    // ── system / event pill ──────────────────────────────────
    if (isSystem) {
      return (
        <motion.div
          key={m.id}
          layout
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="mx-auto w-fit max-w-[85%] rounded-full border border-[#f2d4b5]/70 bg-gradient-to-b from-[#fff8ef] to-[#fff4e6] px-4 py-1.5 text-center text-[11px] font-semibold text-[#8a5a2a] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_2px_8px_rgba(196,134,82,0.10)]"
        >
          {m.text}
        </motion.div>
      );
    }

    // ── guess bubble ─────────────────────────────────────────
    if (isGuessMsg) {
      const guessCosmetic =
        isMe && uid
          ? cosmeticsMap[uid]
          : !isMe && m.senderUid && m.senderUid !== "system"
            ? cosmeticsMap[m.senderUid]
            : undefined;

      return (
        <motion.div
          key={m.id}
          layout
          initial={{ opacity: 0, scale: 0.86, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
          className={`mx-1 flex items-end gap-2.5 overflow-visible ${isMe ? "flex-row-reverse" : "flex-row"}`}
        >
          <div className="mb-1 shrink-0">
            <ProfileAvatar
              cosmetic={guessCosmetic}
              fallbackPhotoURL={isMe ? user?.photoURL : undefined}
              displayName={isMe ? displayName : m.senderName ?? undefined}
              size="sm"
              idle
              active={isMe}
            />
          </div>

          <div
            className="min-w-0 flex-1 overflow-hidden rounded-[1.5rem]"
            style={
              m.correct
                ? {
                    background: "linear-gradient(180deg,#f0fdf4 0%,#dcfce7 100%)",
                    border: "2px solid rgba(22,163,74,0.40)",
                    boxShadow:
                      "0 0 0 4px rgba(22,163,74,0.09), 0 8px 24px rgba(22,163,74,0.18), inset 0 1px 0 rgba(255,255,255,0.7)",
                  }
                : {
                    background: "linear-gradient(180deg,#fff5f5 0%,#fff0f0 100%)",
                    border: "2px solid rgba(252,165,165,0.55)",
                    boxShadow:
                      "0 0 0 3px rgba(252,165,165,0.10), 0 6px 16px rgba(220,80,80,0.08), inset 0 1px 0 rgba(255,255,255,0.6)",
                  }
            }
          >
            <div
              className={`flex items-center gap-2 px-4 py-2 text-[11px] font-extrabold ${
                m.correct
                  ? "bg-gradient-to-r from-[#bbf7d0] to-[#86efac]/50 text-[#15803d]"
                  : "bg-gradient-to-r from-[#fecaca] to-[#fca5a5]/50 text-[#b91c1c]"
              }`}
            >
              <span>{m.correct ? "🏆 تخمين صحيح!" : "✗ تخمين خاطئ"}</span>
              <span className="mr-auto text-[10px] opacity-70">
                {isMe ? "أنت" : m.senderName}
              </span>
            </div>
            <div
              className={`px-4 py-3 text-[15px] font-black leading-snug ${
                m.correct ? "text-[#14532d]" : "text-[#7f1d1d]"
              }`}
            >
              {m.text}
            </div>
          </div>
        </motion.div>
      );
    }

    // ── normal question / answer / chat bubble ────────────────
    // Gradients per type: question→purple depth, answer→green depth,
    // me→warm orange, them→clean white with warm border
    const bubbleStyle: CSSProperties = isQuestion
      ? {
          background: "linear-gradient(135deg,#ede9fe 0%,#ddd6fe 100%)",
          border: "1.5px solid rgba(167,139,250,0.45)",
          boxShadow:
            "0 4px 16px rgba(139,92,246,0.11), inset 0 1px 0 rgba(255,255,255,0.55)",
          color: "#3b1f6e",
        }
      : isAnswer
        ? {
            background: "linear-gradient(135deg,#dcfce7 0%,#bbf7d0 100%)",
            border: "1.5px solid rgba(74,222,128,0.38)",
            boxShadow:
              "0 4px 16px rgba(22,163,74,0.11), inset 0 1px 0 rgba(255,255,255,0.55)",
            color: "#14532d",
          }
        : isMe
          ? {
              background: "linear-gradient(135deg,#ffd7a8 0%,#ffcc8a 100%)",
              border: "1.5px solid rgba(240,191,138,0.65)",
              boxShadow:
                "0 4px 14px rgba(196,120,40,0.16), inset 0 1px 0 rgba(255,255,255,0.42)",
              color: "#6f3714",
            }
          : {
              background: "linear-gradient(180deg,#ffffff 0%,#fff9f4 100%)",
              border: "1.5px solid rgba(232,213,181,0.75)",
              boxShadow:
                "0 4px 14px rgba(196,134,82,0.09), inset 0 1px 0 rgba(255,255,255,0.85)",
              color: "#6f3714",
            };

    const typeTag = isQuestion ? "سؤال" : isAnswer ? "إجابة" : null;

    const senderCosmetic =
      isMe && uid
        ? cosmeticsMap[uid]
        : !isMe && m.senderUid && m.senderUid !== "system"
          ? cosmeticsMap[m.senderUid]
          : undefined;

    return (
      <motion.div
        key={m.id}
        layout
        initial={{ opacity: 0, x: isMe ? 14 : -14, y: 4 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 28 }}
        className={`flex items-end gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}
      >
        <div className="mb-0.5 shrink-0">
          <ProfileAvatar
            cosmetic={senderCosmetic}
            fallbackPhotoURL={isMe ? user?.photoURL : undefined}
            displayName={isMe ? displayName : m.senderName ?? undefined}
            size="sm"
            idle
            active={isMe}
          />
        </div>

        <div
          className="max-w-[76%] rounded-[1.45rem] px-4 py-3 text-sm leading-relaxed sm:max-w-[70%]"
          style={bubbleStyle}
        >
          {typeTag ? (
            <div
              className={`mb-1.5 text-[9.5px] font-extrabold uppercase tracking-wider ${
                isQuestion ? "text-[#7c3aed]" : "text-[#16a34a]"
              }`}
            >
              {typeTag}
            </div>
          ) : !isMe ? (
            <div className="mb-1 text-[10px] font-bold text-[#9b6338]/80">
              {m.senderName}
            </div>
          ) : null}
          <div className="whitespace-pre-wrap break-words font-medium">{m.text}</div>
        </div>
      </motion.div>
    );
  }, [uid, cosmeticsMap, user, displayName]);

  if (!uid) return null;

  if (!room) {
    return (
      <div className="mx-auto flex h-full min-h-0 w-full max-w-lg flex-1 flex-col justify-center px-4 py-10 text-center">
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

    // Resolve player slots: me first, opponent second
    const mePlayer = room.players.find((p) => p.uid === uid);
    const opponent = room.players.find((p) => p.uid !== uid);

    const sel = room.customOpponentSelections ?? {};
    const assigned = room.customOpponentCardAssigned ?? {};
    const puids = room.playerUids;
    const customModeActive = room.customCardsEnabled === true;
    const isBot = (pid: string) => pid.startsWith("bot:");
    // Bot opponents auto-pick a random card from the catalog when the match
    // starts, so we treat their slot as already completed in the lobby UI.
    const uidCardComplete = (pid: string) =>
      isBot(pid) || assigned[pid] === true || isOpponentCustomCardComplete(sel[pid]);
    const bothPickedCustom =
      !customModeActive ||
      randomLobby ||
      (puids.length === 2 && puids.every((pid) => uidCardComplete(pid)));
    // Allow uploading the opponent card even before the opponent has joined —
    // the server stores it keyed by the giver's uid and applies it when the match starts.
    const customLobby = Boolean(customModeActive && !randomLobby);

    const mePickDone = uid ? uidCardComplete(uid) : false;
    const oppPickDone = opponent ? uidCardComplete(opponent.uid) : false;
    const myLobbyPickUi = uid ? sel[uid] : undefined;
    const tileImageSrc = lobbyCustomPreview ?? myLobbyPickUi?.imageUrl ?? null;
    const dirtyAgainstServer = Boolean(
      uid &&
        mePickDone &&
        myLobbyPickUi &&
        (lobbyCustomName.trim() !== (myLobbyPickUi.nameAr ?? "").trim() ||
          (lobbyCustomPreview != null && lobbyCustomPreview !== myLobbyPickUi.imageUrl)),
    );
    const showCardSuccessVisual = mePickDone && !dirtyAgainstServer;
    const showDraftEditVisual = mePickDone && dirtyAgainstServer;

    return (
      <div
        dir="rtl"
        className="relative flex h-full min-h-0 w-full flex-1 flex-col overflow-x-hidden overflow-y-auto select-none"
        style={{
          background:
            "radial-gradient(120% 70% at 50% 0%, #FFF1DD 0%, #FCE9D4 55%, #FFEED8 100%)",
        }}
      >
        {/* ── ambient decor ── */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <motion.div
            animate={{ y: [0, -22, 0], x: [0, 12, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#FFCB8A]/50 blur-3xl"
          />
          <motion.div
            animate={{ y: [0, 18, 0], x: [0, -10, 0] }}
            transition={{ duration: 17, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute -left-28 top-1/3 h-80 w-80 rounded-full bg-[#FFB574]/38 blur-3xl"
          />
          <motion.div
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 5 }}
            className="absolute bottom-28 right-1/4 h-56 w-56 rounded-full bg-[#FFD9A6]/46 blur-3xl"
          />
          {([
            { char: "؟", top: "6%",  left: "4%",   delay: 0,   size: 52, tint: "rgba(176,92,255,0.11)" },
            { char: "؟", top: "28%", right: "5%",  delay: 1.4, size: 42, tint: "rgba(255,138,30,0.16)" },
            { char: "؟", top: "65%", left: "7%",   delay: 3,   size: 48, tint: "rgba(78,163,255,0.12)" },
            { char: "✦", top: "15%", right: "13%", delay: 0.7, size: 18, tint: "rgba(255,180,90,0.68)"  },
            { char: "✦", top: "48%", left: "17%",  delay: 2.6, size: 14, tint: "rgba(155,89,255,0.58)"  },
            { char: "✦", top: "80%", right: "19%", delay: 4.3, size: 20, tint: "rgba(78,163,255,0.54)"  },
          ] as const).map((s, i) => (
            <motion.span
              key={i}
              aria-hidden
              style={{
                position: "absolute",
                top: s.top,
                left: "left" in s ? s.left : undefined,
                right: "right" in s ? s.right : undefined,
                fontSize: s.size,
                color: s.tint,
                fontWeight: 900,
                userSelect: "none",
              }}
              animate={{ y: [0, -10, 0], rotate: [0, 6, 0] }}
              transition={{ duration: 6 + s.delay, repeat: Infinity, ease: "easeInOut", delay: s.delay }}
            >
              {s.char}
            </motion.span>
          ))}
        </div>

        <input
          ref={lobbyCustomFileRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,.png,.jpg,.jpeg,.webp"
          className="hidden"
          onChange={(ev) => void onLobbyCustomFile(ev)}
        />

        {/* ── scroll container ── */}
        <div className="relative z-10 mx-auto w-full max-w-md px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:max-w-lg sm:px-6 lg:max-w-2xl lg:px-10">

          {/* ── Banner (copy success / error) ── */}
          <AnimatePresence>
            {banner ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-3 rounded-2xl border border-[#f4c48d] bg-[#fff2de] px-4 py-3 text-center text-sm font-bold text-[#9a5f2d]"
              >
                {banner}
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* ── Hero title ── */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 24 }}
            className="mb-1 text-center"
          >
            <h1
              className="text-5xl font-black sm:text-6xl lg:text-7xl"
              style={{
                background: "linear-gradient(180deg,#FF9F0A 0%,#E0660A 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 4px 12px rgba(224,102,10,0.4))",
              }}
            >
              غرفة اللعب
            </h1>
            <p className="mt-2 text-sm font-semibold text-[#bc7a45] sm:text-base">
              بانتظار استعداد اللاعبين
            </p>
          </motion.div>

          {/* ── Super card ── */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 190, damping: 22, delay: 0.08 }}
            className="relative mt-5 overflow-hidden rounded-[2rem] border border-white/80 bg-white/95 shadow-[0_20px_60px_rgba(196,134,82,0.28),0_6px_16px_rgba(196,134,82,0.12)] backdrop-blur-sm"
          >
            {/* warm inner top glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute -top-12 left-1/2 h-32 w-3/4 -translate-x-1/2 rounded-full blur-3xl"
              style={{ background: "rgba(255,175,60,0.18)" }}
            />

            <div className="px-5 py-7 sm:px-7 sm:py-8">

              {/* ── Room code row (private rooms only) ── */}
              {!randomLobby ? (
                <div
                  className="mb-6 flex items-center gap-3 rounded-2xl px-4 py-3"
                  style={{
                    background: "linear-gradient(135deg,#FFF8EE 0%,#FFEDD8 100%)",
                    boxShadow: "0 4px 14px rgba(196,134,82,0.14), inset 0 0 0 1.5px rgba(244,196,141,0.6)",
                  }}
                >
                  {/* lock icon */}
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white shadow-[0_3px_10px_rgba(196,134,82,0.18)]">
                    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
                      <rect x="3" y="9" width="14" height="9" rx="2.5" stroke="#bc7a45" strokeWidth="1.7" fill="rgba(255,149,0,0.1)" />
                      <path d="M6 9V6.5a4 4 0 018 0V9" stroke="#bc7a45" strokeWidth="1.7" strokeLinecap="round" />
                    </svg>
                  </span>
                  {/* code */}
                  <span className="min-w-0 flex-1 text-center text-2xl font-black tracking-[0.3em] text-[#8a3f16] sm:text-3xl">
                    {room.code}
                  </span>
                  {/* copy button */}
                  <motion.button
                    type="button"
                    onClick={() => void copyCode()}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.92 }}
                    aria-label="نسخ الرمز"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white shadow-[0_3px_10px_rgba(196,134,82,0.18)]"
                  >
                    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
                      <rect x="7" y="7" width="10" height="10" rx="2" stroke="#bc7a45" strokeWidth="1.7" />
                      <path d="M5 13H4a1 1 0 01-1-1V4a1 1 0 011-1h8a1 1 0 011 1v1" stroke="#bc7a45" strokeWidth="1.7" strokeLinecap="round" />
                    </svg>
                  </motion.button>
                </div>
              ) : (
                /* random match badge */
                <div className="mb-6 flex items-center justify-center gap-2 rounded-2xl bg-[#FFF8EE] px-4 py-2.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <p className="text-sm font-extrabold text-[#8a3f16]">مطابقة عشوائية · خصمك جاهز</p>
                </div>
              )}

              {!randomLobby && isHost && googleSoc ? (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    resumeAudioContext();
                    playUIButton();
                    setFriendInviteOpen(true);
                  }}
                  className="mb-6 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-black text-white sm:text-base"
                  style={{
                    background: "linear-gradient(180deg,#B05CFF 0%,#7A3CFF 100%)",
                    boxShadow:
                      "inset 0 2px 0 rgba(255,255,255,0.38), 0 8px 0 #5B22D6, 0 14px 28px rgba(122,60,255,0.38)",
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0" aria-hidden>
                    <path
                      d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.48 0-2.75.81-3.45 2H8c-.55 0-1 .45-1 1v5.09c0 .05.01.1.02.15C7.72 15.4 8.85 16 10 16h5v-1h-3.45c1.18-.69 2-1.95 2-3.44 0-1.48-.81-2.75-2-3.45V11h5z"
                      fill="white"
                      fillOpacity=".92"
                    />
                    <circle cx="8.5" cy="8.5" r="1.5" fill="white" />
                  </svg>
                  دعوة الأصدقاء
                </motion.button>
              ) : null}

              {/* ── Player visual row ── */}
              <div className="flex items-center justify-center gap-2 sm:gap-4">

                {/* ── My avatar ── */}
                <div className="flex flex-col items-center gap-2">
                  <div className="relative">
                    <motion.div
                      aria-hidden
                      animate={{ opacity: [0.5, 1, 0.5], scale: [0.92, 1.06, 0.92] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 -z-10 rounded-full blur-xl"
                      style={{ background: "rgba(255,149,0,0.5)" }}
                    />
                    <div className="relative flex items-center justify-center">
                      <ProfileAvatar
                        cosmetic={uid ? cosmeticsMap[uid] : undefined}
                        fallbackPhotoURL={user?.photoURL}
                        displayName={displayName}
                        size="lg"
                        idle
                        active={myReadyOptimistic}
                      />
                    </div>
                    {/* crown for host */}
                    {isHost && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-lg leading-none" aria-label="مضيف">
                        👑
                      </span>
                    )}
                    {/* ready dot */}
                    <motion.span
                      animate={myReadyOptimistic
                        ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }
                        : { scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                      className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full ring-2 ring-white ${myReadyOptimistic ? "bg-emerald-400" : "bg-amber-400"}`}
                    />
                  </div>
                  <div className="text-center">
                    <p className="max-w-[72px] truncate text-xs font-extrabold text-[#8a3f16] sm:max-w-[88px] sm:text-sm">
                      {displayName}
                    </p>
                    <p className={`mt-0.5 text-[10px] font-bold sm:text-xs ${myReadyOptimistic ? "text-emerald-600" : "text-amber-600"}`}>
                      {myReadyOptimistic ? "جاهز" : "بانتظار"}
                    </p>
                  </div>
                </div>

                {/* connection dots + center ؟ */}
                <div className="flex flex-1 items-center justify-center gap-1.5 sm:gap-2.5">
                  {/* left dots */}
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={`l${i}`}
                      className="h-1.5 w-1.5 rounded-full bg-[#FFB300]"
                      animate={{ scale: [1, 1.6, 1], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: i * 0.22 }}
                    />
                  ))}
                  {/* center disc */}
                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center sm:h-16 sm:w-16">
                    <motion.div
                      aria-hidden
                      animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.85, 1.05, 0.85] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 rounded-full blur-xl"
                      style={{ background: "rgba(255,159,10,0.55)" }}
                    />
                    <motion.div
                      aria-hidden
                      animate={{ scale: [1, 1.2, 1], opacity: [0.25, 0.08, 0.25] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 rounded-full border-2 border-[#FF9F0A]/70"
                    />
                    <div
                      className="relative z-10 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full sm:h-12 sm:w-12"
                      style={{
                        background: "linear-gradient(160deg,#FF9F0A 0%,#FF6B00 100%)",
                        boxShadow: "inset 0 2px 0 rgba(255,255,255,0.45), 0 6px 0 #be5200, 0 10px 22px rgba(255,122,0,0.5)",
                      }}
                    >
                      <span className="text-2xl font-black text-white sm:text-3xl" style={{ textShadow: "0 2px 0 rgba(0,0,0,0.22)" }}>
                        ؟
                      </span>
                      <span aria-hidden className="pointer-events-none absolute inset-x-1.5 top-1 h-2 rounded-full bg-white/40 blur-[1px]" />
                    </div>
                  </div>
                  {/* right dots */}
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={`r${i}`}
                      className="h-1.5 w-1.5 rounded-full bg-[#FFB300]"
                      animate={{ scale: [1, 1.6, 1], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.66 + i * 0.22 }}
                    />
                  ))}
                </div>

                {/* ── Opponent slot ── */}
                <div className="flex flex-col items-center gap-2">
                  <div className="relative">
                    {opponent ? (
                      <>
                        <motion.div
                          aria-hidden
                          animate={{ opacity: [0.4, 0.85, 0.4], scale: [0.9, 1.05, 0.9] }}
                          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                          className="absolute inset-0 -z-10 rounded-full blur-xl"
                          style={{ background: "rgba(255,149,0,0.4)" }}
                        />
                        <div className="relative flex items-center justify-center">
                          <ProfileAvatar
                            cosmetic={cosmeticsMap[opponent.uid]}
                            displayName={opponent.displayName}
                            size="lg"
                            idle
                            active={opponent.ready}
                          />
                        </div>
                        {opponent.uid === room.hostUid && (
                          <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-lg leading-none">👑</span>
                        )}
                        <motion.span
                          animate={opponent.ready
                            ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }
                            : { scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                          transition={{ duration: 1.4, repeat: Infinity, delay: 0.3 }}
                          className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full ring-2 ring-white ${opponent.ready ? "bg-emerald-400" : "bg-amber-400"}`}
                        />
                      </>
                    ) : (
                      /* silhouette waiting slot */
                      <>
                        <motion.div
                          aria-hidden
                          animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.9, 1.07, 0.9] }}
                          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                          className="absolute inset-0 -z-10 rounded-full blur-xl"
                          style={{ background: "rgba(255,179,0,0.3)" }}
                        />
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 rounded-full"
                          style={{ background: "conic-gradient(rgba(255,179,0,0.5) 0deg, transparent 110deg, rgba(255,122,0,0.35) 240deg, transparent 360deg)" }}
                        />
                        <div
                          className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full sm:h-20 sm:w-20"
                          style={{ background: "linear-gradient(135deg,#F5E0C0 0%,#EAC898 100%)", boxShadow: "0 0 0 3px rgba(255,179,0,0.3), 0 6px 20px rgba(196,134,82,0.28)" }}
                        >
                          <svg viewBox="0 0 56 56" fill="none" className="h-10 w-10 sm:h-12 sm:w-12" aria-hidden>
                            <circle cx="28" cy="22" r="10" fill="rgba(139,100,50,0.22)" />
                            <ellipse cx="28" cy="44" rx="14" ry="9" fill="rgba(139,100,50,0.18)" />
                          </svg>
                          <motion.div
                            aria-hidden
                            animate={{ opacity: [0.1, 0.3, 0.1] }}
                            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute inset-0 rounded-full"
                            style={{ background: "radial-gradient(circle at 40% 35%, rgba(255,220,150,0.45), transparent 65%)" }}
                          />
                        </div>
                        <motion.span
                          animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0.4, 0.8] }}
                          transition={{ duration: 1.6, repeat: Infinity }}
                          className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#FFB300] ring-2 ring-white text-[8px] font-black text-white"
                        >
                          ?
                        </motion.span>
                      </>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="max-w-[72px] truncate text-xs font-extrabold text-[#8a3f16] sm:max-w-[88px] sm:text-sm">
                      {opponent ? opponent.displayName : "خصمك؟"}
                    </p>
                    {opponent ? (
                      <p className={`mt-0.5 text-[10px] font-bold sm:text-xs ${opponent.ready ? "text-emerald-600" : "text-amber-600"}`}>
                        {opponent.ready ? "جاهز" : "بانتظار"}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-[10px] font-bold text-[#bc7a45] sm:text-xs">في الطريق…</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Match settings chips ── */}
              <div className="mt-6 flex flex-wrap justify-center gap-2.5">
                {/* question timer */}
                <div
                  className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5"
                  style={{ background: "#FFF8EE", boxShadow: "0 3px 10px rgba(196,134,82,0.14), inset 0 0 0 1.5px rgba(244,196,141,0.55)" }}
                >
                  <span className="grid h-7 w-7 place-items-center rounded-xl bg-[#FFF1DF]">
                    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
                      <circle cx="10" cy="10" r="7" stroke="#c2530c" strokeWidth="1.7" />
                      <path d="M10 6.5v3.5l2 2" stroke="#c2530c" strokeWidth="1.7" strokeLinecap="round" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold text-[#bc7a45]">سؤال</p>
                    <p className="text-xs font-extrabold text-[#8a3f16]">{room.questionTimerSec ?? 20} ثانية</p>
                  </div>
                </div>
                {/* answer timer */}
                <div
                  className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5"
                  style={{ background: "#FFF8EE", boxShadow: "0 3px 10px rgba(196,134,82,0.14), inset 0 0 0 1.5px rgba(244,196,141,0.55)" }}
                >
                  <span className="grid h-7 w-7 place-items-center rounded-xl bg-[#FFF1DF]">
                    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
                      <circle cx="10" cy="10" r="7" stroke="#c2530c" strokeWidth="1.7" />
                      <path d="M7 10l2 2 4-4" stroke="#c2530c" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold text-[#bc7a45]">إجابة</p>
                    <p className="text-xs font-extrabold text-[#8a3f16]">{room.answerTimerSec ?? 15} ثانية</p>
                  </div>
                </div>
                {/* voice mode */}
                {voiceMode && (
                  <div
                    className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5"
                    style={{ background: "#F0FDF4", boxShadow: "0 3px 10px rgba(22,163,74,0.14), inset 0 0 0 1.5px rgba(134,239,172,0.55)" }}
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-xl bg-emerald-100">
                      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
                        <path d="M6 8c0-2.21 1.79-4 4-4s4 1.79 4 4" stroke="#16a34a" strokeWidth="1.7" strokeLinecap="round" />
                        <rect x="4" y="7.5" width="4" height="6" rx="2" fill="#16a34a" opacity=".5" />
                        <rect x="12" y="7.5" width="4" height="6" rx="2" fill="#16a34a" opacity=".5" />
                        <path d="M10 15v2" stroke="#16a34a" strokeWidth="1.7" strokeLinecap="round" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-[10px] font-semibold text-emerald-700">وضع المكالمة</p>
                      <p className="text-xs font-extrabold text-emerald-800">مفعل</p>
                    </div>
                  </div>
                )}
              </div>

              {customModeActive && !randomLobby ? (
                <div
                  className="mt-5 rounded-2xl border border-[#f5dcc8] bg-[#FFFBF6]/95 px-4 py-3 shadow-[0_8px_22px_rgba(196,134,82,0.12)]"
                  dir="rtl"
                >
                  <p className="mb-2.5 text-center text-[13px] font-extrabold text-[#8a3f16]">جاهزية الغرفة</p>
                  <div className="grid grid-cols-2 gap-3 text-[11px] font-bold sm:text-xs">
                    <div
                      className={`relative rounded-xl bg-white/90 px-2.5 py-2 transition-shadow duration-300 ${
                        mePickDone
                          ? "ring-2 ring-emerald-400/75 shadow-[0_0_22px_rgba(52,211,153,0.38)]"
                          : "ring-1 ring-[#f4e0cc]"
                      }`}
                    >
                      {mePickDone ? (
                        <span
                          className="absolute -top-1.5 end-1.5 grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-[11px] text-white shadow-md shadow-emerald-600/35 ring-2 ring-white"
                          aria-hidden
                        >
                          ✓
                        </span>
                      ) : null}
                      <p className="truncate text-[#bc7a45]">أنت</p>
                      <p className={`mt-1 ${myReadyOptimistic ? "text-emerald-700" : "text-amber-700"}`}>
                        {myReadyOptimistic ? "✓ جاهز" : "⋯ لم يُعلَن الجاهز بعد"}
                      </p>
                      <p className={`mt-0.5 ${mePickDone ? "text-emerald-700" : "text-amber-700"}`}>
                        {mePickDone ? "✓ تم اختيار بطاقة للخصم" : "⋯ بانتظار بطاقة للخصم"}
                      </p>
                    </div>
                    <div
                      className={`relative rounded-xl bg-white/90 px-2.5 py-2 transition-shadow duration-300 ${
                        oppPickDone
                          ? "ring-2 ring-emerald-400/75 shadow-[0_0_22px_rgba(52,211,153,0.38)]"
                          : "ring-1 ring-[#f4e0cc]"
                      }`}
                    >
                      {oppPickDone ? (
                        <span
                          className="absolute -top-1.5 end-1.5 grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-[11px] text-white shadow-md shadow-emerald-600/35 ring-2 ring-white"
                          aria-hidden
                        >
                          ✓
                        </span>
                      ) : null}
                      <p className="truncate text-[#bc7a45]">
                        {opponent ? opponent.displayName : "بانتظار خصم"}
                      </p>
                      <p className={`mt-1 ${opponent?.ready ? "text-emerald-700" : "text-amber-700"}`}>
                        {opponent
                          ? opponent.ready
                            ? "✓ جاهز"
                            : "⋯ بانتظار الجاهز"
                          : "⋯ لم ينضم بعد"}
                      </p>
                      <p className={`mt-0.5 ${oppPickDone ? "text-emerald-700" : "text-amber-700"}`}>
                        {oppPickDone ? "✓ اختار بطاقتك" : "⋯ ينتظر أن يختار بطاقتك"}
                      </p>
                    </div>
                  </div>
                  {isHost && bothReady && !bothPickedCustom ? (
                    <p className="mt-3 text-center text-[11px] font-bold text-[#c2530c]">
                      كل اللاعبين جاهزون — بقي أن يحفظ كلٌ بطاقته للخصم ثم يظهر زر «ابدأ المباراة».
                    </p>
                  ) : null}
                </div>
              ) : null}

              {customLobby ? (
                <section
                  className={`mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[#FFF9FF] via-[#FFF7EE] to-[#FFF2DE] p-4 shadow-[0_10px_28px_rgba(168,85,247,0.12)] ${
                    showCardSuccessVisual
                      ? "border-2 border-emerald-400/55 ring-1 ring-emerald-300/40"
                      : "border border-[#f0dce8]"
                  }`}
                >
                  <div className="mb-3 flex items-start gap-3">
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-lg font-black text-white"
                      style={{
                        background: "linear-gradient(135deg,#c084fc 0%,#FF9F0A 100%)",
                        boxShadow: "0 4px 12px rgba(168,85,247,0.35)",
                      }}
                      aria-hidden
                    >
                      ★
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-extrabold text-[#8a3f16]">اختر بطاقة لخصمك</p>
                      <p className="mt-1 text-xs font-semibold leading-relaxed text-[#a16231]">
                        صورة واحدة وإجابة صحيحة — الخصم هو من سيخمنها. يمكنك التعديل بدلًا منها في أي وقت قبل البدء.
                      </p>
                      {showCardSuccessVisual ? (
                        <motion.p
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/12 px-3 py-1 text-[11px] font-extrabold text-emerald-800 ring-1 ring-emerald-400/35"
                        >
                          <span className="text-emerald-600">✓</span>
                          تم اختيار بطاقة خصمك
                        </motion.p>
                      ) : null}
                    </div>
                  </div>

                  {dirtyAgainstServer ? (
                    <p className="mb-3 rounded-xl border border-amber-200/90 bg-amber-50/95 px-3 py-2 text-center text-[11px] font-bold leading-relaxed text-amber-950">
                      عدّلت الصورة أو الاسم — اضغط «حفظ بطاقة خصمك» لتحديث اختيارك على الخادم.
                    </p>
                  ) : null}

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                    <motion.div
                      key={customSavePulse}
                      initial={customSavePulse === 0 ? false : { scale: 0.93, opacity: 0.86 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 24 }}
                      className="relative flex aspect-square w-full max-w-[168px] shrink-0 self-center sm:h-[156px] sm:w-[156px]"
                    >
                      {showCardSuccessVisual ? (
                        <motion.div
                          aria-hidden
                          className="pointer-events-none absolute inset-[-10px] -z-10 rounded-[24px] blur-2xl"
                          animate={{ opacity: [0.4, 0.75, 0.4], scale: [0.96, 1.03, 0.96] }}
                          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                          style={{
                            background:
                              "radial-gradient(closest-side,rgba(52,211,153,0.55),rgba(16,185,129,0.15),transparent 72%)",
                          }}
                        />
                      ) : null}
                      <motion.div
                        className="h-full w-full"
                        animate={
                          showCardSuccessVisual
                            ? { scale: [1, 1.02, 1] }
                            : { scale: 1 }
                        }
                        transition={{ duration: 0.55, ease: "easeOut" }}
                      >
                        <motion.button
                          type="button"
                          disabled={lobbyCustomBusy}
                          onClick={() => lobbyCustomFileRef.current?.click()}
                          whileTap={{ scale: 0.98 }}
                          className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-2xl ${
                            showCardSuccessVisual
                              ? "border-2 border-emerald-400 shadow-[0_12px_32px_rgba(34,197,94,0.32),inset_0_2px_0_rgba(255,255,255,0.55)]"
                              : showDraftEditVisual
                                ? "border-2 border-amber-400/90 bg-gradient-to-br from-[#FFFBF0] to-[#FFF4D6] shadow-[0_8px_22px_rgba(245,158,11,0.2)]"
                                : "border-2 border-dashed border-[#f4c49a] bg-gradient-to-br from-[#FFF9F0] to-[#FFE8CC]"
                          }`}
                          style={
                            showCardSuccessVisual
                              ? {
                                  background:
                                    "linear-gradient(155deg,#ecfdf5 0%,#d1fae5 42%,#ecfccb 100%)",
                                }
                              : !showDraftEditVisual
                                ? {
                                    boxShadow:
                                      "inset 0 2px 0 rgba(255,255,255,0.65), 0 8px 20px rgba(255,149,0,0.14)",
                                  }
                                : undefined
                          }
                        >
                          {showCardSuccessVisual ? (
                            <span className="absolute end-2 top-2 z-20 grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-700/30 ring-2 ring-white">
                              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
                                <path
                                  d="M5 13l4 4L19 7"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </span>
                          ) : null}
                          {lobbyCustomBusy ? (
                            <span className="text-sm font-bold text-[#c2530c]">جاري المعالجة…</span>
                          ) : tileImageSrc ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={tileImageSrc}
                                alt=""
                                className="absolute inset-0 h-full w-full object-cover"
                              />
                              <div
                                className={`absolute inset-0 rounded-2xl ring-2 ring-inset ${
                                  showCardSuccessVisual ? "ring-emerald-200/90" : "ring-white/40"
                                }`}
                              />
                              <span className="relative z-10 mt-auto mb-2 rounded-full bg-black/55 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                                {showCardSuccessVisual ? "تغيير البطاقة" : "تغيير الصورة"}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-3xl">📷</span>
                              <span className="mt-2 px-3 text-center text-sm font-black text-[#c2530c]">
                                رفع صورة
                              </span>
                              <span className="mt-1 px-2 text-center text-[9px] font-semibold text-[#a16231]/90">
                                PNG · JPG · WEBP
                              </span>
                            </>
                          )}
                        </motion.button>
                      </motion.div>
                    </motion.div>

                    <div className="min-w-0 flex-1 space-y-2">
                      <label className="block text-[11px] font-bold text-[#a16231]">
                        الإجابة الصحيحة التي سيخمنها خصمك
                      </label>
                      <Input
                        dir="rtl"
                        value={lobbyCustomName}
                        onChange={(ev) => setLobbyCustomName(ev.target.value)}
                        placeholder="اكتب اسم الإجابة التي سيخمنها خصمك"
                        className="font-bold text-[#8a3f16]"
                      />
                      {lobbyCustomName.trim().length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {generateGuessAliases(lobbyCustomName.trim())
                            .slice(0, 8)
                            .map((h) => (
                              <span
                                key={h}
                                className="rounded-full bg-[#FFF1DF] px-2 py-0.5 text-[10px] font-bold text-[#9a4f1d] ring-1 ring-[#f4d4b0]/80"
                              >
                                {h}
                              </span>
                            ))}
                        </div>
                      )}
                      <motion.button
                        type="button"
                        disabled={
                          lobbyCustomBusy ||
                          !lobbyCustomPreview ||
                          !lobbyCustomName.trim()
                        }
                        onClick={() => void submitLobbyOpponentCard()}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="mt-2 w-full rounded-2xl py-3 text-base font-black text-white disabled:opacity-55"
                        style={{
                          background: "linear-gradient(180deg,#FF9F0A 0%,#FF5F00 100%)",
                          boxShadow:
                            "inset 0 2px 0 rgba(255,255,255,0.42), 0 8px 0 #be5200, 0 14px 28px rgba(255,107,0,0.35)",
                          textShadow: "0 1px 0 rgba(0,0,0,0.2)",
                        }}
                      >
                        حفظ بطاقة خصمك
                      </motion.button>
                    </div>
                  </div>

                  {!bothPickedCustom ? (
                    <p className="mt-3 text-center text-xs font-bold text-[#c2530c]">
                      انتظر حتى يختار كلٌ منكما بطاقة للآخر، ثم يمكن للمضيف بدء المباراة.
                    </p>
                  ) : null}
                </section>
              ) : null}

              {/* ── Primary CTA ── */}
              <div className="mt-7 space-y-3">
                {/* Ready toggle — always show for non-random non-host, or non-random host pre-start */}
                {!randomLobby && (
                  <div className="relative">
                    <motion.div
                      aria-hidden
                      animate={{ opacity: [0.55, 1, 0.55], scale: [0.95, 1.06, 0.95] }}
                      transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 -z-10 rounded-[26px] blur-2xl"
                      style={{ background: myReadyOptimistic
                        ? "radial-gradient(closest-side,rgba(22,163,74,0.4),transparent 70%)"
                        : "radial-gradient(closest-side,rgba(255,138,30,0.6),transparent 70%)" }}
                    />
                    <motion.button
                      type="button"
                      disabled={busy}
                      onClick={() => void toggleReady()}
                      whileHover={{ y: -3, scale: 1.02 }}
                      whileTap={{ y: 5, scale: 0.97 }}
                      className="relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-[24px] py-[18px] text-2xl font-black text-white disabled:opacity-60 sm:text-3xl"
                      style={myReadyOptimistic
                        ? {
                            background: "linear-gradient(180deg,#22c55e 0%,#16a34a 100%)",
                            boxShadow: "inset 0 2.5px 0 rgba(255,255,255,0.45), inset 0 -7px 14px rgba(0,100,40,0.3), 0 12px 0 #15803d, 0 22px 36px rgba(22,163,74,0.45)",
                          }
                        : {
                            background: "linear-gradient(180deg,#FF9F0A 0%,#FF7A00 100%)",
                            boxShadow: "inset 0 2.5px 0 rgba(255,255,255,0.52), inset 0 -7px 16px rgba(150,50,0,0.38), 0 13px 0 #be5200, 0 24px 40px rgba(255,122,0,0.55)",
                          }
                      }
                    >
                      <span aria-hidden className="pointer-events-none absolute inset-x-8 top-2 h-3 rounded-full bg-white/35 blur-[2.5px]" />
                      {myReadyOptimistic ? (
                        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
                          <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
                          <polygon points="5,3 19,12 5,21" fill="white" />
                        </svg>
                      )}
                      <span style={{ textShadow: "0 2px 0 rgba(0,0,0,0.22)" }}>
                        {myReadyOptimistic ? "جاهز ✓" : "جاهز"}
                      </span>
                    </motion.button>
                  </div>
                )}

                {/* Start match — host only, non-random.
                    Always visible so the host knows the path to start. The button
                    is disabled until every precondition holds; missing pieces are
                    listed underneath. The server re-validates everything anyway. */}
                {!randomLobby && isHost && (() => {
                  const missing: string[] = [];
                  if (!opponent) missing.push("انضمام اللاعب الثاني");
                  if (customModeActive) {
                    if (uid && !uidCardComplete(uid)) missing.push("حفظ بطاقتك للخصم");
                    if (opponent && !uidCardComplete(opponent.uid))
                      missing.push("اختيار الخصم لبطاقتك");
                  }
                  if (!myReadyOptimistic) missing.push("تضغط أنت «جاهز»");
                  if (opponent && !opponent.ready) missing.push("الخصم يضغط «جاهز»");
                  const canStart = missing.length === 0;
                  return (
                    <motion.div
                      key="start-match-cta"
                      initial={{ opacity: 0, scale: 0.92, y: 12 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 340, damping: 26 }}
                      className="relative"
                    >
                      {canStart ? (
                        <motion.div
                          aria-hidden
                          animate={{ opacity: [0.55, 1, 0.55], scale: [0.96, 1.08, 0.96] }}
                          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute inset-0 -z-10 rounded-[26px] blur-2xl"
                          style={{
                            background:
                              "radial-gradient(closest-side,rgba(255,159,40,0.85),rgba(255,122,0,0.35),transparent 72%)",
                          }}
                        />
                      ) : null}
                      <motion.button
                        type="button"
                        disabled={busy || !canStart}
                        onClick={() => void startMatch()}
                        whileHover={canStart && !busy ? { y: -4, scale: 1.03 } : undefined}
                        whileTap={canStart && !busy ? { y: 6, scale: 0.97 } : undefined}
                        className="relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-[24px] py-[18px] text-2xl font-black text-white disabled:cursor-not-allowed disabled:opacity-55 sm:text-3xl"
                        style={{
                          background: "linear-gradient(180deg,#FFC933 0%,#FF7A00 100%)",
                          boxShadow:
                            "inset 0 3px 0 rgba(255,255,255,0.55), inset 0 -8px 18px rgba(180,70,0,0.35), 0 14px 0 #b45300, 0 26px 48px rgba(255,122,0,0.55)",
                        }}
                      >
                        <span aria-hidden className="pointer-events-none absolute inset-x-8 top-2 h-3 rounded-full bg-white/45 blur-[2px]" />
                        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
                          <polygon points="5,3 19,12 5,21" fill="white" />
                        </svg>
                        <span style={{ textShadow: "0 2px 0 rgba(0,0,0,0.22)" }}>
                          ابدأ المباراة
                        </span>
                      </motion.button>
                      {!canStart ? (
                        <p className="mt-2 text-center text-[11px] font-bold leading-relaxed text-[#c2530c]">
                          ينقص: {missing.join(" • ")}
                        </p>
                      ) : null}
                    </motion.div>
                  );
                })()}

                {/* Guest waiting messages */}
                {!randomLobby && !isHost && !myReadyOptimistic && (
                  <p className="text-center text-sm font-semibold text-[#bc7a45]">
                    اضغط جاهز، ثم انتظر المضيف ليبدأ اللعب.
                  </p>
                )}
                {!randomLobby && !isHost && myReadyOptimistic && !bothReady && (
                  <p className="text-center text-sm font-semibold text-[#bc7a45]">
                    في انتظار جاهزية المضيف…
                  </p>
                )}
                {randomLobby && !isHost && (
                  <div className="flex items-center justify-center gap-2 text-sm font-semibold text-[#bc7a45]">
                    <span>جاري البدء تلقائياً</span>
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="block h-1.5 w-1.5 rounded-full bg-[#bc7a45]"
                        animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                )}

                {/* Leave room */}
                <motion.button
                  type="button"
                  onClick={requestExit}
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ y: 3, scale: 0.98 }}
                  className="flex w-full items-center justify-center gap-2 rounded-[24px] py-4 text-base font-extrabold text-[#8a3f16]"
                  style={{
                    background: "linear-gradient(180deg,#FFFFFF 0%,#FFF4E4 100%)",
                    boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.9), 0 8px 0 rgba(196,134,82,0.26), 0 14px 28px rgba(196,134,82,0.16)",
                  }}
                >
                  <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0" aria-hidden>
                    <path d="M5 5l10 10M15 5L5 15" stroke="#8a3f16" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  مغادرة الغرفة
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {friendInviteOpen && uid ? (
            <RoomInviteFriendsPanel
              key="friend-invite"
              myUid={uid}
              roomId={room.id}
              onClose={() => setFriendInviteOpen(false)}
            />
          ) : null}
        </AnimatePresence>

        {/* ── Leave confirm modal ── */}
        <AnimatePresence>
          {leaveConfirmOpen ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-[#6a3f1b]/45 px-4 backdrop-blur-sm"
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

  const opponent = room.players.find((p) => p.uid !== uid);
  const opponentName = opponent?.displayName ?? "الخصم";

  // Turn label — surface action the current actor must do
  const turnAction = match?.status === "active"
    ? myTurn
      ? phase === "question"
        ? voiceMode ? "اسأل الآن بصوتك! 🎙️" : "اسأل الآن!"
        : voiceMode ? "أجب بصوتك! 🎙️" : "أجب الآن!"
      : phase === "question"
        ? voiceMode ? `${opponentName} يسألك…` : `${opponentName} يسأل…`
        : voiceMode ? `${opponentName} يجيب…` : `${opponentName} يجيب…`
    : null;

  const activeActorUid = match?.status === "active" ? match.actorUid ?? null : null;
  const activeActorName =
    activeActorUid ? room.players.find((p) => p.uid === activeActorUid)?.displayName ?? "اللاعب" : "";

  const voicePlayingUI =
    voiceMode && room.status === "playing" && match?.status === "active" && !ended;
  const voiceAwaitMatchUI = voiceMode && room.status === "playing" && !match && !ended;
  const voiceFocusPlaying = voiceAwaitMatchUI || voicePlayingUI;

  const voiceTurnHeadline =
    match?.status === "active"
      ? myTurn
        ? phase === "question"
          ? "اسأل الآن"
          : "أجب الآن"
        : phase === "question"
          ? "بانتظار السؤال"
          : "بانتظار الإجابة"
      : null;

  const voiceTurnSub =
    match?.status === "active"
      ? myTurn
        ? phase === "question"
          ? "اطرح سؤالك بالصوت على الخصم"
          : "أجِب بالصوت بوضوح"
        : phase === "question"
          ? `${opponentName} يطرح السؤال`
          : `${opponentName} يجيب الآن`
      : null;

  return (
    <div
      dir="rtl"
      className="relative z-40 flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden select-none"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
        background: voiceFocusPlaying
          ? "radial-gradient(135% 82% at 50% 0%, #FFF1DD 0%, #FFECD7 52%, #FDE7CD 100%)"
          : "radial-gradient(130% 75% at 50% 0%, #FFF1DE 0%, #FFEBD3 55%, #FCE6CD 100%)",
        touchAction: "manipulation",
        overscrollBehavior: "contain",
      }}
    >
      <ConfettiBurst active={ended && iWon && Boolean(winnerUid)} />
      <MatchVsIntroOverlay
        open={vsIntroOpen && !ended}
        meName={displayName}
        opponentName={opponentNameForVs}
        myCosmetic={uid ? cosmeticsMap[uid] : undefined}
        opponentCosmetic={opponentPlayer ? cosmeticsMap[opponentPlayer.uid] : undefined}
        myPhotoURL={user?.photoURL}
      />

      {/* ── Fixed ambient background ── */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          animate={{ y: [0, -24, 0], x: [0, 16, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#FFCB8A]/40 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 20, 0], x: [0, -12, 0] }}
          transition={{ duration: 19, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute -left-28 top-2/5 h-80 w-80 rounded-full bg-[#FFB574]/28 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, -14, 0] }}
          transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 7 }}
          className="absolute bottom-24 right-1/3 h-56 w-56 rounded-full bg-[#FFD9A6]/36 blur-3xl"
        />
        {/* Subtle decorative particles */}
        {([
          { char: "؟", top: "7%",  left: "2%",    delay: 0,   size: 38, tint: "rgba(164,80,255,0.09)" },
          { char: "؟", top: "38%", right: "3%",   delay: 2,   size: 30, tint: "rgba(255,138,30,0.11)" },
          { char: "؟", top: "72%", left: "5%",    delay: 3.5, size: 34, tint: "rgba(60,150,255,0.09)" },
          { char: "✦", top: "16%", right: "10%",  delay: 1,   size: 13, tint: "rgba(255,180,90,0.55)"  },
          { char: "✦", top: "55%", left: "12%",   delay: 3,   size: 10, tint: "rgba(150,80,255,0.45)"  },
          { char: "✦", top: "84%", right: "16%",  delay: 4.8, size: 15, tint: "rgba(60,150,255,0.42)"  },
        ] as const).map((s, i) => (
          <motion.span
            key={i}
            aria-hidden
            style={{
              position: "absolute",
              top: s.top,
              left: "left" in s ? s.left : undefined,
              right: "right" in s ? s.right : undefined,
              fontSize: s.size,
              color: s.tint,
              fontWeight: 900,
              userSelect: "none",
              lineHeight: 1,
            }}
            animate={{ y: [0, -9, 0], rotate: [0, 6, 0] }}
            transition={{ duration: 6 + s.delay, repeat: Infinity, ease: "easeInOut", delay: s.delay }}
          >
            {s.char}
          </motion.span>
        ))}
        {voiceFocusPlaying ? (
          <>
            <motion.div
              aria-hidden
              animate={{ y: [0, -14, 0], rotate: [10, 14, 10], opacity: [0.22, 0.35, 0.22] }}
              transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-[6%] top-[32%] h-28 w-20 rounded-3xl bg-[#ffb84d]/25 blur-3xl"
            />
            <motion.div
              aria-hidden
              animate={{ y: [0, 12, 0], rotate: [-8, -12, -8], opacity: [0.18, 0.32, 0.18] }}
              transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute right-[5%] top-[48%] h-32 w-24 rounded-3xl bg-[#ffd89e]/22 blur-3xl"
            />
          </>
        ) : null}
      </div>

      {/* ════════════════════════════════════════════════════════
          TOP HUD — menu · logo · room-code
      ════════════════════════════════════════════════════════ */}
      <div className="relative z-10 mx-auto w-full max-w-lg flex-shrink-0 px-3 pt-2 sm:max-w-xl sm:px-4">
        <div className="flex items-center justify-between gap-2">

          <motion.button
            type="button"
            onClick={requestExit}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.88 }}
            aria-label="قائمة"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_4px_14px_rgba(196,134,82,0.20)] backdrop-blur-sm"
          >
            {/* 3-line hamburger */}
            <svg viewBox="0 0 18 14" fill="none" className="h-4 w-4" aria-hidden>
              <path d="M1 1h16M1 7h16M1 13h16" stroke="#6b3d15" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </motion.button>

          <span
            className="text-xl font-black tracking-tight sm:text-2xl"
            style={{
              background: "linear-gradient(180deg,#FF9F0A 0%,#E0660A 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 2px 5px rgba(224,102,10,0.28))",
            }}
          >
            مين أنا؟
          </span>

          <motion.button
            type="button"
            onClick={copyCode}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            aria-label="نسخ رمز الغرفة"
            className="flex items-center gap-1.5 rounded-2xl bg-white/90 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_4px_14px_rgba(196,134,82,0.18)] backdrop-blur-sm"
          >
            <span className="text-[9.5px] font-bold text-[#bc7a45]">رمز</span>
            <span className="font-mono text-[12px] font-extrabold tracking-wider text-[#8a3f16]">
              {room.code}
            </span>
            {/* copy icon */}
            <svg viewBox="0 0 14 14" fill="none" className="h-3 w-3 shrink-0 text-[#bc7a45]" aria-hidden>
              <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M2 10V2h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>

        </div>

        {/* Voice mode indicator — lobby/wait only (playing UI has its own instruction strip) */}
        {voiceMode && room.status === "playing" && !ended && !voicePlayingUI ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 mt-2 flex justify-center px-3"
          >
            <motion.div
              animate={{ boxShadow: ["0 0 0 1.5px rgba(74,222,128,0.45), 0 6px 22px rgba(34,197,94,0.28)", "0 0 0 2px rgba(74,222,128,0.65), 0 8px 28px rgba(34,197,94,0.38)", "0 0 0 1.5px rgba(74,222,128,0.45), 0 6px 22px rgba(34,197,94,0.28)"] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 sm:px-5 sm:py-2.5"
              style={{
                background: "linear-gradient(135deg,#ecfdf5 0%,#d1fae5 100%)",
              }}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                style={{ boxShadow: "0 0 8px rgba(34,197,94,0.65)" }}
                aria-hidden
              />
              <span className="text-xs font-black text-emerald-900 sm:text-sm">وضع المكالمة مفعل</span>
            </motion.div>
          </motion.div>
        ) : null}
      </div>

      {/* ════════════════════════════════════════════════════════
          MAIN BODY — chat scroll OR voice viewport (no scroll)
      ════════════════════════════════════════════════════════ */}
      <div
        className={
          voiceFocusPlaying
            ? "relative z-10 mx-auto flex w-full max-w-4xl flex-1 min-h-0 flex-col overflow-hidden px-3 pt-1 sm:px-6 lg:px-8"
            : "relative z-10 mx-auto flex w-full max-w-lg flex-1 min-h-0 flex-col overflow-hidden px-1 pt-1 sm:max-w-xl sm:px-2"
        }
        style={
          voiceFocusPlaying
            ? { paddingBottom: "max(env(safe-area-inset-bottom, 0px), 0.5rem)" }
            : undefined
        }
      >

        {voiceAwaitMatchUI ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-4 py-10">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.12, repeat: Infinity, ease: "linear" }}
              className="grid h-14 w-14 place-items-center rounded-full bg-white/92 shadow-[0_8px_28px_rgba(196,134,82,0.22)] ring-1 ring-[#fde68a]/70"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-[#FF9F0A]" aria-hidden>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.2" strokeOpacity="0.22" />
                <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </motion.div>
            <p className="text-center text-lg font-black text-[#8a3f16]">جاري مزامنة حالة المباراة…</p>
            <p className="max-w-[280px] text-center text-sm font-semibold leading-relaxed text-[#bc7a45]">
              تحدّث بالصوت مع الخصم عبر Discord أو المكالمة. الدردشة النصية معطّلة في وضع المكالمة.
            </p>
          </div>
        ) : voicePlayingUI ? (
          <VoiceModePlayingPanel
            banner={banner}
            displayName={displayName}
            opponentName={opponentName}
            opponent={opponent}
            uid={uid}
            hostUid={room.hostUid}
            isHost={isHost}
            phase={phase}
            myTurn={myTurn}
            activeActorUid={activeActorUid}
            activeActorName={activeActorName}
            voiceTurnHeadline={voiceTurnHeadline}
            voiceTurnSub={voiceTurnSub}
            secLeft={secLeft}
            maxPhaseSec={maxPhaseSec}
            opponentCard={opponentCard}
            busy={busy}
            sendVoiceAck={sendVoiceAck}
            openGuessFlow={openGuessFlow}
            myCosmetic={uid ? cosmeticsMap[uid] : undefined}
            opponentCosmetic={opponent ? cosmeticsMap[opponent.uid] : undefined}
            myPhotoURL={user?.photoURL}
          />
        ) : (
          <GameplaySocialSurface
            banner={banner}
            keyboardOverlapPx={keyboardOverlapPx}
            matchSyncWaiting={room.status === "playing" && !match}
            socialMatchLive={Boolean(match?.status === "active" && !ended)}
            myTurn={myTurn}
            phase={phase}
            turnAction={turnAction}
            secLeft={secLeft}
            maxPhaseSec={maxPhaseSec}
            displayName={displayName}
            opponentName={opponentName}
            uid={uid}
            opponent={opponent}
            cosmeticsMap={cosmeticsMap}
            userPhotoURL={user?.photoURL}
            opponentCard={opponentCard}
            messages={messages}
            renderMessage={renderMessage}
            chatScrollRef={chatScrollRef}
            chatEndRef={chatEndRef}
            draft={draft}
            onDraftChange={setDraft}
            onSendDraft={sendDraft}
            busy={busy}
            onGuessClick={openGuessFlow}
            onComposerFocus={(el) => {
              setComposerFocused(true);
              snapChatToBottom("auto");
              el.style.boxShadow =
                "inset 0 0 0 2px rgba(255,149,0,0.50), inset 0 2px 6px rgba(196,134,82,0.08)";
            }}
            onComposerBlur={(el) => {
              setComposerFocused(false);
              el.style.boxShadow =
                "inset 0 0 0 1.5px rgba(244,196,141,0.55), inset 0 2px 6px rgba(196,134,82,0.06)";
            }}
          />
        )}

      </div>{/* end scrollable body */}

      {/* Guess CTA for text chat lives inside the chat panel footer (see composer
          block) so it never covers the input on mobile. Voice mode keeps its
          own guess control in VoiceModePlayingPanel. */}

      {/* ════════════════════════════════════════════════════════
          TURN TRANSITION POPUP
      ════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {turnPopup ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 z-[60] flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.68, y: 32 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.68, y: 32 }}
              transition={{ type: "spring", stiffness: 350, damping: 22 }}
              className="relative overflow-hidden rounded-[2rem] px-14 py-8 text-3xl font-black text-white sm:text-4xl"
              style={{
                background: "linear-gradient(140deg,#FF9F0A 0%,#FF5500 100%)",
                boxShadow: "inset 0 2.5px 0 rgba(255,255,255,0.40), 0 16px 0 #be5200, 0 28px 60px rgba(255,100,0,0.52)",
                textShadow: "0 2px 0 rgba(0,0,0,0.22)",
              }}
            >
              <span aria-hidden className="pointer-events-none absolute inset-x-12 top-3 h-3 rounded-full bg-white/28 blur-sm" />
              {turnPopup}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════
          MATCH RESULT SCREEN — full-screen takeover
      ════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {ended ? (
          <MatchResultScreen
            roomId={roomId}
            myUid={uid}
            iWon={iWon}
            winnerUid={winnerUid}
            forfeitWin={forfeitWin}
            myName={displayName}
            opponentName={opponentName}
            opponentCard={opponentCard}
            messages={messages}
            matchStartedAtMs={match?.startedAt?.toMillis?.() ?? null}
            matchEndedAtMs={match?.endedAt?.toMillis?.() ?? null}
            replayBusy={busy}
            onReplay={() => void handleReplay()}
            onHome={() => router.push("/")}
            myCosmetic={uid ? cosmeticsMap[uid] : undefined}
            opponentCosmetic={opponent ? cosmeticsMap[opponent.uid] : undefined}
            myPhotoURL={user?.photoURL}
          />
        ) : null}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════
          GUESS: ARE YOU SURE
      ════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {guessSureOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[55] flex items-center justify-center bg-[#6a3f1b]/45 px-4 backdrop-blur-sm"
            onClick={() => setGuessSureOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.88, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              onClick={(e: MouseEvent) => e.stopPropagation()}
            >
              <Panel className="max-w-sm text-center">
                <div className="text-4xl">🎯</div>
                <p className="mt-3 text-xl font-black text-[#8a3f16]">هل أنت متأكد؟</p>
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

      {/* ════════════════════════════════════════════════════════
          GUESS: INPUT
      ════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {guessInputOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[54] flex items-center justify-center bg-[#6a3f1b]/40 px-4 backdrop-blur-sm"
            onClick={() => setGuessInputOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.90, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 20 }}
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

      {/* ════════════════════════════════════════════════════════
          LEAVE CONFIRM
      ════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {leaveConfirmOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-[56] flex items-center justify-center bg-[#6a3f1b]/45 px-4 backdrop-blur-sm"
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
