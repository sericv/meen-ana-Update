/**
 * XP & Level System — structured progression inspired by competitive mobile games.
 *
 * Level curve: XP_for_level(n) = floor(50 * n^1.75)
 *   Level 1:   50 XP
 *   Level 2:  119 XP
 *   Level 5:  419 XP
 *   Level 10: 1,120 XP (cumulative ~3,700)
 *   Level 20: 3,180 XP (cumulative ~17,000)
 *   Level 50: 13,200 XP (cumulative ~160,000)
 *
 * XP awards (server-authoritative):
 *   Base win:        +50 XP
 *   Base loss:       +15 XP
 *   Fast win (<5m):  +25 bonus XP
 *   Fast win (<10m): +12 bonus XP
 *   Tool usage:      +4 XP per tool (max +16)
 *   Long match (>15m):+10 XP (effort bonus)
 */

/* ── Base awards ─────────────────────────────────────────── */

/** Base XP on any win. */
export const XP_PER_WIN = 50;
/** Base XP on defeat — keeps progression moving. */
export const XP_PER_LOSS = 15;

/* ── Bonus amounts ───────────────────────────────────────── */

/** Fast-win bonus (< 5 min). */
export const XP_BONUS_FAST_WIN_5 = 25;
/** Fast-win bonus (5–10 min). */
export const XP_BONUS_FAST_WIN_10 = 12;
/** Per-tool-used bonus (hint or tactical). Max: XP_BONUS_TOOL_MAX. */
export const XP_BONUS_PER_TOOL = 4;
/** Cap on tool usage bonus per match. */
export const XP_BONUS_TOOL_MAX = 16;
/** Long match effort bonus (> 15 min). */
export const XP_BONUS_LONG_MATCH = 10;
/** Threshold for long-match bonus (ms). */
export const XP_LONG_MATCH_MS = 15 * 60 * 1000;

/* ── Level curve ─────────────────────────────────────────── */

/**
 * Total cumulative XP required to REACH `level`.
 * Level 1 starts at 0.
 */
export function xpTotalForLevel(level: number): number {
  const lv = Math.max(1, Math.floor(level));
  if (lv <= 1) return 0;
  // Sum: floor(50 * k^1.75) for k = 1..lv-1
  let total = 0;
  for (let k = 1; k < lv; k++) {
    total += Math.floor(50 * Math.pow(k, 1.75));
  }
  return total;
}

/** XP needed to go from `level` to `level+1`. */
export function xpToNextLevel(level: number): number {
  const lv = Math.max(1, Math.floor(level));
  return Math.floor(50 * Math.pow(lv, 1.75));
}

export function levelFromXp(xp: number): number {
  const safe = Math.max(0, Math.floor(xp));
  let level = 1;
  while (true) {
    const needed = xpTotalForLevel(level + 1);
    if (needed > safe) break;
    level++;
    // Practical cap — no one reaches level 200 but prevents infinite loop
    if (level >= 200) break;
  }
  return level;
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
  const xpToNext = xpToNextLevel(level);
  const pct = Math.min(100, Math.round((xpInLevel / xpToNext) * 100));
  return { level, xpInLevel, xpToNext, pct };
}

/* ── XP breakdown type ───────────────────────────────────── */

export type XpBreakdown = {
  /** Total XP awarded. */
  total: number;
  /** Base award (win or loss). */
  base: number;
  /** Fast-win bonus (0 if none). */
  fastWinBonus: number;
  /** Tool usage bonus (0 if none). */
  toolBonus: number;
  /** Long match effort bonus (0 if none). */
  longMatchBonus: number;
  /** Human-readable bonus label in Arabic (null when no bonus). */
  bonusLabelAr: string | null;
};

/**
 * Compute the full XP breakdown for a match outcome.
 *
 * @param won        Whether this player won.
 * @param durationMs Match duration in ms (null = unknown).
 * @param toolsUsed  Total hints + tactical tools used by this player.
 */
export function computeXpBreakdown(
  won: boolean,
  durationMs: number | null,
  toolsUsed: number,
): XpBreakdown {
  const base = won ? XP_PER_WIN : XP_PER_LOSS;

  /* fast win bonus */
  let fastWinBonus = 0;
  if (won && durationMs !== null && durationMs >= 0) {
    if (durationMs < 5 * 60 * 1000) {
      fastWinBonus = XP_BONUS_FAST_WIN_5;
    } else if (durationMs < 10 * 60 * 1000) {
      fastWinBonus = XP_BONUS_FAST_WIN_10;
    }
  }

  /* tool usage bonus */
  const clampedTools = Math.min(Math.max(0, Math.floor(toolsUsed)), 4);
  const toolBonus = Math.min(clampedTools * XP_BONUS_PER_TOOL, XP_BONUS_TOOL_MAX);

  /* long match effort bonus (loss or win, just for enduring) */
  const longMatchBonus =
    durationMs !== null && durationMs >= XP_LONG_MATCH_MS ? XP_BONUS_LONG_MATCH : 0;

  const total = base + fastWinBonus + toolBonus + longMatchBonus;

  /* build human-readable label */
  const parts: string[] = [];
  if (fastWinBonus > 0) parts.push(`فوز سريع +${fastWinBonus}`);
  if (toolBonus > 0) parts.push(`أدوات +${toolBonus}`);
  if (longMatchBonus > 0) parts.push(`مباراة طويلة +${longMatchBonus}`);
  const bonusLabelAr = parts.length > 0 ? parts.join(" · ") : null;

  return { total, base, fastWinBonus, toolBonus, longMatchBonus, bonusLabelAr };
}
