"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { AuthGate } from "@/components/auth/AuthGate";
import { GameAppBottomNav } from "@/components/nav/GameAppBottomNav";
import { useAuth } from "@/components/providers/AuthProvider";
import { isFullAccountUser } from "@/lib/auth/google-user";
import { playUIButton, resumeAudioContext } from "@/lib/audio/game-sounds";
import { useIncomingFriendRequestCount } from "@/hooks/useIncomingFriendRequestCount";
import { useLiveUserProfile } from "@/hooks/useLiveUserProfile";
import { CoinDisplay } from "@/components/ui/CoinDisplay";
import { PlayerLevelBadge } from "@/components/ui/PlayerLevelBadge";

function MenuCard({
  title,
  subtitle,
  onClick,
  tone = "cream",
  badgeDot,
}: {
  title: string;
  subtitle?: string;
  onClick: () => void;
  tone?: "cream" | "violet" | "sky";
  badgeDot?: boolean;
}) {
  const toneStyle =
    tone === "violet"
      ? {
          border: "border-[#e9d5ff]/80",
          bg: "linear-gradient(145deg,rgba(255,255,255,0.97) 0%,rgba(250,245,255,0.96) 100%)",
        }
      : tone === "sky"
        ? {
            border: "border-[#bae6fd]/65",
            bg: "linear-gradient(145deg,rgba(255,255,255,0.97) 0%,rgba(240,249,255,0.95) 100%)",
          }
        : {
            border: "border-white/80",
            bg: "linear-gradient(145deg,rgba(255,255,255,0.98) 0%,rgba(255,248,236,0.96) 100%)",
          };

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        resumeAudioContext();
        playUIButton();
        onClick();
      }}
      className={`relative flex w-full items-center gap-3 rounded-[1.35rem] border px-4 py-4 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_10px_28px_rgba(196,134,82,0.12)] ${toneStyle.border}`}
      style={{ background: toneStyle.bg }}
    >
      {badgeDot ? (
        <span
          aria-hidden
          className="absolute left-4 top-4 h-2 w-2 rounded-full border border-white/90 shadow-[0_0_10px_rgba(249,115,22,0.55)]"
          style={{
            background: "radial-gradient(circle at 30% 30%, #ffb347 0%, #f97316 55%, #ea580c 100%)",
          }}
        />
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-[#8a3f16]">{title}</p>
        {subtitle ? <p className="mt-1 text-[11px] font-semibold leading-relaxed text-[#a16231]">{subtitle}</p> : null}
      </div>
      <span className="text-[#c48652]/80" aria-hidden>
        ‹
      </span>
    </motion.button>
  );
}

function ProfileHubInner() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const google = isFullAccountUser(user);
  const pendingIncoming = useIncomingFriendRequestCount(user?.uid ?? null, google);
  const liveProfile = useLiveUserProfile(user?.uid ?? null);

  return (
    <div
      dir="rtl"
      className="relative min-h-[100dvh] w-full overflow-x-hidden select-none pb-[calc(5.5rem+env(safe-area-inset-bottom))]"
      style={{
        background: "radial-gradient(130% 70% at 50% 0%, #FFF1DF 0%, #FCE8D2 52%, #FFEFD8 100%)",
      }}
    >
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-24 top-10 h-64 w-64 rounded-full bg-[#FFCB8A]/35 blur-3xl" />
        <div className="absolute -left-16 bottom-1/4 h-56 w-56 rounded-full bg-[#FFB574]/28 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:max-w-lg sm:px-6">
        <header className="mb-8 flex items-center justify-between gap-3">
          <motion.button
            type="button"
            whileTap={{ scale: 0.93 }}
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 rounded-2xl bg-white/92 px-3.5 py-2.5 text-sm font-extrabold text-[#8a3f16] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_14px_rgba(196,134,82,0.18)] ring-1 ring-[#f4d4b0]/60"
          >
            <svg viewBox="0 0 10 16" fill="none" className="h-3.5 w-3.5 shrink-0" aria-hidden>
              <path d="M8 2L2 8l6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            رجوع
          </motion.button>
          <h1
            className="text-xl font-black sm:text-2xl"
            style={{
              background: "linear-gradient(180deg,#FF9F0A 0%,#E0660A 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 2px 6px rgba(224,102,10,0.28))",
            }}
          >
            حسابي
          </h1>
          <span className="w-14" />
        </header>

        <p className="mb-4 px-0.5 text-center text-xs font-semibold text-[#a16231]">
          كل إعداداتك في مكان واحد — بهدوء ولطافة لعبة الجوال.
        </p>

        {liveProfile ? (
          <section className="mb-5 rounded-[1.35rem] border border-white/80 bg-white/92 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_10px_28px_rgba(196,134,82,0.14)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <PlayerLevelBadge xp={liveProfile.progress.xp} size="md" showBar />
              <CoinDisplay amount={liveProfile.progress.coins} size="md" />
            </div>
            <p className="mt-3 text-center text-[11px] font-semibold text-[#a16231]">
              انتصارات: {liveProfile.progress.matchWins} — الخبرة تُحفظ تلقائياً في حسابك
            </p>
          </section>
        ) : null}

        <div className="flex flex-col gap-3">
          <MenuCard
            title="المظهر والاسم"
            subtitle="الاسم الظاهر، اسم المستخدم، والصورة"
            tone="cream"
            onClick={() => router.push("/profile/appearance")}
          />
          <MenuCard
            title="المشتريات"
            subtitle="إطاراتك وعناصرك المكسوبة فقط"
            tone="violet"
            onClick={() => router.push("/profile/purchases")}
          />
          <MenuCard
            title="الأصدقاء"
            subtitle={google ? "قائمة أصدقائك وحالتهم" : "يتطلب تسجيل الدخول بـ Google"}
            tone="sky"
            onClick={() => router.push("/profile/friends")}
          />
          <MenuCard
            title="طلبات الصداقة"
            subtitle={google ? "الوارد والمرسل" : "يتطلب تسجيل الدخول بـ Google"}
            tone="violet"
            badgeDot={google && pendingIncoming > 0}
            onClick={() => router.push("/profile/requests")}
          />
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            resumeAudioContext();
            playUIButton();
            void logout().then(() => router.replace("/"));
          }}
          className="mt-8 w-full rounded-[1.25rem] border border-[#fecaca]/80 bg-gradient-to-b from-[#fff5f5] to-[#ffe8e8] py-3.5 text-sm font-extrabold text-[#b91c1c] shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_8px_22px_rgba(220,60,60,0.12)]"
        >
          تسجيل الخروج
        </motion.button>
      </div>
      <GameAppBottomNav />
    </div>
  );
}

export default function ProfileHubPage() {
  return (
    <AuthGate>
      <ProfileHubInner />
    </AuthGate>
  );
}
