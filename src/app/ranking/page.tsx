"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ShellScreen } from "@/components/shell/ShellScreen";

const PREVIEW_FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="8" r="7" />
        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
      </svg>
    ),
    title: "أفضل اللاعبين عالميًا",
    desc: "لوحة متصدرين تفاعلية لعرض نخبة المحققين حول العالم.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    title: "مواسم تنافسية جوائز",
    desc: "تحديات ومواسم متجددة مع مكافآت وجوائز حصرية.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    title: "شارات وإنجازات فريدة",
    desc: "إطارات ملف شخصي وأوسمة حصرية تثبت مهاراتك.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M23 6l-9.5 9.5-5-5L1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
    title: "نظام نقاط عادل",
    desc: "تصنيف دقيق يتغير بناءً على مستوى أدائك الفعلي.",
  },
];

export default function RankingPage() {
  const router = useRouter();

  return (
    <ShellScreen activeTab="home">
      <div className="flex min-h-0 w-full flex-1 flex-col p-4 gap-4" dir="rtl">
        
        {/* Header Bar */}
        <div className="game-card-outer w-full flex-shrink-0">
          <div className="game-card-inner p-3.5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between shadow-sm">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/50 flex items-center justify-center text-slate-400 active:scale-95 transition-transform"
              aria-label="رجوع"
              style={{ cursor: "pointer" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <h2 className="h-display text-sm font-black text-slate-800">التصنيف العالمي</h2>
            <div className="w-8" />
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto pr-0.5 flex flex-col gap-5">

          {/* Coming Soon Teaser Hero Card */}
          <div className="game-card-outer w-full">
            <div className="game-card-inner p-6 bg-gradient-to-br from-white to-slate-50/50 border border-slate-100 rounded-[28px] flex flex-col items-center text-center gap-4 relative overflow-hidden">
              
              {/* Background Glow Decals */}
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-purple-500/5 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-amber-500/5 blur-2xl pointer-events-none" />

              {/* Floating Trophy Illustration */}
              <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
                {/* Floating Medals & Badges background details */}
                <motion.div
                  animate={{ y: [0, -4, 0], rotate: [0, 5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center text-[10px] shadow-sm"
                >
                  🎖️
                </motion.div>
                <motion.div
                  animate={{ y: [0, 4, 0], rotate: [0, -6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-[10px] shadow-sm"
                >
                  ⭐
                </motion.div>

                {/* Main Trophy */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-20 h-20 bg-amber-50/40 border border-amber-200/50 rounded-full flex items-center justify-center shadow-[0_12px_24px_rgba(245,158,11,0.06)]"
                >
                  <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                    <path d="M4 22h16" />
                    <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
                    <path d="M12 2a6 6 0 0 0-6 6v5a6 6 0 0 0 12 0V8a6 6 0 0 0-6-6Z" />
                  </svg>
                </motion.div>
              </div>

              {/* Title & Desc */}
              <div className="flex flex-col gap-1.5 z-10" style={{ lineHeight: 1.2 }}>
                
                {/* Coming Soon floating badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/40 text-amber-700 text-[10px] font-black mx-auto mb-2 shadow-sm">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="animate-spin-slow">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  <span>قريبًا</span>
                </div>

                <h1 className="h-display text-base font-black text-slate-800">نظام التصنيف العالمي</h1>
                <p className="text-[10px] text-slate-400 font-bold max-w-[240px] mx-auto leading-normal mt-1.5">
                  نعمل على تطوير نظام تصنيف تنافسي متكامل يمنحك تجربة أكثر حماسًا وعدالة مع بقية اللاعبين.
                </p>
              </div>

            </div>
          </div>

          {/* Preview Features Grid */}
          <div className="flex flex-col gap-3">
            <h3 className="h-display text-xs font-black text-slate-500 px-1">ما الذي ينتظرك في التحديث القادم؟</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PREVIEW_FEATURES.map((item, idx) => (
                <div key={idx} className="game-card-outer w-full opacity-80">
                  <div className="game-card-inner p-3.5 bg-slate-50/50 border border-slate-200/50 rounded-2xl flex items-start gap-3.5 relative overflow-hidden">
                    
                    {/* Blurry lock indicator */}
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[8px] font-bold text-slate-400 select-none">
                      قيد التطوير
                    </div>

                    <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                      {item.icon}
                    </div>

                    <div className="flex-1 min-w-0" style={{ lineHeight: 1.2 }}>
                      <span className="text-xs font-black text-slate-700 block truncate">
                        {item.title}
                      </span>
                      <p className="text-[9px] text-slate-400 font-bold mt-1 leading-normal">
                        {item.desc}
                      </p>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action button */}
          <div className="py-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-full py-4 rounded-2xl text-xs font-black text-slate-600 bg-white border border-slate-200/60 shadow-sm active:scale-98 transition-transform flex items-center justify-center gap-1.5 hover:bg-slate-50"
              style={{ cursor: "pointer" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span>العودة للرئيسية</span>
            </button>
          </div>

        </div>

      </div>
    </ShellScreen>
  );
}
