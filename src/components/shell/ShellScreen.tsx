"use client";

import type { ReactNode } from "react";
import { ShellEmbers } from "@/components/shell/ShellEmbers";

export function ShellScreen({
  children,
}: {
  children: ReactNode;
  activeTab?: string;
  showTabBar?: boolean;
}) {
  return (
    <div className="shell-screen" style={{ background: "transparent" }}>
      <ShellEmbers count={6} />
      {children}
    </div>
  );
}
