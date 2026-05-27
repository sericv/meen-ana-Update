"use client";

/**
 * ShopItemCard — premium collectible-style item card.
 *
 * Design:
 *  - Large icon zone (top): rarity-tinted gradient bg, big SVG icon, rarity chip
 *  - Info strip (bottom): name, subtitle, owned count, price, CTA
 *  - NO looping animations, NO preview scenes, NO GIF systems
 *
 * Animations (lightweight):
 *  - whileTap: instant scale press (GPU transform only)
 *  - Icon zone: subtle CSS float keyframe (translateY only, compositor layer)
 *  - Legendary/Epic: CSS glow pulse on icon zone shadow (compositor only)
 *
 * Performance:
 *  - React.memo: prevents rerenders when unrelated siblings update
 *  - contain: layout style paint — limits repaint scope to this card
 *  - willChange: transform on icon zone only (not the whole card)
 *  - No backdropFilter, no filter: blur
 */

import { motion, useReducedMotion } from "framer-motion";
import { useCallback, memo } from "react";
import { ShellCoin } from "@/components/shell/ShellCoin";

type Rarity = "common" | "rare" | "epic" | "legendary";

const RARITY: Record<Rarity, {
  label: string;
  chipBg: string;
  chipColor: string;
  iconBg: string;
  iconColor: string;
  border: string;
  borderPress: string;
  shadowIdle: string;
  shadowPress: string;
  floatAnim: string;   // CSS animation name
}> = {
  common: {
    label: "عادي",
    chipBg: "oklch(0.86 0.04 68)",
    chipColor: "oklch(0.40 0.05 58)",
    iconBg: "linear-gradient(160deg, oklch(0.93 0.05 76) 0%, oklch(0.85 0.08 70) 100%)",
    iconColor: "oklch(0.38 0.08 58)",
    border: "oklch(0.86 0.04 70 / .55)",
    borderPress: "oklch(0.78 0.07 68 / .7)",
    shadowIdle: "0 3px 14px oklch(0.70 0.06 65 / .14)",
    shadowPress: "0 1px 6px oklch(0.70 0.06 65 / .18)",
    floatAnim: "shopIconFloat",
  },
  rare: {
    label: "نادر",
    chipBg: "oklch(0.80 0.14 235)",
    chipColor: "oklch(0.26 0.12 228)",
    iconBg: "linear-gradient(160deg, oklch(0.88 0.10 240) 0%, oklch(0.76 0.16 232) 100%)",
    iconColor: "oklch(0.98 0.02 240)",
    border: "oklch(0.78 0.10 238 / .55)",
    borderPress: "oklch(0.66 0.16 238 / .75)",
    shadowIdle: "0 3px 16px oklch(0.70 0.14 238 / .18)",
    shadowPress: "0 1px 8px oklch(0.65 0.16 238 / .22)",
    floatAnim: "shopIconFloat",
  },
  epic: {
    label: "ملحمي",
    chipBg: "linear-gradient(120deg, oklch(0.76 0.18 300), oklch(0.68 0.20 278))",
    chipColor: "oklch(0.97 0.02 300)",
    iconBg: "linear-gradient(160deg, oklch(0.82 0.16 300) 0%, oklch(0.68 0.22 278) 100%)",
    iconColor: "oklch(0.97 0.02 300)",
    border: "oklch(0.76 0.14 292 / .55)",
    borderPress: "oklch(0.64 0.20 290 / .80)",
    shadowIdle: "0 3px 18px oklch(0.66 0.18 288 / .22)",
    shadowPress: "0 1px 8px oklch(0.62 0.20 288 / .28)",
    floatAnim: "shopIconFloatEpic",
  },
  legendary: {
    label: "أسطوري",
    chipBg: "linear-gradient(120deg, oklch(0.84 0.20 78), oklch(0.70 0.22 64))",
    chipColor: "oklch(0.22 0.06 45)",
    iconBg: "linear-gradient(160deg, oklch(0.88 0.18 80) 0%, oklch(0.72 0.22 64) 100%)",
    iconColor: "oklch(0.22 0.06 44)",
    border: "oklch(0.78 0.16 74 / .6)",
    borderPress: "oklch(0.65 0.22 70 / .82)",
    shadowIdle: "0 4px 20px oklch(0.72 0.20 74 / .28)",
    shadowPress: "0 2px 10px oklch(0.68 0.20 72 / .32)",
    floatAnim: "shopIconFloatLegendary",
  },
};

