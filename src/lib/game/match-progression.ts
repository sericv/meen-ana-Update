/** Maximum incorrect final guesses per player per match. */
export const FINAL_GUESS_LIMIT = 3;

/** Base coin reward on any win. */
export const MATCH_WIN_BASE_COINS = 1;

/** Fast-win thresholds (milliseconds). */
export const FAST_WIN_5_MIN_MS = 5 * 60 * 1000;
export const FAST_WIN_10_MIN_MS = 10 * 60 * 1000;

/** Tactical banner visible duration (client + server expiry). */
export const TACTICAL_EVENT_DISPLAY_MS = 4800;

export type FastWinTier = "none" | "under_10" | "under_5";

export function computeFastWinTier(durationMs: number | null): FastWinTier {
  if (durationMs == null || durationMs < 0) return "none";
  if (durationMs < FAST_WIN_5_MIN_MS) return "under_5";
  if (durationMs < FAST_WIN_10_MIN_MS) return "under_10";
  return "none";
}

/** Total coins granted to the winner for a match duration. */
export function computeWinCoinReward(durationMs: number | null): {
  total: number;
  base: number;
  bonus: number;
  tier: FastWinTier;
  bonusLabelAr: string | null;
} {
  const base = MATCH_WIN_BASE_COINS;
  const tier = computeFastWinTier(durationMs);
  let bonus = 0;
  let bonusLabelAr: string | null = null;
  if (tier === "under_5") {
    bonus = 3;
    bonusLabelAr = "فوز سريع +3 عملات";
  } else if (tier === "under_10") {
    bonus = 2;
    bonusLabelAr = "فوز سريع +2 عملات";
  }
  return { total: base + bonus, base, bonus, tier, bonusLabelAr };
}

export function remainingFinalGuesses(attemptsUsed: number): number {
  return Math.max(0, FINAL_GUESS_LIMIT - Math.max(0, Math.floor(attemptsUsed)));
}

export function computeStoredWinRate(matchWins: number, matchTotal: number): number {
  if (matchTotal <= 0) return 0;
  return Math.round((matchWins / matchTotal) * 100);
}
