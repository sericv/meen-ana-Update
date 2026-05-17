"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { GameplayHeroCard } from "@/components/game/play/GameplayHeroCard";
import { GameplayMyHiddenCard } from "@/components/game/play/GameplayMyHiddenCard";
import { IconFwd, IconMic, IconStar } from "@/components/game/play/icons";
import { GP } from "@/components/game/play/tokens";
import type { PlayerCosmetic } from "@/lib/profile/cosmetics";
import type { GameCard } from "@/types";

function TurnHalo({
  active,
  accent,
  children,
}: {
  active: boolean;
  accent: "amber" | "rose";
  children: ReactNode;
}) {
  const color = accent === "amber" ? GP.gold : GP.rose;
  return (
    <motion.div className="relative p-1.5">
      {active ? (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full border-2 opacity-85"
            style={{ borderColor: color, boxShadow: `0 0 14px ${color}` }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-1 animate-pulse rounded-full border opacity-35"
            style={{ borderColor: color }}
          />
        </>
      ) : null}
      {children}
    </motion.div>
  );
}

function RoundBtn({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-[60px] flex-col items-center gap-1">
      <motion.div
        whileTap={{ scale: 0.94 }}
        className="grid h-[50px] w-[50px] place-items-center rounded-full border"
        style={{
          background: "linear-gradient(180deg, #fffaf3 0%, #fff1dd 100%)",
          borderColor: "rgba(244,196,141,0.5)",
          color: GP.rose,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 4px 10px rgba(58,37,23,0.12)",
        }}
      >
        <IconStar size={22} />
      </motion.div>
      <span className="text-xs font-semibold" style={{ color: GP.inkSoft }}>
        {label}
      </span>
    </button>
  );
}

function PassTurnButton({
  passing,
  onClick,
}: {
  passing: boolean;
  onClick: () => void;
}) {
  const label = passing ? "تمرير…" : "انتهيت — مرّر الدور";
  return (
    <motion.button
      type="button"
      disabled={passing}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className="relative flex h-[72px] min-w-[200px] max-w-[min(280px,78vw)] flex-1 items-center justify-center gap-2 rounded-full border-0 px-5 text-sm font-bold"
      style={{
        background: "linear-gradient(180deg, #FFD27A 0%, #C8881F 100%)",
        color: GP.ink,
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.55), 0 14px 28px -10px rgba(200,130,20,0.5)",
      }}
    >
      {!passing ? (
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-1.5 animate-ping rounded-full border-2 opacity-40"
          style={{ borderColor: GP.gold }}
        />
      ) : null}
      <IconFwd />
      <span className="leading-tight">{label}</span>
    </motion.button>
  );
}

export type GameplayVoiceLayoutProps = {
  banner: string | null;
  myName: string;
  opponentName: string;
  myCosmetic?: PlayerCosmetic | null;
  opponentCosmetic?: PlayerCosmetic | null;
  myPhotoURL?: string | null;
  myTurn: boolean;
  secLeft: number | null;
  opponentCard: GameCard | null;
  categoryLabel: string | null;
  letters: string[];
  revealedIdx: number[];
  hintsLeft: number;
  bonusHints?: number;
  busy: boolean;
  passing: boolean;
  onPassTurn: () => void;
  onGuess: () => void;
  onMyCardPress: () => void;
};

