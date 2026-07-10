"use client";

import { usePathname } from "next/navigation";
import { ShellTabBar } from "./ShellTabBar";

export function PersistentTabBar() {
  const pathname = usePathname() ?? "/";

  // Determine if the navigation bar should be visible on the current path
  const showTabBar =
    pathname === "/" ||
    pathname === "/shop" ||
    pathname === "/profile/friends" ||
    pathname === "/profile";

  if (!showTabBar) return null;

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[32rem] z-50 pointer-events-none select-none">
      <div className="pointer-events-auto">
        <ShellTabBar />
      </div>
    </div>
  );
}
