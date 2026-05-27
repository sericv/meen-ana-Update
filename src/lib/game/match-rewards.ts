import type { XpBreakdown } from "@/lib/profile/level";

export type AwardMatchRewardsResult = {
  won: boolean;
  coinsAwarded: number;
  baseCoins: number;
  bonusCoins: number;
  bonusLabelAr: string | null;
  xpAwarded: number;
  /** Detailed XP breakdown for the result screen. */
  xpBreakdown: XpBreakdown;
  alreadyAwarded: boolean;
  winRate: number;
  matchWins: number;
  matchTotal: number;
  toolsUsed: number;
  /** Level before this match (used to detect level-up). */
  levelBefore: number;
  /** Level after this match's XP is applied. */
  levelAfter: number;
  /** True when levelAfter > levelBefore. */
  leveledUp: boolean;
};
