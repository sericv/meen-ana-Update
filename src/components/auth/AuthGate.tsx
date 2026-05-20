"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const next = encodeURIComponent(pathname || "/");
      router.replace(`/login?next=${next}`);
    }
  }, [loading, user, router, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4" aria-busy>
        <div className="route-loading-spinner" />
        <p className="text-sm font-semibold text-[#9b6338]">جاري التحميل…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center text-[#9b6338]">
        <div className="w-full max-w-md rounded-2xl border border-[rgba(244,196,141,0.45)] bg-white/90 px-5 py-6 shadow-sm">
          <p className="text-sm">يلزم تسجيل الدخول للمتابعة.</p>
          <Link className="mt-4 inline-block font-semibold text-[#ea8c2f]" href="/login">
            الانتقال لتسجيل الدخول
          </Link>
          <Link className="mt-3 block text-sm font-semibold text-[#bc7a45]" href="/">
            الرئيسية
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
