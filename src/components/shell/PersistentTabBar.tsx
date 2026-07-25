"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { ShellTabBar } from "./ShellTabBar";

export function PersistentTabBar() {
  const pathname = usePathname() ?? "/";
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show Bottom Navigation ONLY on main "Who Am I?" application screens
  // Completely HIDE on Word Race (/play/word-race) and standalone flows
  const showTabBar =
    pathname === "/" ||
    pathname === "/shop" ||
    pathname === "/friends" ||
    pathname.startsWith("/profile/friends") ||
    pathname === "/profile" ||
    pathname === "/ranking" ||
    pathname === "/categories";

  if (!mounted || !showTabBar) return null;

  return createPortal(
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[32rem] z-[99999] pointer-events-none select-none">
      <div className="pointer-events-auto">
        <ShellTabBar />
      </div>
    </div>,
    document.body
  );
}
