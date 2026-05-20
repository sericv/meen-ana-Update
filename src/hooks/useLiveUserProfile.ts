"use client";

import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { getFirebaseDb } from "@/lib/firebase/client";
import { col } from "@/lib/firestore/paths";
import { normalizeCosmetic, type PlayerCosmetic } from "@/lib/profile/cosmetics";
import { normalizePlayerProgress, type PlayerProgress } from "@/lib/profile/progression";

export type LiveUserProfile = {
  cosmetic: PlayerCosmetic;
  progress: PlayerProgress;
  username: string | null;
  usernameLower: string | null;
};

/**
 * Single Firestore listener for `users/{uid}` — cosmetics + progression (coins, wins, owned frames).
 */
export function useLiveUserProfile(uid: string | null | undefined): LiveUserProfile | null {
  const key = uid ?? "";
  const [state, setState] = useState<LiveUserProfile | null>(null);

  useEffect(() => {
    if (!key) {
      setState(null);
      return;
    }
    const db = getFirebaseDb();
    return onSnapshot(
      doc(db, col.users, key),
      (snap) => {
        const raw = snap.exists() ? (snap.data() as Record<string, unknown>) : undefined;
        setState({
          cosmetic: normalizeCosmetic(raw),
          progress: normalizePlayerProgress(raw),
          username: typeof raw?.username === "string" ? raw.username : null,
          usernameLower: typeof raw?.usernameLower === "string" ? raw.usernameLower : null,
        });
      },
      () => {
        setState({
          cosmetic: normalizeCosmetic(undefined),
          progress: normalizePlayerProgress(undefined),
          username: null,
          usernameLower: null,
        });
      },
    );
  }, [key]);

  return state;
}
