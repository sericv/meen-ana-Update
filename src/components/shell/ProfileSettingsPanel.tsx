"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { GuestProfileLockCard } from "@/components/profile/GuestProfileLockCard";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { useAuth } from "@/components/providers/AuthProvider";
import { ShellIcon } from "@/components/shell/ShellIcons";
import { useLiveUserProfiles } from "@/hooks/useLiveUserProfiles";
import type { LiveUserProfile } from "@/hooks/useLiveUserProfile";
import { uploadProfileAvatarImage } from "@/lib/api/profile-client";
import { postSocial } from "@/lib/api/social-client";
import { playUIButton, resumeAudioContext } from "@/lib/audio/game-sounds";
import { updateUserPhotoURL } from "@/lib/firestore/users.client";
import { compressAvatarImageFromFile } from "@/lib/profile/avatar-compress";
import { DEFAULT_AVATAR_ID, normalizeCosmetic, type PlayerCosmetic } from "@/lib/profile/cosmetics";
import { validateUsernameInput } from "@/lib/social/username";

export type ProfileSettingsPanelUser = {
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  email?: string | null;
};

export type ProfileSettingsPanelProps = {
  uid: string;
  google: boolean;
  user: ProfileSettingsPanelUser;
  live: LiveUserProfile | null;
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid oklch(0.72 0.05 60 / 0.5)",
  background: "oklch(0.98 0.015 80)",
  fontFamily: "var(--body)",
  fontSize: 15,
  color: "var(--fg-0)",
  outline: "none",
};

