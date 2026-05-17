"use client";

import { motion } from "framer-motion";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { GameplayTurnArc } from "@/components/game/play/GameplayTurnArc";
import { GP } from "@/components/game/play/tokens";
import type { PlayerCosmetic } from "@/lib/profile/cosmetics";

type PlayerProps = {
  name: string;
  uid: string | null;
  cosmetic?: PlayerCosmetic | null;
  photoURL?: string | null;
  active: boolean;
  reverse?: boolean;
};

function PlayerCorner({ name, uid, cosmetic, photoURL, active, reverse }: PlayerProps) {
  return (
    <div
      className="flex min-w-0 items-center gap-2"
      style={{
        flexDirection: reverse ? "row-reverse" : "row",
        opacity: active ? 1 : 0.55,
        transition: "opacity 0.3s",
      }}
    >
      <div className="relative shrink-0">
        {active ? (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -inset-2 rounded-full opacity-70"
            style={{
              background: `radial-gradient(circle, ${GP.gold}55 0%, transparent 70%)`,
              filter: "blur(6px)",
            }}
          />
        ) : null}
        <ProfileAvatar
          cosmetic={uid ? cosmetic : null}
          fallbackPhotoURL={photoURL}
          displayName={name}
          size="sm"
          active={active}
          idle={!active}
        />
      </div>
      <div
        className="flex min-w-0 flex-col"
        style={{ alignItems: reverse ? "flex-end" : "flex-start", lineHeight: 1.1 }}
      >
        <span className="max-w-[5.5rem] truncate text-sm font-extrabold" style={{ color: GP.ink }}>
          {name}
        </span>
      </div>
    </div>
  );
}

type Props = {
  myName: string;
  opponentName: string;
  myUid: string | null;
  opponentUid: string | null;
  myCosmetic?: PlayerCosmetic | null;
  opponentCosmetic?: PlayerCosmetic | null;
  myPhotoURL?: string | null;
  myTurn: boolean;
  secLeft: number | null;
  maxPhaseSec: number;
  phase: string;
};

export function GameplayTopBar({
  myName,
  opponentName,
  myUid,
  opponentUid,
  myCosmetic,
  opponentCosmetic,
  myPhotoURL,
  myTurn,
  secLeft,
  maxPhaseSec,
  phase,
}: Props) {
  const turnLabel = myTurn
    ? phase === "answer"
      ? "دورك تجيب"
      : "دورك تسأل"
    : "دور الخصم";

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
      <div className="flex flex-col items-center gap-1">
        <GameplayTurnArc secLeft={secLeft} maxSec={maxPhaseSec} active={myTurn} />
        <span
          className="text-xs font-extrabold"
          style={{
            color: myTurn ? GP.gold : GP.rose,
            textShadow: myTurn ? `0 0 12px ${GP.gold}88` : `0 0 12px ${GP.rose}66`,
          }}
        >
          {turnLabel}
        </span>
      </div>
      <PlayerCorner
        name={opponentName}
        uid={opponentUid}
        cosmetic={opponentCosmetic}
        active={!myTurn}
      />
    </div>
  );
}
