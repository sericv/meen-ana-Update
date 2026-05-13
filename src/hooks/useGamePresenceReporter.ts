"use client";

import { deleteField, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useEffect, useRef } from "react";
import { getFirebaseDb } from "@/lib/firebase/client";
import { col } from "@/lib/firestore/paths";
import type { GamePresence } from "@/lib/social/presence-constants";

type Args = {
  uid: string | null;
  enabled: boolean;
  presence: GamePresence;
  roomId?: string | null;
  /** Heartbeat to keep `gamePresenceUpdatedAt` fresh for friends list. */
  heartbeatMs?: number;
  /** When the component unmounts, mark player as online (lobby exit, etc.). */
  resetOnUnmount?: boolean;
};

/**
 * Writes `gamePresence` + `gamePresenceUpdatedAt` on the signed-in user's
 * Firestore profile for friends / invites. Google-only callers should pass
 * `enabled: isGoogleLinkedUser(...)`.
 */
export function useGamePresenceReporter({
  uid,
  enabled,
  presence,
  roomId = null,
  heartbeatMs = 22_000,
  resetOnUnmount = true,
}: Args): void {
  const lastSig = useRef<string>("");

  useEffect(() => {
    if (!uid || !enabled) return;
    const db = getFirebaseDb();
    const ref = doc(db, col.users, uid);
    const sig = `${presence}\t${roomId ?? ""}`;
    const write = () => {
      const patch: Record<string, unknown> = {
        gamePresence: presence,
        gamePresenceUpdatedAt: serverTimestamp(),
      };
      if (roomId) patch.gamePresenceRoomId = roomId;
      else patch.gamePresenceRoomId = deleteField();
      void updateDoc(ref, patch).catch(() => undefined);
    };
    if (lastSig.current !== sig) {
      lastSig.current = sig;
      write();
    }
    const id = window.setInterval(write, heartbeatMs);
    return () => {
      window.clearInterval(id);
      if (resetOnUnmount) {
        void updateDoc(ref, {
          gamePresence: "online",
          gamePresenceRoomId: deleteField(),
          gamePresenceUpdatedAt: serverTimestamp(),
        }).catch(() => undefined);
      }
    };
  }, [uid, enabled, presence, roomId, heartbeatMs, resetOnUnmount]);
}
