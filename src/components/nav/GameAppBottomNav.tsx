"use client";

import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { isFullAccountUser } from "@/lib/auth/google-user";
import { useIncomingFriendRequestCount } from "@/hooks/useIncomingFriendRequestCount";
import { playUIButton, resumeAudioContext } from "@/lib/audio/game-sounds";

export type BottomNavTab = "account" | "shop" | "ranking";

function IconAccount({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="9" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M5 21v-1.2C5 16.3 8.1 14 12 14s7 2.3 7 5.8V21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconShop({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M5 9l1.5-4h11L19 9v10a2 2 0 01-2 2H7a2 2 0 01-2-2V9z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M5 9h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M9 13v3M12 12.5v3.5M15 13v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconPodium({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M4 20h16M8 20V12H4v8M12 20V8H8v12M16 20v-6h-4v6M20 20V6h-4v14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function activeTabFromPath(pathname: string): BottomNavTab | null {
  if (pathname.startsWith("/profile")) return "account";
  if (pathname === "/shop") return "shop";
  if (pathname === "/ranking") return "ranking";
  return null;
}

export function GameAppBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const active = activeTabFromPath(pathname ?? "");
  const google = isFullAccountUser(user);
  const pendingIncoming = useIncomingFriendRequestCount(user?.uid ?? null, google);

  function go(href: string, requireAuth: boolean) {
    resumeAudioContext();
    playUIButton();
    if (requireAuth && !loading && !user) {
      router.push(`/login?next=${encodeURIComponent(href)}`);
      return;
    }
    router.push(href);
  }

  const tabs: {
    id: BottomNavTab;
    label: string;
    href: string;
    Icon: typeof IconAccount;
    requireAuth: boolean;
  }[] = [
    { id: "account", label: "حسابي", href: "/profile", Icon: IconAccount, requireAuth: true },
    { id: "shop", label: "المتجر", href: "/shop", Icon: IconShop, requireAuth: true },
    { id: "ranking", label: "التصنيف", href: "/ranking", Icon: IconPodium, requireAuth: false },
  ];

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-2"
      aria-label="التنقل الرئيسي"
    >
      <div
        className="pointer-events-auto flex w-full max-w-md gap-2 rounded-[1.35rem] border border-white/75 bg-gradient-to-b from-white/[0.94] to-[#fff6e8]/95 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_14px_40px_rgba(196,134,82,0.22),0_4px_14px_rgba(160,80,20,0.10)] backdrop-blur-md sm:max-w-lg"
        dir="rtl"
      >
        {tabs.map(({ id, label, href, Icon, requireAuth }) => {
          const isActive = active === id;
          return (
            <motion.button
              key={id}
              type="button"
              onClick={() => go(href, requireAuth)}
              whileTap={{ scale: 0.96 }}
              className={`relative flex min-h-[3.25rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-[1.05rem] px-2 text-xs font-extrabold transition-colors ${
                isActive ? "text-[#8a3f16]" : "text-[#a16231]/85"
              }`}
              style={
                isActive
                  ? {
                      background:
                        "linear-gradient(180deg,rgba(255,245,225,0.98) 0%,rgba(255,228,190,0.92) 100%)",
                      boxShadow:
                        "inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -2px 8px rgba(255,159,10,0.12), 0 0 0 1px rgba(244,196,141,0.55), 0 6px 18px rgba(255,159,10,0.18)",
                    }
                  : {
                      background: "linear-gradient(180deg,rgba(255,255,255,0.35) 0%,rgba(255,248,236,0.28) 100%)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
                    }
              }
            >
              {isActive ? (
                <span
                  aria-hidden
                  className="absolute inset-x-3 top-1 h-6 rounded-full opacity-55 blur-lg"
                  style={{
                    background:
                      "radial-gradient(ellipse at 50% 0%,rgba(255,185,90,0.55) 0%,transparent 72%)",
                  }}
                />
              ) : null}
              <span className="relative inline-flex">
                <Icon className="relative h-[1.35rem] w-[1.35rem] shrink-0" />
                {id === "account" && pendingIncoming > 0 ? (
                  <span
                    aria-hidden
                    className="absolute -left-0.5 -top-0.5 h-2 w-2 rounded-full border border-white/90 shadow-[0_0_8px_rgba(245,140,31,0.7)]"
                    style={{
                      background: "radial-gradient(circle at 30% 30%, #ffb347 0%, #f97316 55%, #ea580c 100%)",
                    }}
                  />
                ) : null}
              </span>
              <span className="relative leading-none tracking-tight">{label}</span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
