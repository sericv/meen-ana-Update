"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { DefaultAvatarIllustration } from "@/components/profile/DefaultAvatarIllustration";
import { FramePicker } from "@/components/profile/FramePicker";
import { GuestProfileLockCard } from "@/components/profile/GuestProfileLockCard";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { useAuth } from "@/components/providers/AuthProvider";
import { useDefaultOnlinePresence } from "@/hooks/useDefaultOnlinePresence";
import { usePlayerCosmetics } from "@/hooks/usePlayerCosmetics";
import { uploadProfileAvatarImage } from "@/lib/api/profile-client";
import { isFullAccountUser } from "@/lib/auth/google-user";
import { playUIButton, resumeAudioContext } from "@/lib/audio/game-sounds";
import { updateUserCosmetics, updateUserPhotoURL } from "@/lib/firestore/users.client";
import { compressAvatarImageFromFile } from "@/lib/profile/avatar-compress";
import { AVATAR_PRESETS, normalizeCosmetic, type FrameId } from "@/lib/profile/cosmetics";

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
  const fullAccount = isFullAccountUser(user);
  useDefaultOnlinePresence(uid, fullAccount);
  const map = usePlayerCosmetics(uid ? [uid] : []);
  const live = uid ? map[uid] : undefined;
  const resolved = useMemo(() => normalizeCosmetic(live as Record<string, unknown> | undefined), [live]);

  const [avatarId, setAvatarId] = useState(resolved.avatarId);
  const [frameId, setFrameId] = useState<FrameId>(resolved.avatarFrameId as FrameId);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoErr, setPhotoErr] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadPhase, setUploadPhase] = useState<"idle" | "compressing" | "uploading">("idle");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAvatarId(resolved.avatarId);
    setFrameId(resolved.avatarFrameId as FrameId);
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
    if (!uid || !fullAccount) return;
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
  }, [uid, fullAccount, avatarId, frameId]);

  const applyProviderPhoto = useCallback(async () => {
    if (!uid || !user?.photoURL || !fullAccount) return;
    resumeAudioContext();
    playUIButton();
    setPhotoBusy(true);
    setPhotoErr(null);
    try {
      await updateUserPhotoURL(uid, user.photoURL);
    } catch {
      setPhotoErr("تعذر مزامنة صورة الحساب.");
    } finally {
      setPhotoBusy(false);
    }
  }, [uid, user?.photoURL, fullAccount]);

  const onFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !uid || !fullAccount) return;
      resumeAudioContext();
      playUIButton();
      setPhotoErr(null);
      setUploadPhase("compressing");
      setUploadProgress(null);
      setPhotoBusy(true);
      try {
        const b64 = await compressAvatarImageFromFile(file);
        setUploadPhase("uploading");
        setUploadProgress(12);
        await uploadProfileAvatarImage(b64, (p) => setUploadProgress(p));
        setUploadProgress(100);
      } catch (ex) {
        setPhotoErr(ex instanceof Error ? ex.message : "تعذر رفع الصورة.");
      } finally {
        setPhotoBusy(false);
        setUploadPhase("idle");
        setUploadProgress(null);
      }
    },
    [uid, fullAccount],
  );

  return (
    <div
      dir="rtl"
      className="relative min-h-[100dvh] w-full overflow-x-hidden select-none"
      style={{
        background:
          "radial-gradient(120% 70% at 50% 0%, #FFF1DF 0%, #FCE8D2 55%, #FFEFD8 100%)",
      }}
    >
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={(e) => void onFileChange(e)}
      />

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
          {fullAccount ? (
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => router.push("/friends")}
              className="rounded-2xl bg-gradient-to-b from-[#ede9fe] to-[#f5f3ff] px-3 py-2 text-xs font-extrabold text-[#5b21b6] shadow-[0_4px_12px_rgba(139,92,246,0.2)] ring-1 ring-[#c4b5fd]"
            >
              الأصدقاء
            </motion.button>
          ) : (
            <span className="w-16" />
          )}
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

        {!fullAccount ? (
          <GuestProfileLockCard />
        ) : (
          <>
            <section className="mb-6 rounded-[1.75rem] border border-[#f4d4af] bg-[#fffaf5] p-4 shadow-inner">
              <p className="mb-3 text-sm font-black text-[#8a3f16]">صورة الملف</p>
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    disabled={photoBusy}
                    onClick={() => fileRef.current?.click()}
                    className="flex-1 min-w-[9rem] rounded-2xl bg-gradient-to-b from-[#FF9F0A] to-[#FF6B00] px-4 py-3 text-sm font-black text-white shadow-[0_6px_0_#be5200] disabled:opacity-55"
                  >
                    {photoBusy && uploadPhase === "compressing"
                      ? "جاري تجهيز الصورة…"
                      : photoBusy && uploadPhase === "uploading"
                        ? "جاري الرفع…"
                        : "رفع من المعرض"}
                  </motion.button>
                  {user?.photoURL ? (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      disabled={photoBusy}
                      onClick={() => void applyProviderPhoto()}
                      className="flex-1 min-w-[9rem] rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-[#8a3f16] shadow-[0_4px_12px_rgba(196,134,82,0.15)] ring-1 ring-[#f4d4af] disabled:opacity-55"
                    >
                      صورة Google / البريد
                    </motion.button>
                  ) : null}
                </div>

                <AnimatePresence>
                  {uploadProgress !== null && photoBusy ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden rounded-xl bg-white/90 p-2 ring-1 ring-[#f4d4b0]"
                    >
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#ffe8cf]">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-[#FF9F0A] to-[#FF6B00]"
                          initial={{ width: "0%" }}
                          animate={{ width: `${uploadProgress}%` }}
                          transition={{ type: "tween", duration: 0.25 }}
                        />
                      </div>
                      <p className="mt-1 text-center text-[10px] font-bold text-[#a16231]">جاري الرفع… {uploadProgress}%</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                <AnimatePresence>
                  {photoErr ? (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-xs font-bold text-red-800"
                    >
                      {photoErr}
                    </motion.p>
                  ) : null}
                </AnimatePresence>

                <p className="text-[11px] font-semibold leading-relaxed text-[#bc7a45]">
                  نضغط الصورة تلقائياً لمربع ناعم وJPEG خفيف — آمنة للجوال. الحد الأقصى للرفع يُتحقق على الخادم.
                </p>
              </div>
            </section>

            <section className="mb-6 rounded-[1.75rem] border border-[#f4d4af] bg-[#fffaf5] p-4 shadow-inner">
              <p className="mb-3 text-sm font-black text-[#8a3f16]">الشكل الافتراضي</p>
              <p className="mb-3 text-[11px] font-semibold text-[#bc7a45]">بدون صورة رفع، يظهر رسم لطيف يطابق أسلوب اللعبة.</p>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-4">
                {AVATAR_PRESETS.map((a, presetIndex) => (
                  <motion.button
                    key={a.id}
                    type="button"
                    whileTap={{ scale: 0.92 }}
                    onClick={() => {
                      resumeAudioContext();
                      playUIButton();
                      setAvatarId(a.id);
                    }}
                    aria-label={`شكل افتراضي ${presetIndex + 1}`}
                    className={`flex aspect-square items-center justify-center rounded-2xl p-1 ${
                      avatarId === a.id
                        ? "bg-gradient-to-b from-[#FF9F0A] to-[#FF6B00] shadow-[0_6px_0_#be5200] ring-2 ring-[#FF9F0A]/80"
                        : "bg-white/90 ring-1 ring-[#f4d4af]"
                    }`}
                  >
                    <span
                      className={`flex items-center justify-center overflow-hidden rounded-full ${
                        avatarId === a.id ? "ring-2 ring-white/90" : ""
                      }`}
                      style={{ width: 44, height: 44 }}
                    >
                      <DefaultAvatarIllustration avatarId={a.id} size={44} />
                    </span>
                  </motion.button>
                ))}
              </div>
            </section>

            <section className="mb-8 rounded-[1.75rem] border border-[#f4d4af] bg-[#fffaf5] p-4 shadow-inner">
              <p className="mb-2 text-sm font-black text-[#8a3f16]">إطار متحرك</p>
              <FramePicker
                previewCosmetic={previewCosmetic}
                selectedFrameId={frameId}
                onSelect={setFrameId}
                fallbackPhotoURL={user?.photoURL}
                displayName={user?.displayName ?? undefined}
              />
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
          </>
        )}

        <p className="mt-4 text-center text-[11px] font-semibold text-[#bc7a45]">
          يظهر مظهرك للاعبين في الغرفة والدردشة بعد الحفظ.
        </p>
      </div>
    </div>
  );
}
