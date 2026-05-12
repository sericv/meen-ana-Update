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
import { isOpponentCustomCardComplete } from "@/lib/custom-cards/opponent-card-gate";
import type { ChatMessage, GameCard, MatchState, Room, StoredCustomRoomCard } from "@/types";

function parseCustomOpponentAssigned(raw: unknown): Room["customOpponentCardAssigned"] | undefined {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const out: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (v === true) out[k] = true;
  }
  return Object.keys(out).length ? out : undefined;
}

function parseOpponentSelections(raw: unknown): Room["customOpponentSelections"] | undefined {
  if (raw == null) return undefined;
  const entries: [string, unknown][] =
    raw instanceof Map
      ? [...raw.entries()].map(([k, v]) => [String(k), v])
      : typeof raw === "object" && !Array.isArray(raw)
        ? Object.entries(raw as Record<string, unknown>)
        : [];
  if (!entries.length) return undefined;

  const out: Record<string, StoredCustomRoomCard> = {};
  for (const [key, val] of entries) {
    if (!val || typeof val !== "object" || Array.isArray(val)) continue;
    const v = val as Record<string, unknown>;
    const nameAr = String(v.nameAr ?? "").trim();
    const imageUrl = String(v.imageUrl ?? "").trim();
    const id = String(v.id ?? "").trim() || key;
    const savedAt =
      v.savedAt && typeof v.savedAt === "object" && "toMillis" in (v.savedAt as object)
        ? (v.savedAt as Timestamp)
        : null;
    const card: StoredCustomRoomCard = {
      id,
      nameAr,
      name: v.name !== undefined ? String(v.name) : undefined,
      imageUrl,
      aliases: Array.isArray(v.aliases) ? v.aliases.map((x) => String(x)) : [],
      savedAt: savedAt ?? undefined,
    };
    if (!isOpponentCustomCardComplete(card)) continue;
    out[key] = card;
  }
  return Object.keys(out).length ? out : undefined;
}

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
          voiceMode: d.voiceMode !== undefined ? Boolean(d.voiceMode) : undefined,
          customCardsEnabled:
            d.customCardsEnabled !== undefined ? Boolean(d.customCardsEnabled) : undefined,
          customOpponentSelections: parseOpponentSelections(d.customOpponentSelections),
          customOpponentCardAssigned: parseCustomOpponentAssigned(d.customOpponentCardAssigned),
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
