"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AuthGate } from "@/components/auth/AuthGate";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLiveUserProfile } from "@/hooks/useLiveUserProfile";
import { ShellCoin } from "@/components/shell/ShellCoin";
import { ShellIcon } from "@/components/shell/ShellIcons";
import { ShellScreen } from "@/components/shell/ShellScreen";
import { playUIButton, resumeAudioContext } from "@/lib/audio/game-sounds";
import { isFullAccountUser } from "@/lib/auth/google-user";
import {
  FRAME_REGISTRY,
  preloadFrameAssets,
  type FrameId,
} from "@/lib/profile/cosmetics";
import { HINT_SHOP_ITEMS } from "@/lib/profile/hints";
import { ownsShopFrame, SHOP_FRAME_IDS, SHOP_FRAME_PRICE } from "@/lib/profile/progression";
import { TACTICAL_SHOP_ITEMS } from "@/lib/profile/tactical-tools";
import {
  purchaseHintItem,
  purchaseShopFrame,
  purchaseTacticalTool,
  ShopPurchaseError,
  updateUserCosmetics,
} from "@/lib/firestore/users.client";
import { TacticalToolIcon } from "@/components/game/play/TacticalToolIcons";
import { IconHintBulb } from "@/components/game/play/icons";
import { ShopItemCard } from "@/components/shop/ShopItemCard";
import { ShopFrameCard } from "@/components/shop/ShopFrameCard";

import type { TacticalToolId } from "@/lib/profile/tactical-tools";

