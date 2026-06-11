"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { useAuth } from "@/components/providers/AuthProvider";
import { ShellEmbers } from "@/components/shell/ShellEmbers";
import { ShellIcon } from "@/components/shell/ShellIcons";
import { useDefaultOnlinePresence } from "@/hooks/useDefaultOnlinePresence";
import { isFullAccountUser } from "@/lib/auth/google-user";
import { fetchCategories } from "@/lib/firestore/categories.client";
import { createPrivateRoom } from "@/lib/firestore/rooms.client";
import {
  ANSWER_PHASE_SECONDS,
  QUESTION_PHASE_SECONDS,
  ROOM_TIMER_MAX_SECONDS,
  ROOM_TIMER_MIN_SECONDS,
} from "@/lib/game/constants";
import { CATEGORIES as LOCAL_CATEGORIES, DEFAULT_CATEGORY_ID } from "@/lib/game/categories";
import type { Category } from "@/types";

const Q_PRESETS = [10, 20, 30, 60] as const;
const A_PRESETS = [10, 15, 20, 30] as const;

export default function NewRoomPage() {
  return (
    <AuthGate>
      <NewRoomInner />
    </AuthGate>
  );
}

function NewRoomInner() {
  const { user } = useAuth();
  useDefaultOnlinePresence(user?.uid ?? null, isFullAccountUser(user));
  const router = useRouter();
  // Stable reference — LOCAL_CATEGORIES is a module constant so the memo never reruns.
  // Must not be inline (new array on every render) to avoid ∞ useEffect loop.
  const localFallback = useMemo<Category[]>(
    () => LOCAL_CATEGORIES.map((c) => ({ id: c.id, nameAr: c.nameAr, slug: c.slug, order: c.order })),
    [],
  );
  const [cats, setCats] = useState<Category[]>(localFallback);
  const [catId, setCatId] = useState(DEFAULT_CATEGORY_ID);
  const [questionTimerSec, setQuestionTimerSec] = useState(QUESTION_PHASE_SECONDS);
  const [answerTimerSec, setAnswerTimerSec] = useState(ANSWER_PHASE_SECONDS);
  const [voiceMode, setVoiceMode] = useState(false);
  const [hintsEnabled, setHintsEnabled] = useState(true);
  const [customCardsEnabled, setCustomCardsEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void fetchCategories()
      .then((remote) => {
        if (remote.length === 0) return;
        // Firestore is the source of truth. Append any hardcoded categories that
        // haven't been seeded to Firestore yet so the picker never goes empty.
        const remoteIds = new Set(remote.map((c) => c.id));
        const localOnly = localFallback.filter((c) => !remoteIds.has(c.id));
        const merged = [...remote, ...localOnly].sort(
          (a, b) => (a.order ?? 99) - (b.order ?? 99),
        );
        setCats(merged);
      })
      .catch(() => undefined);
  }, [localFallback]);

  const start = async () => {
    if (!user) return;
    setBusy(true);
    setErr(null);
    try {
      const clamp = (v: number) =>
        Math.min(ROOM_TIMER_MAX_SECONDS, Math.max(ROOM_TIMER_MIN_SECONDS, Math.round(v)));
      const { roomId } = await createPrivateRoom({
        uid: user.uid,
        displayName: user.displayName || user.email || "زائر",
        categoryId: catId,
        questionTimerSec: clamp(questionTimerSec),
        answerTimerSec: clamp(answerTimerSec),
        voiceMode,
        hintsEnabled,
        customCardsEnabled,
        vsBot: false,
      });
      router.push(`/room/${roomId}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "تعذر إنشاء الغرفة");
    } finally {
      setBusy(false);
    }
  };

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
          <span className="h-display fw-7">إنشاء غرفة</span>
        </div>
        <div style={{ width: 36 }} />
      </div>

      <div className="f-1 scroll-y" style={{ padding: "8px 16px 12px" }}>
        <div className="surf" style={{ padding: 16 }}>
          <div className="h-display fw-7 text-md">إعدادات المباراة</div>
          <p className="text-xs muted mt-2">خصّص القواعد قبل دعوة الخصم</p>

          <div className="mt-4">
            <p className="text-sm fw-7 mb-2">الفئة</p>
            <div className="row gap-2" style={{ flexWrap: "wrap" }}>
              {cats.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`chip ${catId === c.id ? "chip-amber" : ""}`}
                  onClick={() => setCatId(c.id)}
                >
                  {c.nameAr}
                </button>
              ))}
            </div>
          </div>

          <TimerPick label="وقت السؤال" value={questionTimerSec} presets={Q_PRESETS} onChange={setQuestionTimerSec} />
          <TimerPick label="وقت الإجابة" value={answerTimerSec} presets={A_PRESETS} onChange={setAnswerTimerSec} />

          <ToggleRow
            label="نوع الجلسة"
            hint={voiceMode ? "صوت فقط — بدون دردشة نصية" : "دردشة نصية أثناء اللعب"}
            valueLabel={voiceMode ? "صوت فقط" : "دردشة"}
            icon={voiceMode ? "sound" : "chat"}
            on={voiceMode}
            onToggle={() => setVoiceMode((v) => !v)}
          />
          <ToggleRow
            label="التلميحات"
            hint={hintsEnabled ? "يمكن استخدام تلميحات المتجر" : "معطّلة في هذه الغرفة"}
            valueLabel={hintsEnabled ? "مفعّلة" : "معطّلة"}
            icon="lightbulb"
            on={hintsEnabled}
            onToggle={() => setHintsEnabled((v) => !v)}
          />
          <ToggleRow
            label="بطاقة مخصصة للخصم"
            hint="كل لاعب يختار صورة وإجابة لخصمه في اللوبي"
            valueLabel={customCardsEnabled ? "مفعّلة" : "معطّلة"}
            icon="image"
            on={customCardsEnabled}
            onToggle={() => setCustomCardsEnabled((v) => !v)}
          />
        </div>

        {err ? (
          <p className="text-sm mt-3" style={{ color: "var(--lose)", fontWeight: 700, textAlign: "center" }}>
            {err}
          </p>
        ) : null}
      </div>

      <div
        style={{
          padding: "10px 16px calc(14px + env(safe-area-inset-bottom, 0px))",
          background: "linear-gradient(180deg, transparent, oklch(0.95 0.025 78) 30%)",
        }}
      >
        <button
          type="button"
          disabled={busy}
          className="btn btn-block btn-lg btn-primary"
          style={{ height: 56 }}
          onClick={() => void start()}
        >
          <ShellIcon name="sparkle" size={20} />
          {busy ? "جاري الإنشاء…" : "إنشاء الغرفة"}
        </button>
      </div>
    </div>
  );
}

function TimerPick({
  label,
  value,
  presets,
  onChange,
}: {
  label: string;
  value: number;
  presets: readonly number[];
  onChange: (v: number) => void;
}) {
  return (
    <div className="mt-4">
      <p className="text-sm fw-7 mb-2">{label}</p>
      <div className="row gap-2" style={{ flexWrap: "wrap" }}>
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            className={`chip ${value === p ? "chip-amber" : ""}`}
            onClick={() => onChange(p)}
          >
            {p} ث
          </button>
        ))}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  valueLabel,
  icon,
  on,
  onToggle,
}: {
  label: string;
  hint: string;
  valueLabel: string;
  icon: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="row between mt-4"
      style={{
        padding: "12px 0",
        borderTop: "1px solid oklch(0.78 0.04 65 / 0.25)",
      }}
    >
      <div className="row gap-2" style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "linear-gradient(180deg, oklch(0.94 0.07 75), oklch(0.88 0.10 65))",
            display: "grid",
            placeItems: "center",
          }}
        >
          <ShellIcon name={icon} size={16} />
        </div>
        <div>
          <p className="text-sm fw-7">{label}</p>
          <p className="text-xs muted">{hint}</p>
          <p className="text-xs muted mt-1">{valueLabel}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={onToggle}
        className="btn btn-sm"
        style={{
          minWidth: 52,
          background: on ? "var(--amber)" : "oklch(0.88 0.03 75)",
          color: on ? "oklch(0.22 0.04 35)" : "var(--fg-2)",
        }}
      >
        {on ? "نعم" : "لا"}
      </button>
    </div>
  );
}
