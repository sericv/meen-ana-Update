"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useCallback, memo } from "react";
import { ShellCoin } from "@/components/shell/ShellCoin";

export type Rarity = "common" | "rare" | "epic" | "legendary" | "mythic";

const RARITY: Record<Rarity, {
  label: string;
  dot: string;
  accentBar: string;
  iconOrb: string;
  iconColor: string;
  border: string;
  bgGlow: string;
  float: string;
}> = {
  common: {
    label: "عادي",
    dot: "bg-slate-400",
    accentBar: "from-slate-400 to-slate-500",
    iconOrb: "from-slate-100 to-transparent",
    iconColor: "text-slate-500",
    border: "border-slate-200/50",
    bgGlow: "bg-slate-500/5",
    float: "shopFloat",
  },
  rare: {
    label: "نادر",
    dot: "bg-cyan-500",
    accentBar: "from-cyan-400 to-cyan-500",
    iconOrb: "from-cyan-100/50 to-transparent",
    iconColor: "text-cyan-600",
    border: "border-cyan-200/50",
    bgGlow: "bg-cyan-500/5",
    float: "shopFloat",
  },
  epic: {
    label: "ملحمي",
    dot: "bg-purple-500",
    accentBar: "from-purple-400 to-purple-500",
    iconOrb: "from-purple-100/50 to-transparent",
    iconColor: "text-purple-600",
    border: "border-purple-200/50",
    bgGlow: "bg-purple-500/5",
    float: "shopFloatSlow",
  },
  legendary: {
    label: "أسطوري",
    dot: "bg-amber-500",
    accentBar: "from-amber-400 to-amber-500",
    iconOrb: "from-amber-100/50 to-transparent",
    iconColor: "text-amber-600",
    border: "border-amber-200/50",
    bgGlow: "bg-amber-500/5",
    float: "shopFloatSlow",
  },
  mythic: {
    label: "خرافي",
    dot: "bg-rose-500",
    accentBar: "from-rose-500 to-red-500",
    iconOrb: "from-rose-100 to-transparent",
    iconColor: "text-rose-600",
    border: "border-rose-300/50",
    bgGlow: "bg-rose-500/10",
    float: "shopFloatSlow",
  },
};

const CSS = `
  @keyframes shopFloat {
    0%, 100% { transform: translateY(0px);   }
    50%       { transform: translateY(-4px);  }
  }
  @keyframes shopFloatSlow {
    0%, 100% { transform: translateY(0px);   }
    50%       { transform: translateY(-5px);  }
  }
`;

export interface ShopItemCardProps {
  id: string;
  name: string;
  subtitle?: string;
  description?: string;
  price: number;
  rarity?: Rarity;
  ownedCount?: number;
  icon?: React.ReactNode;
  busy?: boolean;
  canBuy?: boolean;
  insufficientCoins?: boolean;
  owned?: boolean;
  equipped?: boolean;
  onBuy?: () => void;
  onEquip?: () => void;
  showOwnedCount?: boolean;
  teaser?: boolean;
}

