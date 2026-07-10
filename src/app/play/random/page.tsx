"use client";

import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AuthGate } from "@/components/auth/AuthGate";
import { ShellMatchmakingView, type ShellMatchStage } from "@/components/shell/lobby/ShellMatchmakingView";
import { ShellIcon } from "@/components/shell/ShellIcons";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLiveUserProfile } from "@/hooks/useLiveUserProfile";
import { playMatchFound, resumeAudioContext } from "@/lib/audio/game-sounds";
import { matchmakingAck, matchmakingJoin, matchmakingLeave } from "@/lib/api/matchmaking-client";
import { getFirebaseDb } from "@/lib/firebase/client";
import { col } from "@/lib/firestore/paths";
import { isFirebaseFirestoreError, logFsListenAttach, logFsOpFailure } from "@/lib/firestore/fs-op-debug";
import { DEFAULT_CATEGORY_ID } from "@/lib/game/categories";
import { MATCHMAKING_POOL_ALL } from "@/lib/game/constants";
import { useGamePresenceReporter } from "@/hooks/useGamePresenceReporter";
import { isFullAccountUser } from "@/lib/auth/google-user";
import { normalizeCosmetic, type PlayerCosmetic } from "@/lib/profile/cosmetics";

const DEFAULT_CATEGORY = DEFAULT_CATEGORY_ID;
const MATCH_FOUND_REVEAL_MS = 2400;

type Phase = "idle" | "searching" | "found" | "matched";

export default function RandomPlayPage() {
  return (
    <AuthGate>
      <RandomInner />
    </AuthGate>
  );
}

