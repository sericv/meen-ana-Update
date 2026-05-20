"use client";

import type { ReactNode } from "react";
import { ShellEmbers } from "@/components/shell/ShellEmbers";
import { ShellTabBar, type ShellTabKey } from "@/components/shell/ShellTabBar";

export function ShellScreen({
  children,
  activeTab,
  showTabBar = true,
}: {
  children: ReactNode;
  activeTab?: ShellTabKey;
  showTabBar?: boolean;
}) {
  return (
    <div className="shell-screen" style={{ background: "transparent" }}>
      <ShellEmbers count={6} />
      {children}
      {showTabBar ? <ShellTabBar active={activeTab} /> : null}
    </div>
  );
}
