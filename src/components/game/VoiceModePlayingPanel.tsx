"use client";

import { useState } from "react";
import { GameplayVoiceLayout } from "@/components/game/play/GameplayVoiceLayout";
import { MyHiddenCardSheet } from "@/components/game/play/GameplaySheets";
import { useLiveUserProfile } from "@/hooks/useLiveUserProfile";
import { TacticalToolsBar } from "@/components/game/play/TacticalToolsBar";
import { useMatchHints } from "@/hooks/useMatchHints";
import type { TacticalInventory } from "@/lib/profile/tactical-tools";
import type { TacticalToolId } from "@/lib/profile/tactical-tools";
import type { MatchState } from "@/types";
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
  roomHintsEnabled?: boolean;
  match?: MatchState | null;
  tacticalInventory?: TacticalInventory;
  tacticalBusy?: TacticalToolId | null;
  onUseTactical?: (toolId: TacticalToolId) => void;
  tacticalError?: string | null;
};

export function VoiceModePlayingPanel({
  banner,
  roomId,
  matchId,
  uid,
  displayName,
  opponentName,
  phase = "question",
  myTurn,
  secLeft,
  opponentCard,
  busy,
  sendVoiceAck,
  openGuessFlow,
  myCosmetic,
  opponentCosmetic,
  myPhotoURL,
  roomHintsEnabled = true,
  match = null,
  tacticalInventory,
  tacticalBusy = null,
  onUseTactical,
  tacticalError = null,
}: VoiceModePlayingPanelProps) {
  const [cardSheetOpen, setCardSheetOpen] = useState(false);
  const [passing, setPassing] = useState(false);
  const [hintBusy, setHintBusy] = useState(false);
  const liveProfile = useLiveUserProfile(uid);

  const hintsEnabled = roomHintsEnabled && Boolean(roomId && matchId && uid);
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
      {tacticalInventory && onUseTactical ? (
        <div className="shrink-0">
          {tacticalError ? (
            <p className="mx-4 mb-1 text-center text-[10px] font-bold text-[#B8332E]">{tacticalError}</p>
          ) : null}
          <TacticalToolsBar
            match={match}
            uid={uid}
            myTurn={myTurn}
            phase={phase}
            inventory={tacticalInventory}
            busy={tacticalBusy}
            onUse={onUseTactical}
          />
        </div>
      ) : null}
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
        bonusLetterHints={liveProfile?.progress.hintLetterCredits ?? 0}
        bonusCountHints={liveProfile?.progress.hintCountCredits ?? 0}
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
        bonusLetterHints={liveProfile?.progress.hintLetterCredits ?? 0}
        bonusCountHints={liveProfile?.progress.hintCountCredits ?? 0}
        busy={hintBusy}
        onClose={() => setCardSheetOpen(false)}
        onUseHint={(k) => void handleUseHint(k)}
      />
    </>
  );
}
