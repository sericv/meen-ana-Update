"use client";

import { doc, increment, runTransaction, serverTimestamp } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import { col } from "@/lib/firestore/paths";
import { XP_PER_LOSS, XP_PER_WIN } from "@/lib/profile/level";

/** Award coins + XP after a match (idempotent per session key in caller). */
export async function awardMatchEndRewards(uid: string, won: boolean): Promise<void> {
  const db = getFirebaseDb();
  const ref = doc(db, col.users, uid);
  const xpGain = won ? XP_PER_WIN : XP_PER_LOSS;

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) {
      transaction.set(
        ref,
        {
          coins: won ? 1 : 0,
          xp: xpGain,
          matchWins: won ? 1 : 0,
          ownedFrameIds: [] as string[],
          lastSeen: serverTimestamp(),
        },
        { merge: true },
      );
      return;
    }
    const patch: Record<string, unknown> = {
      xp: increment(xpGain),
      lastSeen: serverTimestamp(),
    };
    if (won) {
      patch.coins = increment(1);
      patch.matchWins = increment(1);
    }
    transaction.update(ref, patch);
  });
}

/** @deprecated Use awardMatchEndRewards */
export async function awardMatchWinRewards(uid: string): Promise<void> {
  return awardMatchEndRewards(uid, true);
}
