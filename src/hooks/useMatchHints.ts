"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { postGame } from "@/lib/api/game-client";
import { splitNameLetters } from "@/components/game/play/tokens";

type HintState = {
  hintsLeft: number;
  revealedIndices: number[];
  nameLength: number;
  revealedLetters: Record<number, string>;
};

function storageKey(matchId: string, uid: string) {
  return `meenana-hints:${matchId}:${uid}`;
}

function readStored(matchId: string, uid: string): HintState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKey(matchId, uid));
    if (!raw) return null;
    return JSON.parse(raw) as HintState;
  } catch {
    return null;
  }
}

function writeStored(matchId: string, uid: string, st: HintState) {
  sessionStorage.setItem(storageKey(matchId, uid), JSON.stringify(st));
}

const DEFAULT: HintState = {
  hintsLeft: 2,
  revealedIndices: [],
  nameLength: 0,
  revealedLetters: {},
};

export function useMatchHints(
  roomId: string | null,
  matchId: string | null,
  uid: string | null,
  enabled: boolean,
) {
  const [state, setState] = useState<HintState>(DEFAULT);

  useEffect(() => {
    if (!matchId || !uid || !enabled) {
      setState(DEFAULT);
      return;
    }
    setState(readStored(matchId, uid) ?? DEFAULT);
  }, [matchId, uid, enabled]);

  const persist = useCallback(
    (next: HintState) => {
      setState(next);
      if (matchId && uid) writeStored(matchId, uid, next);
    },
    [matchId, uid],
  );

  const { letters, revealedIdx, countRevealed } = useMemo(() => {
    if (state.nameLength > 0) {
      return {
        countRevealed: true,
        letters: Array.from({ length: state.nameLength }, (_, i) =>
          state.revealedIndices.includes(i) ? (state.revealedLetters[i] ?? "—") : "—",
        ),
        revealedIdx: state.revealedIndices,
      };
    }
    const solo = state.revealedIndices.map((i) => state.revealedLetters[i] ?? "—");
    return {
      countRevealed: false,
      letters: solo,
      revealedIdx: solo.map((_, i) => i),
    };
  }, [state]);

  const useHint = useCallback(
    async (kind: "letter" | "count") => {
      if (!roomId || !matchId || !uid) return;
      try {
        const res = (await postGame<{
          hintsLeft: number;
          revealedIndices: number[];
          nameLength: number;
          revealedLetters: Record<number, string>;
          message: string;
        }>("/api/game/hint", { roomId, matchId, kind })) as {
          hintsLeft: number;
          revealedIndices: number[];
          nameLength: number;
          revealedLetters: Record<number, string>;
        };
        persist({
          hintsLeft: res.hintsLeft,
          revealedIndices: res.revealedIndices,
          nameLength: res.nameLength,
          revealedLetters: res.revealedLetters,
        });
      } catch {
        /* parent may toast */
      }
    },
    [roomId, matchId, uid, state.hintsLeft, persist],
  );

  return {
    hintsLeft: state.hintsLeft,
    revealedIdx,
    letters: countRevealed && !letters.length ? splitNameLetters("؟؟؟") : letters,
    countRevealed,
    useHint,
  };
}
