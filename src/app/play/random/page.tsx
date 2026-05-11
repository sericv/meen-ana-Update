"use client";

import { doc, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { matchmakingAck, matchmakingJoin, matchmakingLeave } from "@/lib/api/matchmaking-client";
import { getFirebaseDb } from "@/lib/firebase/client";
import { col } from "@/lib/firestore/paths";
import { MATCHMAKING_POOL_ALL } from "@/lib/game/constants";
import { DEFAULT_CATEGORY_ID } from "@/lib/game/categories";

const DEFAULT_CATEGORY = DEFAULT_CATEGORY_ID;

export default function RandomPlayPage() {
  return (
    <AuthGate>
      <RandomInner />
    </AuthGate>
  );
}

function RandomInner() {
  const { user } = useAuth();
  const router = useRouter();
  const unsubRef = useRef<(() => void) | null>(null);

  const [phase, setPhase] = useState<"idle" | "searching" | "matched">("idle");
  const [hint, setHint] = useState<string | null>(null);

  const cleanupListen = () => {
    unsubRef.current?.();
    unsubRef.current = null;
  };

  useEffect(
    () => () => {
      cleanupListen();
      void matchmakingLeave({ poolId: MATCHMAKING_POOL_ALL }).catch(() => undefined);
    },
    [],
  );

  const displayName = user?.displayName || user?.email || "زائر";

  const goRoom = async (roomId: string) => {
    setPhase("matched");
    setHint("تمت المطابقة! جاري الدخول…");
    cleanupListen();
    try {
      await matchmakingAck();
    } catch {
      // non-fatal
    }
    router.replace(`/room/${roomId}`);
  };

  const startSearch = async () => {
    if (!user) return;
    setPhase("searching");
    setHint(null);
    cleanupListen();

    try {
      const res = await matchmakingJoin({
        poolId: MATCHMAKING_POOL_ALL,
        categoryId: DEFAULT_CATEGORY,
        displayName,
      });

      if (res.status === "matched" && res.roomId) {
        await goRoom(res.roomId);
        return;
      }

      setHint("جاري البحث عن خصم… ابقَ في هذه الشاشة.");

      const db = getFirebaseDb();
      const resultRef = doc(db, col.matchmakingResults, user.uid);
      unsubRef.current = onSnapshot(resultRef, (snap) => {
        const rid = snap.exists() ? String(snap.data()?.roomId ?? "") : "";
        if (rid) void goRoom(rid);
      });
    } catch (e) {
      setPhase("idle");
      setHint(e instanceof Error ? e.message : "تعذر البدء");
    }
  };

  const cancelSearch = async () => {
    setHint(null);
    cleanupListen();
    try {
      await matchmakingLeave({ poolId: MATCHMAKING_POOL_ALL });
    } catch {
      // ignore
    }
    setPhase("idle");
  };

  return (
    <div className="flex min-h-[100dvh] flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-10">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center space-y-4">
        <Panel className="overflow-hidden shadow-[0_18px_44px_rgba(214,133,56,0.18)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black leading-tight text-[#8a3f16] sm:text-4xl">العب عشوائي</h1>
              <p className="mt-2 text-sm leading-relaxed text-[#a16231] sm:text-base">
                مطابقة تلقائية مع لاعب آخر. لا حاجة لرمز غرفة — انتظر قليلاً حتى يكتمل الاثنان.
              </p>
            </div>
          </div>

          <MatchPulse active={phase === "searching"} />

          {hint ? (
            <p className="mt-4 rounded-2xl border border-[#f4cfa8] bg-[#fff6ea] px-4 py-3 text-sm text-[#8a4a20]">{hint}</p>
          ) : null}

          <div className="mt-6 flex flex-col gap-3">
            {phase === "searching" ? (
              <>
                <Button type="button" className="min-h-[48px] w-full text-lg" disabled>
                  جاري البحث عن خصم…
                </Button>
                <Button type="button" variant="ghost" className="min-h-[48px] w-full" onClick={() => void cancelSearch()}>
                  إلغاء البحث
                </Button>
              </>
            ) : (
              <Button
                type="button"
                className="min-h-[52px] w-full text-lg"
                disabled={phase === "matched"}
                onClick={() => void startSearch()}
              >
                ابحث عن خصم
              </Button>
            )}
            <Link
              className="text-center text-sm font-semibold text-[#ea8c2f] underline-offset-4 hover:underline"
              href="/"
            >
              الرئيسية
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function MatchPulse({ active }: { active: boolean }) {
  return (
    <div
      className={`mt-5 flex h-24 items-center justify-center rounded-3xl border-2 border-dashed transition-colors ${
        active ? "border-[#f59e3b] bg-[#fff4e4]" : "border-[#f4cfa8] bg-[#fffbf7]"
      }`}
      aria-hidden
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <div
          className={`h-3 w-3 rounded-full ${active ? "animate-pulse bg-[#f97316]" : "bg-[#f4cfa8]"}`}
        />
        <span className="text-xs font-semibold text-[#bc7a45]">
          {active ? "نبحث عن لاعب في الطابور…" : "اضغط للانضمام للطابور"}
        </span>
      </div>
    </div>
  );
}
