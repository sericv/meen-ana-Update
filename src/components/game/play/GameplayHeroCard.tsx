"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { memo, useState } from "react";
import { GP } from "@/components/game/play/tokens";
import type { GameCard } from "@/types";

const PLACEHOLDER = "/cards/_placeholder.svg";

const CardImg = memo(function CardImg({ src, alt }: { src: string; alt: string }) {
  const [err, setErr] = useState(false);
  return (
    <Image
      src={err ? PLACEHOLDER : src}
      alt={alt}
      fill
      className="object-cover object-center"
      sizes="(max-width: 640px) 50vw, 220px"
      unoptimized
      onError={() => setErr(true)}
    />
  );
});

type Props = {
  opponentCard: GameCard | null;
  categoryLabel: string | null;
  size?: "stage" | "voice";
};

export function GameplayHeroCard({ opponentCard, categoryLabel, size = "stage" }: Props) {
  const voice = size === "voice";
  const w = voice ? "min(200px, 52vw)" : "min(200px, 48vw)";
  const h = voice ? "min(278px, 58vw)" : "min(270px, 52vw)";
  const hasImage = Boolean(opponentCard?.imageUrl);

  return (
    <motion.div
      className="relative mx-auto grid place-items-center"
      style={{ width: w, height: h }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-8 rounded-[32px]"
        animate={{ opacity: [0.55, 0.85, 0.55] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: `radial-gradient(ellipse, ${GP.orange}44 0%, transparent 70%)`,
          filter: "blur(12px)",
        }}
      />
      <div
        className="relative flex h-full w-full flex-col overflow-hidden rounded-[20px] border-[1.5px] border-[rgba(255,138,61,0.28)]"
        style={{
          background: "linear-gradient(160deg, #fff 0%, #fff1dd 48%, #fbe0bd 100%)",
          boxShadow:
            "0 18px 36px rgba(180,100,30,0.24), inset 0 2px 0 #fff, inset 0 -3px 0 #fbe0bd",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -left-6 -top-6 h-40 w-16 rotate-[18deg] opacity-40"
          style={{
            background: "linear-gradient(110deg, transparent, rgba(255,255,255,0.7), transparent)",
          }}
        />
        <div className="relative min-h-0 flex-1 overflow-hidden bg-gradient-to-b from-[#FFF6E5] to-[#FFE8BF]">
          {hasImage ? (
            <CardImg src={opponentCard!.imageUrl!} alt={opponentCard?.nameAr ?? "بطاقة"} />
          ) : (
            <motion.div
              className="flex h-full items-center justify-center"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <span
                className="text-6xl font-black"
                style={{
                  background: `linear-gradient(180deg, #fff 0%, ${GP.gold} 100%)`,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                ؟
              </span>
            </motion.div>
          )}
        </div>
        <div className="relative z-[1] shrink-0 px-3 pb-3 pt-2 text-center">
          <p className="truncate text-sm font-extrabold" style={{ color: GP.ink }}>
            {opponentCard?.nameAr ?? "بطاقة الخصم"}
          </p>
          {categoryLabel ? (
            <p className="mt-1 text-[10px] font-bold" style={{ color: GP.inkSoft }}>
              {categoryLabel}
            </p>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