export interface ShopItemCardProps {
  id: string;
  name: string;
  subtitle?: string;
  /** unused — kept for API compatibility with shop/page.tsx */
  description?: string;
  price: number;
  rarity?: Rarity;
  ownedCount?: number;
  /** Large icon/artwork node rendered in the icon zone */
  icon?: React.ReactNode;
  busy?: boolean;
  canBuy?: boolean;
  insufficientCoins?: boolean;
  owned?: boolean;
  equipped?: boolean;
  onBuy?: () => void;
  onEquip?: () => void;
  showOwnedCount?: boolean;
  /** @deprecated — ignored, kept for backward compat */
  preview?: React.ReactNode;
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
      whileTap={reduced ? {} : { scale: 0.965 }}
      transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: "linear-gradient(180deg, oklch(0.995 0.006 80 / .98) 0%, oklch(0.960 0.016 74 / .99) 100%)",
        borderRadius: 18,
        border: `1.5px solid ${rs.border}`,
        overflow: "hidden",
        cursor: "pointer",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
        boxShadow: rs.shadowIdle,
        contain: "layout style paint",
        transition: "box-shadow 0.18s ease, border-color 0.18s ease",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Icon Zone ── */}
      <div
        style={{
          position: "relative",
          height: 88,
          background: rs.iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {/* Subtle inner vignette — no blur, pure gradient */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 50% 110%, rgba(0,0,0,0.10) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Floating icon */}
        <div
          style={{
            color: rs.iconColor,
            animation: reduced ? "none" : `${rs.floatAnim} 3.2s ease-in-out infinite`,
            willChange: "transform",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            filter: rarity === "legendary" || rarity === "epic"
              ? "drop-shadow(0 2px 8px rgba(0,0,0,0.18))"
              : "drop-shadow(0 1px 4px rgba(0,0,0,0.12))",
          }}
        >
          {/* Render icon at larger size inside the zone */}
          <IconZoneWrapper>{icon}</IconZoneWrapper>
        </div>

        {/* Rarity chip — top right */}
        <div
          style={{
            position: "absolute",
            top: 7,
            right: 7,
            background: rs.chipBg,
            color: rs.chipColor,
            fontSize: 8,
            fontWeight: 800,
            fontFamily: "var(--display)",
            padding: "2px 7px",
            borderRadius: 20,
            letterSpacing: "0.05em",
            lineHeight: 1.7,
            boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
          }}
        >
          {rs.label}
        </div>

        {/* Owned count — top left */}
        {showOwnedCount && typeof ownedCount === "number" && ownedCount > 0 && (
          <div
            style={{
              position: "absolute",
              top: 7,
              left: 7,
              background: "oklch(0.20 0.04 45 / .72)",
              color: "oklch(0.96 0.04 78)",
              fontSize: 9,
              fontWeight: 800,
              fontFamily: "var(--display)",
              padding: "2px 7px",
              borderRadius: 20,
              letterSpacing: "0.03em",
              lineHeight: 1.7,
            }}
          >
            ×{ownedCount}
          </div>
        )}
      </div>

      {/* ── Info Strip ── */}
      <div
        style={{
          padding: "10px 11px 11px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          flex: 1,
        }}
      >
        {/* Name + subtitle */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div
            style={{
              fontFamily: "var(--display)",
              fontWeight: 800,
              fontSize: 13,
              color: "oklch(0.24 0.05 44)",
              lineHeight: 1.2,
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
                color: "oklch(0.50 0.05 58)",
                fontFamily: "var(--display)",
                lineHeight: 1.3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        {/* Price + CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: "auto" }}>
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
                  border: "1px solid oklch(0.80 0.08 74 / .4)",
                  whiteSpace: "nowrap",
                }}
              >
                تمتلكه ✓
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
                padding: "5px 12px",
                borderRadius: 10,
                opacity: insufficientCoins ? 0.48 : 1,
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {busy ? "…" : "شراء"}
            </motion.button>
          )}
        </div>
      </div>
    </motion.article>
  );
});

/**
 * Scales the child icon up to fill the 88px zone nicely.
 * The child is expected to be an SVG at its native size.
 * We use a fixed wrapper that scales the SVG without reflow.
 */
function IconZoneWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: 52,
        height: 52,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // Scale up SVG children — transform doesn't cause layout recalc
        transform: "scale(1.85)",
        transformOrigin: "center",
      }}
    >
      {children}
    </div>
  );
}
