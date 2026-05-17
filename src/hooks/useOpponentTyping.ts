"use client";

import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import { getFirebaseDb } from "@/lib/firebase/client";
import { roomTypingCol } from "@/lib/firestore/paths";

/** Realtime opponent typing indicator via `rooms/{id}/typing/{uid}`. */
export function useOpponentTyping(
  roomId: string | null,
  myUid: string | null,
  opponentUid: string | null,
  enabled: boolean,
) {
  const [opponentTyping, setOpponentTyping] = useState(false);
  const clearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || !roomId || !opponentUid) {
      setOpponentTyping(false);
      return;
    }
    const db = getFirebaseDb();
    const ref = doc(db, roomTypingCol(roomId), opponentUid);
    const unsub = onSnapshot(ref, (snap) => {
      const typing = Boolean(snap.data()?.typing);
      setOpponentTyping(typing);
    });
    return () => unsub();
  }, [roomId, opponentUid, enabled]);

  const setMyTyping = useCallback(
    (typing: boolean) => {
      if (!enabled || !roomId || !myUid) return;
      const db = getFirebaseDb();
      const ref = doc(db, roomTypingCol(roomId), myUid);
      void setDoc(
        ref,
        { typing, updatedAt: serverTimestamp() },
        { merge: true },
      ).catch(() => undefined);
    },
    [roomId, myUid, enabled],
  );

  const pulseTyping = useCallback(() => {
    setMyTyping(true);
    if (clearRef.current) clearTimeout(clearRef.current);
    clearRef.current = setTimeout(() => setMyTyping(false), 2200);
  }, [setMyTyping]);

  useEffect(() => {
    return () => {
      if (clearRef.current) clearTimeout(clearRef.current);
      if (roomId && myUid) setMyTyping(false);
    };
  }, [roomId, myUid, setMyTyping]);

  return { opponentTyping, pulseTyping, setMyTyping };
}