type ShopTab = "frames" | "items";

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

  const [tab, setTab] = useState<ShopTab>("frames");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    preloadFrameAssets();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const cosmetic = live?.cosmetic;
  const progress = live?.progress;
  const allFramesOwned = progress
    ? progress.legacyFullCatalog || SHOP_FRAME_IDS.every((id) => ownsShopFrame(progress, id))
    : false;
  const shopFrames = allFramesOwned ? [] : FRAME_REGISTRY.filter((f) => f.id !== "none");

  useEffect(() => {
    if (allFramesOwned && tab === "frames") setTab("items");
  }, [allFramesOwned, tab]);

  const buyTactical = useCallback(
    async (toolId: TacticalToolId) => {
      if (!uid || !google) return;
      resumeAudioContext();
      playUIButton();
      setBusyId(toolId);
      setToast(null);
      try {
        await purchaseTacticalTool(uid, toolId);
        const item = TACTICAL_SHOP_ITEMS.find((i) => i.id === toolId);
        setToast({ msg: item ? `تم شراء ${item.nameAr}!` : "تم الشراء!", ok: true });
      } catch (e: unknown) {
        setToast({
          msg: e instanceof ShopPurchaseError ? e.message : e instanceof Error ? e.message : "تعذر الشراء.",
          ok: false,
        });
      } finally {
        setBusyId(null);
      }
    },
    [uid, google],
  );

  const buyHint = useCallback(
    async (itemId: string) => {
      if (!uid || !google) return;
      resumeAudioContext();
      playUIButton();
      setBusyId(itemId);
      setToast(null);
      try {
        await purchaseHintItem(uid, itemId);
        const item = HINT_SHOP_ITEMS.find((i) => i.id === itemId);
        setToast({ msg: item ? `تم شراء ${item.nameAr}!` : "تم الشراء!", ok: true });
      } catch (e: unknown) {
        setToast({
          msg: e instanceof ShopPurchaseError ? e.message : e instanceof Error ? e.message : "تعذر الشراء.",
          ok: false,
        });
      } finally {
        setBusyId(null);
      }
    },
    [uid, google],
  );

  const buyFrame = useCallback(
    async (frameId: string) => {
      if (!uid || !google) return;
      resumeAudioContext();
      playUIButton();
      setBusyId(frameId);
      setToast(null);
      try {
        await purchaseShopFrame(uid, frameId);
        setToast({ msg: "تم شراء الإطار!", ok: true });
      } catch (e: unknown) {
        setToast({
          msg: e instanceof ShopPurchaseError ? e.message : e instanceof Error ? e.message : "تعذر الشراء.",
          ok: false,
        });
      } finally {
        setBusyId(null);
      }
    },
    [uid, google],
  );

  const equipFrame = useCallback(
    async (frameId: FrameId) => {
      if (!uid || !google) return;
      resumeAudioContext();
      playUIButton();
      setBusyId(`eq:${frameId}`);
      setToast(null);
      try {
        await updateUserCosmetics(uid, { avatarFrameId: frameId });
        setToast({ msg: "تم تجهيز الإطار!", ok: true });
      } catch {
        setToast({ msg: "تعذر تجهيز الإطار.", ok: false });
      } finally {
        setBusyId(null);
      }
    },
    [uid, google],
  );

  function tapTab(next: ShopTab) {
    resumeAudioContext();
    playUIButton();
    setTab(next);
  }

  function showInsufficientCoins() {
    resumeAudioContext();
    playUIButton();
    setToast({ msg: "ليس لديك عملات كافية.", ok: false });
  }

  const tabs = [
    ...(allFramesOwned ? [] : [{ k: "frames" as const, l: "الإطارات" }]),
    { k: "items" as const, l: "الأدوات والتلميحات" },
  ] as const;

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

        {/* ── Toast ── */}
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.msg}
              initial={{ opacity: 0, y: -10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              style={{
                marginBottom: 12,
                padding: "10px 14px",
                borderRadius: 14,
                background: toast.ok
                  ? "linear-gradient(135deg, oklch(0.88 0.12 140 / .9), oklch(0.82 0.14 145 / .95))"
                  : "linear-gradient(135deg, oklch(0.92 0.08 22 / .9), oklch(0.86 0.10 18 / .95))",
                border: `1.5px solid ${toast.ok ? "oklch(0.72 0.14 142 / .5)" : "oklch(0.65 0.16 22 / .5)"}`,
                color: toast.ok ? "oklch(0.28 0.10 140)" : "oklch(0.30 0.14 22)",
                fontFamily: "var(--display)",
                fontWeight: 700,
                fontSize: 13,
                textAlign: "center",
                boxShadow: `0 4px 16px ${toast.ok ? "oklch(0.65 0.14 140 / .2)" : "oklch(0.55 0.16 22 / .2)"}`,
              }}
            >
              {toast.msg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Tab selector ── */}
        {tabs.length > 1 && (
          <div
            style={{
              display: "flex",
              gap: 4,
              padding: 4,
              borderRadius: 14,
              background: "oklch(0.91 0.03 72 / .85)",
              border: "1px solid oklch(0.80 0.04 68 / .4)",
              marginBottom: 18,
            }}
          >
            {tabs.map((t) => (
              <motion.button
                key={t.k}
                type="button"
                onClick={() => tapTab(t.k)}
                className="f-1"
                animate={{
                  background:
                    tab === t.k
                      ? "linear-gradient(180deg, oklch(0.99 0.02 80), oklch(0.93 0.04 74))"
                      : "transparent",
                  boxShadow:
                    tab === t.k
                      ? "0 2px 8px oklch(0.70 0.06 68 / .18)"
                      : "none",
                }}
                transition={{ duration: 0.18 }}
                style={{
                  padding: "10px 0",
                  borderRadius: 10,
                  color: tab === t.k ? "var(--fg-0)" : "var(--fg-3)",
                  fontFamily: "var(--display)",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {t.l}
              </motion.button>
            ))}
          </div>
        )}

        {/* ── Tab content ── */}
        <AnimatePresence mode="wait">

          {/* Frames tab */}
          {tab === "frames" && (
            <motion.div
              key="frames"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 12,
                }}
              >
                {shopFrames.map((f) => {
                  const owned = progress ? ownsShopFrame(progress, f.id) : false;
                  const equipped = cosmetic?.avatarFrameId === f.id;
                  const canBuy = google && progress && !progress.legacyFullCatalog && !owned;
                  const insufficientCoins = Boolean(canBuy && progress!.coins < SHOP_FRAME_PRICE);
                  const busy = busyId === f.id || busyId === `eq:${f.id}`;
                  const preview = cosmetic ? { ...cosmetic, avatarFrameId: f.id } : undefined;
                  const rarity = (f as { rarity?: import("@/lib/profile/cosmetics").FrameRarity }).rarity ?? "common";

                  return (
                    <ShopFrameCard
                      key={f.id}
                      frameId={f.id}
                      displayNameAr={f.displayNameAr}
                      rarity={rarity}
                      previewCosmetic={preview}
                      fallbackPhotoURL={user?.photoURL}
                      displayName={user?.displayName ?? undefined}
                      price={SHOP_FRAME_PRICE}
                      owned={owned || progress?.legacyFullCatalog}
                      equipped={equipped}
                      busy={busy}
                      canBuy={canBuy ?? false}
                      insufficientCoins={insufficientCoins}
                      onBuy={
                        insufficientCoins
                          ? showInsufficientCoins
                          : () => void buyFrame(f.id)
                      }
                      onEquip={google ? () => void equipFrame(f.id as FrameId) : undefined}
                    />
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Items tab */}
          {tab === "items" && (
            <motion.div
              key="items"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              style={{ display: "flex", flexDirection: "column", gap: 0 }}
            >
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
                  marginBottom: 24,
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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
