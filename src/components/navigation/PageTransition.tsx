"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Soft cross-route enter — CSS only (no framer-motion). */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  return (
    <div key={pathname} className="route-transition-host flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {children}
    </div>
  );
}
