"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { ShellIcon } from "@/components/shell/ShellIcons";
import { playUIButton, resumeAudioContext } from "@/lib/audio/game-sounds";
import { useIncomingFriendRequestCount } from "@/hooks/useIncomingFriendRequestCount";
import { isFullAccountUser } from "@/lib/auth/google-user";

export type ShellTabKey = "home" | "shop" | "play" | "friends" | "profile";

function activeFromPath(pathname: string): ShellTabKey {
  if (pathname.startsWith("/profile/friends") || pathname === "/friends") return "friends";
  if (pathname.startsWith("/profile")) return "profile";
  if (pathname === "/shop") return "shop";
  if (pathname.startsWith("/play")) return "play";
  return "home";
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

  function go(href: string, needsAuth?: boolean) {
    resumeAudioContext();
    playUIButton();
    if (needsAuth && !loading && !user) {
      router.push(`/login?next=${encodeURIComponent(href)}`);
      return;
    }
    router.push(href);
  }

  return (
    <nav className="tabbar" aria-label="التنقل الرئيسي">
      {items.map((it) =>
        it.key === "play" ? (
          <button key={it.key} type="button" className="tab" onClick={() => go(it.href)} style={{ position: "relative" }}>
            <div
              style={{
                position: "absolute",
                top: -24,
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "linear-gradient(180deg, oklch(0.86 0.16 75), oklch(0.66 0.18 50))",
                display: "grid",
                placeItems: "center",
                color: "oklch(0.22 0.04 35)",
                boxShadow:
                  "0 12px 24px -8px oklch(0.70 0.18 60 / .55), inset 0 1px 0 rgba(255,255,255,.55), inset 0 -2px 0 oklch(0.48 0.16 45)",
                border: "3px solid oklch(0.95 0.022 78)",
              }}
            >
              <ShellIcon name="play" size={26} />
            </div>
            <div style={{ height: 30 }} />
            <span style={{ marginTop: 4 }}>{it.label}</span>
          </button>
        ) : (
          <button
            key={it.key}
            type="button"
            className={`tab ${resolved === it.key ? "active" : ""}`}
            onClick={() => go(it.href, it.auth)}
            style={{ position: "relative" }}
          >
            <ShellIcon name={it.icon} size={22} />
            {it.key === "friends" && pendingIncoming > 0 ? (
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  top: 4,
                  left: "50%",
                  marginLeft: 10,
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "oklch(0.72 0.18 55)",
                  boxShadow: "0 0 6px oklch(0.78 0.18 65 / .7)",
                }}
              />
            ) : null}
            <span>{it.label}</span>
          </button>
        ),
      )}
    </nav>
  );
}
