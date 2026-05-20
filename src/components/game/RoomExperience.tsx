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
  playTacticalAlert,
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
import {
  MATCHUP_VS_INTRO_DURATION_MS,
  MatchupVsTransitionOverlay,
} from "@/components/game/MatchupVsTransitionOverlay";
import { MatchResultScreen } from "@/components/game/MatchResultScreen";
import { GameplaySocialSurface } from "@/components/game/GameplaySocialSurface";
import { VoiceModePlayingPanel } from "@/components/game/VoiceModePlayingPanel";
import { TacticalEventBanner } from "@/components/game/play/TacticalEventBanner";
import { useLiveUserProfile } from "@/hooks/useLiveUserProfile";
import { useMatchTactical } from "@/hooks/useMatchTactical";
import { TIME_PRESSURE_QUESTION_SEC } from "@/lib/profile/tactical-tools";
import type { TacticalToolId } from "@/lib/profile/tactical-tools";
import { RoomInviteFriendsPanel } from "@/components/social/RoomInviteFriendsPanel";
import { LobbyShellBridge } from "@/components/game/LobbyShellBridge";

type Props = { roomId: string };

const MATCHUP_VS_STALE_MS = MATCHUP_VS_INTRO_DURATION_MS + 8000;

function matchupVsSessionKey(matchId: string) {
  return `meenana-matchup-vs:${matchId}`;
}

function readMatchupVsSession(matchId: string): { t: number; phase: "start" | "done" } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(matchupVsSessionKey(matchId));
    if (!raw) return null;
    return JSON.parse(raw) as { t: number; phase: "start" | "done" };
  } catch {
    return null;
  }
}

function writeMatchupVsSession(matchId: string, phase: "start" | "done") {
  sessionStorage.setItem(matchupVsSessionKey(matchId), JSON.stringify({ t: Date.now(), phase }));
}

// ─── ROOM EXPERIENCE ────────────────────────────────────────────────────────

