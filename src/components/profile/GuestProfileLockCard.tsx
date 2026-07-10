"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export function GuestProfileLockCard() {
  const router = useRouter();

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="game-card-outer w-full mb-4"
    >
      <div className="game-card-inner p-6 bg-gradient-to-br from-white via-purple-50/20 to-purple-50/40 border border-slate-100 rounded-[22px] flex flex-col items-center gap-4 text-center relative overflow-hidden">
        
        {/* Glow bloom */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.25]"
          style={{
            background:
              "radial-gradient(80% 60% at 50% 0%, rgba(124,58,237,0.15), transparent 60%)",
          }}
        />

        <div className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 border border-purple-100">
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#7C3AED]" fill="none" aria-hidden>
            <path
              d="M12 11c2.21 0 4-1.34 4-3s-1.79-3-4-3-4 1.34-4 3 1.79 3 4 3z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M5 20v-1c0-2.5 3.13-4 7-4s7 1.5 7 4v1"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div style={{ lineHeight: 1.25 }}>
          <h4 className="text-xs font-black text-slate-800">
            سجّل عبر Google لحفظ تقدمك وحجز معرفك المميز
          </h4>
          <p className="mt-1 text-[10px] font-bold text-slate-400 max-w-[240px] mx-auto">
            يمكنك مواصلة اللعب كزائر — الارتباط بـ Google يتيح لك تعديل صورتك واسم المستخدم وقائمة أصدقائك.
          </p>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={() => router.push(`/login?next=${encodeURIComponent("/profile")}`)}
          className="w-full py-3.5 mt-2 rounded-xl text-xs font-black text-white shadow-sm border border-purple-800"
          style={{
            background: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
            cursor: "pointer",
          }}
        >
          المتابعة والتسجيل عبر Google
        </motion.button>

      </div>
    </motion.section>
  );
}
