import { useEffect, useState } from "react";
import { postGame } from "@/lib/api/game-client";
import type { GameCard } from "@/types";

/**
 * Polls `/api/game/reveal-cards` once a match has ended to fetch both
 * players' true cards (hidden during play, revealed after the match ends).
 */
export function useRevealedCards(roomId: string, myUid: string): {
  myCard: GameCard | null;
  opponentCard: GameCard | null;
} {
  const [myCard, setMyCard] = useState<GameCard | null>(null);
  const [oppCard, setOppCard] = useState<GameCard | null>(null);

  useEffect(() => {
    if (!roomId || !myUid) { setMyCard(null); setOppCard(null); return; }
    let cancelled = false;
    let attempts = 0;
    const tick = async () => {
      if (cancelled) return;
      attempts += 1;
      try {
        const res = await postGame("/api/game/reveal-cards", { roomId });
        const data = res as {
          ok?: boolean;
          myCard?: { cardId: string; name: string; nameAr: string; imageUrl: string; categoryId: string } | null;
          opponentCard?: { cardId: string; name: string; nameAr: string; imageUrl: string; categoryId: string } | null;
        };
        if (cancelled) return;
        const mapCard = (c: NonNullable<typeof data.myCard>): GameCard => ({
          id: String(c.cardId ?? ""),
          name: String(c.name ?? ""),
          nameAr: String(c.nameAr ?? ""),
          imageUrl: String(c.imageUrl ?? ""),
          categoryId: String(c.categoryId ?? ""),
          tags: [],
        });
        if (data.myCard) setMyCard(mapCard(data.myCard));
        if (data.opponentCard) setOppCard(mapCard(data.opponentCard));
      } catch {
        if (!cancelled && attempts < 5) setTimeout(() => void tick(), 400 * attempts);
      }
    };
    void tick();
    return () => { cancelled = true; };
  }, [roomId, myUid]);

  return { myCard, opponentCard: oppCard };
}
