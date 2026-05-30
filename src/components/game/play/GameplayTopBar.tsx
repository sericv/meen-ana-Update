"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { GameplayTurnArc } from "@/components/game/play/GameplayTurnArc";
import { GP } from "@/components/game/play/tokens";
import { EASE_OUT } from "@/lib/motion";
import { useSecLeft } from "@/hooks/useSecLeft";
import type { PlayerCosmetic } from "@/lib/profile/cosmetics";
import type { Timestamp } from "firebase/firestore";


type PlayerProps = {
  name: string;
  uid: string | null;
  cosmetic?: PlayerCosmetic | null;
  photoURL?: string | null;
  active: boolean;
  reverse?: boolean;
};

// memo — only re-renders when player identity or active flag changes, not on every clock tick
const PlayerCorner = memo(function PlayerCorner({ name, uid, cosmetic, photoURL, active, reverse }: PlayerProps) {
  return (
    <div
      className="flex min-w-0 items-center gap-2"
      style={{
        flexDirection: reverse ? "row-reverse" : "row",
        opacity: active ? 1 : 0.5,
        filter: active ? "none" : "grayscale(0.7)",
        transition: "opacity 0.3s, filter 0.3s",
      }}
    >
      <div className="relative shrink-0">
        <ProfileAvatar
          cosmetic={uid ? cosmetic : null}
          fallbackPhotoURL={photoURL}
          displayName={name}
          size="sm"
          active={false}
          idle={false}
        />
      </div>

      <div
        className="flex min-w-0 flex-col"
        style={{ alignItems: reverse ? "flex-end" : "flex-start", lineHeight: 1.1 }}
      >
        <span
          className="max-w-[5.5rem] truncate text-sm font-extrabold"
          style={{ color: active ? GP.ink : GP.inkSoft }}
        >
          {name}
        </span>
      </div>
    </div>
  );
});

type Props = {
  myName: string;
  opponentName: string;
  myUid: string | null;
  opponentUid: string | null;
  myCosmetic?: PlayerCosmetic | null;
  opponentCosmetic?: PlayerCosmetic | null;
  myPhotoURL?: string | null;
  myTurn: boolean;
  /**
   * Firestore deadline timestamp — the TopBar owns the 200ms countdown
   * internally via useSecLeft so the parent (GameplaySocialSurface / RoomExperience)
   * never has to hold a fast-ticking clock state.
   */
  turnDeadline: Timestamp | null | undefined;
  maxPhaseSec: number;
  phase: string;
};

export const GameplayTopBar = memo(function GameplayTopBar({
  myName,
  opponentName,
  myUid,
  opponentUid,
  myCosmetic,
  opponentCosmetic,
  myPhotoURL,
  myTurn,
  turnDeadline,
  maxPhaseSec,
  phase,
}: Props) {
  // The countdown lives here — changes to secLeft only re-render this subtree,
  // not RoomExperience or GameplaySocialSurface.
  const secLeft = useSecLeft(turnDeadline, myTurn || true);

  const turnLabel = myTurn
    ? phase === "answer"
      ? "دورك تجيب"
      : "دورك تسأل"
    : "دور الخصم";

  const turnColor = myTurn ? GP.gold : GP.rose;

  return (
    <div
      dir="ltr"
      className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 px-3.5 pb-2 pt-1"
    >
      <PlayerCorner
        name={myName}
        uid={myUid}
        cosmetic={myCosmetic}
        photoURL={myPhotoURL}
        active={myTurn}
        reverse
      />

      {/* Center: arc + turn label */}
      <div className="flex flex-col items-center gap-1">
        <GameplayTurnArc secLeft={secLeft} maxSec={maxPhaseSec} active={myTurn} />
        <AnimatePresence mode="wait">
          <motion.span
            key={turnLabel}
            initial={{ opacity: 0, y: 4, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -3, scale: 0.94 }}
            transition={{ duration: 0.22, ease: EASE_OUT }}
            className="text-xs font-extrabold"
            style={{
              color: turnColor,
              textShadow: `0 0 14px ${turnColor}99`,
            }}
          >
            {turnLabel}
          </motion.span>
        </AnimatePresence>
      </div>

      <PlayerCorner
        name={opponentName}
        uid={opponentUid}
        cosmetic={opponentCosmetic}
        active={!myTurn}
      />
    </div>
  );
});
