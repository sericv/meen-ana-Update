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
import { playUIButton, resumeAudioContext } from "@/lib/audio/game-sounds";
import { updateUserPhotoURL } from "@/lib/firestore/users.client";
import { compressAvatarImageFromFile } from "@/lib/profile/avatar-compress";
import { DEFAULT_AVATAR_ID, normalizeCosmetic, type PlayerCosmetic } from "@/lib/profile/cosmetics";
import { validateUsernameInput } from "@/lib/social/username";
import { motion, AnimatePresence } from "framer-motion";
import { postSocial } from "@/lib/api/social-client";

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
  borderRadius: 14,
  border: "1px solid oklch(0.85 0.03 76)",
  background: "#FFFFFF",
  fontFamily: "var(--body)",
  fontSize: 14,
  color: "#1E293B",
  outline: "none",
  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)",
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
      await postSocial("/social/username/claim", { username: usernameDraft });
      setUsernameErr(null);
    } catch (e) {
      setUsernameErr(e instanceof Error ? e.message : "تعذر تغيير اسم المستخدم.");
    } finally {
      setUsernameBusy(false);
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoBusy(true);
    setPhotoErr(null);
    setUploadProgress(null);
    setUploadPhase("compressing");
    try {
      const compressed = await compressAvatarImageFromFile(f);
      setUploadPhase("uploading");
      const url = await uploadProfileAvatarImage(compressed, (p: number) => {
        setUploadProgress(p);
      });
      await updateUserPhotoURL(uid, url);
    } catch (err) {
      setPhotoErr(err instanceof Error ? err.message : "فشل تحميل الصورة.");
    } finally {
      setPhotoBusy(false);
      setUploadPhase("idle");
      setUploadProgress(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const applyProviderPhoto = async () => {
    if (!user.photoURL) return;
    setPhotoBusy(true);
    setPhotoErr(null);
    try {
      await updateUserPhotoURL(uid, user.photoURL);
    } catch {
      setPhotoErr("فشل تعيين صورة Google.");
    } finally {
      setPhotoBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={(e) => void onFileChange(e)}
      />

      {/* Avatar Preview Bento */}
      <div className="game-card-outer w-full">
        <div className="game-card-inner p-5 bg-white border border-slate-100 rounded-[22px] flex flex-col items-center gap-3 text-center">
          <ProfileAvatar
            cosmetic={previewCosmetic}
            fallbackPhotoURL={google ? user.photoURL : null}
            displayName={displayName}
            size="xl"
            idle
            active
          />
          <h3 className="h-display text-sm font-black text-slate-800 mt-2">{displayName}</h3>
          
          {google ? (
            <p className="text-[10px] text-slate-400 font-bold max-w-[240px] mx-auto">
              لتجهيز إطار مخصص، توجه إلى تبويب{" "}
              <button
                type="button"
                className="text-[#7C3AED] underline hover:no-underline font-extrabold"
                onClick={() => {
                  resumeAudioContext();
                  playUIButton();
                  router.push("/profile?tab=purchases");
                }}
              >
                الهوية والجوائز
              </button>
              .
            </p>
          ) : (
            <p className="text-[10px] text-slate-400 font-bold max-w-[240px] mx-auto">
              الزائر يظهر بصورة موحّدة. سجّل الدخول لحفظ تقدمك وإمكانية رفع صورة شخصية.
            </p>
          )}
        </div>
      </div>

      {/* Edit Display Name Bento */}
      <div className="game-card-outer w-full">
        <div className="game-card-inner p-4 bg-white border border-slate-100 rounded-[22px] flex flex-col gap-3">
          <div className="flex flex-col text-right">
            <span className="text-xs font-black text-slate-800">الاسم الظاهر</span>
            <span className="text-[9px] text-slate-400 font-bold mt-0.5">الاسم الذي يظهر للجميع داخل اللعبة</span>
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              resumeAudioContext();
              playUIButton();
              setNameDraft(displayName);
              setNameErr(null);
              setNameModalOpen(true);
            }}
            className="w-full py-3 rounded-xl text-xs font-black bg-slate-50 hover:bg-slate-100 border border-slate-150 text-slate-600 transition-colors flex items-center justify-center gap-1.5"
            style={{ cursor: "pointer" }}
          >
            <ShellIcon name="user" size={13} color="#64748B" />
            تعديل الاسم الظاهر
          </motion.button>
        </div>
      </div>

      {/* Nickname / Username Claim Bento */}
      {google && (
        <div className="game-card-outer w-full">
          <div className="game-card-inner p-4 bg-white border border-slate-100 rounded-[22px] flex flex-col gap-3">
            <div className="flex flex-col text-right">
              <span className="text-xs font-black text-slate-800">اسم المستخدم (المعرف الفريد)</span>
              <span className="text-[9px] text-slate-400 font-bold mt-0.5">فريد ومميز — يمكن تعديله مرة كل 24 ساعة</span>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 relative" style={{ minWidth: 0 }}>
                <span
                  className="h-display font-black text-xs"
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94A3B8",
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
                  style={{ ...inputStyle, paddingRight: 30 }}
                  dir="ltr"
                />
              </div>

              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                disabled={usernameBusy}
                onClick={() => void saveUsername()}
                className="px-4 py-3 rounded-xl text-xs font-black text-white shadow-sm border border-purple-800"
                style={{
                  background: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
                  cursor: "pointer",
                }}
              >
                {usernameBusy ? "..." : "حفظ"}
              </motion.button>
            </div>

            {usernameErr && (
              <p className="text-center text-[10px] font-black text-rose-600 mt-1">
                {usernameErr}
              </p>
            )}

            {myUsername && !usernameErr && (
              <div className="text-center mt-1">
                <span className="inline-block px-3 py-1 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100">
                  اسمك الحالي: @{myUsername}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Guest registration prompt */}
      {!google && <GuestProfileLockCard />}

      {/* Avatar Image Upload Bento */}
      {google && (
        <div className="game-card-outer w-full">
          <div className="game-card-inner p-4 bg-white border border-slate-100 rounded-[22px] flex flex-col gap-3">
            <div className="flex flex-col text-right">
              <span className="text-xs font-black text-slate-800">صورة الحساب الشخصي</span>
              <span className="text-[9px] text-slate-400 font-bold mt-0.5">اختر صورة حقيقية مخصصة من ملفاتك</span>
            </div>

            <div className="flex gap-2 w-full mt-1">
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                disabled={photoBusy}
                onClick={() => {
                  resumeAudioContext();
                  playUIButton();
                  fileRef.current?.click();
                }}
                className="flex-1 py-3 rounded-xl text-xs font-black text-white shadow-sm border border-purple-800 flex items-center justify-center gap-1.5"
                style={{
                  background: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
                  cursor: "pointer",
                }}
              >
                <ShellIcon name="settings" size={13} color="#FFFFFF" />
                {photoBusy && uploadPhase === "compressing"
                  ? "جاري المعالجة..."
                  : photoBusy && uploadPhase === "uploading"
                    ? `جاري الرفع... ${uploadProgress != null ? `${uploadProgress}%` : ""}`
                    : "رفع صورة"}
              </motion.button>

              {user.photoURL && (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  disabled={photoBusy}
                  onClick={() => void applyProviderPhoto()}
                  className="px-4 py-3 rounded-xl text-xs font-black bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center gap-1"
                  style={{ cursor: "pointer" }}
                >
                  صورة Google
                </motion.button>
              )}
            </div>

            {photoErr && (
              <p className="text-[10px] font-black text-rose-600 text-center mt-1">
                {photoErr}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Edit Name Modal Dialog */}
      <AnimatePresence>
        {nameModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center px-4"
            style={{
              background: "rgba(15, 23, 42, 0.4)",
              backdropFilter: "blur(8px)",
            }}
            onClick={() => !nameBusy && setNameModalOpen(false)}
            role="presentation"
          >
            <motion.div
              initial={{ scale: 0.92, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 15 }}
              className="game-card-outer w-full max-w-[340px]"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="profile-display-name-title"
            >
              <div className="game-card-inner p-5 bg-white border border-slate-100 rounded-[22px] flex flex-col gap-4">
                <h2 id="profile-display-name-title" className="h-display font-black text-md text-slate-800 text-center">
                  تعديل الاسم الظاهر
                </h2>
                
                <div>
                  <input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    placeholder="اسمك الظاهر الجديد"
                    maxLength={40}
                    disabled={nameBusy}
                    style={{ ...inputStyle, textAlign: "center" }}
                  />
                  {nameErr && (
                    <p className="mt-2 text-center text-[10px] font-black text-rose-600">
                      {nameErr}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 mt-2 w-full">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    disabled={nameBusy || !nameDraft.trim()}
                    onClick={() => {
                      resumeAudioContext();
                      playUIButton();
                      setNameBusy(true);
                      setNameErr(null);
                      void setDisplayName(nameDraft)
                        .then(() => setNameModalOpen(false))
                        .catch((e) => setNameErr(e instanceof Error ? e.message : "تعذر حفظ الاسم"))
                        .finally(() => setNameBusy(false));
                    }}
                    className="flex-1 py-2.5 rounded-xl text-xs font-black text-white shadow-sm border border-purple-800"
                    style={{
                      background: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
                      cursor: "pointer",
                    }}
                  >
                    حفظ
                  </motion.button>
                  
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    disabled={nameBusy}
                    onClick={() => {
                      resumeAudioContext();
                      playUIButton();
                      setNameModalOpen(false);
                    }}
                    className="flex-1 py-2.5 rounded-xl text-xs font-black bg-slate-50 border border-slate-200 text-slate-600"
                    style={{ cursor: "pointer" }}
                  >
                    إلغاء
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
