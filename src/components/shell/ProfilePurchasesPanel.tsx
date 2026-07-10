"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { playUIButton, resumeAudioContext } from "@/lib/audio/game-sounds";
import { updateUserCosmetics } from "@/lib/firestore/users.client";
import { type FrameId, type PlayerCosmetic } from "@/lib/profile/cosmetics";
import { ownedShopFramesList, type PlayerProgress } from "@/lib/profile/progression";
import { motion, AnimatePresence } from "framer-motion";

const VectorMysteryBox = ({ className }: { className?: string }) => (
  <svg className={className} width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

export function ProfilePurchasesPanel({
  uid,
  google,
  cosmetic,
  progress,
  fallbackPhotoURL,
  displayName,
}: {
  uid: string;
  google: boolean;
  cosmetic: PlayerCosmetic;
  progress: PlayerProgress | undefined;
  fallbackPhotoURL?: string | null;
  displayName: string;
}) {
  const router = useRouter();
  const [equipBusy, setEquipBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const ownedFrames = useMemo(
    () => (progress ? ownedShopFramesList(progress) : []),
    [progress],
  );
  const selectableFrames = useMemo(() => ["none" as const, ...ownedFrames], [ownedFrames]);

  const equip = useCallback(
    async (fid: FrameId) => {
      if (!google) return;
      resumeAudioContext();
      playUIButton();
      setEquipBusy(fid);
      setToast(null);
      try {
        await updateUserCosmetics(uid, { avatarFrameId: fid });
        setToast("تم تجهيز إطار صورتك الرمزية بنجاح!");
      } catch {
        setToast("تعذر تغيير الإطار حالياً، يرجى المحاولة لاحقاً.");
      } finally {
        setEquipBusy(null);
      }
    },
    [uid, google],
  );

  if (!progress) {
    return <p className="py-8 text-center text-xs font-black text-slate-400">جاري تحميل المعرض...</p>;
  }

  const showEmptyFrames = !progress.legacyFullCatalog && ownedFrames.length === 0;

  return (
    <div className="flex flex-col gap-4">
      
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-center text-xs font-black text-[#7C3AED]"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {!showEmptyFrames && (
        <div className="grid grid-cols-3 gap-3">
          {selectableFrames.map((fid) => {
            const isEq = cosmetic.avatarFrameId === fid;
            const busy = equipBusy === fid;
            const isNone = fid === "none";
            
            return (
              <motion.button
                key={fid}
                type="button"
                disabled={!google || busy || isEq}
                onClick={() => void equip(fid)}
                whileTap={{ scale: 0.96 }}
                className={`game-card-outer text-right ${!google ? "opacity-50" : ""}`}
                style={{ cursor: google && !busy && !isEq ? "pointer" : "default" }}
              >
                <div 
                  className={`game-card-inner p-3.5 bg-white border rounded-[22px] flex flex-col items-center gap-3 justify-center transition-all ${
                    isEq ? "border-[#7C3AED]" : "border-slate-100"
                  }`}
                >
                  <ProfileAvatar
                    cosmetic={{ ...cosmetic, avatarFrameId: fid }}
                    fallbackPhotoURL={fallbackPhotoURL}
                    displayName={displayName}
                    size="md"
                  />
                  
                  <span 
                    className={`px-2 py-0.5 text-[8px] font-black rounded-full select-none ${
                      isEq 
                        ? "bg-purple-50 text-[#7C3AED] border border-purple-100" 
                        : "bg-slate-50 text-slate-500 border border-slate-100"
                    }`}
                  >
                    {busy ? "..." : isEq ? "مفعّل" : isNone ? "افتراضي" : "تجهيز"}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {showEmptyFrames && (
        <div className="game-card-outer w-full">
          <div className="game-card-inner p-8 bg-white border border-slate-100 rounded-[22px] flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center text-[#7C3AED]">
              <VectorMysteryBox />
            </div>
            
            <div style={{ lineHeight: 1.25 }}>
              <h3 className="h-display text-sm font-black text-slate-800">معرض الإطارات فارغ</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-1 max-w-[200px] mx-auto">
                لا تمتلك أي إطارات إضافية حالياً. احصل على إطاراتك المميزة من المتجر السحري!
              </p>
            </div>

            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => router.push("/shop")}
              className="px-4 py-2 text-xs font-black text-white shadow-sm rounded-xl active:scale-95 transition-transform border border-purple-800"
              style={{
                background: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
                cursor: "pointer",
              }}
            >
              زيارة المتجر السحري
            </motion.button>
          </div>
        </div>
      )}

    </div>
  );
}
