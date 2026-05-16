"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, startTransition, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";

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
      className="relative min-h-[100dvh] w-full overflow-x-hidden px-4 py-10 sm:px-6"
      style={{
        background: "radial-gradient(120% 70% at 50% 0%, #FFF1DF 0%, #FCE8D2 55%, #FFEFD8 100%)",
      }}
    >
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-16 top-20 h-56 w-56 rounded-full bg-[#FFCB8A]/40 blur-3xl" />
        <div className="absolute -left-20 bottom-24 h-72 w-72 rounded-full bg-[#FFB574]/35 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md sm:max-w-lg">
        <div className="mb-6 text-center">
          <h1
            className="text-3xl font-black tracking-tight sm:text-4xl"
            style={{
              background: "linear-gradient(180deg,#FF9F0A 0%,#E0660A 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            تسجيل الدخول
          </h1>
          <p className="mt-2 text-sm font-semibold text-[#a16231] sm:text-base">
            Google للحساب الكامل، أو تابع كزائر — كل الإدارة من «حسابي».
          </p>
        </div>

        <div className="space-y-4 rounded-[1.75rem] border border-white/80 bg-white/95 p-5 shadow-[0_18px_44px_rgba(196,134,82,0.22)] sm:p-6">
          <Button
            type="button"
            className="min-h-[52px] w-full text-base font-black shadow-[0_8px_24px_rgba(234,140,47,0.35)]"
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
                      ? "افتح هذه الصفحة في Safari أو Chrome لتسجيل الدخول عبر Google."
                      : e instanceof Error && e.message
                        ? e.message
                        : "تعذر فتح Google. تحقق من الاتصال وحاول مجدداً.";
                  setGoogleErr(msg);
                })
                .finally(() => setGoogleBusy(false));
            }}
          >
            {googleBusy ? "جاري فتح Google…" : "المتابعة عبر Google"}
          </Button>
          {googleErr ? (
            <p role="alert" className="text-center text-sm font-bold text-red-700">
              {googleErr}
            </p>
          ) : null}

          <Button
            type="button"
            variant="ghost"
            className="min-h-[48px] w-full font-bold text-[#b45309]"
            disabled={loading}
            onClick={() => void signInGuest()}
          >
            دخول كزائر
          </Button>

          <Link
            className="block text-center text-sm font-bold text-[#ea8c2f] underline-offset-4 hover:underline"
            href="/"
          >
            العودة للرئيسية
          </Link>
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
          className="flex min-h-[100dvh] items-center justify-center text-sm font-bold text-[#a16231]"
          style={{
            background: "radial-gradient(120% 70% at 50% 0%, #FFF1DF 0%, #FCE8D2 55%, #FFEFD8 100%)",
          }}
        >
          جاري التحميل…
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
