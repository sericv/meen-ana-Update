"use client";

import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { getFirebaseDb } from "@/lib/firebase/client";
import { col, userSub } from "@/lib/firestore/paths";

/** Incoming friend requests waiting for the current user (full accounts only). */
export function useIncomingFriendRequestCount(uid: string | null, enabled: boolean): number {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!uid || !enabled) {
      setN(0);
      return;
    }
    const db = getFirebaseDb();
    return onSnapshot(
      collection(db, col.users, uid, userSub.friendInbox),
      (snap) => setN(snap.size),
      () => setN(0),
    );
  }, [uid, enabled]);

  return n;
}
