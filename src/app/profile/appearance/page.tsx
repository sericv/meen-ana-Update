"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { AccountSubpageLayout } from "@/components/profile/AccountSubpageLayout";
import { DefaultAvatarIllustration } from "@/components/profile/DefaultAvatarIllustration";
import { FramePicker } from "@/components/profile/FramePicker";
import { GuestProfileLockCard } from "@/components/profile/GuestProfileLockCard";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { useAuth } from "@/components/providers/AuthProvider";
import { useDefaultOnlinePresence } from "@/hooks/useDefaultOnlinePresence";
import { useLiveUserProfile } from "@/hooks/useLiveUserProfile";
import { uploadProfileAvatarImage } from "@/lib/api/profile-client";
import { isFullAccountUser } from "@/lib/auth/google-user";
import { playUIButton, resumeAudioContext } from "@/lib/audio/game-sounds";
import { updateUserCosmetics, updateUserPhotoURL } from "@/lib/firestore/users.client";
import { compressAvatarImageFromFile } from "@/lib/profile/avatar-compress";
import {
  AVATAR_PRESETS,
  normalizeCosmetic,
  type FrameId,
} from "@/lib/profile/cosmetics";
import { normalizePlayerProgress, ownsShopFrame } from "@/lib/profile/progression";
import { postSocial } from "@/lib/api/social-client";
import { validateUsernameInput } from "@/lib/social/username";
import { useLiveUserProfiles } from "@/hooks/useLiveUserProfiles";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";

