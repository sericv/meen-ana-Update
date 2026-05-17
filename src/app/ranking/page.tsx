"use client";

import { useRouter } from "next/navigation";
import { ShellIcon } from "@/components/shell/ShellIcons";
import { ShellScreen } from "@/components/shell/ShellScreen";

export default function RankingPage() {
  const router = useRouter();

  return (
    <ShellScreen activeTab="home">
      <div className="topbar">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => router.push("/")}
          style={{ padding: 8, borderRadius: 12 }}
          aria-label="رجوع"
        >
          <ShellIcon name="back" size={18} />
        </button>
        <span className="h-display fw-7">التصنيف</span>
        <span style={{ width: 40 }} />
      </div>
      <div className="f-1 col center" style={{ padding: 24, textAlign: "center", gap: 12 }}>
        <ShellIcon name="trophy" size={48} color="var(--amber)" />
        <p className="h-display fw-7 text-lg">قريبًا</p>
        <p className="text-sm muted">لوحة المتصدرين قيد التطوير — ترقّب التحديث القادم.</p>
        <button type="button" className="btn btn-primary mt-4" onClick={() => router.push("/")}>
          الرئيسية
        </button>
      </div>
    </ShellScreen>
  );
}
