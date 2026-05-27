"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGate } from "@/components/auth/AuthGate";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLiveUserProfile } from "@/hooks/useLiveUserProfile";
import { ShellCoin } from "@/components/shell/ShellCoin";
import { ShellIcon } from "@/components/shell/ShellIcons";
import { ShellScreen } from "@/components/shell/ShellScreen";
import { motion } from "framer-motion";
import { playUIButton, resumeAudioContext } from "@/lib/audio/game-sounds";
import { isFullAccountUser } from "@/lib/auth/google-user";
import { HINT_SHOP_ITEMS } from "@/lib/profile/hints";
import { TACTICAL_SHOP_ITEMS } from "@/lib/profile/tactical-tools";
import {
  purchaseHintItem,
  purchaseTacticalTool,
  ShopPurchaseError,
} from "@/lib/firestore/users.client";
import { TacticalToolIcon } from "@/components/game/play/TacticalToolIcons";
import { IconHintBulb } from "@/components/game/play/icons";
import { ShopItemCard } from "@/components/shop/ShopItemCard";
import { PurchaseToast } from "@/components/shop/PurchaseToast";

import type { TacticalToolId } from "@/lib/profile/tactical-tools";

function tacticalRarity(id: TacticalToolId): "common" | "rare" | "epic" | "legendary" {
  switch (id) {
    case "extra_time":     return "rare";
    case "time_pressure":  return "epic";
    case "extra_question": return "rare";
    case "shield":         return "legendary";
  }
}

function ShopInner() {
  const router = useRouter();
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const google = isFullAccountUser(user);
  const live = useLiveUserProfile(uid);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const progress = live?.progress;

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    window.setTimeout(() => setToast(null), 3200);
  };

  const buyTactical = useCallback(
    async (toolId: TacticalToolId) => {
      if (!uid || !google) return;
      resumeAudioContext();
      playUIButton();
      setBusyId(toolId);
      try {
        await purchaseTacticalTool(uid, toolId);
        const item = TACTICAL_SHOP_ITEMS.find((i) => i.id === toolId);
        showToast(item ? `تم شراء ${item.nameAr}` : "تم الشراء", true);
      } catch (e: unknown) {
        showToast(
          e instanceof ShopPurchaseError ? e.message : e instanceof Error ? e.message : "تعذر الشراء",
          false,
        );
      } finally {
        setBusyId(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uid, google],
  );

  const buyHint = useCallback(
    async (itemId: string) => {
      if (!uid || !google) return;
      resumeAudioContext();
      playUIButton();
      setBusyId(itemId);
      try {
        await purchaseHintItem(uid, itemId);
        const item = HINT_SHOP_ITEMS.find((i) => i.id === itemId);
        showToast(item ? `تم شراء ${item.nameAr}` : "تم الشراء", true);
      } catch (e: unknown) {
        showToast(
          e instanceof ShopPurchaseError ? e.message : e instanceof Error ? e.message : "تعذر الشراء",
          false,
        );
      } finally {
        setBusyId(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uid, google],
  );

  function showInsufficientCoins() {
    resumeAudioContext();
    playUIButton();
    showToast("ليس لديك عملات كافية", false);
  }

  return (
    <ShellScreen activeTab="shop">
      {/* ── Top bar ── */}
      <div className="topbar">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => router.push("/")}
          style={{ padding: 8, borderRadius: 12 }}
          aria-label="رجوع"
        >
          <ShellIcon name="back" size={18} />
        </button>
        <div className="h-display fw-7">المتجر</div>
        <div className="topbar-slot-end">
          {progress ? <ShellCoin value={progress.coins} /> : null}
        </div>
      </div>

      <div className="f-1 scroll-y" style={{ padding: "0 14px 24px" }}>

        {/* ── Guest notice ── */}
        {!google && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="surf mb-3"
            style={{ padding: "10px 14px", textAlign: "center" }}
          >
            <p className="text-sm fw-7">وضع المعاينة للزائر</p>
            <p className="text-xs muted mt-1">
              سجّل الدخول بـ Google للشراء والتجهيز.
            </p>
          </motion.div>
        )}

        {/* ── Tactical tools section ── */}
        <SectionLabel
          title="الأدوات التكتيكية"
          note="تُشترى مرة واحدة · تُفعّل أثناء المباراة"
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 12,
            marginBottom: 28,
          }}
        >
          {TACTICAL_SHOP_ITEMS.map((item) => {
            const busy = busyId === item.id;
            const owned = progress?.tacticalInventory[item.id] ?? 0;
            const canBuy = !!(google && progress);
            const insufficientCoins = Boolean(canBuy && progress!.coins < item.price);
            return (
              <ShopItemCard
                key={item.id}
                id={item.id}
                name={item.nameAr}
                subtitle={item.subtitleAr}
                price={item.price}
                rarity={tacticalRarity(item.id)}
                ownedCount={owned}
                showOwnedCount
                icon={<TacticalToolIcon id={item.id} size={22} />}
                busy={busy}
                canBuy={canBuy}
                insufficientCoins={insufficientCoins}
                onBuy={
                  insufficientCoins
                    ? showInsufficientCoins
                    : () => void buyTactical(item.id)
                }
              />
            );
          })}
        </div>

        {/* ── Hints section ── */}
        <SectionLabel
          title="التلميحات"
          note="مرة واحدة في المباراة · تساعدك على معرفة كرتك"
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 12,
          }}
        >
          {HINT_SHOP_ITEMS.map((item) => {
            const busy = busyId === item.id;
            const canBuy = !!(google && progress);
            const insufficientCoins = Boolean(canBuy && progress!.coins < item.price);
            return (
              <ShopItemCard
                key={item.id}
                id={item.id}
                name={item.nameAr}
                subtitle={item.subtitleAr}
                price={item.price}
                rarity="common"
                icon={<IconHintBulb size={22} variant="illustrated" />}
                busy={busy}
                canBuy={canBuy}
                insufficientCoins={insufficientCoins}
                onBuy={
                  insufficientCoins
                    ? showInsufficientCoins
                    : () => void buyHint(item.id)
                }
              />
            );
          })}
        </div>
      </div>

      {/* ── Purchase toast (bottom-center fixed) ── */}
      <PurchaseToast toast={toast} />
    </ShellScreen>
  );
}

/* ── Section label ── */
function SectionLabel({ title, note }: { title: string; note?: string }) {
  return (
    <div
      style={{
        marginBottom: 12,
        paddingBottom: 8,
        borderBottom: "1px solid oklch(0.82 0.04 70 / .30)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--display)",
          fontWeight: 800,
          fontSize: 14.5,
          color: "oklch(0.26 0.06 48)",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </div>
      {note && (
        <div
          style={{
            fontSize: 10.5,
            color: "oklch(0.52 0.04 58)",
            marginTop: 2,
            fontFamily: "var(--display)",
          }}
        >
          {note}
        </div>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <AuthGate>
      <ShopInner />
    </AuthGate>
  );
}
