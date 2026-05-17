"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGate } from "@/components/auth/AuthGate";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLiveUserProfile } from "@/hooks/useLiveUserProfile";
import { ShellCoin } from "@/components/shell/ShellCoin";
import { ShellIcon } from "@/components/shell/ShellIcons";
import { ShellScreen } from "@/components/shell/ShellScreen";
import { rarityColor, rarityLabel } from "@/components/shell/shell-rarity";
import { playUIButton, resumeAudioContext } from "@/lib/audio/game-sounds";
import { isFullAccountUser } from "@/lib/auth/google-user";
import {
  FRAME_REGISTRY,
  getFrameDefinition,
  preloadFrameAssets,
  type FrameId,
} from "@/lib/profile/cosmetics";
import { HINT_SHOP_ITEMS } from "@/lib/profile/hints";
import { ownsShopFrame, SHOP_FRAME_PRICE } from "@/lib/profile/progression";
import { TACTICAL_SHOP_ITEMS } from "@/lib/profile/tactical-tools";
import {
  purchaseHintItem,
  purchaseShopFrame,
  purchaseTacticalTool,
  ShopPurchaseError,
  updateUserCosmetics,
} from "@/lib/firestore/users.client";
import { TacticalToolIcon } from "@/components/game/play/TacticalToolIcons";

type ShopTab = "frames" | "hints" | "tactical";