export const ShopItemCard = memo(function ShopItemCard({
  name,
  subtitle,
  price,
  rarity = "common",
  ownedCount,
  icon,
  busy,
  canBuy,
  insufficientCoins,
  owned,
  equipped,
  onBuy,
  onEquip,
  showOwnedCount = false,
  teaser = false,
}: ShopItemCardProps) {
  const reduced = useReducedMotion();
  const rs = RARITY[rarity];

  const handleBuy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onBuy?.();
  }, [onBuy]);

  const handleEquip = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEquip?.();
  }, [onEquip]);

  return (
    <motion.article
      whileTap={reduced || teaser ? {} : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={`game-card-outer flex flex-col relative overflow-hidden ${teaser ? "opacity-75 grayscale-[20%]" : ""}`}
    >
      {/* 3px accent bar */}
      <div className={`absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r ${rs.accentBar}`} />

      {/* Sparks particles background in low opacity */}
      <div className="absolute inset-0 pointer-events-none opacity-5 flex items-center justify-between px-4">
        <span className="text-xs">✦</span>
        <span className="text-xs mt-8">✦</span>
      </div>

      <div
        className={`game-card-inner relative flex h-full w-full flex-col overflow-hidden p-4 bg-white border border-slate-100 rounded-[22px] shadow-sm gap-3 text-right`}
      >
        {/* Rarity Label Row */}
        <div className="flex justify-between items-center w-full">
          <span 
            className={`text-[8.5px] font-black px-2.5 py-0.5 rounded-full select-none ${
              rarity === "mythic" ? "bg-rose-50 text-rose-600" :
              rarity === "legendary" ? "bg-amber-50 text-amber-700" : 
              rarity === "epic" ? "bg-purple-50 text-purple-700" : 
              rarity === "rare" ? "bg-cyan-50 text-cyan-700" : "bg-slate-50 text-slate-500"
            }`}
          >
            {rs.label}
          </span>
          <span className={`w-1.5 h-1.5 rounded-full ${rs.dot}`} />
        </div>

        {/* Icon Zone */}
        <div
          className={`relative w-full rounded-xl flex items-center justify-center overflow-hidden border border-slate-50 ${rs.bgGlow}`}
          style={{ height: 96 }}
        >
          {/* Ambient orb backdrop */}
          <div
            aria-hidden
            className={`absolute inset-0 bg-gradient-to-b ${rs.iconOrb}`}
            style={{ pointerEvents: "none" }}
          />

          {/* Floating item icon */}
          <div
            className={rs.iconColor}
            style={{
              animation: reduced || teaser ? "none" : `${rs.float} 3.4s ease-in-out infinite`,
              willChange: "transform",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconZoneWrapper>{icon}</IconZoneWrapper>
          </div>

          {/* Owned count badge */}
          {showOwnedCount && typeof ownedCount === "number" && ownedCount > 0 && (
            <div
              className="absolute bottom-2 left-2 bg-slate-900/60 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-full backdrop-blur-[2px]"
            >
              ×{ownedCount}
            </div>
          )}
        </div>

        {/* Item Info (Name, Subtitle) */}
        <div className="flex flex-col gap-1 min-h-[42px] justify-center">
          <h4 className="h-display text-xs font-black text-slate-800 leading-tight">
            {name}
          </h4>
          {subtitle && (
            <p className="text-[9px] text-slate-400 font-bold leading-normal">
              {subtitle}
            </p>
          )}
        </div>

        <div className="border-t border-slate-100 my-0.5" />

        {/* Price & CTA Button */}
        <div className="flex items-center justify-between w-full mt-auto">
          
          {/* Teaser state */}
          {teaser ? (
            <>
              <span className="text-[9px] font-black text-slate-400">قريبًا جداً</span>
              <span className="text-[9px] font-black text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">مغلق</span>
            </>
          ) : (
            <>
              {!owned && (
                <div className="flex-1 text-right">
                  <ShellCoin value={price} compact />
                </div>
              )}
              {owned && <div className="flex-1" />}

              {owned ? (
                onEquip ? (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={handleEquip}
                    disabled={busy || equipped}
                    className="px-3.5 py-1.5 rounded-xl text-[10px] font-black transition-all bg-slate-50 border border-slate-200 text-slate-700 active:scale-95 disabled:bg-purple-50 disabled:border-purple-100 disabled:text-[#7C3AED]"
                    style={{ cursor: "pointer" }}
                  >
                    {busy ? "…" : equipped ? "مفعّل" : "تجهيز"}
                  </motion.button>
                ) : (
                  <span className="text-[9px] font-black text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
                    تمتلكه
                  </span>
                )
              ) : (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBuy}
                  disabled={!canBuy || busy}
                  className="px-4 py-1.5 rounded-xl text-[10px] font-black transition-all bg-gradient-to-r from-purple-600 to-purple-400 border border-purple-800 text-white shadow-sm active:scale-95 disabled:opacity-40"
                  style={{ cursor: "pointer" }}
                >
                  {busy ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="animate-spin">
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  ) : (
                    "شراء"
                  )}
                </motion.button>
              )}
            </>
          )}

        </div>
      </div>
      <style>{CSS}</style>
    </motion.article>
  );
});

function IconZoneWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: 52,
        height: 52,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: "scale(1.9)",
        transformOrigin: "center",
      }}
    >
      {children}
    </div>
  );
}
