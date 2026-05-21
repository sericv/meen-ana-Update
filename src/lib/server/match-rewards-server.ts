import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { col } from "@/lib/firestore/paths";
import { computeStoredWinRate, computeWinCoinReward } from "@/lib/game/match-progression";
import type { AwardMatchRewardsResult } from "@/lib/game/match-rewards";
import { XP_PER_LOSS, XP_PER_WIN } from "@/lib/profile/level";

export type { AwardMatchRewardsResult };

function readDurationMs(m: Record<string, unknown>): number | null {
  const started = m.startedAt as Timestamp | undefined;
  const ended = m.endedAt as Timestamp | undefined;
  const startMs = started?.toMillis?.() ?? 0;
  const endMs = ended?.toMillis?.() ?? 0;
  if (!startMs || !endMs || endMs <= startMs) return null;
  return endMs - startMs;
}

function seedProfileMatchTotals(data: Record<string, unknown>): {
  matchWins: number;
  matchLosses: number;
  matchTotal: number;
} {
  const xp =
    typeof data.xp === "number" && Number.isFinite(data.xp) ? Math.max(0, Math.floor(data.xp)) : 0;
  const matchWins =
    typeof data.matchWins === "number" && Number.isFinite(data.matchWins)
      ? Math.max(0, Math.floor(data.matchWins))
      : 0;
  let matchLosses =
    typeof data.matchLosses === "number" && Number.isFinite(data.matchLosses)
      ? Math.max(0, Math.floor(data.matchLosses))
      : 0;
  let matchTotal =
    typeof data.matchTotal === "number" && Number.isFinite(data.matchTotal)
      ? Math.max(0, Math.floor(data.matchTotal))
      : 0;

  if (!Object.prototype.hasOwnProperty.call(data, "matchTotal")) {
    const estimatedLosses = Math.max(0, Math.floor((xp - matchWins * XP_PER_WIN) / XP_PER_LOSS));
    if (!Object.prototype.hasOwnProperty.call(data, "matchLosses") && matchLosses === 0) {
      matchLosses = estimatedLosses;
    }
    matchTotal = Math.max(matchWins, matchWins + (matchLosses || estimatedLosses));
  }

  return { matchWins, matchLosses, matchTotal };
}

/** Server-authoritative match rewards + profile win-rate stats (idempotent per player per match). */
export async function awardMatchRewards(args: {
  matchId: string;
  uid: string;
}): Promise<AwardMatchRewardsResult> {
  const db = getAdminDb();
  const matchRef = db.collection(col.matches).doc(args.matchId);
  const userRef = db.collection(col.users).doc(args.uid);

  return db.runTransaction(async (tx) => {
    const [matchSnap, userSnap] = await Promise.all([tx.get(matchRef), tx.get(userRef)]);
    if (!matchSnap.exists) throw new Error("MATCH_NOT_FOUND");
    const m = matchSnap.data()!;
    if (m.status !== "ended") throw new Error("MATCH_NOT_ENDED");

    const order = (m.playerOrder as string[]) ?? [];
    if (!order.includes(args.uid)) throw new Error("NOT_IN_MATCH");

    const winnerUid = m.winnerUid != null ? String(m.winnerUid) : null;
    const won = winnerUid === args.uid;
    const durationMs = readDurationMs(m);
    const coinBreakdown = won ? computeWinCoinReward(durationMs) : { total: 0, base: 0, bonus: 0, bonusLabelAr: null };
    const xpAwarded = won ? XP_PER_WIN : XP_PER_LOSS;

    const statsRaw = (m.matchStatsByUid as Record<string, unknown>) ?? {};
    const myStats = statsRaw[args.uid];
    const toolsUsed =
      myStats && typeof myStats === "object" && !Array.isArray(myStats)
        ? Math.max(
            0,
            Math.floor(
              Number((myStats as Record<string, unknown>).totalToolsUsed ?? 0) || 0,
            ),
          )
        : 0;

    const rewarded = { ...((m.rewardedByUid as Record<string, boolean>) ?? {}) };
    if (rewarded[args.uid] === true) {
      const data = userSnap.exists ? (userSnap.data() as Record<string, unknown>) : {};
      const seeded = seedProfileMatchTotals(data);
      return {
        won,
        coinsAwarded: won ? coinBreakdown.total : 0,
        baseCoins: coinBreakdown.base,
        bonusCoins: coinBreakdown.bonus,
        bonusLabelAr: coinBreakdown.bonusLabelAr,
        xpAwarded,
        alreadyAwarded: true,
        winRate: computeStoredWinRate(seeded.matchWins, seeded.matchTotal),
        matchWins: seeded.matchWins,
        matchTotal: seeded.matchTotal,
        toolsUsed,
      };
    }

    rewarded[args.uid] = true;
    tx.update(matchRef, { [`rewardedByUid.${args.uid}`]: true });

    if (!userSnap.exists) {
      const matchWins = won ? 1 : 0;
      const matchLosses = won ? 0 : 1;
      const matchTotal = 1;
      tx.set(
        userRef,
        {
          coins: coinBreakdown.total,
          xp: xpAwarded,
          matchWins,
          matchLosses,
          matchTotal,
          winRate: computeStoredWinRate(matchWins, matchTotal),
          ownedFrameIds: [] as string[],
          lastSeen: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      return {
        won,
        coinsAwarded: coinBreakdown.total,
        baseCoins: coinBreakdown.base,
        bonusCoins: coinBreakdown.bonus,
        bonusLabelAr: coinBreakdown.bonusLabelAr,
        xpAwarded,
        alreadyAwarded: false,
        winRate: computeStoredWinRate(matchWins, matchTotal),
        matchWins,
        matchTotal,
        toolsUsed,
      };
    }

    const data = userSnap.data() as Record<string, unknown>;
    const seeded = seedProfileMatchTotals(data);
    const matchWins = seeded.matchWins + (won ? 1 : 0);
    const matchLosses = seeded.matchLosses + (won ? 0 : 1);
    const matchTotal = seeded.matchTotal + 1;
    const winRate = computeStoredWinRate(matchWins, matchTotal);

    const patch: Record<string, unknown> = {
      xp: FieldValue.increment(xpAwarded),
      matchWins,
      matchLosses,
      matchTotal,
      winRate,
      lastSeen: FieldValue.serverTimestamp(),
    };
    if (won && coinBreakdown.total > 0) {
      patch.coins = FieldValue.increment(coinBreakdown.total);
    }
    tx.update(userRef, patch);

    return {
      won,
      coinsAwarded: coinBreakdown.total,
      baseCoins: coinBreakdown.base,
      bonusCoins: coinBreakdown.bonus,
      bonusLabelAr: coinBreakdown.bonusLabelAr,
      xpAwarded,
      alreadyAwarded: false,
      winRate,
      matchWins,
      matchTotal,
      toolsUsed,
    };
  });
}