export function RoomExperience({ roomId }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const uid = user?.uid ?? null;
  const displayName = user?.displayName || user?.email || "زائر";

  const { room, match, messages, opponentCard, wireError } = useRoomWire(roomId, uid);
  const liveProfile = useLiveUserProfile(uid);
  const tacticalInv = liveProfile?.progress.tacticalInventory;
  const {
    useTool: activateTactical,
    busy: tacticalBusy,
    error: tacticalError,
    clearError: clearTacticalError,
  } = useMatchTactical(roomId, match?.id ?? null);

  const cosmeticUids = useMemo(
    () => (room?.players ?? []).map((p) => p.uid).filter(Boolean) as string[],
    [room?.players],
  );
  const cosmeticsMap = usePlayerCosmetics(cosmeticUids);

  const opponentPlayer = useMemo(
    () => (room && uid ? room.players.find((p) => p.uid !== uid) : undefined),
    [room, uid],
  );

  const [draft, setDraft] = useState("");
  const [guessSureOpen, setGuessSureOpen] = useState(false);
  const [guessInputOpen, setGuessInputOpen] = useState(false);
  const [guessDraft, setGuessDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [turnPopup, setTurnPopup] = useState<string | null>(null);
  const [matchupVsOpen, setMatchupVsOpen] = useState(false);
  const matchupVsTimerRef = useRef<number | null>(null);

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
  const lastTacticalEventId = useRef<string | null>(null);
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
    if (matchupVsTimerRef.current) {
      window.clearTimeout(matchupVsTimerRef.current);
      matchupVsTimerRef.current = null;
    }

    if (!room || room.status !== "playing" || !match || match.status !== "active" || ended) {
      return;
    }
    if (!opponentPlayer) return;

    const startedMs = match.startedAt?.toMillis?.() ?? 0;
    if (startedMs > 0 && Date.now() - startedMs > 12000) {
      return;
    }

    const st = readMatchupVsSession(match.id);
    if (st?.phase === "done") return;

    const finish = () => {
      writeMatchupVsSession(match.id, "done");
      setMatchupVsOpen(false);
      matchupVsTimerRef.current = null;
    };

    if (st?.phase === "start") {
      const elapsed = Date.now() - st.t;
      if (elapsed >= MATCHUP_VS_STALE_MS) {
        finish();
        return;
      }
      const remaining = MATCHUP_VS_INTRO_DURATION_MS - elapsed;
      if (remaining <= 0) {
        finish();
        return;
      }
      setMatchupVsOpen(true);
      matchupVsTimerRef.current = window.setTimeout(finish, remaining);
    } else {
      writeMatchupVsSession(match.id, "start");
      setMatchupVsOpen(true);
      matchupVsTimerRef.current = window.setTimeout(finish, MATCHUP_VS_INTRO_DURATION_MS);
    }

    return () => {
      if (matchupVsTimerRef.current) {
        window.clearTimeout(matchupVsTimerRef.current);
        matchupVsTimerRef.current = null;
      }
    };
  }, [room?.status, match?.id, match?.status, match?.startedAt, ended, opponentPlayer]);

  useEffect(() => {
    if (ended) setMatchupVsOpen(false);
  }, [ended]);

  useEffect(() => {
    if (!room || room.status !== "playing") setMatchupVsOpen(false);
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
  const timePressureOnActor =
    phase === "question" &&
    match?.actorUid &&
    match.timePressureTargetUid === match.actorUid;
  const maxPhaseSec =
    phase === "answer" ? aSec : timePressureOnActor ? TIME_PRESSURE_QUESTION_SEC : qSec;

  const onUseTactical = useCallback(
    (toolId: TacticalToolId) => {
      resumeAudioContext();
      playUIButton();
      clearTacticalError();
      void activateTactical(toolId, displayName).then((ev) => {
        if (!ev) return;
        resumeAudioContext();
        playTacticalAlert(ev.blocked === true);
      });
    },
    [activateTactical, displayName, clearTacticalError],
  );

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
    const ev = match?.lastTacticalEvent;
    if (!ev?.id || ev.id === lastTacticalEventId.current) return;
    lastTacticalEventId.current = ev.id;
    if (ev.actorUid === uid) return;
    resumeAudioContext();
    playTacticalAlert(ev.blocked === true);
  }, [match?.lastTacticalEvent, uid]);

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

    const lobbyCustomPanels = (
      <>
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
      </>
    );

    return (
      <>
        <input
          ref={lobbyCustomFileRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,.png,.jpg,.jpeg,.webp"
          className="hidden"
          onChange={(ev) => void onLobbyCustomFile(ev)}
        />
        <LobbyShellBridge
          room={room}
          uid={uid}
          displayName={displayName}
          userPhotoURL={user?.photoURL}
          cosmeticsMap={cosmeticsMap}
          myReady={myReadyOptimistic}
          isHost={isHost}
          busy={busy}
          banner={banner}
          googleSoc={googleSoc}
          myReadyOptimistic={myReadyOptimistic}
          opponent={opponent}
          customModeActive={customModeActive}
          randomLobby={randomLobby}
          uidCardComplete={uidCardComplete}
          bothPickedCustom={bothPickedCustom}
          onBack={() => router.push("/")}
          onCopyCode={() => void copyCode()}
          onInviteFriends={() => {
            resumeAudioContext();
            playUIButton();
            setFriendInviteOpen(true);
          }}
          onToggleReady={() => void toggleReady()}
          onStartMatch={() => void startMatch()}
          onLeave={requestExit}
          customPanels={lobbyCustomPanels}
          overlays={
            <>
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
            </>
          }
        />
      </>
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
      <MatchupVsTransitionOverlay
        open={matchupVsOpen && !ended && Boolean(opponentPlayer)}
        leftName={opponentPlayer?.displayName ?? "الخصم"}
        leftCosmetic={opponentPlayer ? cosmeticsMap[opponentPlayer.uid] : undefined}
        rightName={displayName}
        rightCosmetic={uid ? cosmeticsMap[uid] : undefined}
        rightPhotoURL={user?.photoURL}
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
        <TacticalEventBanner event={match?.lastTacticalEvent} myUid={uid} />

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
            roomId={room.id}
            matchId={match?.id ?? null}
            roomHintsEnabled={room.hintsEnabled !== false}
            uid={uid}
            displayName={displayName}
            opponentName={opponentName}
            myTurn={myTurn}
            secLeft={secLeft}
            opponentCard={opponentCard}
            busy={busy}
            sendVoiceAck={sendVoiceAck}
            openGuessFlow={openGuessFlow}
            myCosmetic={uid ? cosmeticsMap[uid] : undefined}
            opponentCosmetic={opponent ? cosmeticsMap[opponent.uid] : undefined}
            myPhotoURL={user?.photoURL}
            match={match}
            phase={phase}
            tacticalInventory={tacticalInv}
            tacticalBusy={tacticalBusy}
            onUseTactical={onUseTactical}
            tacticalError={tacticalError}
          />
        ) : (
          <GameplaySocialSurface
            banner={banner}
            roomId={room.id}
            matchId={match?.id ?? null}
            roomHintsEnabled={room.hintsEnabled !== false}
            keyboardOverlapPx={keyboardOverlapPx}
            matchSyncWaiting={room.status === "playing" && !match}
            socialMatchLive={Boolean(match?.status === "active" && !ended)}
            myTurn={myTurn}
            phase={phase}
            secLeft={secLeft}
            maxPhaseSec={maxPhaseSec}
            displayName={displayName}
            opponentName={opponentName}
            uid={uid}
            opponentUid={opponent?.uid ?? null}
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
            match={match}
            tacticalInventory={tacticalInv}
            tacticalBusy={tacticalBusy}
            onUseTactical={onUseTactical}
            tacticalError={tacticalError}
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
