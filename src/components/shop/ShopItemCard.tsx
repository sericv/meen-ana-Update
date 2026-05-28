"use client";

/**
 * ShopItemCard — premium collectible card.
 *
 * Visual language:
 *  - All cards share the same warm cream base — rarity is never "painted" on.
 *  - Rarity shows through: thin 3px top accent bar, subtle border tint,
 *    a small ambient orb glow behind the icon, and a tiny dot on the chip.
 *  - Icon zone: tall warm zone, rarity-tinted radial halo, floating icon.
 *  - Info strip: clean hierarchy — name, subtitle, price + CTA.
 *
 * Motion:
 *  - whileTap scale(0.97), spring — tactile press
 *  - CSS float keyframe on icon — compositor only, no JS
 *  - No looping Framer Motion animations on the card shell
 *
 * Performance:
 *  - React.memo, contain: layout style paint
 *  - willChange: transform on icon only
 */

import { motion, useReducedMotion } from "framer-motion";
import { useCallback, memo } from "react";
import { ShellCoin } from "@/components/shell/ShellCoin";

type Rarity = "common" | "rare" | "epic" | "legendary";

/* ── Rarity tokens ─────────────────────────────────────────────── */
const RARITY: Record<Rarity, {
  label: string;
  /** Tiny colored dot shown inside the rarity chip */
  dot: string;
  /** 3px accent bar across the top of the card */
  accentBar: string;
  /** Radial orb behind the icon */
  iconOrb: string;
  /** Icon color */
  iconColor: string;
  /** Card border tint */
  border: string;
  /** Outer ambient shadow (rarity-tinted) */
  shadow: string;
  /** Float animation name */
  float: string;
}> = {
  common: {
    label: "عادي",
    dot: "oklch(0.72 0.10 68)",
    accentBar: "linear-gradient(90deg, oklch(0.78 0.10 72), oklch(0.68 0.12 60))",
    iconOrb: "radial-gradient(circle at 50% 60%, oklch(0.88 0.10 72 / .55) 0%, transparent 65%)",
    iconColor: "oklch(0.44 0.10 60)",
    border: "oklch(0.82 0.07 70 / .50)",
    shadow: "0 3px 14px oklch(0.68 0.08 65 / .10)",
    float: "shopFloat",
  },
  rare: {
    label: "نادر",
    dot: "oklch(0.58 0.14 238)",
    accentBar: "linear-gradient(90deg, oklch(0.62 0.14 238), oklch(0.52 0.16 228))",
    iconOrb: "radial-gradient(circle at 50% 60%, oklch(0.80 0.12 238 / .45) 0%, transparent 65%)",
    iconColor: "oklch(0.46 0.14 236)",
    border: "oklch(0.72 0.10 236 / .38)",
    shadow: "0 3px 16px oklch(0.58 0.14 236 / .13)",
    float: "shopFloat",
  },
  epic: {
    label: "ملحمي",
    dot: "oklch(0.56 0.18 288)",
    accentBar: "linear-gradient(90deg, oklch(0.60 0.18 290), oklch(0.52 0.20 272))",
    iconOrb: "radial-gradient(circle at 50% 60%, oklch(0.76 0.14 285 / .42) 0%, transparent 65%)",
    iconColor: "oklch(0.50 0.16 284)",
    border: "oklch(0.68 0.12 284 / .36)",
    shadow: "0 3px 18px oklch(0.56 0.16 282 / .14)",
    float: "shopFloatSlow",
  },
  legendary: {
    label: "أسطوري",
    dot: "oklch(0.72 0.20 68)",
    accentBar: "linear-gradient(90deg, oklch(0.82 0.20 74), oklch(0.68 0.22 60))",
    iconOrb: "radial-gradient(circle at 50% 60%, oklch(0.88 0.16 72 / .55) 0%, transparent 65%)",
    iconColor: "oklch(0.50 0.18 66)",
    border: "oklch(0.76 0.14 70 / .48)",
    shadow: "0 4px 20px oklch(0.70 0.18 70 / .18)",
    float: "shopFloatSlow",
  },
};

/* ── CSS keyframes (injected once via <style>) ──────────────────── */
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

/* ── Types ─────────────────────────────────────────────────────── */
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
  /** @deprecated — ignored */
  preview?: React.ReactNode;
}

