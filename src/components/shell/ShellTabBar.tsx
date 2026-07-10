"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { ShellIcon } from "@/components/shell/ShellIcons";
import { playUIButton, resumeAudioContext } from "@/lib/audio/game-sounds";
import { useIncomingFriendRequestCount } from "@/hooks/useIncomingFriendRequestCount";
import { isFullAccountUser } from "@/lib/auth/google-user";
import { motion } from "framer-motion";

export type ShellTabKey = "home" | "shop" | "play" | "friends" | "profile";

function activeFromPath(pathname: string): ShellTabKey {
  if (pathname.startsWith("/profile/friends") || pathname === "/friends") return "friends";
  if (pathname.startsWith("/profile")) return "profile";
  if (pathname === "/shop") return "shop";
  if (pathname.startsWith("/play")) return "play";
  return "home";
}

function tabSound() {
  resumeAudioContext();
  playUIButton();
}

export function ShellTabBar({ active }: { active?: ShellTabKey }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const resolved = active ?? activeFromPath(pathname);
  const { user, loading } = useAuth();
  const google = isFullAccountUser(user);
  const pendingIncoming = useIncomingFriendRequestCount(user?.uid ?? null, google);

  const items: { key: ShellTabKey; icon: string; label: string; href: string; auth?: boolean }[] = [
    { key: "home", icon: "home", label: "الرئيسية", href: "/" },
    { key: "shop", icon: "shop", label: "المتجر", href: "/shop", auth: true },
    { key: "play", icon: "play", label: "العب", href: "/play/random" },
    { key: "friends", icon: "friends", label: "الأصدقاء", href: "/profile/friends", auth: true },
    { key: "profile", icon: "user", label: "حسابي", href: "/profile", auth: true },
  ];

  function onAuthTab(e: MouseEvent<HTMLAnchorElement>, href: string) {
    tabSound();
    if (!loading && !user) {
      e.preventDefault();
      router.push(`/login?next=${encodeURIComponent(href)}`);
    }
  }

  return (
    <div className="mx-6 mb-5 p-1 bg-slate-900/5 ring-1 ring-black/5 rounded-full relative z-10">
      <nav 
        className="bg-white/85 rounded-full backdrop-blur-md px-4 py-2.5 flex items-center justify-around shadow-[inset_0_1px_0px_rgba(255,255,255,0.8)]"
        aria-label="التنقل الرئيسي"
        style={{ direction: "rtl" }}
      >
        {items.map((it) => {
          const isActive = resolved === it.key;

          if (it.key === "play") {
            return (
              <Link
                key={it.key}
                href={it.href}
                prefetch
                className="select-none"
                onClick={tabSound}
                style={{ position: "relative", textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center" }}
              >
                <div className="absolute top-[-26px] p-1 bg-slate-900/5 ring-1 ring-black/5 rounded-full active:scale-[0.93] transition-transform">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="w-11 h-11 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] flex items-center justify-center shadow-md border border-purple-800"
                  >
                    <ShellIcon name="play" size={18} color="#FFFFFF" />
                  </motion.div>
                </div>
                <div style={{ height: 24 }} />
                <span className="text-[9px] font-black text-slate-400 mt-1 select-none">
                  {it.label}
                </span>
              </Link>
            );
          }

          const handleTabClick = (e: MouseEvent<HTMLAnchorElement>) => {
            if (it.auth) {
              onAuthTab(e, it.href);
            } else {
              tabSound();
            }
          };

          return (
            <Link
              key={it.key}
              href={it.href}
              prefetch
              className="select-none flex flex-col items-center justify-center"
              style={{
                textDecoration: "none",
                position: "relative",
                color: isActive ? "#7C3AED" : "#64748B",
              }}
              onClick={handleTabClick}
            >
              <motion.div
                animate={isActive ? { scale: 1.08, y: -0.5 } : { scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="flex flex-col items-center justify-center gap-1 p-1 rounded-xl"
              >
                <div style={{ position: "relative" }}>
                  <ShellIcon name={it.icon} size={isActive ? 18 : 20} color={isActive ? "#7C3AED" : "#64748B"} />
                  {it.key === "friends" && pendingIncoming > 0 ? (
                    <span
                      aria-hidden
                      style={{
                        position: "absolute",
                        top: -1,
                        right: -2,
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "#FF007F",
                        border: "1px solid #FFF",
                      }}
                    />
                  ) : null}
                </div>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: isActive ? 800 : 600,
                    lineHeight: 1,
                  }}
                >
                  {it.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
