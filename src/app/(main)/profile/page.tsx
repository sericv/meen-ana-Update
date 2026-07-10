"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthGate } from "@/components/auth/AuthGate";
import { useAuth } from "@/components/providers/AuthProvider";
import { useDefaultOnlinePresence } from "@/hooks/useDefaultOnlinePresence";
import { useLiveUserProfile } from "@/hooks/useLiveUserProfile";
import { isFullAccountUser } from "@/lib/auth/google-user";
import { playUIButton, resumeAudioContext } from "@/lib/audio/game-sounds";
import { normalizeCosmetic } from "@/lib/profile/cosmetics";
import { xpProgressInCurrentLevel } from "@/lib/profile/level";
import type { PlayerProgress } from "@/lib/profile/progression";
import { ShellIcon } from "@/components/shell/ShellIcons";
import { ShellScreen } from "@/components/shell/ShellScreen";
import { ProfileIdentityCard } from "@/components/shell/ProfileIdentityCard";
import { ProfilePurchasesPanel } from "@/components/shell/ProfilePurchasesPanel";
import { ProfileSettingsPanel } from "@/components/shell/ProfileSettingsPanel";

type ProfileTab = "purchases" | "settings";

function ProfileScreenInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "settings" ? "settings" : "purchases";

  const { user, logout } = useAuth();
  const uid = user?.uid ?? null;
  const google = isFullAccountUser(user);
  useDefaultOnlinePresence(uid, google);

  const live = useLiveUserProfile(uid);
  const username = live?.username ?? null;

  const [tab, setTab] = useState<ProfileTab>(initialTab);

  const cosmetic = live?.cosmetic ?? normalizeCosmetic(undefined);
  const progress = live?.progress;
  const displayName =
    user?.displayName || (user?.isAnonymous ? "زائر" : (user?.email?.split("@")[0] ?? "لاعب"));

  const levelInfo = xpProgressInCurrentLevel(progress?.lifetimeXp ?? progress?.xp ?? 0);
  const totalMatches = progress?.matchTotal ?? 0;
  const winRate = progress && totalMatches > 0 ? `${progress.winRate}%` : "—";

  const stats = useMemo(
    () => [
      { label: "فوز", value: progress?.matchWins ?? 0, icon: "trophy" },
      { label: "مباريات", value: totalMatches, icon: "swords" },
      { label: "نسبة الفوز", value: winRate, icon: "flame" },
    ],
    [progress?.matchWins, totalMatches, winRate],
  );

  function tapTab(next: ProfileTab) {
    resumeAudioContext();
    playUIButton();
    setTab(next);
  }

  return (
    <ShellScreen>
      <div className="shell-screen relative memphis-grid" style={{ background: "transparent", overflow: "hidden" }}>
        {/* Background floaters */}
        <div className="bg-shape text-3xl memphis-float" style={{ top: "15%", left: "6%", opacity: 0.05 }}>✨</div>
        <div className="bg-shape text-3xl memphis-float-delayed" style={{ top: "50%", right: "6%", opacity: 0.05 }}>👑</div>
        <div className="bg-shape text-2xl memphis-float" style={{ bottom: "20%", left: "12%", opacity: 0.05 }}>🏆</div>

        {/* Double Bezel Floating Header */}
        <div className="mx-4 mt-5 p-1 bg-slate-900/5 ring-1 ring-black/5 rounded-[22px] relative z-10">
          <div className="bg-white/95 rounded-[17px] p-2 flex items-center justify-between shadow-[inset_0_1px_0px_rgba(255,255,255,0.8)]">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center active:scale-95 transition-transform"
                onClick={() => router.push("/")}
                aria-label="رجوع"
                style={{ cursor: "pointer" }}
              >
                <ShellIcon name="back" size={16} color="#64748B" />
              </button>
              <div className="flex flex-col text-right justify-center" style={{ lineHeight: 1.15 }}>
                <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider">بطاقتك الشخصية</span>
                <span className="h-display text-sm font-black text-slate-800">الملف الشخصي</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black bg-purple-50 text-[#7C3AED] px-2.5 py-1 rounded-full border border-purple-100">
                Lv.{levelInfo.level}
              </span>
            </div>
          </div>
        </div>

        {/* Main scrollable body */}
        <div className="f-1 scroll-y" style={{ padding: "16px 16px 100px" }}>
          
          {/* Identity Header */}
          <div className="game-card-outer mb-6">
            <div className="game-card-inner p-5 bg-white border border-slate-100 rounded-[22px] relative overflow-hidden flex flex-col gap-4">
              <ProfileIdentityCard
                cosmetic={cosmetic}
                fallbackPhotoURL={user?.photoURL}
                displayName={displayName}
                username={username}
                levelInfo={levelInfo}
                progress={progress}
                stats={stats}
              />
            </div>
          </div>

          {/* Navigation Tabs Switcher */}
          <div
            className="row gap-1 p-1 mb-5"
            style={{
              borderRadius: 16,
              background: "rgba(124, 58, 237, 0.05)",
              border: "1px solid rgba(124, 58, 237, 0.1)",
            }}
          >
            {(
              [
                { k: "purchases" as const, l: "الهوية والجوائز" },
                { k: "settings" as const, l: "إعدادات الحساب" },
              ] as const
            ).map((t) => (
              <motion.button
                key={t.k}
                type="button"
                onClick={() => tapTab(t.k)}
                whileTap={{ scale: 0.97 }}
                className="f-1 py-2.5 text-xs font-black rounded-xl transition-all"
                style={{
                  background: tab === t.k ? "#7C3AED" : "transparent",
                  color: tab === t.k ? "#FFFFFF" : "#64748B",
                  cursor: "pointer",
                }}
              >
                {t.l}
              </motion.button>
            ))}
          </div>

          {/* Tab content panel */}
          <div className="mt-3">
            {tab === "purchases" && uid && (
              <div className="flex flex-col gap-6">
                
                {/* Customization/Showcase Section */}
                <div>
                  <SectionLabel title="إطارات الملف الشخصي" note="اختر إطاراً مميزاً لتزيين صورتك الرمزية" />
                  <ProfilePurchasesPanel
                    uid={uid}
                    google={google}
                    cosmetic={cosmetic}
                    progress={progress}
                    fallbackPhotoURL={user?.photoURL}
                    displayName={displayName}
                  />
                </div>

                {/* Achievements List */}
                <div>
                  <SectionLabel title="إنجازات اللعبة" note="أكمل المهام لفتح المزيد من الألقاب والجوائز" />
                  <div className="grid grid-cols-2 gap-4">
                    {/* Achievement 1 */}
                    <div className="game-card-outer">
                      <div className="game-card-inner p-3.5 bg-white border border-slate-100 rounded-xl flex flex-col gap-1.5 text-right">
                        <span className="text-lg">🏆</span>
                        <h4 className="h-display text-xs font-black text-slate-800">صياد الانتصارات</h4>
                        <p className="text-[9px] text-slate-400 font-bold leading-tight">فز بمباراة واحدة على الأقل</p>
                        <div className="w-full bg-slate-50 border border-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div 
                            className="bg-[#FFE600] h-full rounded-full" 
                            style={{ width: (progress?.matchWins ?? 0) >= 1 ? "100%" : "0%" }} 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Achievement 2 */}
                    <div className="game-card-outer">
                      <div className="game-card-inner p-3.5 bg-white border border-slate-100 rounded-xl flex flex-col gap-1.5 text-right">
                        <span className="text-lg">🔥</span>
                        <h4 className="h-display text-xs font-black text-slate-800">المخمن الذهبي</h4>
                        <p className="text-[9px] text-slate-400 font-bold leading-tight">اجمع ما يصل إلى 500 XP</p>
                        <div className="w-full bg-slate-50 border border-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div 
                            className="bg-[#FFE600] h-full rounded-full" 
                            style={{ width: `${Math.min(100, ((progress?.xp ?? 0) / 500) * 100)}%` }} 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Achievement 3 */}
                    <div className="game-card-outer">
                      <div className="game-card-inner p-3.5 bg-white border border-slate-100 rounded-xl flex flex-col gap-1.5 text-right">
                        <span className="text-lg">👑</span>
                        <h4 className="h-display text-xs font-black text-slate-800">النجم الصاعد</h4>
                        <p className="text-[9px] text-slate-400 font-bold leading-tight">العب 10 مباريات كاملة</p>
                        <div className="w-full bg-slate-50 border border-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div 
                            className="bg-[#FFE600] h-full rounded-full" 
                            style={{ width: `${Math.min(100, ((progress?.matchTotal ?? 0) / 10) * 100)}%` }} 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Achievement 4 */}
                    <div className="game-card-outer">
                      <div className="game-card-inner p-3.5 bg-white border border-slate-100 rounded-xl flex flex-col gap-1.5 text-right">
                        <span className="text-lg">✨</span>
                        <h4 className="h-display text-xs font-black text-slate-800">المظهر الأسطوري</h4>
                        <p className="text-[9px] text-slate-400 font-bold leading-tight">احصل على إطار مخصص</p>
                        <div className="w-full bg-slate-50 border border-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div 
                            className="bg-[#FFE600] h-full rounded-full" 
                            style={{ width: (cosmetic.avatarFrameId && cosmetic.avatarFrameId !== "none") ? "100%" : "0%" }} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {tab === "settings" && uid && user && (
              <div className="flex flex-col gap-6">
                <div>
                  <SectionLabel title="تعديل الحساب" note="غيّر صورتك الرمزية أو اسمك العام" />
                  <ProfileSettingsPanel
                    uid={uid}
                    google={google}
                    user={{
                      displayName: user.displayName,
                      photoURL: user.photoURL,
                      isAnonymous: user.isAnonymous,
                      email: user.email,
                    }}
                    live={live}
                  />
                </div>

                {/* Settings shortcuts */}
                <div>
                  <SectionLabel title="روابط واختصارات" note="روابط شروط الخدمة وتسجيل الخروج" />
                  <div className="flex flex-col gap-3">
                    
                    <Link href="/privacy" className="game-card-outer text-right block" style={{ textDecoration: "none" }}>
                      <div className="game-card-inner p-3.5 bg-white border border-slate-100 rounded-xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base">🔒</span>
                          <div className="flex flex-col" style={{ lineHeight: 1.15 }}>
                            <span className="text-xs font-black text-slate-800">سياسة الخصوصية</span>
                            <span className="text-[9px] text-slate-400 font-bold">كيف نقوم بحماية بياناتك الشخصية</span>
                          </div>
                        </div>
                        <span className="text-slate-300 font-black text-xs select-none">←</span>
                      </div>
                    </Link>

                    <Link href="/terms" className="game-card-outer text-right block" style={{ textDecoration: "none" }}>
                      <div className="game-card-inner p-3.5 bg-white border border-slate-100 rounded-xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base">📝</span>
                          <div className="flex flex-col" style={{ lineHeight: 1.15 }}>
                            <span className="text-xs font-black text-slate-800">شروط الاستخدام</span>
                            <span className="text-[9px] text-slate-400 font-bold">شروط وأحكام استخدام اللعبة</span>
                          </div>
                        </div>
                        <span className="text-slate-300 font-black text-xs select-none">←</span>
                      </div>
                    </Link>

                    <button 
                      type="button" 
                      onClick={() => {
                        resumeAudioContext();
                        playUIButton();
                        void logout().then(() => router.replace("/"));
                      }}
                      className="game-card-outer text-right block w-full"
                    >
                      <div className="game-card-inner p-3.5 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base">🚪</span>
                          <div className="flex flex-col text-right" style={{ lineHeight: 1.15 }}>
                            <span className="text-xs font-black text-rose-700">تسجيل الخروج</span>
                            <span className="text-[9px] text-rose-400 font-bold">تسجيل الخروج من الحساب الحالي</span>
                          </div>
                        </div>
                        <span className="text-rose-300 font-black text-xs select-none">←</span>
                      </div>
                    </button>

                  </div>
                </div>

              </div>
            )}
          </div>

        </div>
      </div>
    </ShellScreen>
  );
}

/* ── Section label ── */
function SectionLabel({ title, note }: { title: string; note?: string }) {
  return (
    <div className="mb-4 pb-2 border-b border-purple-100 flex flex-col gap-1 pr-1 text-right">
      <div className="h-display text-sm font-black text-slate-800 flex items-center gap-1.5">
        <span className="w-1.5 h-3.5 rounded-full bg-gradient-to-b from-[#FFE600] to-[#EAB308] inline-block" />
        {title}
      </div>
      {note && (
        <div className="text-[10px] text-slate-400 font-bold leading-tight">
          {note}
        </div>
      )}
    </div>
  );
}

export default function ProfileHubPage() {
  return (
    <AuthGate>
      <Suspense fallback={<div className="shell-screen screen-enter" style={{ padding: 24 }}>…</div>}>
        <ProfileScreenInner />
      </Suspense>
    </AuthGate>
  );
}
