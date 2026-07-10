"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, startTransition, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { motion, AnimatePresence } from "framer-motion";
import { ShellIcon } from "@/components/shell/ShellIcons";

/* ── Vector Illustrations for Login page ── */

const LoginHeroIllustration = () => (
  <svg className="w-40 h-40 mx-auto text-[#7C3AED]" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Background soft organic shapes */}
    <path d="M40 100C40 60 70 40 100 40C130 40 160 60 160 100C160 140 130 160 100 160C70 160 40 140 40 100Z" fill="rgba(124, 58, 237, 0.05)" />
    
    {/* Floating card 1 */}
    <g className="memphis-float">
      <rect x="50" y="60" width="40" height="56" rx="6" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
      <circle cx="70" cy="80" r="8" fill="#7C3AED" fillOpacity="0.1" />
      <path d="M64 88h12M64 96h8" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" />
    </g>

    {/* Floating card 2 */}
    <g className="memphis-float-delayed">
      <rect x="110" y="80" width="40" height="56" rx="6" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" transform="rotate(8 130 108)" />
      <path d="M125 102l5-5 7 7" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="130" cy="115" r="3" fill="#A78BFA" />
    </g>

    {/* Magnifying Glass */}
    <circle cx="100" cy="110" r="22" fill="#FFFFFF" stroke="#7C3AED" strokeWidth="4" />
    <path d="M116 126l20 20" stroke="#7C3AED" strokeWidth="4" strokeLinecap="round" />
    
    {/* Question Mark in Glass */}
    <path d="M96 102c0-2 2-4 4-4s4 2 4 4c0 2-2 3-3 4-1 1-1 2-1 3m0 4v1" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
  </svg>
);

function LoginInner() {
  const { signInGoogle, signInGuest, user, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = useMemo(() => params.get("next") || "/", [params]);

  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleErr, setGoogleErr] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    if (user.isAnonymous) return;
    const id = requestAnimationFrame(() => {
      startTransition(() => {
        router.replace(next);
      });
    });
    return () => cancelAnimationFrame(id);
  }, [loading, user, router, next]);

  return (
    <div
      dir="rtl"
      className="app-page relative w-full memphis-grid"
      style={{
        background: "transparent",
      }}
    >
      {/* Background Floaters */}
      <div className="bg-shape text-2xl memphis-float" style={{ top: "12%", left: "8%", opacity: 0.05 }}>✨</div>
      <div className="bg-shape text-2xl memphis-float-delayed" style={{ top: "50%", right: "8%", opacity: 0.05 }}>⭐</div>

      <div className="app-scroll-y relative z-10 px-4 py-8 sm:px-6">
        <div className="mx-auto w-full max-w-sm flex flex-col gap-6">
          
          {/* Welcome header & Hero */}
          <div className="text-center flex flex-col gap-4">
            <LoginHeroIllustration />
            
            <div style={{ lineHeight: 1.25 }}>
              <h1 className="h-display text-2xl font-black text-slate-800">
                مين أنا؟
              </h1>
              <p className="text-xs text-slate-400 font-bold mt-1.5 max-w-[260px] mx-auto">
                خمن الشخصيات الغامضة، وتحدى أصدقاءك في مغامرة التخمين الجماعية السريعة!
              </p>
            </div>
          </div>

          {/* Login Credentials Card */}
          <div className="game-card-outer w-full">
            <div className="game-card-inner p-6 bg-white border border-slate-100 rounded-[22px] flex flex-col gap-4 shadow-sm text-center">
              
              <div className="flex flex-col gap-2">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  disabled={loading || googleBusy}
                  onClick={() => {
                    if (googleBusy) return;
                    setGoogleBusy(true);
                    setGoogleErr(null);
                    void signInGoogle()
                      .catch((e: unknown) => {
                        const code =
                          e && typeof e === "object" && "code" in e
                            ? String((e as { code: unknown }).code)
                            : "";
                        if (
                          code === "auth/popup-closed-by-user" ||
                          code === "auth/cancelled-popup-request"
                        ) {
                          return;
                        }
                        const msg =
                          code === "auth/in-app-browser"
                            ? "افتح الصفحة في المتصفح الرسمي (Safari / Chrome) للدخول عبر Google."
                            : e instanceof Error && e.message
                              ? e.message
                              : "تعذر فتح Google. يرجى التحقق من اتصالك بالشبكة.";
                        setGoogleErr(msg);
                      })
                      .finally(() => setGoogleBusy(false));
                  }}
                  className="w-full py-4 rounded-xl text-xs font-black text-white shadow-sm border border-purple-800 flex items-center justify-center gap-2"
                  style={{
                    background: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
                    cursor: "pointer",
                  }}
                >
                  <GoogleIcon />
                  {googleBusy ? "جاري الاتصال بـ Google..." : "المتابعة باستخدام Google"}
                </motion.button>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  disabled={loading}
                  onClick={() => void signInGuest()}
                  className="w-full py-3.5 rounded-xl text-xs font-black bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center gap-1.5"
                  style={{ cursor: "pointer" }}
                >
                  الدخول كلاعب زائر
                </motion.button>
              </div>

              {googleErr && (
                <p role="alert" className="text-[10px] font-black text-rose-600">
                  {googleErr}
                </p>
              )}

              <div className="border-t border-purple-50 pt-3 flex flex-col gap-3">
                <Link
                  className="text-xs font-black text-slate-400 hover:text-slate-600 underline underline-offset-4"
                  href="/"
                >
                  العودة للرئيسية
                </Link>

                <div className="flex items-center justify-center gap-3 text-[10px] font-bold text-slate-400">
                  <Link className="hover:text-slate-600 underline underline-offset-4" href="/privacy">
                    سياسة الخصوصية
                  </Link>
                  <span aria-hidden className="text-slate-200">·</span>
                  <Link className="hover:text-slate-600 underline underline-offset-4" href="/terms">
                    الشروط والأحكام
                  </Link>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          className="app-page flex items-center justify-center text-xs font-black text-slate-400"
          style={{
            background: "#FAFAF8",
          }}
        >
          جاري التحميل...
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
