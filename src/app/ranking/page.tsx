"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { GameAppBottomNav } from "@/components/nav/GameAppBottomNav";
import { playUIButton, resumeAudioContext } from "@/lib/audio/game-sounds";

export default function RankingPage() {
  const router = useRouter();

  return (
    <div
      dir="rtl"
      className="relative min-h-[100dvh] w-full overflow-x-hidden select-none pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]"
      style={{
        background:
          "radial-gradient(115% 60% at 50% 0%, #fff6eb 0%, #fcebd6 48%, #fff3e4 100%)",
      }}
    >
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute left-1/2 top-1/4 h-72 w-72 -translate-x-1/2 rounded-full opacity-35 blur-3xl"
          style={{ background: "radial-gradient(circle,rgba(255,200,130,0.5),transparent 70%)" }}
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md px-4 sm:max-w-lg sm:px-6">
        <header className="mb-8 flex items-center justify-between gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.93 }}
            onClick={() => {
              resumeAudioContext();
              playUIButton();
              router.push("/");
            }}
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
              background: "linear-gradient(180deg,#d97706 0%,#b45309 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 2px 4px rgba(180,83,9,0.22))",
            }}
          >
            التصنيف
          </h1>
          <span className="w-14" />
        </header>

        <section
          className="relative overflow-hidden rounded-[1.85rem] border border-white/80 px-6 py-12 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_18px_48px_rgba(196,134,82,0.2)]"
          style={{
            background:
              "linear-gradient(165deg,rgba(255,255,255,0.97) 0%,rgba(255,244,225,0.92) 45%,rgba(255,232,200,0.88) 100%)",
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              background:
                "radial-gradient(80% 50% at 50% -10%,rgba(255,190,90,0.35),transparent 60%)",
            }}
          />
          <div className="relative">
            <div
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
              style={{
                background: "linear-gradient(180deg,#f4f4f5 0%,#e4e4e7 100%)",
                boxShadow:
                  "inset 0 2px 0 rgba(255,255,255,0.85),0 8px 20px rgba(100,100,110,0.15),0 0 0 1px rgba(180,180,190,0.35)",
                filter: "grayscale(0.15)",
              }}
            >
              🏆
            </div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#a16231]/75">قريبًا</p>
            <h2 className="mt-3 text-2xl font-black text-[#8a3f16]">لوحة التصنيف</h2>
            <p className="mx-auto mt-3 max-w-[260px] text-sm font-semibold leading-relaxed text-[#a16231]">
              نعمل على لوحة تصنيف عادلة وممتعة — تنافس مع اللاعبين وحافظ على سلسلة انتصاراتك قريبًا.
            </p>
            <div
              className="mx-auto mt-8 max-w-xs rounded-2xl px-4 py-3 text-xs font-bold text-[#7a3410]/75"
              style={{
                background: "rgba(255,255,255,0.65)",
                boxShadow: "inset 0 0 0 1px rgba(244,196,141,0.45)",
              }}
            >
              ترقب التحديث في إصدار قادم — بدون ازدحام، بل طابع لعبة دافئ كما تحب.
            </div>
          </div>
        </section>
      </div>
      <GameAppBottomNav />
    </div>
  );
}
