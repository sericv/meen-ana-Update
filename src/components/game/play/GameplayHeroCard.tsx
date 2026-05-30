"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { memo, useState } from "react";
import { GP } from "@/components/game/play/tokens";
import { EASE_OUT } from "@/lib/motion";
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

export const GameplayHeroCard = memo(function GameplayHeroCard({ opponentCard, categoryLabel, size = "stage" }: Props) {
  const voice = size === "voice";
  const w = voice ? "min(200px, 52vw)" : "min(200px, 48vw)";
  const h = voice ? "min(278px, 58vw)" : "min(270px, 52vw)";
  const hasImage = Boolean(opponentCard?.imageUrl);

  return (
    <motion.div
      className="relative mx-auto grid place-items-center"
      style={{ width: w, height: h }}
    >
      {/* Outer distant bloom — CSS animation, compositor thread */}
      <div
        aria-hidden
        className="hero-bloom-outer pointer-events-none absolute rounded-[32px]"
        style={{
          inset: -24,
          background: `radial-gradient(ellipse, ${GP.orange}38 0%, transparent 68%)`,
          filter: "blur(18px)",
        }}
      />

      {/* Inner tight glow — CSS animation, compositor thread */}
      <div
        aria-hidden
        className="hero-bloom-inner pointer-events-none absolute rounded-[24px]"
        style={{
          inset: -8,
          background: `radial-gradient(ellipse, ${GP.gold}28 0%, transparent 72%)`,
          filter: "blur(7px)",
        }}
      />

      {/* Card surface */}
      <motion.div
        className="relative flex h-full w-full flex-col overflow-hidden rounded-[20px]"
        style={{
          border: "1.5px solid rgba(255,138,61,0.3)",
          outline: "1px solid rgba(255,255,255,0.55)",
          background: "linear-gradient(160deg, #fff 0%, #fff3e2 48%, #fbe0bd 100%)",
          boxShadow: [
            "0 1px 1px rgba(0,0,0,0.05)",
            "0 6px 12px -2px rgba(180,100,30,0.18)",
            "0 18px 36px -4px rgba(180,100,30,0.22)",
            "inset 0 2px 0 #fff",
            "inset 0 -2px 0 #f5d4a0",
          ].join(", "),
        }}
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.38, ease: EASE_OUT }}
      >
        {/* Top specular streak */}
        <span
          aria-hidden
          className="pointer-events-none absolute -left-6 -top-6 h-40 w-16 rotate-[18deg] opacity-45"
          style={{
            background: "linear-gradient(110deg, transparent, rgba(255,255,255,0.75), transparent)",
          }}
        />

        {/* Image area */}
        <div className="shimmer-sweep relative min-h-0 flex-1 overflow-hidden bg-gradient-to-b from-[#FFF8EF] to-[#FFE8BF]">
          {hasImage ? (
            <CardImg src={opponentCard!.imageUrl!} alt={opponentCard?.nameAr ?? "بطاقة"} />
          ) : (
            <div className="gentle-bob flex h-full items-center justify-center">
              {/* Shadow ؟ behind */}
              <span
                aria-hidden
                className="absolute text-6xl font-black select-none"
                style={{
                  transform: "translate(3px, 4px)",
                  color: `${GP.gold}28`,
                  filter: "blur(3px)",
                  userSelect: "none",
                }}
              >
                ؟
              </span>
              {/* Main ؟ */}
              <span
                className="relative text-6xl font-black"
                style={{
                  background: `linear-gradient(160deg, #fff 0%, ${GP.gold} 60%, ${GP.goldDeep} 100%)`,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  filter: `drop-shadow(0 0 8px ${GP.gold}88)`,
                }}
              >
                ؟
              </span>
            </div>
          )}

          {/* Bottom image vignette */}
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-16"
            style={{
              background: "linear-gradient(to top, rgba(251,224,189,0.82) 0%, transparent 100%)",
            }}
          />
        </div>

        {/* Name / category footer */}
        <div className="relative z-[1] shrink-0 px-3 pb-3 pt-2 text-center">
          <p
            className="truncate text-sm font-extrabold"
            style={{
              color: GP.ink,
              textShadow: `0 1px 0 rgba(255,255,255,0.8)`,
            }}
          >
            {opponentCard?.nameAr ?? "بطاقة الخصم"}
          </p>
          {categoryLabel ? (
            <p className="mt-0.5 text-[10px] font-bold" style={{ color: GP.inkSoft }}>
              {categoryLabel}
            </p>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
});
