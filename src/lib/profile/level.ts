/** XP granted on match victory (client + Firestore). */
export const XP_PER_WIN = 25;
/** XP granted on defeat — keeps progression moving. */
export const XP_PER_LOSS = 10;

/** Total XP needed to reach this level (level 1 = 0). */
export function xpTotalForLevel(level: number): number {
  const lv = Math.max(1, Math.floor(level));
  return (lv - 1) * 80;
}

export function levelFromXp(xp: number): number {
  const safe = Math.max(0, Math.floor(xp));
  return Math.floor(safe / 80) + 1;
}

export type LevelProgress = {
  level: number;
  xpInLevel: number;
  xpToNext: number;
  pct: number;
};

export function xpProgressInCurrentLevel(xp: number): LevelProgress {
  const safe = Math.max(0, Math.floor(xp));
  const level = levelFromXp(safe);
  const floor = xpTotalForLevel(level);
  const xpInLevel = safe - floor;
  const xpToNext = 80;
  const pct = Math.min(100, Math.round((xpInLevel / xpToNext) * 100));
  return { level, xpInLevel, xpToNext, pct };
}
