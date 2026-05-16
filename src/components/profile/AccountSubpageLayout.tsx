"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { GameAppBottomNav } from "@/components/nav/GameAppBottomNav";

export function AccountSubpageLayout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const router = useRouter();

  return (
    <div
      dir="rtl"
      className="relative min-h-[100dvh] w-full overflow-x-hidden select-none pb-[calc(5.5rem+env(safe-area-inset-bottom))]"
      style={{
        background: "radial-gradient(130% 70% at 50% 0%, #FFF1DF 0%, #FCE8D2 52%, #FFEFD8 100%)",
      }}
    >
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-20 top-12 h-60 w-60 rounded-full bg-[#FFCB8A]/32 blur-3xl" />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-md px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:max-w-lg sm:px-6">
        <header className="mb-6 flex items-center justify-between gap-3">
          <motion.button
            type="button"
            whileTap={{ scale: 0.93 }}
            onClick={() => router.push("/profile")}
            className="flex items-center gap-1.5 rounded-2xl bg-white/92 px-3.5 py-2.5 text-sm font-extrabold text-[#8a3f16] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_14px_rgba(196,134,82,0.18)] ring-1 ring-[#f4d4b0]/60"
          >
            <svg viewBox="0 0 10 16" fill="none" className="h-3.5 w-3.5 shrink-0" aria-hidden>
              <path d="M8 2L2 8l6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            حسابي
          </motion.button>
          <h1
            className="text-lg font-black sm:text-xl"
            style={{
              background: "linear-gradient(180deg,#FF9F0A 0%,#E0660A 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {title}
          </h1>
          <span className="w-14" />
        </header>
        {children}
      </div>
      <GameAppBottomNav />
    </div>
  );
}