export function GameplayVoiceLayout({
  banner,
  myName,
  opponentName,
  myCosmetic,
  opponentCosmetic,
  myPhotoURL,
  myTurn,
  secLeft,
  opponentCard,
  categoryLabel,
  letters,
  revealedIdx,
  hintsLeft,
  bonusHints = 0,
  busy,
  passing,
  onPassTurn,
  onGuess,
  onMyCardPress,
}: GameplayVoiceLayoutProps) {
  const timer = secLeft ?? 0;
  const turnName = myTurn ? "أنت" : opponentName;
  const turnLine = `دور ${turnName}`;

  return (
    <motion.div className="flex min-h-0 flex-1 flex-col overflow-hidden" dir="rtl">
      {banner ? (
        <p className="mx-4 mt-1 shrink-0 rounded-xl px-3 py-1.5 text-center text-xs font-bold text-[#9a5f2d]">
          {banner}
        </p>
      ) : null}

      <motion.div
        className="mx-4 mt-2 flex shrink-0 items-center justify-center rounded-2xl px-2 py-1"
        style={{ background: "rgba(255,255,255,0.55)" }}
      >
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold"
          style={{ background: GP.cream, color: GP.ink }}
        >
          <IconMic size={12} color={GP.orange} />
          وضع الصوت
        </span>
      </motion.div>

      <motion.div className="relative flex min-h-0 flex-1 flex-col px-4 pt-2">
        <motion.div className="pointer-events-none absolute left-6 top-4 z-10 flex flex-col items-center gap-1.5">
          <TurnHalo active={myTurn} accent="amber">
            <ProfileAvatar
              cosmetic={myCosmetic}
              fallbackPhotoURL={myPhotoURL}
              displayName={myName}
              size="lg"
              active={myTurn}
            />
          </TurnHalo>
          <span className="text-sm font-extrabold" style={{ color: GP.ink }}>
            {myName}
          </span>
        </motion.div>
        <motion.div className="pointer-events-none absolute right-6 top-4 z-10 flex flex-col items-center gap-1.5">
          <TurnHalo active={!myTurn} accent="rose">
            <ProfileAvatar
              cosmetic={opponentCosmetic}
              displayName={opponentName}
              size="lg"
              active={!myTurn}
            />
          </TurnHalo>
          <span className="text-sm font-extrabold" style={{ color: GP.ink }}>
            {opponentName}
          </span>
        </motion.div>

        <motion.div className="relative mx-auto mt-[96px] flex w-full max-w-md items-end justify-center pb-2">
          <motion.div className="absolute bottom-0 left-0 z-20">
            <GameplayMyHiddenCard
              hintsLeft={hintsLeft}
              bonusHints={bonusHints}
              revealedIdx={revealedIdx}
              letters={letters}
              size="voice"
              onPress={onMyCardPress}
            />
          </motion.div>

          <motion.div className="flex flex-col items-center">
            <p
              className="mb-1 text-center text-[10px] font-bold uppercase tracking-[0.15em]"
              style={{ color: GP.inkSoft }}
            >
              بطاقة الخصم
            </p>
            <GameplayHeroCard
              opponentCard={opponentCard}
              categoryLabel={categoryLabel}
              size="voice"
            />
          </motion.div>
        </motion.div>

        <motion.div
          className="mx-auto mt-3 flex max-w-md items-center gap-3 rounded-full border px-4 py-2"
          style={{
            background: myTurn
              ? "linear-gradient(180deg, #fff4e0 0%, #ffe8c8 100%)"
              : "linear-gradient(180deg, #ffe8e6 0%, #ffd4d2 100%)",
            borderColor: myTurn ? "rgba(242,181,68,0.55)" : "rgba(229,82,77,0.45)",
          }}
        >
          <span
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-extrabold tabular-nums"
            style={{
              background: myTurn
                ? `linear-gradient(180deg, ${GP.gold} 0%, ${GP.goldDeep} 100%)`
                : `linear-gradient(180deg, ${GP.rose} 0%, ${GP.roseDeep} 100%)`,
              color: GP.ink,
            }}
          >
            {timer}
          </span>
          <p className="min-w-0 flex-1 text-center text-sm font-extrabold" style={{ color: GP.ink }}>
            {turnLine}
          </p>
        </motion.div>
      </motion.div>

      <motion.div
        className="flex shrink-0 items-center justify-center gap-3 px-4 py-3"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 12px)" }}
      >
        {myTurn ? (
          <>
            <PassTurnButton passing={passing || busy} onClick={onPassTurn} />
            <RoundBtn label="خمّن" onClick={onGuess} />
          </>
        ) : (
          <>
            <p
              className="min-w-0 flex-1 text-center text-sm font-extrabold"
              style={{ color: GP.inkSoft }}
            >
              بانتظار {opponentName}
            </p>
            <RoundBtn label="خمّن" onClick={onGuess} />
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
