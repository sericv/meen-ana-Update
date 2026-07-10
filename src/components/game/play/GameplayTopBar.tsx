"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { usePlayerProfileModal } from "@/components/providers/PlayerProfileModalProvider";
import { PlayerTimerRing } from "@/components/game/play/PlayerTimerRing";
import { useSecLeft } from "@/hooks/useSecLeft";
import { EASE_OUT } from "@/lib/motion";
import type { PlayerCosmetic } from "@/lib/profile/cosmetics";
import type { Timestamp } from "firebase/firestore";

type PlayerProps = {
  name: string;
  uid: string | null;
  cosmetic?: PlayerCosmetic | null;
  photoURL?: string | null;
  active: boolean;
  secLeft: number | null;
  maxPhaseSec: number;
  roomId?: string | null;
  matchId?: string | null;
};

const PlayerCorner = memo(function PlayerCorner({
  name,
  uid,
  cosmetic,
  photoURL,
  active,
  secLeft,
  maxPhaseSec,
  roomId,
  matchId,
}: PlayerProps) {
  const { openProfile } = usePlayerProfileModal();
  return (
    <motion.div
      className="relative flex flex-col items-center gap-1 cursor-pointer select-none"
      onClick={uid ? () => openProfile(uid, { roomId, matchId, screen: "gameplay" }) : undefined}
      animate={{
        scale: active ? 1 : 0.88,
        opacity: active ? 1 : 0.5,
      }}
      transition={{ duration: 0.4, ease: EASE_OUT }}
    >
      {/* Avatar with timer ring */}
      <PlayerTimerRing
        active={active}
        secLeft={secLeft}
        maxSec={maxPhaseSec}
        size="sm"
      >
        <ProfileAvatar
          cosmetic={uid ? cosmetic : null}
          fallbackPhotoURL={photoURL}
          displayName={name}
          size="sm"
          active={false}
          idle={false}
        />
      </PlayerTimerRing>

      {/* Countdown label */}
      {active && secLeft !== null && (
        <motion.span
          className="font-black tabular-nums select-none"
          style={{
            fontSize: 9,
            color: "#8B5CF6",
            fontFamily: "var(--display)",
            lineHeight: 1,
          }}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
        >
          {secLeft}
        </motion.span>
      )}

      {/* Name */}
      <span
        className="truncate text-center font-black leading-tight"
        style={{
          fontSize: active ? 12 : 10,
          color: active ? "#374151" : "#9CA3AF",
          fontFamily: "var(--display)",
          maxWidth: 80,
          transition: "color 0.3s, font-size 0.3s",
        }}
      >
        {name}
      </span>
    </motion.div>
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
  turnDeadline: Timestamp | null | undefined;
  maxPhaseSec: number;
  phase: string;
  roomId?: string | null;
  matchId?: string | null;
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
  roomId,
  matchId,
}: Props) {
  const secLeft = useSecLeft(turnDeadline, myTurn || true);

  const turnLabel = myTurn
    ? phase === "answer" ? "دورك تجيب" : "دورك تسأل"
    : "دور الخصم";

  return (
    <div className="mx-4 mt-4 relative z-10">
      <div
        className="flex items-center justify-center gap-4 rounded-2xl px-4 py-3"
        style={{
          background: "#FFFFFF",
          boxShadow: "0 2px 8px rgba(139,92,246,0.04), 0 4px 16px rgba(0,0,0,0.02)",
        }}
      >
        {/* Opponent */}
        <PlayerCorner
          name={opponentName}
          uid={opponentUid}
          cosmetic={opponentCosmetic}
          active={!myTurn}
          secLeft={secLeft}
          maxPhaseSec={maxPhaseSec}
          roomId={roomId}
          matchId={matchId}
        />

        {/* Turn badge */}
        <div className="flex shrink-0 items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={turnLabel}
              initial={{ opacity: 0, y: 4, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -3, scale: 0.94 }}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 select-none"
              style={{
                background: myTurn
                  ? "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)"
                  : "linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)",
                border: `1px solid ${myTurn ? "rgba(139,92,246,0.12)" : "rgba(239,68,68,0.12)"}`,
              }}
            >
              <span
                className="font-black leading-none"
                style={{
                  fontSize: 10,
                  color: myTurn ? "#8B5CF6" : "#EF4444",
                  fontFamily: "var(--display)",
                }}
              >
                {turnLabel}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Me */}
        <PlayerCorner
          name={myName}
          uid={myUid}
          cosmetic={myCosmetic}
          photoURL={myPhotoURL}
          active={myTurn}
          secLeft={secLeft}
          maxPhaseSec={maxPhaseSec}
          roomId={roomId}
          matchId={matchId}
        />
      </div>
    </div>
  );
});
