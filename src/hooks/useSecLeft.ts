"use client";

import { useEffect, useRef, useState } from "react";
import type { Timestamp } from "firebase/firestore";

/**
 * Isolated countdown hook — owns its own 200ms interval so callers
 * (GameplayTopBar / GameplayTurnArc) can subscribe independently
 * without triggering re-renders in RoomExperience.
 *
 * Returns the whole-second countdown derived from `turnDeadline`.
 * Returns `null` when the deadline is absent or the match is not active.
 */
export function useSecLeft(
  turnDeadline: Timestamp | null | undefined,
  active: boolean,
): number | null {
  const deadlineMs = useRef<number | null>(null);

  // Update ref synchronously whenever the deadline prop changes —
  // no state update, no re-render here.
  const ms =
    turnDeadline && typeof turnDeadline.toMillis === "function"
      ? turnDeadline.toMillis()
      : null;
  deadlineMs.current = ms;

  const calc = (): number | null => {
    if (!active || deadlineMs.current === null) return null;
    return Math.max(0, Math.ceil((deadlineMs.current - Date.now()) / 1000));
  };

  const [secLeft, setSecLeft] = useState<number | null>(calc);

  useEffect(() => {
    if (!active) {
      setSecLeft(null);
      return;
    }
    // Snap immediately so the number is correct before the first tick
    setSecLeft(calc());
    const id = window.setInterval(() => setSecLeft(calc()), 200);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, ms]);

  return secLeft;
}