export function ProfileSettingsPanel({ uid, google, user, live }: ProfileSettingsPanelProps) {
  const router = useRouter();
  const { setDisplayName } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const resolved = useMemo(
    () => live?.cosmetic ?? normalizeCosmetic(undefined),
    [live?.cosmetic.avatarId, live?.cosmetic.avatarFrameId, live?.cosmetic.photoURL],
  );

  const selfUids = useMemo(() => [uid], [uid]);
  const selfLive = useLiveUserProfiles(selfUids);
  const myUsername = selfLive[uid]?.username ?? null;

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

  useEffect(() => {
    if (myUsername) setUsernameDraft(myUsername);
  }, [myUsername]);

  const displayName =
    user.displayName ||
    (user.isAnonymous ? "زائر" : (user.email?.split("@")[0] ?? "لاعب"));

  const previewCosmetic = useMemo((): PlayerCosmetic => {
    if (!google) {
      return {
        avatarId: DEFAULT_AVATAR_ID,
        avatarFrameId: resolved.avatarFrameId,
        photoURL: null,
      };
    }
    return resolved;
  }, [google, resolved]);

  const saveUsername = async () => {
    if (!google) return;
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
    if (!user.photoURL || !google) return;
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
  }, [uid, user.photoURL, google]);

  const onFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !google) return;
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
    [google],
  );

  if (!live) {
    return <p className="py-8 text-center text-sm muted">جاري التحميل…</p>;
  }

  return (
    <div className="col gap-3">
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={(e) => void onFileChange(e)}
      />

      <section className="surf col center" style={{ padding: 18 }}>
        <ProfileAvatar
          cosmetic={previewCosmetic}
          fallbackPhotoURL={google ? user.photoURL : null}
          displayName={displayName}
          size="xl"
          idle
          active
        />
        <p className="h-display fw-8 text-md mt-3">{displayName}</p>
        {google ? (
          <p className="text-xs muted mt-2" style={{ textAlign: "center", maxWidth: 280 }}>
            لتغيير الإطار، ادخل إلى{" "}
            <button
              type="button"
              className="fw-7"
              style={{ color: "var(--amber-3)", textDecoration: "underline" }}
              onClick={() => {
                resumeAudioContext();
                playUIButton();
                router.push("/profile?tab=purchases");
              }}
            >
              المشتريات
            </button>
            .
          </p>
        ) : (
          <p className="text-xs muted mt-2" style={{ textAlign: "center", maxWidth: 260 }}>
            الزائر يظهر بصورة موحّدة. سجّل الدخول لرفع صورة وتخصيص الإطار من المشتريات.
          </p>
        )}
      </section>

      <section className="surf" style={{ padding: 14 }}>
        <p className="h-display fw-7 text-md mb-3">الاسم الظاهر</p>
        <button
          type="button"
          className="btn btn-secondary btn-block"
          onClick={() => {
            resumeAudioContext();
            playUIButton();
            setNameDraft(displayName);
            setNameErr(null);
            setNameModalOpen(true);
          }}
        >
          تعديل الاسم الظاهر
        </button>
      </section>

      {google ? (
        <section className="surf" style={{ padding: 14 }}>
          <div className="row gap-2 mb-1">
            <ShellIcon name="user" size={16} color="var(--amber-3)" />
            <p className="h-display fw-7 text-md">اسم المستخدم</p>
          </div>
          <p className="text-xs muted mb-3">فريد — يمكن تغييره مرة كل 24 ساعة.</p>
          <div className="row gap-2">
            <div className="f-1" style={{ position: "relative", minWidth: 0 }}>
              <span
                className="h-display fw-8"
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--amber-3)",
                  pointerEvents: "none",
                }}
              >
                @
              </span>
              <input
                value={usernameDraft}
                onChange={(e) => setUsernameDraft(e.target.value)}
                placeholder="اسم المستخدم"
                disabled={usernameBusy}
                style={{ ...inputStyle, paddingRight: 32 }}
                dir="ltr"
              />
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={usernameBusy}
              onClick={() => void saveUsername()}
            >
              {usernameBusy ? "…" : "حفظ"}
            </button>
          </div>
          {usernameErr ? (
            <p className="mt-2 text-center text-xs fw-7" style={{ color: "var(--lose)" }}>
              {usernameErr}
            </p>
          ) : myUsername ? (
            <p className="mt-3 text-center">
              <span className="chip chip-win">اسمك: @{myUsername}</span>
            </p>
          ) : null}
        </section>
      ) : null}

      {!google ? <GuestProfileLockCard /> : null}

      {google ? (
        <section className="surf" style={{ padding: 14 }}>
          <div className="row gap-2 mb-3">
            <ShellIcon name="settings" size={16} color="var(--amber-3)" />
            <p className="h-display fw-7 text-md">صورة الملف</p>
          </div>
          <p className="text-xs muted mb-3">
            بدون صورة مرفوعة يظهر الشكل الافتراضي الموحّد للزائر.
          </p>
          <div className="row gap-2" style={{ flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-primary f-1"
              disabled={photoBusy}
              onClick={() => {
                resumeAudioContext();
                playUIButton();
                fileRef.current?.click();
              }}
            >
              {photoBusy && uploadPhase === "compressing"
                ? "جاري التجهيز…"
                : photoBusy && uploadPhase === "uploading"
                  ? `جاري الرفع…${uploadProgress != null ? ` ${uploadProgress}%` : ""}`
                  : "رفع صورة"}
            </button>
            {user.photoURL ? (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={photoBusy}
                onClick={() => void applyProviderPhoto()}
              >
                صورة Google
              </button>
            ) : null}
          </div>
          {photoErr ? (
            <p className="mt-2 text-xs fw-7" style={{ color: "var(--lose)" }}>
              {photoErr}
            </p>
          ) : null}
        </section>
      ) : null}

      {nameModalOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center px-4"
          style={{
            background: "oklch(0.35 0.06 45 / 0.45)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => !nameBusy && setNameModalOpen(false)}
          role="presentation"
        >
          <div
            className="surf col"
            style={{ width: "100%", maxWidth: 360, padding: 18 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-display-name-title"
          >
            <h2 id="profile-display-name-title" className="h-display fw-8 text-lg text-center">
              الاسم الظاهر
            </h2>
            <div className="mt-4">
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder="اسمك"
                maxLength={40}
                disabled={nameBusy}
                style={{ ...inputStyle, textAlign: "center" }}
              />
              {nameErr ? (
                <p className="mt-2 text-center text-sm" style={{ color: "var(--lose)" }}>
                  {nameErr}
                </p>
              ) : null}
            </div>
            <div className="row gap-2 mt-5">
              <button
                type="button"
                className="btn btn-primary f-1"
                disabled={nameBusy || !nameDraft.trim()}
                onClick={() => {
                  resumeAudioContext();
                  playUIButton();
                  setNameBusy(true);
                  setNameErr(null);
                  void setDisplayName(nameDraft)
                    .then(() => setNameModalOpen(false))
                    .catch((e) => setNameErr(e instanceof Error ? e.message : "تعذر الحفظ"))
                    .finally(() => setNameBusy(false));
                }}
              >
                حفظ
              </button>
              <button
                type="button"
                className="btn btn-ghost f-1"
                disabled={nameBusy}
                onClick={() => {
                  resumeAudioContext();
                  playUIButton();
                  setNameModalOpen(false);
                }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
