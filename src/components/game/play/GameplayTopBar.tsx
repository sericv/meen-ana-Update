"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { GameplayTurnArc } from "@/components/game/play/GameplayTurnArc";
import { GP } from "@/components/game/play/tokens";
import { EASE_OUT } from "@/lib/motion";
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
    <motion.div
      className="flex min-w-0 items-center gap-2"
      style={{ flexDirection: reverse ? "row-reverse" : "row" }}
      animate={{ opacity: active ? 1 : 0.52 }}
      transition={{ duration: 0.35, ease: EASE_OUT }}
    >
      <div className="relative shrink-0">
        {/* Active glow — layered rings for depth */}
        <AnimatePresence>
          {active && (
            <>
              {/* Outer ambient bloom */}
              <motion.div
                key="bloom-outer"
                aria-hidden
                className="pointer-events-none absolute rounded-full"
                style={{
                  inset: -10,
                  background: `radial-gradient(circle, ${GP.gold}44 0%, transparent 68%)`,
                  filter: "blur(7px)",
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: [0.55, 0.9, 0.55],
                  scale: [1, 1.05, 1],
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  opacity: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
                  scale:   { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
                }}
              />
              {/* Inner tight ring */}
              <motion.div
                key="ring-inner"
                aria-hidden
                className="pointer-events-none absolute rounded-full"
                style={{
                  inset: -4,
                  boxShadow: `0 0 0 1.5px ${GP.gold}55, 0 0 8px 2px ${GP.gold}33`,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            </>
          )}
        </AnimatePresence>

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
        <motion.span
          className="max-w-[5.5rem] truncate text-sm font-extrabold"
          animate={{
            color: active ? GP.ink : GP.inkSoft,
            textShadow: active ? `0 0 16px ${GP.gold}55` : "none",
          }}
          transition={{ duration: 0.35, ease: EASE_OUT }}
        >
          {name}
        </motion.span>
      </div>
    </motion.div>
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
}