function AppearanceInner() {
  const { user, setDisplayName } = useAuth();
  const uid = user?.uid ?? null;
  const google = isFullAccountUser(user);
  useDefaultOnlinePresence(uid, google);
  const live = useLiveUserProfile(uid);

  const resolved = useMemo(
    () => live?.cosmetic ?? normalizeCosmetic(undefined),
    [live?.cosmetic.avatarId, live?.cosmetic.avatarFrameId, live?.cosmetic.photoURL],
  );
  const progress = useMemo(
    () => live?.progress ?? normalizePlayerProgress(undefined),
    [
      live?.progress.coins,
      live?.progress.matchWins,
      live?.progress.legacyFullCatalog,
      live?.progress.ownedShopFrameIds.size,
    ],
  );

  const ownedKey = useMemo(() => {
    const p = live?.progress;
    if (!p) return "";
    return `${p.legacyFullCatalog}:${[...p.ownedShopFrameIds].sort().join(",")}`;
  }, [live?.progress]);

  const [avatarId, setAvatarId] = useState(resolved.avatarId);
  const [frameId, setFrameId] = useState<FrameId>(resolved.avatarFrameId as FrameId);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoErr, setPhotoErr] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadPhase, setUploadPhase] = useState<"idle" | "compressing" | "uploading">("idle");
  const [photoMode, setPhotoMode] = useState<"photo" | "avatar">("photo");
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [nameBusy, setNameBusy] = useState(false);
  const [nameErr, setNameErr] = useState<string | null>(null);
  const [usernameDraft, setUsernameDraft] = useState("");
  const [usernameBusy, setUsernameBusy] = useState(false);
  const [usernameErr, setUsernameErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const selfUids = useMemo(() => (uid ? [uid] : []), [uid]);
  const selfLive = useLiveUserProfiles(selfUids);
  const myUsername = uid ? selfLive[uid]?.username : null;

  useEffect(() => {
    if (myUsername) setUsernameDraft(myUsername);
  }, [myUsername]);

  useEffect(() => {
    setAvatarId(resolved.avatarId);
    const fid = resolved.avatarFrameId as FrameId;
    if (!ownsShopFrame(progress, fid)) setFrameId("none");
    else setFrameId(fid);
  }, [resolved.avatarId, resolved.avatarFrameId, ownedKey]);

  const displayName =
    user?.displayName || (user?.isAnonymous ? "زائر" : (user?.email?.split("@")[0] ?? "لاعب"));

  const previewCosmetic = useMemo(
    () => ({
      avatarId,
      avatarFrameId: frameId,
      photoURL: photoMode === "photo" ? resolved.photoURL : null,
    }),
    [avatarId, frameId, resolved.photoURL, photoMode],
  );

  const save = useCallback(async () => {
    if (!uid) return;
    resumeAudioContext();
    playUIButton();
    if (!ownsShopFrame(progress, frameId)) {
      setErr("لا يمكن حفظ إطار غير مملوك.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const ops: Promise<void>[] = [updateUserCosmetics(uid, { avatarId, avatarFrameId: frameId })];
      if (google && photoMode === "avatar" && resolved.photoURL) {
        ops.push(updateUserPhotoURL(uid, null));
      }
      await Promise.all(ops);
    } catch {
      setErr("تعذر الحفظ — تحقق من الاتصال.");
    } finally {
      setBusy(false);
    }
  }, [uid, google, avatarId, frameId, photoMode, resolved.photoURL, progress]);

  const saveUsername = async () => {
    if (!uid || !google) return;
    resumeAudioContext();
    playUIButton();
    const v = validateUsernameInput(usernameDraft);
    if (!v.ok) {
      setUsernameErr(v.error);
      return;
    }
    setUsernameBusy(true);
    setUsernameErr(null);
    try {
      await postSocial("/api/social/username", { username: v.usernameDisplay });
    } catch (e) {
      setUsernameErr(e instanceof Error ? e.message : "تعذر الحفظ");
    } finally {
      setUsernameBusy(false);
    }
  };

  const applyProviderPhoto = useCallback(async () => {
    if (!uid || !user?.photoURL || !google) return;
    resumeAudioContext();
    playUIButton();
    setPhotoBusy(true);
    setPhotoErr(null);
    try {
      await updateUserPhotoURL(uid, user.photoURL);
      setPhotoMode("photo");
    } catch {
      setPhotoErr("تعذر مزامنة صورة الحساب.");
    } finally {
      setPhotoBusy(false);
    }
  }, [uid, user?.photoURL, google]);

  const onFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !uid || !google) return;
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
        setPhotoMode("photo");
      } catch (ex) {
        setPhotoErr(ex instanceof Error ? ex.message : "تعذر رفع الصورة.");
      } finally {
        setPhotoBusy(false);
        setUploadPhase("idle");
        setUploadProgress(null);
      }
    },
    [uid, google],
  );

  if (!live && uid) {
    return (
      <AccountSubpageLayout title="المظهر والاسم">
        <p className="py-16 text-center text-sm font-bold text-[#a16231]">جاري التحميل…</p>
      </AccountSubpageLayout>
    );
  }

  return (
    <AccountSubpageLayout title="المظهر والاسم">
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={(e) => void onFileChange(e)}
      />

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 overflow-hidden rounded-[1.75rem] border border-white/75 bg-gradient-to-b from-white/95 to-[#fff8ee]/95 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_14px_36px_rgba(196,134,82,0.14)]"
      >
        <div className="flex flex-col items-center">
          <ProfileAvatar
            cosmetic={previewCosmetic}
            fallbackPhotoURL={user?.photoURL}
            displayName={displayName}
            size="xl"
            idle
            active
          />
          <p className="mt-3 text-center text-sm font-black text-[#8a3f16]">{displayName}</p>
        </div>
      </motion.section>

      <section className="mb-5 overflow-hidden rounded-[1.75rem] glass-card p-5">
        <p className="mb-3 text-sm font-black text-[#8a3f16]">الاسم الظاهر</p>
        <Button
          type="button"
          className="w-full min-h-[48px]"
          onClick={() => {
            setNameDraft(displayName);
            setNameErr(null);
            setNameModalOpen(true);
          }}
        >
          تعديل الاسم الظاهر
        </Button>
      </section>

      {google ? (
        <section className="mb-5 overflow-hidden rounded-[1.75rem] glass-card p-5">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-base">@</span>
            <p className="text-sm font-black text-[#8a3f16]">اسم المستخدم</p>
          </div>
          <p className="mb-3 text-xs font-semibold text-[#bc7a45]">فريد — يمكن تغييره مرة كل 24 ساعة.</p>
          <div className="flex gap-2.5">
            <div className="relative min-w-0 flex-1">
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-base font-black text-[#ea8c2f]">
                @
              </span>
              <Input
                value={usernameDraft}
                onChange={(e) => setUsernameDraft(e.target.value)}
                placeholder="اسم المستخدم"
                className="pr-9"
                disabled={usernameBusy}
              />
            </div>
            <Button type="button" className="shrink-0 px-5" disabled={usernameBusy} onClick={() => void saveUsername()}>
              {usernameBusy ? "…" : "حفظ"}
            </Button>
          </div>
          {usernameErr ? (
            <p className="mt-2 text-center text-xs font-bold text-red-700">{usernameErr}</p>
          ) : myUsername ? (
            <p className="mt-3 text-center text-xs font-bold text-emerald-700">اسمك: @{myUsername}</p>
          ) : null}
        </section>
      ) : null}

      {!google ? <GuestProfileLockCard /> : null}

      {google ? (
        <>
          <section className="mb-5 overflow-hidden rounded-[1.75rem] glass-card p-5">
            <p className="mb-3 text-sm font-black text-[#8a3f16]">صورة الملف</p>
            <div className="flex flex-wrap gap-2.5">
              <Button
                type="button"
                disabled={photoBusy}
                onClick={() => fileRef.current?.click()}
                className="min-h-[48px] flex-1"
              >
                {photoBusy && uploadPhase === "compressing"
                  ? "جاري التجهيز…"
                  : photoBusy && uploadPhase === "uploading"
                    ? "جاري الرفع…"
                    : "رفع صورة"}
              </Button>
              {user?.photoURL ? (
                <Button type="button" variant="ghost" disabled={photoBusy} onClick={() => void applyProviderPhoto()}>
                  صورة Google
                </Button>
              ) : null}
            </div>
            <AnimatePresence>
              {resolved.photoURL ? (
                <motion.div
                  key="mode"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3 flex justify-center"
                >
                  <Button type="button" variant="ghost" size="sm" onClick={() => setPhotoMode(photoMode === "photo" ? "avatar" : "photo")}>
                    {photoMode === "photo" ? "عرض الشكل الافتراضي" : "عرض الصورة"}
                  </Button>
                </motion.div>
              ) : null}
            </AnimatePresence>
            {photoErr ? <p className="mt-2 text-xs font-bold text-red-700">{photoErr}</p> : null}
          </section>

          <section className="mb-5 overflow-hidden rounded-[1.75rem] glass-card p-5">
            <p className="mb-4 text-sm font-black text-[#8a3f16]">الشكل الافتراضي</p>
            <div className="grid grid-cols-4 gap-2">
              {AVATAR_PRESETS.map((a, i) => (
                <motion.button
                  key={a.id}
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  onClick={() => {
                    playUIButton();
                    setAvatarId(a.id);
                    setPhotoMode("avatar");
                  }}
                  className={`rounded-2xl p-1.5 ring-1 ${
                    avatarId === a.id ? "ring-[#FF9F0A] bg-orange-50" : "ring-[#f4d4af]/60 bg-white/80"
                  }`}
                >
                  <DefaultAvatarIllustration avatarId={a.id} size={40} />
                </motion.button>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="mb-5 overflow-hidden rounded-[1.75rem] glass-card p-5">
          <p className="mb-4 text-sm font-black text-[#8a3f16]">الشكل الافتراضي</p>
          <div className="grid grid-cols-4 gap-2">
            {AVATAR_PRESETS.map((a) => (
              <motion.button
                key={a.id}
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={() => {
                  playUIButton();
                  setAvatarId(a.id);
                }}
                className={`rounded-2xl p-1.5 ring-1 ${
                  avatarId === a.id ? "ring-[#FF9F0A] bg-orange-50" : "ring-[#f4d4af]/60 bg-white/80"
                }`}
              >
                <DefaultAvatarIllustration avatarId={a.id} size={40} />
              </motion.button>
            ))}
          </div>
        </section>
      )}

      <section className="mb-5 overflow-hidden rounded-[1.75rem] glass-card p-5">
        <p className="mb-3 text-sm font-black text-[#8a3f16]">الإطار المجهّز</p>
        <p className="mb-3 text-[11px] font-semibold text-[#bc7a45]">
          يظهر فقط إطاراتك المكسوبة. المتجر يضيف المزيد إلى «المشتريات».
        </p>
        <FramePicker
          previewCosmetic={previewCosmetic}
          selectedFrameId={frameId}
          onSelect={setFrameId}
          fallbackPhotoURL={user?.photoURL}
          displayName={user?.displayName ?? undefined}
          playerProgress={progress}
          showLabels={false}
        />
      </section>

      <AnimatePresence>
        {err ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-center text-sm font-bold text-red-800"
          >
            {err}
          </motion.p>
        ) : null}
      </AnimatePresence>

      <Button type="button" className="mb-10 w-full min-h-[52px] text-lg font-black" disabled={busy} onClick={() => void save()}>
        {busy ? "جاري الحفظ…" : "حفظ المظهر"}
      </Button>

      <AnimatePresence>
        {nameModalOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-[#6a3f1b]/45 px-4 backdrop-blur-sm"
            onClick={() => !nameBusy && setNameModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm"
            >
              <Panel className="text-center">
                <h2 className="text-xl font-black text-[#8a3f16]">الاسم الظاهر</h2>
                <div className="mt-4 text-right">
                  <Input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    placeholder="اسمك"
                    maxLength={40}
                    className="min-h-[48px] text-center"
                    disabled={nameBusy}
                  />
                  {nameErr ? <p className="mt-2 text-sm text-[#c74d3d]">{nameErr}</p> : null}
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button
                    type="button"
                    className="min-h-[48px] flex-1"
                    disabled={nameBusy || !nameDraft.trim()}
                    onClick={() => {
                      setNameBusy(true);
                      setNameErr(null);
                      void setDisplayName(nameDraft)
                        .then(() => setNameModalOpen(false))
                        .catch((e) => setNameErr(e instanceof Error ? e.message : "تعذر الحفظ"))
                        .finally(() => setNameBusy(false));
                    }}
                  >
                    حفظ
                  </Button>
                  <Button type="button" variant="ghost" className="min-h-[48px] flex-1" disabled={nameBusy} onClick={() => setNameModalOpen(false)}>
                    إلغاء
                  </Button>
                </div>
              </Panel>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </AccountSubpageLayout>
  );
}

export default function AppearancePage() {
  return (
    <AuthGate>
      <AppearanceInner />
    </AuthGate>
  );
}
