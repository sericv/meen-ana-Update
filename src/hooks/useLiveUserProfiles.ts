"use client";

import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { getFirebaseDb } from "@/lib/firebase/client";
import { col } from "@/lib/firestore/paths";
import { normalizeCosmetic, type PlayerCosmetic } from "@/lib/profile/cosmetics";
import { normalizePlayerProgress } from "@/lib/profile/progression";
import type { GamePresence } from "@/lib/social/presence-constants";

export type LivePublicProfile = {
  cosmetic: PlayerCosmetic;
  username: string | null;
  usernameLower: string | null;
  gamePresence: GamePresence | null;
  gamePresenceRoomId: string | null;
  gamePresenceUpdatedAtMs: number | null;
  displayName: string | null;
  photoURL: string | null;
  xp: number;
  matchWins: number;
};

/**
 * Live `users/{uid}` public fields for social lists (cosmetics + presence).
 * One listener per uid; dedupes uids.
 */
export function useLiveUserProfiles(uids: (string | null | undefined)[]): Record<string, LivePublicProfile> {
  const key = useMemo(() => [...new Set(uids.filter(Boolean))].sort().join(","), [uids]);
  const list = useMemo(() => (key ? key.split(",") : []) as string[], [key]);
  const [map, setMap] = useState<Record<string, LivePublicProfile>>({});

  useEffect(() => {
    if (list.length === 0) {
      setMap({});
      return;
    }
    const db = getFirebaseDb();
    const unsubs = list.map((uid) =>
      onSnapshot(
        doc(db, col.users, uid),
        (snap) => {
          if (!snap.exists()) {
            setMap((prev) => ({
              ...prev,
              [uid]: emptyLiveProfile(),
            }));
            return;
          }
          const d = snap.data() as Record<string, unknown>;
          const progress = normalizePlayerProgress(d);
          const ts = d.gamePresenceUpdatedAt as { toMillis?: () => number } | undefined;
          const gamePresenceUpdatedAtMs =
            ts && typeof ts.toMillis === "function" ? ts.toMillis() : null;
          setMap((prev) => ({
            ...prev,
            [uid]: {
              cosmetic: normalizeCosmetic(d),
              username: typeof d.username === "string" ? d.username : null,
              usernameLower: typeof d.usernameLower === "string" ? d.usernameLower : null,
              gamePresence: (d.gamePresence as GamePresence) ?? null,
              gamePresenceRoomId: typeof d.gamePresenceRoomId === "string" ? d.gamePresenceRoomId : null,
              gamePresenceUpdatedAtMs,
              displayName: typeof d.displayName === "string" ? d.displayName : null,
              photoURL: typeof d.photoURL === "string" ? d.photoURL : null,
              xp: progress.xp,
              matchWins: progress.matchWins,
            },
          }));
        },
        () => {
          setMap((prev) => ({
            ...prev,
            [uid]:
              prev[uid] ?? {
                cosmetic: normalizeCosmetic(undefined),
                username: null,
                usernameLower: null,
                gamePresence: null,
                gamePresenceRoomId: null,
                gamePresenceUpdatedAtMs: null,
                displayName: null,
              },
          }));
        },
      ),
    );
    return () => {
      unsubs.forEach((u) => u());
    };
  }, [list]);

  return map;
}

function emptyLiveProfile(): LivePublicProfile {
  return {
    cosmetic: normalizeCosmetic(undefined),
    username: null,
    usernameLower: null,
    gamePresence: null,
    gamePresenceRoomId: null,
    gamePresenceUpdatedAtMs: null,
    displayName: null,
    photoURL: null,
    xp: 0,
    matchWins: 0,
  };
}
