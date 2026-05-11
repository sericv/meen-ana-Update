import { FieldValue, Timestamp, type Firestore } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { col, roomPlayerCardsCol } from "@/lib/firestore/paths";
import {
  ANSWER_PHASE_SECONDS,
  QUESTION_PHASE_SECONDS,
} from "@/lib/game/constants";
import { pickTwoCards } from "@/lib/game/cards";
import { guessMatchesCard } from "@/lib/game/validation";

function messagesRef(db: Firestore, roomId: string) {
  return db.collection(col.rooms).doc(roomId).collection("messages");
}

function opponentOf(order: string[], uid: string): string | null {
  return order.find((u) => u !== uid) ?? null;
}

function readRoomTimers(room: Record<string, unknown>): {
  q: number;
  a: number;
} {
  const qRaw = Number(room.questionTimerSec ?? QUESTION_PHASE_SECONDS);
  const aRaw = Number(room.answerTimerSec ?? ANSWER_PHASE_SECONDS);
  const q = Number.isFinite(qRaw) && qRaw >= 3 ? Math.min(120, qRaw) : QUESTION_PHASE_SECONDS;
  const a = Number.isFinite(aRaw) && aRaw >= 3 ? Math.min(120, aRaw) : ANSWER_PHASE_SECONDS;
  return { q, a };
}

function readMatchTimers(m: Record<string, unknown>): { q: number; a: number } {
  const qRaw = Number(m.questionSeconds ?? QUESTION_PHASE_SECONDS);
  const aRaw = Number(m.answerSeconds ?? ANSWER_PHASE_SECONDS);
  return {
    q: Number.isFinite(qRaw) ? qRaw : QUESTION_PHASE_SECONDS,
    a: Number.isFinite(aRaw) ? aRaw : ANSWER_PHASE_SECONDS,
  };
}

// ─── Start match ─────────────────────────────────────────────────────────────

