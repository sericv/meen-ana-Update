"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { fetchCategories } from "@/lib/firestore/categories.client";
import { createPrivateRoom } from "@/lib/firestore/rooms.client";
import {
  ANSWER_PHASE_SECONDS,
  QUESTION_PHASE_SECONDS,
  ROOM_TIMER_MAX_SECONDS,
  ROOM_TIMER_MIN_SECONDS,
} from "@/lib/game/constants";
import type { Category } from "@/types";

export default function NewRoomPage() {
  return (
    <AuthGate>
      <NewRoomInner />
    </AuthGate>
  );
}

function NewRoomInner() {
  const { user } = useAuth();
  const router = useRouter();
  const [cats, setCats] = useState<Category[]>([]);
  const [catId, setCatId] = useState("cat_objects");
  const [questionTimerSec, setQuestionTimerSec] = useState(QUESTION_PHASE_SECONDS);
  const [answerTimerSec, setAnswerTimerSec] = useState(ANSWER_PHASE_SECONDS);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void fetchCategories()
      .then((c) => {
        setCats(c);
        if (c[0]?.id) setCatId(c[0].id);
      })
      .catch(() => setCats([]));
  }, []);

  const start = async () => {
    if (!user) return;
    setBusy(true);
    setErr(null);
    try {
      const q = Math.min(
        ROOM_TIMER_MAX_SECONDS,
        Math.max(ROOM_TIMER_MIN_SECONDS, Math.round(questionTimerSec)),
      );
      const a = Math.min(
        ROOM_TIMER_MAX_SECONDS,
        Math.max(ROOM_TIMER_MIN_SECONDS, Math.round(answerTimerSec)),
      );
      const { roomId } = await createPrivateRoom({
        uid: user.uid,
        displayName: user.displayName || user.email || "زائر",
        categoryId: catId,
        questionTimerSec: q,
        answerTimerSec: a,
      });
      router.push(`/room/${roomId}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "تعذر إنشاء الغرفة");
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
        <h1 className="text-4xl font-black text-[#8a3f16]">إنشاء غرفة</h1>
        <p className="mt-2 text-base text-[#a16231]">اختر تصنيف البطاقات ثم شارك الرمز مع صديقك.</p>

        <label className="mt-5 block text-sm text-[#b27343]" htmlFor="cat">
          التصنيف
        </label>
        <select
          id="cat"
          className="mt-2 w-full rounded-2xl border-2 border-[#f4c48d] bg-[#fff8ee] px-4 py-3 text-base text-[#6b3a13] outline-none focus:border-[#ef9b42]"
          value={catId}
          onChange={(e) => setCatId(e.target.value)}
        >
          {cats.length ? (
            cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameAr}
              </option>
            ))
          ) : (
            <option value="cat_objects">أشياء (افتراضي)</option>
          )}
        </select>

        <p className="mt-5 text-sm font-semibold text-[#8a3f16]">مدة الجولة</p>
        <p className="mt-1 text-xs text-[#bc7a45]">
          من {ROOM_TIMER_MIN_SECONDS} إلى {ROOM_TIMER_MAX_SECONDS} ثانية لكل مرحلة.
        </p>

        <label className="mt-4 block text-sm text-[#b27343]" htmlFor="qtime">
          وقت السؤال: <span className="font-bold tabular-nums text-[#c2410c]">{questionTimerSec}</span> ث
        </label>
        <input
          id="qtime"
          type="range"
          min={ROOM_TIMER_MIN_SECONDS}
          max={ROOM_TIMER_MAX_SECONDS}
          step={1}
          value={questionTimerSec}
          onChange={(e) => setQuestionTimerSec(Number(e.target.value))}
          className="mt-2 h-3 w-full cursor-pointer accent-[#ea8c2f]"
        />

        <label className="mt-5 block text-sm text-[#b27343]" htmlFor="atime">
          وقت الإجابة: <span className="font-bold tabular-nums text-[#c2410c]">{answerTimerSec}</span> ث
        </label>
        <input
          id="atime"
          type="range"
          min={ROOM_TIMER_MIN_SECONDS}
          max={ROOM_TIMER_MAX_SECONDS}
          step={1}
          value={answerTimerSec}
          onChange={(e) => setAnswerTimerSec(Number(e.target.value))}
          className="mt-2 h-3 w-full cursor-pointer accent-[#ea8c2f]"
        />

        {err ? <p className="mt-3 text-sm text-[#c74d3d]">{err}</p> : null}

        <div className="mt-5 flex flex-col gap-3">
          <Button type="button" disabled={busy} onClick={() => void start()}>
            إنشاء
          </Button>
          <Link className="text-center text-sm font-semibold text-[#ea8c2f]" href="/">
            رجوع
          </Link>
        </div>
      </Panel>
    </div>
  );
}
