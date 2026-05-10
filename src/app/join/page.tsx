"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
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
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-lg px-4 pb-[max(3rem,env(safe-area-inset-bottom))] pt-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link className="text-sm font-semibold text-[#ea8c2f]" href="/">
          الرئيسية
        </Link>
      </div>
      <Panel>
        <h1 className="text-4xl font-black text-[#8a3f16]">انضمام برمز</h1>
        <p className="mt-2 text-base text-[#a16231]">أدخل رمز الغرفة الذي شاركه معك صديقك.</p>
        <div className="mt-5 space-y-3">
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="مثال: A1B2C3" />
          {err ? <p className="text-sm text-[#c74d3d]">{err}</p> : null}
          <Button type="button" disabled={busy || code.trim().length < 4} onClick={() => void submit()}>
            دخول الغرفة
          </Button>
          <Link className="block text-center text-sm font-semibold text-[#ea8c2f]" href="/">
            رجوع
          </Link>
        </div>
      </Panel>
    </div>
  );
}