function RandomInner() {
  const { user } = useAuth();
  const router = useRouter();
  const unsubRef = useRef<(() => void) | null>(null);
  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchStartedAtRef = useRef<number>(0);
  const handledRoomRef = useRef<string | null>(null);
  const leftRef = useRef<boolean>(false);

  const [phase, setPhase] = useState<Phase>("idle");
  const [err, setErr] = useState<string | null>(null);
  const [opponentName, setOpponentName] = useState<string>("خصم جديد");
  const [opponentCosmetic, setOpponentCosmetic] = useState<PlayerCosmetic | null>(null);
  const [opponentXp, setOpponentXp] = useState<number | undefined>(undefined);
  const [opponentWins, setOpponentWins] = useState<number | undefined>(undefined);
  const [countdown, setCountdown] = useState<number>(0);
  const [elapsedSec, setElapsedSec] = useState(0);

  const cleanupListen = useCallback(() => {
    unsubRef.current?.();
    unsubRef.current = null;
  }, []);

  const cleanupNav = useCallback(() => {
    if (navTimer.current) {
      clearTimeout(navTimer.current);
      navTimer.current = null;
    }
  }, []);

  useEffect(() => {
    const onUnload = () => {
      if (leftRef.current) return;
      void matchmakingLeave({ poolId: MATCHMAKING_POOL_ALL }).catch(() => undefined);
      leftRef.current = true;
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, []);

  useEffect(() => {
    return () => {
      cleanupListen();
      cleanupNav();
      if (!leftRef.current) {
        leftRef.current = true;
        void matchmakingLeave({ poolId: MATCHMAKING_POOL_ALL }).catch(() => undefined);
      }
    };
  }, [cleanupListen, cleanupNav]);

  const displayName = user?.displayName || user?.email || "زائر";
  const myUid = user?.uid ?? null;
  const googleSoc = isFullAccountUser(user);
  const matchmakingActive = phase === "searching" || phase === "found" || phase === "matched";
  useGamePresenceReporter({
    uid: googleSoc ? myUid : null,
    enabled: Boolean(googleSoc && myUid),
    presence: matchmakingActive ? "matchmaking" : "online",
    roomId: null,
    resetOnUnmount: true,
  });
  const liveProfile = useLiveUserProfile(myUid);
  const myCosmetic = liveProfile?.cosmetic;

  useEffect(() => {
    if (phase !== "searching" && phase !== "found") {
      setElapsedSec(0);
      return;
    }
    const t = window.setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [phase]);

  const fetchOpponentProfile = useCallback(
    async (roomId: string, uid: string): Promise<{ name: string; cosmetic: PlayerCosmetic; xp?: number; matchWins?: number }> => {
      const fallback = { name: "خصم جديد", cosmetic: normalizeCosmetic(undefined) };
      const db = getFirebaseDb();
      const roomPath = `${col.rooms}/${roomId}`;
      let snap;
      try {
        snap = await getDoc(doc(db, col.rooms, roomId));
      } catch (err) {
        if (isFirebaseFirestoreError(err)) {
          logFsOpFailure({
            area: "random.page.fetchOpponentProfile.getDoc_room",
            op: "read",
            path: roomPath,
            err,
            roomId,
            myUid: uid,
            extra: { step: "room" },
          });
        }
        return fallback;
      }
      if (!snap.exists()) return fallback;
      const data = snap.data() as { players?: Array<{ uid?: string; displayName?: string }> };
      const other = (data.players ?? []).find((p) => p?.uid && p.uid !== uid);
      const name = (other?.displayName ?? "").toString().trim() || "خصم جديد";
      const ouid = other?.uid;
      if (!ouid) return { name, cosmetic: normalizeCosmetic(undefined) };
      const userPath = `${col.users}/${ouid}`;
      try {
        const uSnap = await getDoc(doc(db, col.users, ouid));
        if (!uSnap.exists()) return { name, cosmetic: normalizeCosmetic(undefined) };
        const raw = uSnap.data() as Record<string, unknown>;
        const xp = typeof raw.xp === "number" && Number.isFinite(raw.xp) ? Math.max(0, Math.floor(raw.xp)) : undefined;
        const matchWins = typeof raw.matchWins === "number" && Number.isFinite(raw.matchWins) ? Math.max(0, Math.floor(raw.matchWins)) : undefined;
        return { name, cosmetic: normalizeCosmetic(raw), xp, matchWins };
      } catch (err) {
        if (isFirebaseFirestoreError(err)) {
          logFsOpFailure({
            area: "random.page.fetchOpponentProfile.getDoc_user",
            op: "read",
            path: userPath,
            err,
            roomId,
            myUid: uid,
            opponentUid: ouid,
            roomPlayerUids: (data.players ?? []).map((p) => String(p.uid ?? "")).filter(Boolean),
            amInRoomPlayerUids: Boolean((data.players ?? []).some((p) => p.uid === uid)),
            extra: { step: "users", opponentName: name },
          });
        }
        return { name, cosmetic: normalizeCosmetic(undefined) };
      }
    },
    [],
  );

  const enterMatchFound = useCallback(
    async (roomId: string) => {
      if (handledRoomRef.current === roomId) return;
      handledRoomRef.current = roomId;
      cleanupListen();
      resumeAudioContext();
      playMatchFound();
      setPhase("found");

      if (user?.uid) {
        void fetchOpponentProfile(roomId, user.uid).then(({ name, cosmetic, xp, matchWins }) => {
          setOpponentName(name);
          setOpponentCosmetic(cosmetic);
          setOpponentXp(xp);
          setOpponentWins(matchWins);
        });
      }

      try {
        await matchmakingAck();
      } catch {
        /* non-fatal */
      }

      const totalMs = MATCH_FOUND_REVEAL_MS;
      const start = Date.now();
      setCountdown(Math.ceil(totalMs / 1000));
      const tick = () => {
        const elapsed = Date.now() - start;
        const remain = Math.max(0, totalMs - elapsed);
        setCountdown(Math.ceil(remain / 1000));
        if (remain <= 0) {
          setPhase("matched");
          router.replace(`/room/${roomId}`);
          return;
        }
        navTimer.current = setTimeout(tick, 200);
      };
      tick();
    },
    [cleanupListen, fetchOpponentProfile, router, user?.uid],
  );

  const startSearch = async () => {
    if (!user) return;
    setPhase("searching");
    setErr(null);
    setOpponentCosmetic(null);
    setOpponentXp(undefined);
    setOpponentWins(undefined);
    cleanupListen();
    cleanupNav();
    handledRoomRef.current = null;
    leftRef.current = false;
    searchStartedAtRef.current = Date.now();

    try {
      await matchmakingAck();
    } catch {
      /* ignore */
    }

    try {
      const db = getFirebaseDb();
      const resultRef = doc(db, col.matchmakingResults, user.uid);
      const resultPath = `${col.matchmakingResults}/${user.uid}`;
      logFsListenAttach("random.page.matchmakingResults", resultPath, { myUid: user.uid });
      unsubRef.current = onSnapshot(
        resultRef,
        (snap) => {
          if (!snap.exists()) return;
          const data = snap.data() as {
            roomId?: unknown;
            createdAt?: { toMillis?: () => number } | undefined;
          };
          const rid = typeof data.roomId === "string" ? data.roomId : "";
          if (!rid) return;
          const createdMs = data.createdAt?.toMillis?.() ?? 0;
          if (createdMs && createdMs < searchStartedAtRef.current - 500) return;
          void enterMatchFound(rid);
        },
        (err) => {
          if (isFirebaseFirestoreError(err)) {
            logFsOpFailure({
              area: "random.page.matchmakingResults.onSnapshot",
              op: "listen",
              path: resultPath,
              err,
              myUid: user.uid,
              extra: { note: "listener_error_callback" },
            });
          }
        },
      );
    } catch (err) {
      if (isFirebaseFirestoreError(err)) {
        logFsOpFailure({
          area: "random.page.matchmakingResults.onSnapshot_setup",
          op: "listen",
          path: `${col.matchmakingResults}/${user.uid}`,
          err,
          myUid: user.uid,
        });
      }
    }

    try {
      const res = await matchmakingJoin({
        poolId: MATCHMAKING_POOL_ALL,
        categoryId: DEFAULT_CATEGORY,
        displayName,
      });
      if (res.status === "matched" && res.roomId) {
        void enterMatchFound(res.roomId);
      }
    } catch (e) {
      cleanupListen();
      setPhase("idle");
      setErr(e instanceof Error ? e.message : "تعذر البدء");
    }
  };

  const cancelSearch = async () => {
    setErr(null);
    cleanupListen();
    cleanupNav();
    try {
      await matchmakingLeave({ poolId: MATCHMAKING_POOL_ALL });
      leftRef.current = true;
    } catch {
      /* ignore */
    }
    setPhase("idle");
    handledRoomRef.current = null;
  };

  const shellStage: ShellMatchStage =
    phase === "idle"
      ? "idle"
      : phase === "searching"
        ? "searching"
        : phase === "found"
          ? "found"
          : "connecting";

  const chipLabel =
    phase === "found"
      ? "تم العثور!"
      : phase === "matched"
        ? "جاري الدخول"
        : phase === "searching"
          ? "البحث عن خصم"
          : "لعب عشوائي";

  const statusTitle =
    phase === "found"
      ? "تم العثور على خصمك"
      : phase === "matched"
        ? "جاري الدخول إلى الغرفة"
        : phase === "searching"
          ? "نبحث عن منافس مناسب…"
          : "ابحث عن خصم وابدأ اللعب";

  const statusSubtitle =
    phase === "found"
      ? countdown > 0
        ? `المباراة تبدأ خلال ${countdown}…`
        : "المباراة تبدأ خلال لحظات…"
      : phase === "matched"
        ? "جاري ربط اللاعبين…"
        : phase === "searching"
          ? "في انتظار لاعب بمستوى قريب من مستواك"
          : "اضغط الزر أدناه للانضمام إلى الطابور";

  const onClose = () => {
    if (phase === "searching") {
      void cancelSearch();
      return;
    }
    router.push("/");
  };

  const footer = (
    <div className="flex flex-col gap-2 w-full">
      {phase === "idle" ? (
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={() => void startSearch()}
          className="w-full py-4 rounded-2xl text-sm font-black text-white shadow-md transition-transform flex items-center justify-center gap-2 border border-purple-800"
          style={{
            background: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
            cursor: "pointer",
          }}
        >
          <ShellIcon name="search" size={16} color="#FFFFFF" />
          البحث عن منافس
        </motion.button>
      ) : null}
      {phase === "searching" ? (
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={() => void cancelSearch()}
          className="w-full py-4 rounded-2xl text-sm font-black bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-sm transition-transform flex items-center justify-center gap-2"
          style={{
            cursor: "pointer",
          }}
        >
          <ShellIcon name="close" size={14} color="#64748B" />
          إلغاء البحث
        </motion.button>
      ) : null}
      {(phase === "found" || phase === "matched") ? (
        <button
          type="button"
          disabled
          className="w-full py-4 rounded-2xl text-sm font-black bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center gap-2 select-none"
        >
          جاري ربط اللاعبين...
        </button>
      ) : null}
      {phase === "idle" ? (
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={() => router.push("/")}
          className="w-full py-3.5 rounded-2xl text-xs font-black bg-slate-50 hover:bg-slate-100 border border-slate-150 text-slate-500 mt-2 transition-transform flex items-center justify-center gap-2"
          style={{
            cursor: "pointer",
          }}
        >
          العودة للرئيسية
        </motion.button>
      ) : null}
    </div>
  );

  return (
    <ShellMatchmakingView
      stage={shellStage}
      elapsedSec={elapsedSec}
      chipLabel={chipLabel}
      myName={displayName}
      myCosmetic={myCosmetic}
      myPhotoURL={user?.photoURL}
      myXp={liveProfile?.progress.xp}
      myWins={liveProfile?.progress.matchWins}
      opponentName={opponentName}
      opponentCosmetic={opponentCosmetic ?? undefined}
      opponentXp={opponentXp}
      opponentWins={opponentWins}
      statusTitle={statusTitle}
      statusSubtitle={statusSubtitle}
      searching={phase === "searching"}
      onClose={onClose}
      footer={footer}
      error={err}
    />
  );
}
