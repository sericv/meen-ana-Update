import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { col } from "@/lib/firestore/paths";
import {
  ANSWER_PHASE_SECONDS,
  QUESTION_PHASE_SECONDS,
} from "@/lib/game/constants";
import { generateRoomCode } from "@/lib/game/room-code";

type PoolState = {
  waitingUid: string | null;
  waitingDisplayName: string | null;
};

function poolRef(poolId: string) {
  return getAdminDb().collection(col.matchmakingPool).doc(poolId);
}

function resultRef(uid: string) {
  return getAdminDb().collection(col.matchmakingResults).doc(uid);
}

/**
 * Atomically join queue or pair with a waiter. Creates room via Admin when paired.
 */
export async function joinMatchmakingQueue(args: {
  poolId: string;
  uid: string;
  displayName: string;
  categoryId: string;
}): Promise<{ status: "waiting" } | { status: "matched"; roomId: string }> {
  const db = getAdminDb();
  const pref = poolRef(args.poolId);

  const outcome = await db.runTransaction(async (tx) => {
    const snap = await tx.get(pref);
    const data = (snap.exists ? snap.data() : {}) as Partial<PoolState>;
    const waitingUid = (data.waitingUid as string | undefined) ?? null;
    const waitingDisplayName = (data.waitingDisplayName as string | undefined) ?? null;

    if (!waitingUid) {
      tx.set(
        pref,
        {
          waitingUid: args.uid,
          waitingDisplayName: args.displayName,
          waitingSince: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      return { kind: "wait" as const };
    }

    if (waitingUid === args.uid) {
      return { kind: "wait" as const };
    }

    const waiterUid = waitingUid;
    const waiterName = waitingDisplayName || "لاعب";
    const joinerUid = args.uid;
    const joinerName = args.displayName;

    tx.set(
      pref,
      {
        waitingUid: null,
        waitingDisplayName: null,
        waitingSince: null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return {
      kind: "pair" as const,
      waiterUid,
      waiterName,
      joinerUid,
      joinerName,
    };
  });

  if (outcome.kind === "wait") {
    return { status: "waiting" };
  }

  const code = generateRoomCode();
  const roomRef = db.collection(col.rooms).doc();
  const roomId = roomRef.id;
  const now = FieldValue.serverTimestamp();

  const waiterUid = outcome.waiterUid;
  const joinerUid = outcome.joinerUid;

  const batch = db.batch();

  batch.set(roomRef, {
    code,
    hostUid: waiterUid,
    playerUids: [waiterUid, joinerUid],
    players: [
      { uid: waiterUid, displayName: outcome.waiterName, ready: true, joinedAt: null },
      { uid: joinerUid, displayName: outcome.joinerName, ready: true, joinedAt: null },
    ],
    playerJoinedAt: {
      [waiterUid]: now,
      [joinerUid]: now,
    },
    status: "lobby",
    categoryId: args.categoryId,
    tutorial: false,
    matchId: null,
    openJoin: false,
    randomMatch: true,
    questionTimerSec: QUESTION_PHASE_SECONDS,
    answerTimerSec: ANSWER_PHASE_SECONDS,
    createdAt: now,
    lastActivityAt: now,
    cleanupAt: null,
  });

  batch.set(db.collection(col.roomCodes).doc(code), { roomId });

  batch.set(resultRef(waiterUid), {
    roomId,
    poolId: args.poolId,
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return { status: "matched", roomId };
}

/** Clear queue if this uid is currently waiting. */
export async function leaveMatchmakingQueue(poolId: string, uid: string): Promise<void> {
  const db = getAdminDb();
  const pref = poolRef(poolId);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(pref);
    if (!snap.exists) return;
    const waitingUid = (snap.data()?.waitingUid as string | undefined) ?? null;
    if (waitingUid !== uid) return;
    tx.set(
      pref,
      {
        waitingUid: null,
        waitingDisplayName: null,
        waitingSince: null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });
}

export async function deleteMatchmakingResult(uid: string): Promise<void> {
  await resultRef(uid).delete().catch(() => undefined);
}
