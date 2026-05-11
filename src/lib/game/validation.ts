/**
 * Server-side guess validation — checks if the player's typed guess matches
 * the name of their hidden card. Uses Arabic-aware normalization + per-card
 * aliases (spelling variations only).
 */

import { getAliasesForCard } from "./cards";
import { matchesGuess } from "./aliases";

export function guessMatchesCard(
  guess: string,
  cardName: string,
  cardNameAr: string,
  cardId?: string,
): boolean {
  const aliases = cardId ? getAliasesForCard(cardId) : [];
  return matchesGuess(guess, cardName, cardNameAr, aliases);
}
