"use client";

import { useState } from "react";
import { GameplayVoiceLayout } from "@/components/game/play/GameplayVoiceLayout";
import { MyHiddenCardSheet } from "@/components/game/play/GameplaySheets";
import { useLiveUserProfile } from "@/hooks/useLiveUserProfile";
import { useMatchHints } from "@/hooks/useMatchHints";
import { getCategoryById } from "@/lib/game/categories";
import type { PlayerCosmetic } from "@/lib/profile/cosmetics";
import type { GameCard } from "@/types";

export type VoiceModePlayingPanelProps = {
  banner: string | null;
  roomId: string | null;
  matchId: string | null;
  uid: string | null;
  displayName: string;
  opponentName: string;
  phase?: string;
  myTurn: boolean;
  secLeft: number | null;
  opponentCard: GameCard | null;
  busy: boolean;
  sendVoiceAck: () => void | Promise<void>;
  openGuessFlow: () => void;
  myCosmetic?: PlayerCosmetic | null;
  opponentCosmetic?: PlayerCosmetic | null;
  myPhotoURL?: string | null;
};

export function VoiceModePlayingPanel({
  banner,
  roomId,
  matchId,
  uid,
  displayName,
  opponentName,
  myTurn,
  secLeft,
  opponentCard,
  busy,
  sendVoiceAck,
  openGuessFlow,
  myCosmetic,
  opponentCosmetic,
  myPhotoURL,
}: VoiceModePlayingPanelProps) {
  const [cardSheetOpen, setCardSheetOpen] = useState(false);
  const [passing, setPassing] = useState(false);
  const [hintBusy, setHintBusy] = useState(false);
  const liveProfile = useLiveUserProfile(uid);

  const hintsEnabled = Boolean(roomId && matchId && uid);
  const { hintsLeft, revealedIdx, letters, countRevealed, useHint } = useMatchHints(
    roomId,
    matchId,
    uid,
    hintsEnabled,
  );

  const categoryLabel = opponentCard?.categoryId
    ? (getCategoryById(opponentCard.categoryId)?.nameAr ?? null)
    : null;

  const onPassTurn = async () => {
    if (!myTurn || busy || passing) return;
    setPassing(true);
    try {
      await sendVoiceAck();
    } finally {
      setPassing(false);
    }
  };

  const handleUseHint = async (kind: "letter" | "count") => {
    setHintBusy(true);
    try {
      await useHint(kind);
    } finally {
      setHintBusy(false);
    }
  };

  return (
    <>
      <GameplayVoiceLayout
        banner={banner}
        myName={displayName}
        opponentName={opponentName}
        myCosmetic={myCosmetic}
        opponentCosmetic={opponentCosmetic}
        myPhotoURL={myPhotoURL}
        myTurn={myTurn}
        secLeft={secLeft}
        opponentCard={opponentCard}
        categoryLabel={categoryLabel}
        letters={letters}
        revealedIdx={revealedIdx}
        hintsLeft={hintsLeft}
        bonusHints={liveProfile?.progress.hintCredits ?? 0}
        busy={busy}
        passing={passing}
        onPassTurn={() => void onPassTurn()}
        onGuess={openGuessFlow}
        onMyCardPress={() => setCardSheetOpen(true)}
      />
      <MyHiddenCardSheet
        open={cardSheetOpen}
        letters={letters}
        revealedIdx={revealedIdx}
        countRevealed={countRevealed}
        hintsLeft={hintsLeft}
        bonusHints={liveProfile?.progress.hintCredits ?? 0}
        coins={liveProfile?.progress.coins ?? 0}
        busy={hintBusy}
        onClose={() => setCardSheetOpen(false)}
        onUseHint={(k) => void handleUseHint(k)}
      />
    </>
  );
}
