"use client";

import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { getFirebaseDb } from "@/lib/firebase/client";
import { col } from "@/lib/firestore/paths";
import {
  ANSWER_PHASE_SECONDS,
  QUESTION_PHASE_SECONDS,
} from "@/lib/game/constants";
import type { ChatMessage, GameCard, MatchState, Room } from "@/types";

export function useRoomWire(roomId: string | null, myUid: string | null) {
  const [room, setRoom] = useState<Room | null>(null);
  const [match, setMatch] = useState<MatchState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [opponentCard, setOpponentCard] = useState<GameCard | null>(null);
  const [wireError, setWireError] = useState<string | null>(null);

  const opponentUid = useMemo(() => {
    if (!room || !myUid) return null;
    return room.playerUids.find((u) => u !== myUid) ?? null;
  }, [room, myUid]);

  // Room snapshot
  useEffect(() => {
    if (!roomId) return;
    const db = getFirebaseDb();
    return onSnapshot(
      doc(db, col.rooms, roomId),
      (snap) => {
        if (!snap.exists()) { setRoom(null); return; }
        const d = snap.data();
        setRoom({
          id: snap.id,
          code: String(d.code ?? ""),
          hostUid: String(d.hostUid ?? ""),
          players: (d.players as Room["players"]) ?? [],
          playerJoinedAt: (d.playerJoinedAt as Record<string, Timestamp | null> | undefined) ?? {},
          playerUids: (d.playerUids as string[]) ?? [],
          status: d.status as Room["status"],
          categoryId: String(d.categoryId ?? ""),
          matchId: (d.matchId as string | null) ?? null,
          tutorial: Boolean(d.tutorial),
          openJoin: Boolean(d.openJoin),
          randomMatch: Boolean(d.randomMatch),
          questionTimerSec: d.questionTimerSec !== undefined ? Number(d.questionTimerSec) : undefined,
          answerTimerSec: d.answerTimerSec !== undefined ? Number(d.answerTimerSec) : undefined,
          leftByUid: d.leftByUid !== undefined ? String(d.leftByUid) : undefined,
          lobbyLeftByUid: d.lobbyLeftByUid !== undefined ? String(d.lobbyLeftByUid) : undefined,
          createdAt: (d.createdAt as Timestamp | null) ?? null,
          lastActivityAt: (d.lastActivityAt as Timestamp | null) ?? null,
          cleanupAt: (d.cleanupAt as Timestamp | null) ?? null,
        });
      },
      (e) => setWireError(e.message),
    );
  }, [roomId]);

  // Match snapshot (simplified — no turn fields)
  useEffect(() => {
    if (!room?.matchId) { setMatch(null); return; }
    const db = getFirebaseDb();
    return onSnapshot(
      doc(db, col.matches, room.matchId),
      (snap) => {
        if (!snap.exists()) { setMatch(null); return; }
        const d = snap.data();
        const qs = Number(d.questionSeconds ?? QUESTION_PHASE_SECONDS);
        const as = Number(d.answerSeconds ?? ANSWER_PHASE_SECONDS);
        setMatch({
          id: snap.id,
          roomId: String(d.roomId ?? ""),
          status: d.status as MatchState["status"],
          playerOrder: (d.playerOrder as string[]) ?? [],
          actorUid: (d.actorUid as string | null) ?? null,
          chatPhase: (d.chatPhase as MatchState["chatPhase"]) ?? "question",
          turnDeadline: (d.turnDeadline as Timestamp | null) ?? null,
          questionSeconds: Number.isFinite(qs) ? qs : QUESTION_PHASE_SECONDS,
          answerSeconds: Number.isFinite(as) ? as : ANSWER_PHASE_SECONDS,
          winnerUid: (d.winnerUid as string | null) ?? null,
          winReason: (d.winReason as MatchState["winReason"]) ?? null,
          startedAt: (d.startedAt as Timestamp | null) ?? null,
          endedAt: (d.endedAt as Timestamp | null) ?? null,
        });
      },
      (e) => setWireError(e.message),
    );
  }, [room?.matchId]);

  // Opponent card — now stored directly in playerCards (no second Firestore lookup)
  useEffect(() => {
    if (!roomId || !opponentUid) { setOpponentCard(null); return; }
    const db = getFirebaseDb();
    return onSnapshot(
      doc(db, col.rooms, roomId, "playerCards", opponentUid),
      (snap) => {
        if (!snap.exists()) { setOpponentCard(null); return; }
        const c = snap.data();
        setOpponentCard({
          id: String(c.cardId ?? ""),
          name: String(c.name ?? ""),
          nameAr: String(c.nameAr ?? ""),
          imageUrl: String(c.imageUrl ?? ""),
          categoryId: String(c.categoryId ?? ""),
          tags: [],
        });
      },
      (e) => setWireError(e.message),
    );
  }, [roomId, opponentUid]);

  // Messages
  useEffect(() => {
    if (!roomId) return;
    const db = getFirebaseDb();
    const q = query(
      collection(db, col.rooms, roomId, "messages"),
      orderBy("createdAt", "asc"),
      limit(150),
    );
    return onSnapshot(
      q,
      (snap) => {
        setMessages(
          snap.docs.map((d) => {
            const x = d.data();
            return {
              id: d.id,
              roomId,
              senderUid: String(x.senderUid ?? ""),
              senderName: String(x.senderName ?? ""),
              type: x.type as ChatMessage["type"],
              text: String(x.text ?? ""),
              correct: x.correct as boolean | undefined,
              createdAt: (x.createdAt as Timestamp | null) ?? null,
            };
          }),
        );
      },
      (e) => setWireError(e.message),
    );
  }, [roomId]);

  // Presence heartbeat
  useEffect(() => {
    if (!roomId || !myUid) return;
    const db = getFirebaseDb();
    const ref = doc(db, col.rooms, roomId, "presence", myUid);
    const tick = () => setDoc(ref, { lastSeen: serverTimestamp(), state: "online" }, { merge: true });
    void tick();
    const id = window.setInterval(() => void tick(), 15000);
    return () => window.clearInterval(id);
  }, [roomId, myUid]);

  return { room, match, messages, opponentCard, opponentUid, wireError };
}
