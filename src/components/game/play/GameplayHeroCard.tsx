"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import Image from "next/image";
import { memo, useState } from "react";
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
      className="object-cover object-center rounded-2xl"
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

  // 3D Tilt values using motion variables
  const x = useMotionValue(200 / 2);
  const y = useMotionValue(270 / 2);

  const rotateX = useTransform(y, [0, 270], [10, -10]);
  const rotateY = useTransform(x, [0, 200], [-10, 10]);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - rect.left);
    y.set(event.clientY - rect.top);
  }

  function handleMouseLeave() {
    x.set(200 / 2);
    y.set(270 / 2);
  }

  return (
    <motion.div
      className="relative mx-auto grid place-items-center select-none"
      style={{ width: w, height: h, perspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ y: [0, -5, 0] }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {/* Decorative floating elements behind card */}
      <div className="absolute inset-0 pointer-events-none select-none z-0">
        <span className="absolute -top-3 -left-3 opacity-20 animate-pulse">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#7C3AED" aria-hidden>
            <path d="M12 2l2.4 5.8 6.3.5-4.8 4.1 1.5 6.1L12 15.8 7.6 18.5l1.5-6.1-4.8-4.1 6.3-.5L12 2z" />
          </svg>
        </span>
        <span className="absolute -bottom-3 -right-3 opacity-20 animate-pulse">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFE600" aria-hidden>
            <path d="M12 2l2.4 5.8 6.3.5-4.8 4.1 1.5 6.1L12 15.8 7.6 18.5l1.5-6.1-4.8-4.1 6.3-.5L12 2z" />
          </svg>
        </span>
        <span className="absolute top-1/2 -right-4 opacity-10">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" aria-hidden>
            <circle cx="12" cy="12" r="10" />
            <path d="M9 10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4z" />
          </svg>
        </span>
      </div>

      {/* Collectible Card Outer Bezel */}
      <motion.div
        className="relative flex h-full w-full flex-col overflow-hidden rounded-[26px] game-card-outer z-10"
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.38, ease: EASE_OUT }}
      >
        <div className="game-card-inner h-full w-full bg-white border border-slate-100 rounded-[22px] flex flex-col p-2.5 shadow-lg relative">
          
          {/* Card Category Header Badge */}
          {categoryLabel && (
            <div className="mx-auto mb-2 z-10 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-100 text-[8px] font-black text-[#7C3AED] select-none">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              {categoryLabel}
            </div>
          )}

          {/* Polaroid / Collectible Image Container */}
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-slate-50 border border-slate-100/50 flex flex-col justify-center items-center shadow-inner">
            {hasImage ? (
              <CardImg src={opponentCard!.imageUrl!} alt={opponentCard?.nameAr ?? "بطاقة"} />
            ) : (
              <div className="flex flex-col items-center justify-center relative">
                
                {/* Decorative pulsing circular glow */}
                <div className="absolute w-24 h-24 rounded-full bg-purple-50 border border-purple-100/30 animate-ping opacity-75 z-0" />
                
                <span
                  className="relative z-10 text-5xl font-black text-slate-300"
                  style={{
                    background: "linear-gradient(135deg, #7C3AED 0%, #C084FC 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  ؟
                </span>
                
                <span className="relative z-10 text-[7px] font-black text-slate-400 mt-1 uppercase tracking-wider select-none">
                  بطاقة غامضة
                </span>
              </div>
            )}
            
            {/* Soft inner card shadow vignette overlay */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.03)]" />
          </div>

          {/* Name Footer under image */}
          <div className="shrink-0 px-2 pt-2.5 pb-1 text-center select-none" style={{ lineHeight: 1.15 }}>
            <h4 className="text-xs font-black text-slate-800 truncate">
              {opponentCard?.nameAr ?? "من هو خصمك؟"}
            </h4>
            <span className="text-[7.5px] font-bold text-slate-400 mt-0.5 block">
              {opponentCard ? "مستوى الكشف المتاح" : "توقع البطاقة للفوز"}
            </span>
          </div>

        </div>
      </motion.div>
    </motion.div>
  );
});
