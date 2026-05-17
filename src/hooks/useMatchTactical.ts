"use client";

import { useCallback, useState } from "react";
import { postGame } from "@/lib/api/game-client";
import type { TacticalToolId } from "@/lib/profile/tactical-tools";
import type { TacticalGameplayEvent } from "@/types";

export function useMatchTactical(roomId: string | null, matchId: string | null) {
  const [busy, setBusy] = useState<TacticalToolId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const useTool = useCallback(
    async (toolId: TacticalToolId, displayName: string): Promise<TacticalGameplayEvent | null> => {
      if (!roomId || !matchId) return null;
      setBusy(toolId);
      setError(null);
      try {
        const res = await postGame<{ event: TacticalGameplayEvent }>("/api/game/tactical", {
          roomId,
          matchId,
          toolId,
          displayName,
        });
        return res.event ?? null;
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "تعذر استخدام الأداة");
        return null;
      } finally {
        setBusy(null);
      }
    },
    [roomId, matchId],
  );

  return { useTool, busy, error, clearError: () => setError(null) };
}
