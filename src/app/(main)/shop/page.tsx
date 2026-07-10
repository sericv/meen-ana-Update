"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGate } from "@/components/auth/AuthGate";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLiveUserProfile } from "@/hooks/useLiveUserProfile";
import { ShellCoin } from "@/components/shell/ShellCoin";
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
import { ShopItemCard, type Rarity } from "@/components/shop/ShopItemCard";
import { PurchaseToast } from "@/components/shop/PurchaseToast";
import { XpExchangeCard } from "@/components/shop/XpExchangeCard";

import type { TacticalToolId } from "@/lib/profile/tactical-tools";

type CategoryId = "all" | "tactical" | "hints" | "frames" | "coins" | "xp";

function tacticalRarity(id: TacticalToolId): Rarity {
  switch (id) {
    case "extra_time":     return "rare";
    case "time_pressure":  return "epic";
    case "extra_question": return "rare";
    case "shield":         return "legendary";
    default:               return "common";
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
  const [activeCategory, setActiveCategory] = useState<CategoryId>("all");

  const progress = live?.progress;
  const coins = progress?.coins ?? 0;

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
    [uid, google],
  );

  function showInsufficientCoins() {
    resumeAudioContext();
    playUIButton();
    showToast("ليس لديك عملات كافية", false);
  }

  // Pre-compiled Featured Carousel items
  type FeaturedItem = {
    id: string;
    name: string;
    desc: string;
    price: number;
    rarity: Rarity;
    icon: React.ReactNode;
  } & (
    | { isTactical: true; toolId: TacticalToolId }
    | { isTactical: false; hintId: string }
  );

  const featuredItems: FeaturedItem[] = [
    {
      id: "shield",
      name: "درع الحماية التكتيكي",
      desc: "يحميك من أدوات الخصم لمدة دور كامل.",
      price: 7,
      rarity: "legendary",
      icon: <TacticalToolIcon id="shield" size={24} />,
      isTactical: true,
      toolId: "shield",
    },
    {
      id: "hint_letter",
      name: "تلميح الحرف الذكي",
      desc: "يكشف لك حرفاً عشوائياً من كرتك السري.",
      price: 3,
      rarity: "rare",
      icon: <IconHintBulb size={24} variant="illustrated" />,
      isTactical: false,
      hintId: "hint_letter",
    },
    {
      id: "time_pressure",
      name: "ضغط الوقت التكتيكي",
      desc: "يقلص وقت تفكير خصمك في دوره التالي.",
      price: 7,
      rarity: "epic",
      icon: <TacticalToolIcon id="time_pressure" size={24} />,
      isTactical: true,
      toolId: "time_pressure",
    },
  ];

  return (
    <div className="shell-screen relative bg-[#FAFAF8] overflow-hidden" dir="rtl">
      
      {/* Background low-opacity magic particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        <div className="absolute top-[10%] left-[8%] text-amber-500/5 text-xl animate-pulse">✦</div>
        <div className="absolute top-[45%] right-[8%] text-purple-500/5 text-xl animate-pulse">✦</div>
        <div className="absolute bottom-[20%] left-[15%] text-rose-500/5 text-xl animate-pulse">✦</div>
      </div>

      {/* Store Header */}
      <div className="mx-4 mt-5 p-1 bg-slate-900/5 ring-1 ring-black/5 rounded-[22px] relative z-10">
        <div className="bg-white/95 rounded-[17px] p-2 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/50 flex items-center justify-center active:scale-95 transition-transform"
              onClick={() => router.push("/")}
              aria-label="رجوع"
              style={{ cursor: "pointer" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <div className="flex flex-col text-right justify-center" style={{ lineHeight: 1.15 }}>
              <span className="h-display text-sm font-black text-slate-800">المتجر السحري</span>
              <span className="text-[8px] text-slate-400 font-bold mt-0.5">افتح الأدوات المساعدة والميزات الفريدة</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {progress && (
              <div className="bg-amber-50 border border-amber-200/40 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                <ShellCoin value={coins} compact />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main scrollable body */}
      <div className="f-1 scroll-y" style={{ padding: "14px 16px 85px" }}>
        
        {/* Guest notice */}
        {!google && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="game-card-outer mb-4 text-center"
          >
            <div className="game-card-inner p-3 bg-amber-50/50 border border-amber-200 rounded-[20px]">
              <p className="text-[10px] font-black text-amber-800">وضع المعاينة للزائر 👁️</p>
              <p className="text-[8px] text-amber-600 font-bold mt-0.5">سجّل الدخول بـ Google لتتمكن من الشراء وحفظ قدراتك.</p>
            </div>
          </motion.div>
        )}

        {/* Featured Items horizontal Carousel */}
        {activeCategory === "all" && (
          <div className="mb-5 flex flex-col gap-2">
            <h3 className="h-display text-[10px] font-black text-slate-500 px-1">عروض تكتيكية مميزة 🔥</h3>
            
            <div 
              className="flex gap-4 overflow-x-auto pb-3 pr-0.5 scroll-x select-none" 
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {featuredItems.map((item) => {
                const busy = busyId === item.id;
                const canBuy = !!(google && progress);
                const insufficientCoins = Boolean(canBuy && progress!.coins < item.price);
                const ownedCount = item.isTactical
                  ? (progress?.tacticalInventory[item.toolId] ?? 0)
                  : (progress?.hintLetterCredits ?? 0);

                return (
                  <div key={item.id} className="w-[200px] flex-shrink-0">
                    <ShopItemCard
                      id={item.id}
                      name={item.name}
                      subtitle={item.desc}
                      price={item.price}
                      rarity={item.rarity}
                      ownedCount={ownedCount}
                      showOwnedCount
                      icon={item.icon}
                      busy={busy}
                      canBuy={canBuy}
                      insufficientCoins={insufficientCoins}
                      onBuy={
                        insufficientCoins
                          ? showInsufficientCoins
                          : item.isTactical
                            ? () => void buyTactical(item.toolId)
                            : () => void buyHint(item.id)
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Category Switcher capsules */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 select-none" style={{ scrollbarWidth: "none" }}>
          {(["all", "tactical", "hints", "frames", "coins", "xp"] as CategoryId[]).map((catId) => {
            const isActive = activeCategory === catId;
            const labels: Record<CategoryId, string> = {
              all: "الكل",
              tactical: "الأدوات",
              hints: "التلميحات",
              frames: "الإطارات",
              coins: "العملات",
              xp: "استبدال الخبرة",
            };
            return (
              <button
                key={catId}
                type="button"
                onClick={() => {
                  resumeAudioContext();
                  playUIButton();
                  setActiveCategory(catId);
                }}
                className={`px-4 py-2 text-[10px] font-black rounded-full border transition-all active:scale-95 flex-shrink-0 ${
                  isActive
                    ? "bg-gradient-to-r from-purple-600 to-purple-400 border-purple-800 text-white shadow-sm"
                    : "bg-white text-slate-500 border-slate-200/50 hover:bg-slate-50 shadow-sm"
                }`}
                style={{ cursor: "pointer" }}
              >
                {labels[catId]}
              </button>
            );
          })}
        </div>

        {/* Products Grid */}
        <div className="flex flex-col gap-5">
          
          {/* Tactical Section */}
          {(activeCategory === "all" || activeCategory === "tactical") && (
            <div>
              <SectionLabel title="أدوات تكتيكية مساعدة" desc="تُشترى مرة واحدة · تُفعّل لتغيير مجرى اللعبة أثناء التخمين" />
              <div className="grid grid-cols-2 gap-4">
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
            </div>
          )}

          {/* Hints Section */}
          {(activeCategory === "all" || activeCategory === "hints") && (
            <div>
              <SectionLabel title="تلميحات مساعدة" desc="تساعدك على معرفة الكرت الموضوع على رأسك" />
              <div className="grid grid-cols-2 gap-4">
                {HINT_SHOP_ITEMS.map((item) => {
                  const busy = busyId === item.id;
                  const canBuy = !!(google && progress);
                  const insufficientCoins = Boolean(canBuy && progress!.coins < item.price);
                  const ownedHints =
                    item.kind === "letter"
                      ? (progress?.hintLetterCredits ?? 0)
                      : (progress?.hintCountCredits ?? 0);
                  return (
                    <ShopItemCard
                      key={item.id}
                      id={item.id}
                      name={item.nameAr}
                      subtitle={item.subtitleAr}
                      price={item.price}
                      rarity="common"
                      ownedCount={ownedHints}
                      showOwnedCount
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
          )}

          {/* Teaser Avatar Frames Section */}
          {activeCategory === "frames" && (
            <div>
              <SectionLabel title="إطارات الصورة الرمزية" desc="تزيين وتخصيص صورتك الشخصية بإطارات نادرة" />
              <div className="grid grid-cols-2 gap-4">
                <ShopItemCard
                  id="frame_crown"
                  name="إطار التاج الذهبي"
                  subtitle="إطار ملكي مذهب لأصحاب الانتصارات المتتالية."
                  price={500}
                  rarity="legendary"
                  teaser
                  icon={
                    <div className="w-10 h-10 rounded-full border-4 border-amber-400 bg-amber-50 flex items-center justify-center text-xs">
                      👑
                    </div>
                  }
                />
                <ShopItemCard
                  id="frame_neon"
                  name="إطار النيون المشع"
                  subtitle="إطار بنفسجي مشع يبرز اسمك في ساحة الانتظار."
                  price={350}
                  rarity="epic"
                  teaser
                  icon={
                    <div className="w-10 h-10 rounded-full border-4 border-purple-500 bg-purple-50 flex items-center justify-center text-xs">
                      ✨
                    </div>
                  }
                />
              </div>
            </div>
          )}

          {/* Teaser Buy Coins Section */}
          {activeCategory === "coins" && (
            <div>
              <SectionLabel title="حزم العملات الذهبية" desc="احصل على كميات إضافية من الذهب لفتح أدوات أكثر" />
              <div className="grid grid-cols-2 gap-4">
                <ShopItemCard
                  id="coins_small"
                  name="سرة العملات الذهبية"
                  subtitle="تحتوي على 500 عملة ذهبية لشراء أدوات سريعة."
                  price={99}
                  rarity="rare"
                  teaser
                  icon={<span className="text-xl">💰</span>}
                />
                <ShopItemCard
                  id="coins_large"
                  name="حقيبة الذهب الضخمة"
                  subtitle="كيس مليء بـ 2500 عملة ذهبية تمنحك سيطرة كاملة."
                  price={299}
                  rarity="mythic"
                  teaser
                  icon={<span className="text-xl">👑</span>}
                />
              </div>
            </div>
          )}

          {/* XP Exchange Section */}
          {(activeCategory === "all" || activeCategory === "xp") && (
            <div>
              <SectionLabel title="استبدال الخبرة بالذهب" desc="حوّل نقاط خبرتك المتراكمة إلى عملات ذهبية" />
              <XpExchangeCard
                uid={uid}
                xp={progress?.xp ?? 0}
                coins={progress?.coins ?? 0}
                google={google}
              />
            </div>
          )}

        </div>
      </div>

      {/* Toast alert */}
      <PurchaseToast toast={toast} />
    </div>
  );
}

/* ── Section Label ── */
function SectionLabel({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-4 pb-2 border-b border-purple-100 flex flex-col gap-1 pr-1 text-right">
      <div className="h-display text-[11px] font-black text-slate-800 flex items-center gap-1.5">
        <span className="w-1 h-3 rounded-full bg-gradient-to-b from-amber-400 to-amber-600 inline-block" />
        {title}
      </div>
      {desc && (
        <div className="text-[9px] text-slate-400 font-bold leading-tight">
          {desc}
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
