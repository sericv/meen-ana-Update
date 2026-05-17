"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { useAuth } from "@/components/providers/AuthProvider";
import { ShellEmbers } from "@/components/shell/ShellEmbers";
import { ShellIcon } from "@/components/shell/ShellIcons";
import { useDefaultOnlinePresence } from "@/hooks/useDefaultOnlinePresence";
import { isFullAccountUser } from "@/lib/auth/google-user";
import { joinRoomByCode } from "@/lib/firestore/rooms.client";

export default function JoinPage() {
  return (
    <AuthGate>
      <JoinInner />
    </AuthGate>
  );
}

function JoinInner() {
  const { user } = useAuth();
  useDefaultOnlinePresence(user?.uid ?? null, isFullAccountUser(user));
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    if (!user) return;
    setBusy(true);
    setErr(null);
    try {
      const { roomId } = await joinRoomByCode({
        code,
        uid: user.uid,
        displayName: user.displayName || user.email || "زائر",
      });
      router.push(`/room/${roomId}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "تعذر الانضمام");
    } finally {
      setBusy(false);
    }
  };

  const canJoin = !busy && code.trim().length >= 4;

  return (
    <div className="shell-screen screen-enter" style={{ background: "transparent" }}>
      <ShellEmbers count={14} />
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
        <div className="col center" style={{ lineHeight: 1.1 }}>
          <span className="text-xs muted">غرفة خاصة</span>
          <span className="h-display fw-7">دخول برمز</span>
        </div>
        <span style={{ width: 40 }} />
      </div>

      <div className="f-1 col center" style={{ padding: "8px 16px 12px", gap: 16 }}>
        <div className="surf" style={{ width: "100%", padding: 20, textAlign: "center" }}>
          <p className="text-sm muted mb-4">أدخل رمز الغرفة المكوّن من 6 خانات</p>
          <input
            ref={inputRef}
            type="text"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6));
              setErr(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canJoin) void submit();
            }}
            placeholder="ABC123"
            maxLength={6}
            className="h-mono fw-8"
            style={{
              width: "100%",
              textAlign: "center",
              fontSize: 32,
              letterSpacing: ".18em",
              padding: "16px 12px",
              borderRadius: 16,
              border: `2px solid ${err ? "var(--lose)" : "oklch(0.78 0.04 65 / .45)"}`,
              background: "oklch(0.98 0.012 80)",
              color: "var(--fg-0)",
            }}
          />
          {err ? (
            <p className="text-sm mt-3" style={{ color: "var(--lose)", fontWeight: 700 }}>
              {err}
            </p>
          ) : (
            <p className="text-xs muted mt-3 row center gap-1" style={{ justifyContent: "center" }}>
              <ShellIcon name="sparkle" size={14} color="var(--fg-3)" />
              الرمز حساس لحالة الأحرف
            </p>
          )}
        </div>

        <div className="surf row gap-2" style={{ width: "100%", padding: 12 }}>
          {[
            { icon: "flame", label: "لعب سريع" },
            { icon: "friends", label: "غرف خاصة" },
            { icon: "swords", label: "مباشر" },
          ].map((f) => (
            <div key={f.label} className="f-1 col center" style={{ gap: 6, padding: 8 }}>
              <ShellIcon name={f.icon} size={22} color="var(--amber-3)" />
              <span className="text-xs fw-6">{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          padding: "10px 16px calc(14px + env(safe-area-inset-bottom, 0px))",
          background: "linear-gradient(180deg, transparent, oklch(0.95 0.025 78) 30%)",
          width: "100%",
        }}
      >
        <button
          type="button"
          disabled={!canJoin}
          className="btn btn-block btn-lg btn-primary"
          style={{ height: 56 }}
          onClick={() => void submit()}
        >
          <ShellIcon name="play" size={20} />
          {busy ? "جاري الانضمام…" : "دخول الغرفة"}
        </button>
        <button type="button" className="btn btn-ghost btn-block mt-3" onClick={() => router.push("/")}>
          الرئيسية
        </button>
      </div>
    </div>
  );
}
