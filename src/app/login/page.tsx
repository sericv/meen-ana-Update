"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, startTransition, useEffect, useMemo } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";

function LoginInner() {
  const { signInGoogle, signInGuest, user, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = useMemo(() => params.get("next") || "/", [params]);

  useEffect(() => {
    if (loading || !user) return;
    // Defer navigation one frame so redirect / account-picker auth state can settle on mobile
    // before Next.js replaces the route (avoids races with OAuth return and in-app browsers).
    const id = requestAnimationFrame(() => {
      startTransition(() => {
        router.replace(next);
      });
    });
    return () => cancelAnimationFrame(id);
  }, [loading, user, router, next]);

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-lg items-center px-4 py-12">
      <Panel className="w-full">
        <h1 className="text-4xl font-black text-[#8a3f16]">تسجيل الدخول</h1>
        <p className="mt-2 text-base text-[#a16231]">
          اختر طريقة الدخول للمتابعة إلى الغرف والمباريات.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button type="button" onClick={() => void signInGoogle()}>
            المتابعة عبر Google
          </Button>
          <Button type="button" variant="ghost" onClick={() => void signInGuest()}>
            دخول كزائر
          </Button>
          <Link className="text-center text-sm font-semibold text-[#ea8c2f]" href="/">
            العودة للرئيسية
          </Link>
        </div>
      </Panel>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center text-[#a16231]">جاري التحميل...</div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
