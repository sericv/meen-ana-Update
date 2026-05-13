"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { useAuth } from "@/components/providers/AuthProvider";
import { usePlayerCosmetics } from "@/hooks/usePlayerCosmetics";
import { playUIButton, resumeAudioContext } from "@/lib/audio/game-sounds";
import { updateUserCosmetics } from "@/lib/firestore/users.client";
import {
  AVATAR_PRESETS,
  FRAME_OPTIONS,
  normalizeCosmetic,
  type FrameId,
} from "@/lib/profile/cosmetics";

export default function ProfilePage() {
  return (
    <AuthGate>
      <ProfileInner />
    </AuthGate>
  );
}

function ProfileInner() {
  const router = useRouter();
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const map = usePlayerCosmetics(uid ? [uid] : []);
  const live = uid ? map[uid] : undefined;
  const resolved = useMemo(() => normalizeCosmetic(live as Record<string, unknown> | undefined), [live]);

  const [avatarId, setAvatarId] = useState(resolved.avatarId);
  const [frameId, setFrameId] = useState(resolved.avatarFrameId);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setAvatarId(resolved.avatarId);
    setFrameId(resolved.avatarFrameId);
  }, [resolved.avatarId, resolved.avatarFrameId]);

  const previewCosmetic = useMemo(
    () => ({
      avatarId,
      avatarFrameId: frameId,
      photoURL: resolved.photoURL,
    }),
    [avatarId, frameId, resolved.photoURL],
  );

  const save = useCallback(async () => {
    if (!uid) return;
    resumeAudioContext();
    playUIButton();
    setBusy(true);
    setErr(null);
    try {
      await updateUserCosmetics(uid, { avatarId, avatarFrameId: frameId });
    } catch {
      setErr("تعذر الحفظ — تحقق من الاتصال.");
    } finally {
      setBusy(false);
    }
  }, [uid, avatarId, frameId]);

  return (
    <div
      dir="rtl"
      className="relative min-h-[100dvh] w-full overflow-x-hidden select-none"
      style={{
        background:
          "radial-gradient(120% 70% at 50% 0%, #FFF1DF 0%, #FCE8D2 55%, #FFEFD8 100%)",
      }}
    >
      <div className="relative z-10 mx-auto w-full max-w-md px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))] sm:max-w-lg sm:px-6">
        <header className="mb-6 flex items-center justify-between gap-3">
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => router.push("/")}
            className="rounded-2xl bg-white/90 px-4 py-2 text-sm font-extrabold text-[#8a3f16] shadow-[0_4px_14px_rgba(196,134,82,0.22)] ring-1 ring-[#f4d4b0]"
          >
            رجوع
          </motion.button>
          <h1
            className="text-xl font-black sm:text-2xl"
            style={{
              background: "linear-gradient(180deg,#FF9F0A 0%,#E0660A 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            شخصيتك
          </h1>
          <span className="w-16" />
        </header>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-[2rem] border border-white/80 bg-white/95 p-6 shadow-[0_20px_50px_rgba(196,134,82,0.22)]"
        >
          <p className="text-center text-sm font-bold text-[#bc7a45]">معاينة مباشرة</p>
          <div className="mt-4 flex justify-center">
            <ProfileAvatar
              cosmetic={previewCosmetic}
              fallbackPhotoURL={user?.photoURL}
              displayName={user?.displayName ?? undefined}
              size="xl"
              idle
              active
            />
          </div>
        </motion.section>

        <section className="mb-6 rounded-[1.75rem] border border-[#f4d4af] bg-[#fffaf5] p-4 shadow-inner">
          <p className="mb-3 text-sm font-black text-[#8a3f16]">الصورة الرمزية</p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-4">
            {AVATAR_PRESETS.map((a) => (
              <motion.button
                key={a.id}
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={() => {
                  resumeAudioContext();
                  playUIButton();
                  setAvatarId(a.id);
                }}
                className={`flex flex-col items-center gap-1 rounded-2xl py-3 text-2xl ${
                  avatarId === a.id
                    ? "bg-gradient-to-b from-[#FF9F0A] to-[#FF6B00] text-white shadow-[0_6px_0_#be5200]"
                    : "bg-white/90 text-[#8a3f16] ring-1 ring-[#f4d4af]"
                }`}
              >
                <span>{a.glyph}</span>
                <span className="text-[10px] font-bold">{a.labelAr}</span>
              </motion.button>
            ))}
          </div>
        </section>

        <section className="mb-8 rounded-[1.75rem] border border-[#f4d4af] bg-[#fffaf5] p-4 shadow-inner">
          <p className="mb-3 text-sm font-black text-[#8a3f16]">إطار متحرك</p>
          <div className="grid max-h-[min(52vh,420px)] grid-cols-2 gap-2 overflow-y-auto overscroll-contain pr-0.5 sm:grid-cols-3 lg:grid-cols-4">
            {FRAME_OPTIONS.map((f) => (
              <motion.button
                key={f.id}
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={() => {
                  resumeAudioContext();
                  playUIButton();
                  setFrameId(f.id as FrameId);
                }}
                className={`rounded-2xl px-3 py-3 text-xs font-extrabold ${
                  frameId === f.id
                    ? "bg-[#ede9fe] text-[#5b21b6] ring-2 ring-[#c4b5fd]"
                    : "bg-white/90 text-[#8a3f16] ring-1 ring-[#f4d4af]"
                }`}
              >
                {f.labelAr}
              </motion.button>
            ))}
          </div>
        </section>

        <AnimatePresence>
          {err ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-center text-sm font-bold text-red-800"
            >
              {err}
            </motion.p>
          ) : null}
        </AnimatePresence>

        <motion.button
          type="button"
          disabled={busy}
          whileTap={{ scale: 0.97 }}
          onClick={() => void save()}
          className="w-full rounded-[1.35rem] py-4 text-lg font-black text-white disabled:opacity-60"
          style={{
            background: "linear-gradient(180deg,#FF9F0A 0%,#FF6B00 100%)",
            boxShadow: "inset 0 2px 0 rgba(255,255,255,0.42), 0 10px 0 #be5200, 0 18px 34px rgba(255,107,0,0.38)",
          }}
        >
          {busy ? "جاري الحفظ…" : "حفظ المظهر"}
        </motion.button>

        <p className="mt-4 text-center text-[11px] font-semibold text-[#bc7a45]">
          يظهر مظهرك للاعبين في الغرفة والدردشة بعد الحفظ.
        </p>
      </div>
    </div>
  );
}