function ShopInner() {
  const router = useRouter();
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const google = isFullAccountUser(user);
  const live = useLiveUserProfile(uid);

  const [tab, setTab] = useState<ShopTab>("frames");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    preloadFrameAssets();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const cosmetic = live?.cosmetic;
  const progress = live?.progress;
  const shopFrames = FRAME_REGISTRY.filter((f) => f.id !== "none");

  const buyTactical = useCallback(
    async (toolId: (typeof TACTICAL_SHOP_ITEMS)[number]["id"]) => {
      if (!uid || !google) return;
      resumeAudioContext();
      playUIButton();
      setBusyId(toolId);
      setToast(null);
      try {
        await purchaseTacticalTool(uid, toolId);
        const item = TACTICAL_SHOP_ITEMS.find((i) => i.id === toolId);
        setToast(item ? `تم شراء ${item.nameAr}!` : "تم الشراء!");
      } catch (e: unknown) {
        setToast(e instanceof ShopPurchaseError ? e.message : e instanceof Error ? e.message : "تعذر الشراء.");
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
        setToast(item ? `تم شراء ${item.nameAr}!` : "تم الشراء!");
      } catch (e: unknown) {
        setToast(e instanceof ShopPurchaseError ? e.message : e instanceof Error ? e.message : "تعذر الشراء.");
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
        setToast("تم شراء الإطار!");
      } catch (e: unknown) {
        setToast(e instanceof ShopPurchaseError ? e.message : e instanceof Error ? e.message : "تعذر الشراء.");
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
        setToast("تم تجهيز الإطار!");
      } catch {
        setToast("تعذر تجهيز الإطار.");
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

  return (
    <ShellScreen activeTab="shop">
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
        <div style={{ width: 40 }}>
          {progress ? <ShellCoin value={progress.coins} /> : null}
        </div>
      </div>

      <div className="f-1 scroll-y" style={{ padding: "0 16px 12px" }}>
        {!google ? (
          <div className="surf mb-3" style={{ padding: 12, textAlign: "center" }}>
            <p className="text-sm fw-7">وضع المعاينة للزائر</p>
            <p className="text-xs muted mt-1">يمكنك مشاهدة الأسعار فقط. سجّل الدخول بـ Google للشراء والتجهيز.</p>
          </div>
        ) : null}

        {toast ? (
          <p className="surf text-center text-sm fw-7 mb-3" style={{ padding: 10 }}>
            {toast}
          </p>
        ) : null}

        <div
          className="row gap-1 mb-4"
          style={{
            padding: 4,
            borderRadius: 14,
            background: "oklch(0.92 0.03 75 / .8)",
            border: "1px solid oklch(0.78 0.05 65 / .4)",
          }}
        >
          {(
            [
              { k: "frames" as const, l: "الإطارات" },
              { k: "hints" as const, l: "التلميحات" },
              { k: "tactical" as const, l: "أدوات" },
            ] as const
          ).map((t) => (
            <button
              key={t.k}
              type="button"
              onClick={() => tapTab(t.k)}
              className="f-1"
              style={{
                padding: "10px 0",
                borderRadius: 10,
                background:
                  tab === t.k
                    ? "linear-gradient(180deg, oklch(0.98 0.02 80), oklch(0.94 0.03 76))"
                    : "transparent",
                color: tab === t.k ? "var(--fg-0)" : "var(--fg-3)",
                fontFamily: "var(--display)",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {t.l}
            </button>
          ))}
        </div>

        {tab === "frames" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {shopFrames.map((f) => {
              const def = getFrameDefinition(f.id);
              const owned = progress ? ownsShopFrame(progress, f.id) : false;
              const equipped = cosmetic?.avatarFrameId === f.id;
              const canBuy = google && progress && !progress.legacyFullCatalog && !owned;
              const busy = busyId === f.id || busyId === `eq:${f.id}`;
              const preview = cosmetic ? { ...cosmetic, avatarFrameId: f.id } : undefined;

              return (
                <article
                  key={f.id}
                  className="surf"
                  style={{
                    padding: 12,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    position: "relative",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      fontSize: 9,
                      fontFamily: "var(--mono)",
                      fontWeight: 700,
                      color: rarityColor(f.rarity),
                    }}
                  >
                    {rarityLabel(f.rarity)}
                  </span>
                  {preview ? (
                    <ProfileAvatar
                      cosmetic={preview}
                      fallbackPhotoURL={user?.photoURL}
                      displayName={user?.displayName ?? undefined}
                      size="lg"
                      idle
                    />
                  ) : null}
                  <div className="text-sm fw-7 text-center">{def.displayNameAr}</div>
                  {owned || progress?.legacyFullCatalog ? (
                    google ? (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm btn-block"
                        disabled={busy || equipped}
                        onClick={() => void equipFrame(f.id)}
                      >
                        {busy ? "…" : equipped ? "مفعّل" : "تجهيز"}
                      </button>
                    ) : (
                      <span className="chip chip-amber" style={{ fontSize: 10 }}>
                        تمتلكه
                      </span>
                    )
                  ) : (
                    <>
                      <ShellCoin value={SHOP_FRAME_PRICE} />
                      <button
                        type="button"
                        className="btn btn-primary btn-sm btn-block"
                        disabled={!canBuy || busy || (progress !== undefined && progress.coins < SHOP_FRAME_PRICE)}
                        onClick={() => void buyFrame(f.id)}
                      >
                        {busy ? "…" : google ? "شراء" : "معاينة"}
                      </button>
                    </>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {tab === "hints" && (
          <div className="col gap-2">
            <p className="text-xs muted px-1">
              اشترِ التلميحات هنا فقط — تُحفظ في حسابك وتُستخدم داخل المباراة بعد التلميحات المجانية.
            </p>
            {HINT_SHOP_ITEMS.map((item) => {
              const busy = busyId === item.id;
              const canBuy = google && progress && progress.coins >= item.price;
              return (
                <div key={item.id} className="surf row gap-3" style={{ padding: 14, alignItems: "center" }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: "linear-gradient(180deg, var(--amber), var(--amber-2))",
                      display: "grid",
                      placeItems: "center",
                      color: "oklch(0.22 0.04 35)",
                      flexShrink: 0,
                    }}
                  >
                    <ShellIcon name={item.kind === "letter" ? "lightbulb" : "search"} size={24} />
                  </div>
                  <div className="f-1" style={{ minWidth: 0 }}>
                    <div className="h-display fw-7 text-md">{item.nameAr}</div>
                    <div className="text-xs muted">{item.subtitleAr}</div>
                    <div className="mt-1">
                      <ShellCoin value={item.price} />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={!canBuy || busy}
                    onClick={() => void buyHint(item.id)}
                  >
                    {busy ? "…" : google ? "شراء" : "—"}
                  </button>
                </div>
              );
            })}
            {progress ? (
              <p className="text-xs muted text-center mt-2">
                محفوظ: {progress.hintLetterCredits} حرف · {progress.hintCountCredits} عدد
              </p>
            ) : null}
          </div>
        )}

        {tab === "tactical" && (
          <div className="col gap-3">
            <div className="surf" style={{ padding: 14 }}>
              <p className="h-display fw-7 text-md">التلميحات والأدوات التكتيكية</p>
              <p className="text-xs muted mt-2 leading-relaxed">
                أدوات لمرة واحدة داخل المباراة — لا مكافآت دائمة. اشترِها هنا، خزّنها في حسابك، وفعّلها في
                اللحظة المناسبة لقلب موازين الجولة.
              </p>
            </div>
            {TACTICAL_SHOP_ITEMS.map((item) => {
              const busy = busyId === item.id;
              const owned = progress?.tacticalInventory[item.id] ?? 0;
              const canBuy = google && progress && progress.coins >= item.price;
              return (
                <article key={item.id} className="surf col gap-2" style={{ padding: 14 }}>
                  <div className="row gap-3" style={{ alignItems: "flex-start" }}>
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 14,
                        background: "linear-gradient(180deg, var(--amber), var(--amber-2))",
                        display: "grid",
                        placeItems: "center",
                        color: "oklch(0.22 0.04 35)",
                        flexShrink: 0,
                      }}
                    >
                      <TacticalToolIcon id={item.id} size={26} />
                    </div>
                    <div className="f-1" style={{ minWidth: 0 }}>
                      <div className="row between gap-2">
                        <span className="h-display fw-7 text-md">{item.nameAr}</span>
                        <span className="chip" style={{ fontSize: 10 }}>
                          ×{owned}
                        </span>
                      </div>
                      <p className="text-xs muted mt-1">{item.subtitleAr}</p>
                      <p className="text-sm mt-2 leading-relaxed">{item.descriptionAr}</p>
                      <p className="text-xs muted mt-2" style={{ fontStyle: "italic" }}>
                        {item.rulesAr}
                      </p>
                      <div className="mt-2">
                        <ShellCoin value={item.price} />
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-block"
                    disabled={!canBuy || busy}
                    onClick={() => void buyTactical(item.id)}
                  >
                    {busy ? "…" : google ? "شراء أداة" : "—"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </ShellScreen>
  );
}

export default function ShopPage() {
  return (
    <AuthGate>
      <ShopInner />
    </AuthGate>
  );
}
