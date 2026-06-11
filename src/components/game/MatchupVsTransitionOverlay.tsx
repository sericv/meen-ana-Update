"use client";

/**
 * Legacy shim — kept only to export MATCHUP_VS_INTRO_DURATION_MS which
 * RoomExperience uses as a stale-guard (skip if match started >12s ago).
 * The actual transition is now <MatchTransition> from ./MatchTransition.
 */
export const MATCHUP_VS_INTRO_DURATION_MS = 2520;