export async function startMatchForRoom(args: {
  roomId: string;
  actingUid: string;
}): Promise<{ matchId: string }> {
  const db = getAdminDb();
  const roomRef = db.collection(col.rooms).doc(args.roomId);
  const roomSnap = await roomRef.get();
  if (!roomSnap.exists) throw new Error("ROOM_NOT_FOUND");

  const room = roomSnap.data()!;
  if (room.hostUid !== args.actingUid) throw new Error("NOT_HOST");
  if (room.status !== "lobby") throw new Error("ROOM_NOT_LOBBY");

  const playerUids = (room.playerUids as string[]) ?? [];
  if (playerUids.length !== 2) throw new Error("NEED_TWO_PLAYERS");
  if (!room.players?.every((p: { ready?: boolean }) => p.ready)) {
    throw new Error("NOT_READY");
  }

  const { q: qSec, a: aSec } = readRoomTimers(room);

  const categoryId = typeof room.categoryId === "string" ? room.categoryId : undefined;
  const pair = pickTwoCards(categoryId);
  if (!pair) throw new Error("NOT_ENOUGH_CARDS");

  const [c0, c1] = pair;
  const [p0, p1] = [playerUids[0]!, playerUids[1]!];

  const matchRef = db.collection(col.matches).doc();
  const matchId = matchRef.id;
  const now = FieldValue.serverTimestamp();
  const qDeadline = Timestamp.fromMillis(Date.now() + qSec * 1000);

  const batch = db.batch();

  batch.set(roomRef, { status: "playing", matchId, lastActivityAt: now, cleanupAt: Timestamp.fromMillis(Date.now() + 60 * 60 * 1000) }, { merge: true });

  batch.set(matchRef, {
    roomId: args.roomId,
    status: "active",
    playerOrder: [p0, p1],
    chatPhase: "question",
    actorUid: p0,
    turnDeadline: qDeadline,
    questionSeconds: qSec,
    answerSeconds: aSec,
    winnerUid: null,
    winReason: null,
    startedAt: now,
    endedAt: null,
  });

  const pc0 = db.doc(`${roomPlayerCardsCol(args.roomId)}/${p0}`);
  const pc1 = db.doc(`${roomPlayerCardsCol(args.roomId)}/${p1}`);
  batch.set(pc0, { cardId: c0.id, name: c0.name, nameAr: c0.nameAr, imageUrl: c0.imageUrl, categoryId: c0.categoryId });
  batch.set(pc1, { cardId: c1.id, name: c1.name, nameAr: c1.nameAr, imageUrl: c1.imageUrl, categoryId: c1.categoryId });

  const sysRef = messagesRef(db, args.roomId).doc();
  batch.set(sysRef, {
    senderUid: "system",
    senderName: "النظام",
    type: "system",
    text: `انطلقت المباراة! ${qSec} ثانية لطرح سؤال، ثم ${aSec} ثانية للإجابة. يبدأ اللاعب الأول.`,
    createdAt: now,
  });

  await batch.commit();
  return { matchId };
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export async function handleChat(args: {
  roomId: string;
  matchId: string;
  uid: string;
  displayName: string;
  text: string;
}) {
  const db = getAdminDb();
  const matchRef = db.collection(col.matches).doc(args.matchId);
  const roomRef = db.collection(col.rooms).doc(args.roomId);

  await db.runTransaction(async (tx) => {
    const matchSnap = await tx.get(matchRef);
    if (!matchSnap.exists) throw new Error("MATCH_NOT_FOUND");
    const m = matchSnap.data()!;
    if (m.status !== "active") throw new Error("MATCH_ENDED");

    const { q: qSec, a: aSec } = readMatchTimers(m);

    const order = m.playerOrder as string[];
    if (!order.includes(args.uid)) throw new Error("NOT_IN_MATCH");

    const phase = (m.chatPhase as string) === "answer" ? "answer" : "question";
    const actorUid = String(m.actorUid ?? "");
    const dl = m.turnDeadline as Timestamp | undefined;
    const dlMs = dl?.toMillis?.() ?? 0;
    if (actorUid && args.uid !== actorUid) throw new Error("NOT_YOUR_TURN");
    if (dlMs && Date.now() > dlMs + 800) throw new Error("TURN_EXPIRED");

    const msgRef = messagesRef(db, args.roomId).doc();

    if (phase === "question") {
      const opp = opponentOf(order, args.uid);
      if (!opp) throw new Error("BAD_MATCH");
      tx.set(msgRef, {
        senderUid: args.uid,
        senderName: args.displayName,
        type: "question",
        text: args.text,
        createdAt: FieldValue.serverTimestamp(),
      });
      tx.set(
        matchRef,
        {
          chatPhase: "answer",
          actorUid: opp,
          turnDeadline: Timestamp.fromMillis(Date.now() + aSec * 1000),
        },
        { merge: true },
      );
    } else {
      tx.set(msgRef, {
        senderUid: args.uid,
        senderName: args.displayName,
        type: "chat",
        text: args.text,
        createdAt: FieldValue.serverTimestamp(),
      });
      tx.set(
        matchRef,
        {
          chatPhase: "question",
          actorUid: args.uid,
          turnDeadline: Timestamp.fromMillis(Date.now() + qSec * 1000),
        },
        { merge: true },
      );
    }

    tx.set(roomRef, { lastActivityAt: FieldValue.serverTimestamp() }, { merge: true });
  });
}

export async function handleTurnTimeout(args: {
  roomId: string;
  matchId: string;
  uid: string;
}): Promise<{ advanced: boolean }> {
  const db = getAdminDb();
  const matchRef = db.collection(col.matches).doc(args.matchId);
  const roomRef = db.collection(col.rooms).doc(args.roomId);

  const result = await db.runTransaction(async (tx) => {
    const matchSnap = await tx.get(matchRef);
    if (!matchSnap.exists) throw new Error("MATCH_NOT_FOUND");
    const m = matchSnap.data()!;
    if (m.status !== "active") return { advanced: false };

    const { q: qSec, a: aSec } = readMatchTimers(m);

    const order = m.playerOrder as string[];
    if (!order.includes(args.uid)) throw new Error("NOT_IN_MATCH");

    const dl = m.turnDeadline as Timestamp | undefined;
    const dlMs = dl?.toMillis?.() ?? 0;
    if (!dlMs || Date.now() < dlMs - 500) return { advanced: false };

    const phase = (m.chatPhase as string) === "answer" ? "answer" : "question";
    const actorUid = String(m.actorUid ?? "");
    if (actorUid !== args.uid) return { advanced: false };

    const sysRef = messagesRef(db, args.roomId).doc();

    if (phase === "question") {
      const opp = opponentOf(order, args.uid);
      if (!opp) throw new Error("BAD_MATCH");
      tx.set(sysRef, {
        senderUid: "system",
        senderName: "النظام",
        type: "system",
        text: "انتهى وقت السؤال — انتقل الدور للخصم.",
        createdAt: FieldValue.serverTimestamp(),
      });
      tx.set(
        matchRef,
        {
          chatPhase: "question",
          actorUid: opp,
          turnDeadline: Timestamp.fromMillis(Date.now() + qSec * 1000),
        },
        { merge: true },
      );
    } else {
      const opp = opponentOf(order, args.uid);
      if (!opp) throw new Error("BAD_MATCH");
      tx.set(sysRef, {
        senderUid: "system",
        senderName: "النظام",
        type: "system",
        text: "انتهى وقت الإجابة — دور سؤال جديد.",
        createdAt: FieldValue.serverTimestamp(),
      });
      tx.set(
        matchRef,
        {
          chatPhase: "question",
          actorUid: opp,
          turnDeadline: Timestamp.fromMillis(Date.now() + qSec * 1000),
        },
        { merge: true },
      );
    }

    tx.set(roomRef, { lastActivityAt: FieldValue.serverTimestamp() }, { merge: true });
    return { advanced: true };
  });

  return result;
}

// ─── Guess (only on your turn as actor) ─────────────────────────────────────

export async function handleGuess(args: {
  roomId: string;
  matchId: string;
  uid: string;
  displayName: string;
  guess: string;
}): Promise<{ correct: boolean }> {
  const db = getAdminDb();
  const matchRef = db.collection(col.matches).doc(args.matchId);
  const cardRef = db.doc(`${roomPlayerCardsCol(args.roomId)}/${args.uid}`);
  const roomRef = db.collection(col.rooms).doc(args.roomId);
  const msgs = messagesRef(db, args.roomId);

  const result = await db.runTransaction(async (tx) => {
    const [matchSnap, cardSnap] = await Promise.all([tx.get(matchRef), tx.get(cardRef)]);

    if (!matchSnap.exists) throw new Error("MATCH_NOT_FOUND");
    const m = matchSnap.data()!;
    if (m.status !== "active") throw new Error("MATCH_ENDED");

    const actorUid = String(m.actorUid ?? "");
    if (actorUid !== args.uid) throw new Error("NOT_YOUR_TURN_GUESS");

    if (!cardSnap.exists) throw new Error("NO_HIDDEN_CARD");

    const card = cardSnap.data()!;
    const correct = guessMatchesCard(
      args.guess,
      String(card.name ?? ""),
      String(card.nameAr ?? ""),
      typeof card.cardId === "string" ? card.cardId : undefined,
    );

    tx.set(msgs.doc(), {
      senderUid: args.uid,
      senderName: args.displayName,
      type: "guess",
      text: args.guess,
      correct,
      createdAt: FieldValue.serverTimestamp(),
    });

    if (correct) {
      tx.set(msgs.doc(), {
        senderUid: "system",
        senderName: "النظام",
        type: "system",
        text: `🎉 ${args.displayName} خمّن البطاقة بشكل صحيح وفاز!`,
        createdAt: FieldValue.serverTimestamp(),
      });
      tx.set(matchRef, { status: "ended", winnerUid: args.uid, winReason: "guess", endedAt: FieldValue.serverTimestamp() }, { merge: true });
      tx.set(roomRef, { status: "ended", lastActivityAt: FieldValue.serverTimestamp(), cleanupAt: Timestamp.fromMillis(Date.now() + 30 * 60 * 1000) }, { merge: true });
    } else {
      tx.set(msgs.doc(), {
        senderUid: "system",
        senderName: "النظام",
        type: "system",
        text: `${args.displayName} خمن بشكل خاطئ`,
        createdAt: FieldValue.serverTimestamp(),
      });
      tx.set(roomRef, { lastActivityAt: FieldValue.serverTimestamp() }, { merge: true });
    }

    return { correct };
  });

  return result;
}

/** Active player forfeits — opponent wins. */
export async function handleLeaveMatch(args: { roomId: string; uid: string }) {
  const db = getAdminDb();
  const roomRef = db.collection(col.rooms).doc(args.roomId);

  await db.runTransaction(async (tx) => {
    const roomSnap = await tx.get(roomRef);
    if (!roomSnap.exists) throw new Error("ROOM_NOT_FOUND");
    const room = roomSnap.data()!;
    const uids = (room.playerUids as string[]) ?? [];
    if (!uids.includes(args.uid)) throw new Error("NOT_IN_ROOM");
    const opp = opponentOf(uids, args.uid);
    const matchId = String(room.matchId ?? "");
    const status = String(room.status ?? "");

    if (status === "ended") return;

    if (status === "lobby") {
      if (opp) {
        tx.set(roomRef, {
          lobbyLeftByUid: args.uid,
          lastActivityAt: FieldValue.serverTimestamp(),
        }, { merge: true });
      }
      return;
    }

    if (!opp) throw new Error("NO_OPPONENT");

    if (status === "playing" && matchId) {
      const matchRef = db.collection(col.matches).doc(matchId);
      const matchSnap = await tx.get(matchRef);
      if (!matchSnap.exists) throw new Error("MATCH_NOT_FOUND");
      const ms = matchSnap.data()!;
      if (ms.status !== "active") throw new Error("MATCH_ALREADY_ENDED");

      const sysRef = messagesRef(db, args.roomId).doc();
      tx.set(sysRef, {
        senderUid: "system",
        senderName: "النظام",
        type: "system",
        text: `غادر اللاعب الغرفة.`,
        createdAt: FieldValue.serverTimestamp(),
      });

      tx.set(matchRef, {
        status: "ended",
        winnerUid: opp,
        winReason: "forfeit",
        endedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      tx.set(roomRef, {
        status: "ended",
        leftByUid: args.uid,
        lastActivityAt: FieldValue.serverTimestamp(),
        cleanupAt: Timestamp.fromMillis(Date.now() + 30 * 60 * 1000),
      }, { merge: true });
      return;
    }
  });
}

export async function enforceChatRate(roomId: string, uid: string, minIntervalMs: number) {
  const db = getAdminDb();
  const ref = db.collection(col.rooms).doc(roomId).collection("serverRate").doc(uid);
  const snap = await ref.get();
  const last = snap.exists
    ? (snap.data()!.lastAt as Timestamp | undefined)?.toMillis?.() ?? 0
    : 0;
  if (last && Date.now() - last < minIntervalMs) {
    throw new Error("RATE_LIMIT");
  }
  await ref.set({ lastAt: FieldValue.serverTimestamp() }, { merge: true });
}
