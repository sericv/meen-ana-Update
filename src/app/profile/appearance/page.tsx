"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGate } from "@/components/auth/AuthGate";
import { AccountSubpageLayout } from "@/components/profile/AccountSubpageLayout";
import { GuestProfileLockCard } from "@/components/profile/GuestProfileLockCard";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { useAuth } from "@/components/providers/AuthProvider";
import { useDefaultOnlinePresence } from "@/hooks/useDefaultOnlinePresence";
import { useLiveUserProfile } from "@/hooks/useLiveUserProfile";
import { uploadProfileAvatarImage } from "@/lib/api/profile-client";
import { isFullAccountUser } from "@/lib/auth/google-user";
import { playUIButton, resumeAudioContext } from "@/lib/audio/game-sounds";
import { updateUserPhotoURL } from "@/lib/firestore/users.client";
import { compressAvatarImageFromFile } from "@/lib/profile/avatar-compress";
import { DEFAULT_AVATAR_ID, normalizeCosmetic } from "@/lib/profile/cosmetics";
import { normalizePlayerProgress } from "@/lib/profile/progression";
import { PlayerLevelBadge } from "@/components/ui/PlayerLevelBadge";
import { postSocial } from "@/lib/api/social-client";
import { validateUsernameInput } from "@/lib/social/username";
import { useLiveUserProfiles } from "@/hooks/useLiveUserProfiles";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";

function AppearanceInner() {
  const router = useRouter();
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
      live?.progress.xp,
      live?.progress.matchWins,
      live?.progress.legacyFullCatalog,
      live?.progress.ownedShopFrameIds.size,
    ],
  );

  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoErr, setPhotoErr] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadPhase, setUploadPhase] = useState<"idle" | "compressing" | "uploading">("idle");
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

  const displayName =
    user?.displayName || (user?.isAnonymous ? "زائر" : (user?.email?.split("@")[0] ?? "لاعب"));

  const previewCosmetic = useMemo(() => {
    if (!google) {
      return {
        avatarId: DEFAULT_AVATAR_ID,
        avatarFrameId: resolved.avatarFrameId,
        photoURL: null as string | null,
      };
    }
    return resolved;
  }, [google, resolved]);

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
        <motion.div className="flex flex-col items-center">
          <ProfileAvatar
            cosmetic={previewCosmetic}
            fallbackPhotoURL={google ? user?.photoURL : null}
            displayName={displayName}
            size="xl"
            idle
            active
          />
          <p className="mt-3 text-center text-sm font-black text-[#8a3f16]">{displayName}</p>
          <PlayerLevelBadge xp={progress.xp} size="md" showBar className="mt-3 items-center" />
          {google ? (
            <p className="mt-3 max-w-[280px] text-center text-[11px] font-semibold leading-relaxed text-[#a16231]">
              لتغيير الإطار، ادخل إلى{" "}
              <button
                type="button"
                onClick={() => router.push("/profile/purchases")}
                className="font-extrabold text-[#c2530c] underline-offset-2 hover:underline"
              >
                المشتريات
              </button>
              .
            </p>
          ) : (
            <p className="mt-3 max-w-[260px] text-center text-[11px] font-semibold leading-relaxed text-[#bc7a45]">
              الزائر يظهر بصورة موحّدة. سجّل الدخول لرفع صورة وتخصيص الإطار من المشتريات.
            </p>
          )}
        </motion.div>
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
        <section className="mb-10 overflow-hidden rounded-[1.75rem] glass-card p-5">
          <p className="mb-3 text-sm font-black text-[#8a3f16]">صورة الملف</p>
          <p className="mb-3 text-[11px] font-semibold text-[#bc7a45]">
            بدون صورة مرفوعة يظهر الشكل الافتراضي الموحّد للزائر.
          </p>
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
                  ? `جاري الرفع…${uploadProgress != null ? ` ${uploadProgress}%` : ""}`
                  : "رفع صورة"}
            </Button>
            {user?.photoURL ? (
              <Button type="button" variant="ghost" disabled={photoBusy} onClick={() => void applyProviderPhoto()}>
                صورة Google
              </Button>
            ) : null}
          </div>
          {photoErr ? <p className="mt-2 text-xs font-bold text-red-700">{photoErr}</p> : null}
        </section>
      ) : null}

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
                <motion.div className="mt-4 text-right">
                  <Input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    placeholder="اسمك"
                    maxLength={40}
                    className="min-h-[48px] text-center"
                    disabled={nameBusy}
                  />
                  {nameErr ? <p className="mt-2 text-sm text-[#c74d3d]">{nameErr}</p> : null}
                </motion.div>
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
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-[48px] flex-1"
                    disabled={nameBusy}
                    onClick={() => setNameModalOpen(false)}
                  >
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
