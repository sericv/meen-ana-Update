"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { GameAppBottomNav } from "@/components/nav/GameAppBottomNav";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLiveUserProfile } from "@/hooks/useLiveUserProfile";
import { playUIButton, resumeAudioContext } from "@/lib/audio/game-sounds";
import {
  FRAME_REGISTRY,
  frameCardSurfaceClass,
  getFrameDefinition,
  preloadFrameAssets,
} from "@/lib/profile/cosmetics";
import { ownsShopFrame, SHOP_FRAME_PRICE } from "@/lib/profile/progression";
import {
  purchaseShopFrame,
  ShopPurchaseError,
  updateUserCosmetics,
} from "@/lib/firestore/users.client";

function ShopInner() {
  const router = useRouter();
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const live = useLiveUserProfile(uid);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [buyCoinsBanner, setBuyCoinsBanner] = useState(false);

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

  const buyFrame = useCallback(
    async (frameId: string) => {
      if (!uid) return;
      resumeAudioContext();
      playUIButton();
      setBusyId(frameId);
      setToast(null);
      try {
        await purchaseShopFrame(uid, frameId);
        setToast("تم شراء الإطار بنجاح!");
      } catch (e: unknown) {
        if (e instanceof ShopPurchaseError) {
          setToast(e.message);
        } else {
          setToast(e instanceof Error ? e.message : "تعذر الشراء.");
        }
      } finally {
        setBusyId(null);
      }
    },
    [uid],
  );

  const equipFrame = useCallback(
    async (frameId: string) => {
      if (!uid) return;
      resumeAudioContext();
      playUIButton();
      setBusyId(frameId);
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
    [uid],
  );

  const shopFrames = FRAME_REGISTRY.filter((f) => f.id !== "none");

  return (
    <div
      dir="rtl"
      className="relative min-h-[100dvh] w-full overflow-x-hidden select-none pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]"
      style={{
        background:
          "radial-gradient(120% 65% at 50% -5%, #fff5e8 0%, #fce8d2 45%, #ffefdb 100%)",
      }}
    >
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -right-20 top-10 h-64 w-64 rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle,rgba(255,190,120,0.45),transparent 68%)" }}
        />
        <div
          className="absolute -left-16 bottom-1/4 h-56 w-56 rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle,rgba(255,140,90,0.35),transparent 70%)" }}
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md px-4 sm:max-w-lg sm:px-6">
        <header className="mb-5 flex items-center justify-between gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.93 }}
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 rounded-2xl bg-white/92 px-3.5 py-2.5 text-sm font-extrabold text-[#8a3f16] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_14px_rgba(196,134,82,0.18)] ring-1 ring-[#f4d4b0]/60"
          >
            <svg viewBox="0 0 10 16" fill="none" className="h-3.5 w-3.5 shrink-0" aria-hidden>
              <path
                d="M8 2L2 8l6 6"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            رجوع
          </motion.button>
          <h1
            className="text-lg font-black sm:text-xl"
            style={{
              background: "linear-gradient(180deg,#FF9F0A 0%,#E0660A 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 2px 6px rgba(224,102,10,0.28))",
            }}
          >
            المتجر
          </h1>
          <span className="w-14" />
        </header>

        {/* Balance + buy coins */}
        <section className="mb-6 overflow-hidden rounded-[1.75rem] border border-white/80 bg-gradient-to-b from-white/95 to-[#fff7ea]/95 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_14px_36px_rgba(196,134,82,0.18)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold text-[#a16231]">رصيدك</p>
              <p className="mt-1 flex items-center gap-2 text-2xl font-black tabular-nums text-[#8a3f16]">
                <span
                  className="grid h-9 w-9 place-items-center rounded-xl text-lg"
                  style={{
                    background: "linear-gradient(180deg,#FFE8A8 0%,#F2C14E 100%)",
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.65),0 4px 10px rgba(200,130,20,0.25)",
                  }}
                  aria-hidden
                >
                  🪙
                </span>
                {progress ? progress.coins : "…"}
              </p>
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                resumeAudioContext();
                playUIButton();
                setBuyCoinsBanner(true);
              }}
              className="rounded-2xl px-5 py-3 text-sm font-extrabold text-white"
              style={{
                background: "linear-gradient(180deg,#B05CFF 0%,#7A3CFF 100%)",
                boxShadow:
                  "inset 0 1.5px 0 rgba(255,255,255,0.38),0 6px 0 #5B22D6,0 12px 24px rgba(122,60,255,0.28)",
              }}
            >
              شراء عملات
            </motion.button>
          </div>
          <p className="mt-3 text-[11px] font-semibold leading-relaxed text-[#bc7a45]">
            كل إطار — {SHOP_FRAME_PRICE} عملات. الفوز في كل مباراة يمنحك +1 عملة.
          </p>
        </section>

        <AnimatePresence>
          {buyCoinsBanner ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mb-5 rounded-2xl border border-[#e9d5ff] bg-gradient-to-br from-[#faf5ff] to-[#f3e8ff] px-4 py-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_22px_rgba(139,92,246,0.12)]"
            >
              <p className="text-sm font-extrabold text-[#5b21b6]">شراء العملات قادم قريبًا</p>
              <p className="mt-1 text-xs font-semibold text-[#7c3aed]/90">
                نجهّز لك طرق دفع آمنة ومريحة — ترقب التحديث.
              </p>
              <button
                type="button"
                onClick={() => setBuyCoinsBanner(false)}
                className="mt-3 text-xs font-bold text-[#6d28d9] underline-offset-2 hover:underline"
              >
                حسناً
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {toast ? (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 rounded-2xl border border-[#f4d4b0]/80 bg-[#fffaf3] px-4 py-2.5 text-center text-sm font-bold text-[#8a3f16]"
            >
              {toast}
            </motion.p>
          ) : null}
        </AnimatePresence>

        <h2 className="mb-3 px-1 text-sm font-black text-[#8a3f16]">إطارات المجموعة</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
          {shopFrames.map((f) => {
            const def = getFrameDefinition(f.id);
            const owned = progress ? ownsShopFrame(progress, f.id) : false;
            const equipped = cosmetic?.avatarFrameId === f.id;
            const canBuy = progress && !progress.legacyFullCatalog && !owned;
            const busy = busyId === f.id;

            const previewCosmetic = cosmetic
              ? { ...cosmetic, avatarFrameId: f.id }
              : undefined;

            return (
              <article
                key={f.id}
                className={`flex flex-col overflow-hidden rounded-[1.25rem] ring-2 ring-[#f0d5b0]/75 shadow-[0_10px_28px_rgba(196,134,82,0.14)] ${frameCardSurfaceClass(f.rarity)}`}
              >
                <div className="relative flex min-h-[7.5rem] items-center justify-center border-b border-[#f4e0c8]/80 bg-gradient-to-b from-white/50 to-transparent px-2 pt-3 pb-2">
                  {previewCosmetic ? (
                    <ProfileAvatar
                      cosmetic={previewCosmetic}
                      fallbackPhotoURL={user?.photoURL}
                      displayName={user?.displayName ?? undefined}
                      size="lg"
                      idle
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center text-sm font-bold text-[#bc7a45]">
                      …
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <h3 className="line-clamp-2 min-h-[2.5rem] text-center text-[12.5px] font-extrabold leading-snug text-[#5e3011]">
                    {def.displayNameAr}
                  </h3>
                  <p className="text-center text-sm font-black tabular-nums text-[#c2530c]">
                    {owned || progress?.legacyFullCatalog ? "تمتلكه" : `${SHOP_FRAME_PRICE} 🪙`}
                  </p>
                  <div className="mt-auto flex flex-col gap-2">
                    {owned ? (
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        disabled={busy || equipped}
                        onClick={() => void equipFrame(f.id)}
                        className="w-full rounded-xl py-2.5 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-55"
                        style={{
                          background: equipped
                            ? "linear-gradient(180deg,#94a3b8 0%,#64748b 100%)"
                            : "linear-gradient(180deg,#FF9F0A 0%,#FF6B00 100%)",
                          boxShadow: equipped
                            ? "none"
                            : "inset 0 1.5px 0 rgba(255,255,255,0.42),0 5px 0 #be5200",
                        }}
                      >
                        {busy ? "…" : equipped ? "مجهّز الآن" : "تجهيز"}
                      </motion.button>
                    ) : canBuy ? (
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        disabled={busy || (progress !== undefined && progress.coins < SHOP_FRAME_PRICE)}
                        onClick={() => void buyFrame(f.id)}
                        className="w-full rounded-xl bg-gradient-to-b from-[#4EA3FF] to-[#2D7CFF] py-2.5 text-sm font-extrabold text-white shadow-[inset_0_1.5px_0_rgba(255,255,255,0.4),0_5px_0_#1B5EC6] disabled:opacity-50"
                      >
                        {busy ? "…" : "شراء"}
                      </motion.button>
                    ) : (
                      <p className="py-2 text-center text-[11px] font-bold text-[#a16231]">
                        ادّخر العملات للشراء
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
      <GameAppBottomNav />
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