/* ── Component ──────────────────────────────────────────────────── */
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
}: ShopItemCardProps) {
  const reduced = useReducedMotion();
  const rs = RARITY[rarity];

  const handleBuy = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    onBuy?.();
  }, [onBuy]);

  const handleEquip = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    onEquip?.();
  }, [onEquip]);

  return (
    <motion.article
      whileTap={reduced ? {} : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 440, damping: 30 }}
      style={{
        /* Warm cream base — same for every rarity */
        background: "linear-gradient(168deg, rgba(255,255,255,0.99) 0%, oklch(0.964 0.014 76) 100%)",
        borderRadius: 18,
        border: `1.5px solid ${rs.border}`,
        overflow: "hidden",
        cursor: "pointer",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
        boxShadow: [
          "inset 0 1.5px 0 rgba(255,255,255,0.90)",
          rs.shadow,
          "0 1px 2px rgba(0,0,0,0.03)",
        ].join(", "),
        contain: "layout style paint",
        display: "flex",
        flexDirection: "column",
        willChange: "transform",
        transition: "box-shadow 0.24s cubic-bezier(0.23,1,0.32,1), border-color 0.24s cubic-bezier(0.23,1,0.32,1)",
      }}
    >
      {/* ── Rarity accent bar (top 3px) ── */}
      <div
        aria-hidden
        style={{
          height: 3,
          background: rs.accentBar,
          flexShrink: 0,
          opacity: 0.82,
        }}
      />

      {/* ── Icon Zone ── */}
      <div
        style={{
          position: "relative",
          height: 100,
          /* Unified warm cream background — rarity only in the orb, not the zone */
          background: "linear-gradient(175deg, oklch(0.975 0.018 78) 0%, oklch(0.940 0.024 74) 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {/* Top specular — soft white streak */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: "15%",
            right: "15%",
            height: 3,
            background: "rgba(255,255,255,0.52)",
            borderRadius: "0 0 999px 999px",
            filter: "blur(1px)",
            pointerEvents: "none",
          }}
        />

        {/* Rarity orb — ambient halo behind the icon */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: rs.iconOrb,
            pointerEvents: "none",
          }}
        />

        {/* Bottom inner shadow for depth */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 28,
            background: "linear-gradient(0deg, oklch(0.88 0.02 70 / .22) 0%, transparent 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Floating icon */}
        <div
          style={{
            color: rs.iconColor,
            animation: reduced ? "none" : `${rs.float} 3.4s ease-in-out infinite`,
            willChange: "transform",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            filter: rarity === "legendary"
              ? "drop-shadow(0 2px 8px oklch(0.70 0.20 68 / .35))"
              : rarity === "epic"
                ? "drop-shadow(0 2px 7px oklch(0.56 0.18 284 / .30))"
                : rarity === "rare"
                  ? "drop-shadow(0 1px 6px oklch(0.58 0.14 236 / .28))"
                  : "drop-shadow(0 1px 4px rgba(0,0,0,0.10))",
          }}
        >
          <IconZoneWrapper>{icon}</IconZoneWrapper>
        </div>

        {/* Owned count badge — top left */}
        {showOwnedCount && typeof ownedCount === "number" && ownedCount > 0 && (
          <div
            style={{
              position: "absolute",
              top: 7,
              left: 8,
              background: "oklch(0.22 0.04 45 / .68)",
              color: "oklch(0.96 0.04 78)",
              fontSize: 9,
              fontWeight: 800,
              fontFamily: "var(--display)",
              padding: "2px 7px",
              borderRadius: 20,
              letterSpacing: "0.03em",
              lineHeight: 1.7,
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
            }}
          >
            ×{ownedCount}
          </div>
        )}

        {/* Rarity indicator — dot only, no text */}
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 9,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: rs.dot,
            boxShadow: `0 0 6px ${rs.dot}, 0 0 12px ${rs.dot}55`,
            border: "1.5px solid rgba(255,255,255,0.55)",
          }}
          aria-hidden
        />
      </div>

      {/* ── Info Strip ── */}
      <div
        style={{
          padding: "11px 12px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 9,
          flex: 1,
        }}
      >
        {/* Name + subtitle */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <div
            style={{
              fontFamily: "var(--display)",
              fontWeight: 800,
              fontSize: 13.5,
              color: "oklch(0.24 0.05 44)",
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {name}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: 10.5,
                color: "oklch(0.52 0.05 56)",
                fontFamily: "var(--display)",
                fontWeight: 500,
                lineHeight: 1.35,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        {/* Divider */}
        <div
          aria-hidden
          style={{
            height: 1,
            background: "oklch(0.88 0.04 70 / .45)",
            margin: "0 -1px",
          }}
        />

        {/* Price + CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {!owned && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <ShellCoin value={price} compact />
            </div>
          )}
          {owned && <div style={{ flex: 1 }} />}

          {owned ? (
            onEquip ? (
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={handleEquip}
                onTouchEnd={handleEquip}
                disabled={busy || equipped}
                className="btn btn-primary btn-sm"
                style={{ minWidth: 60, fontSize: 11.5, padding: "5px 10px", borderRadius: 10 }}
              >
                {busy ? "…" : equipped ? "مفعّل" : "تجهيز"}
              </motion.button>
            ) : (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  fontFamily: "var(--display)",
                  color: "oklch(0.46 0.12 74)",
                  background: "oklch(0.91 0.08 78 / .65)",
                  padding: "3px 9px",
                  borderRadius: 20,
                  border: "1px solid oklch(0.80 0.08 74 / .40)",
                  whiteSpace: "nowrap",
                }}
              >
                تمتلكه
              </span>
            )
          ) : (
            <motion.button
              type="button"
              whileTap={{ scale: 0.90 }}
              onClick={handleBuy}
              onTouchEnd={handleBuy}
              disabled={!canBuy || busy}
              className="btn btn-primary btn-sm"
              style={{
                minWidth: 54,
                fontSize: 12,
                padding: "5px 13px",
                borderRadius: 10,
                opacity: insufficientCoins ? 0.42 : 1,
                fontWeight: 800,
                flexShrink: 0,
                transition: "opacity 0.18s",
              }}
            >
              {busy ? "…" : "شراء"}
            </motion.button>
          )}
        </div>
      </div>

      <style>{CSS}</style>
    </motion.article>
  );
});

/* ── Icon zone wrapper ──────────────────────────────────────────── */
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
