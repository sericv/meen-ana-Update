/**
 * Server-side guess validation — checks if the player's typed guess matches
 * the name of their hidden card (Arabic or English, fuzzy match).
 * Auto-answer logic has been removed; players now answer each other manually.
 */

const NORMALIZE_RE = /[\u064B-\u065F\u0670\u0640]/g; // Arabic diacritics / tatweel

function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .replace(NORMALIZE_RE, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function guessMatchesCard(guess: string, cardName: string, cardNameAr: string): boolean {
  const g = normalizeText(guess);
  if (g.length < 2) return false;
  const a = normalizeText(cardName);
  const b = normalizeText(cardNameAr);
  return g === a || g === b || a.includes(g) || b.includes(g) || g.includes(a) || g.includes(b);
}
