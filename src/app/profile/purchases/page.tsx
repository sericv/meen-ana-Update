"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { AccountSubpageLayout } from "@/components/profile/AccountSubpageLayout";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLiveUserProfile } from "@/hooks/useLiveUserProfile";
import { playUIButton, resumeAudioContext } from "@/lib/audio/game-sounds";
import { updateUserCosmetics } from "@/lib/firestore/users.client";
import { getFrameDefinition, type FrameId } from "@/lib/profile/cosmetics";
import { ownedShopFramesList } from "@/lib/profile/progression";
import { Button } from "@/components/ui/Button";

function PurchasesInner() {
  const router = useRouter();
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const live = useLiveUserProfile(uid);
  const [equipBusy, setEquipBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const progress = live?.progress;
  const cosmetic = live?.cosmetic;

  const ownedKey = useMemo(() => {
    const p = live?.progress;
    if (!p) return "";
    return `${p.legacyFullCatalog}:${[...p.ownedShopFrameIds].sort().join(",")}`;
  }, [live?.progress]);

  const ownedFrames = useMemo(
    () => (progress ? ownedShopFramesList(progress) : []),
    [ownedKey, progress],
  );

  const equippedId = cosmetic?.avatarFrameId;

  const equip = useCallback(
    async (fid: FrameId) => {
      if (!uid) return;
      resumeAudioContext();
      playUIButton();
      setEquipBusy(fid);
      setToast(null);
      try {
        await updateUserCosmetics(uid, { avatarFrameId: fid });
        setToast("تم تجهيز الإطار.");
      } catch {
        setToast("تعذر التجهيز.");
      } finally {
        setEquipBusy(null);
      }
    },
    [uid],
  );

  if (!live && uid) {
    return (
      <AccountSubpageLayout title="المشتريات">
        <p className="py-16 text-center text-sm font-bold text-[#a16231]">جاري التحميل…</p>
      </AccountSubpageLayout>
    );
  }

  const showEmpty = progress && !progress.legacyFullCatalog && ownedFrames.length === 0;

  return (
    <AccountSubpageLayout title="المشتريات">
      {toast ? (
        <p className="mb-4 rounded-2xl border border-[#f4d4b0]/80 bg-[#fffaf3] px-4 py-2.5 text-center text-sm font-bold text-[#8a3f16]">
          {toast}
        </p>
      ) : null}

      {showEmpty ? (
        <div className="flex flex-col items-center rounded-[1.75rem] border border-dashed border-[#f0cfa5]/90 bg-gradient-to-b from-[#fffdfb] to-[#fff5e8] px-4 py-14 text-center">
          <p className="text-sm font-extrabold text-[#7a3410]">لا توجد مشتريات بعد</p>
          <p className="mt-2 max-w-[260px] text-xs font-semibold text-[#a16231]">ابدأ من المتجر بإطارك الأول.</p>
          <Button type="button" className="mt-8 max-w-[220px]" onClick={() => router.push("/shop")}>
            إلى المتجر
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {ownedFrames.map((fid) => {
            const def = getFrameDefinition(fid);
            const preview = cosmetic ? { ...cosmetic, avatarFrameId: fid } : undefined;
            const isEq = equippedId === fid;
            const busy = equipBusy === fid;
            return (
              <motion.button
                key={fid}
                type="button"
                whileTap={{ scale: 0.96 }}
                disabled={busy}
                onClick={() => void equip(fid)}
                title={def.displayNameAr}
                className={`flex aspect-square items-center justify-center rounded-[1.15rem] p-1 ring-2 transition-shadow ${
                  isEq
                    ? "ring-[#FF9F0A] bg-gradient-to-b from-amber-50 to-orange-50/90 shadow-[0_10px_26px_rgba(255,159,10,0.22)]"
                    : "ring-[#f4d4b0]/75 bg-gradient-to-b from-white to-[#fff8ee]"
                }`}
              >
                {preview ? (
                  <ProfileAvatar
                    cosmetic={preview}
                    fallbackPhotoURL={user?.photoURL}
                    displayName={user?.displayName ?? undefined}
                    size="md"
                    idle
                  />
                ) : null}
              </motion.button>
            );
          })}
        </div>
      )}

      <p className="mt-8 text-center text-[11px] font-semibold text-[#bc7a45]">
        تعديل التفاصيل الكاملة من «المظهر والاسم».
      </p>
    </AccountSubpageLayout>
  );
}

export default function PurchasesPage() {
  return (
    <AuthGate>
      <PurchasesInner />
    </AuthGate>
  );
}
