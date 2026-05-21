export type AwardMatchRewardsResult = {
  won: boolean;
  coinsAwarded: number;
  baseCoins: number;
  bonusCoins: number;
  bonusLabelAr: string | null;
  xpAwarded: number;
  alreadyAwarded: boolean;
  winRate: number;
  matchWins: number;
  matchTotal: number;
  toolsUsed: number;
};
