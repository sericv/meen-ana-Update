"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { ShellCoin } from "@/components/shell/ShellCoin";
import { ShellIcon } from "@/components/shell/ShellIcons";
import { playUIButton, resumeAudioContext } from "@/lib/audio/game-sounds";
import { updateUserCosmetics } from "@/lib/firestore/users.client";
import { type FrameId, type PlayerCosmetic } from "@/lib/profile/cosmetics";
import { ownedShopFramesList, type PlayerProgress } from "@/lib/profile/progression";

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

  const letterHints = progress?.hintLetterCredits ?? 0;
  const countHints = progress?.hintCountCredits ?? 0;

  const equip = useCallback(
    async (fid: FrameId) => {
      if (!google) return;
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
    [uid, google],
  );

  if (!progress) {
    return <p className="py-8 text-center text-sm muted">جاري التحميل…</p>;
  }

  const showEmptyFrames = !progress.legacyFullCatalog && ownedFrames.length === 0;

  return (
    <div className="col gap-3">
      {toast ? (
        <p className="surf text-center text-sm fw-7" style={{ padding: 10 }}>
          {toast}
        </p>
      ) : null}

      <section className="surf" style={{ padding: 14 }}>
        <p className="h-display fw-7 text-md mb-2">تلميحاتك المحفوظة</p>
        <div className="row gap-2" style={{ flexWrap: "wrap" }}>
          <span className="chip chip-amber" style={{ gap: 6 }}>
            <ShellIcon name="lightbulb" size={14} />
            حرف: {letterHints}
          </span>
          <span className="chip" style={{ gap: 6 }}>
            <ShellIcon name="search" size={14} />
            عدد: {countHints}
          </span>
        </div>
        {letterHints + countHints === 0 ? (
          <p className="text-xs muted mt-2">اشترِ تلميحات من المتجر لاستخدامها في المباراة.</p>
        ) : (
          <p className="text-xs muted mt-2">تُستخدم بعد التلميحات المجانية في كل مباراة — لا يمكن الشراء أثناء اللعب.</p>
        )}
        <button type="button" className="btn btn-secondary btn-sm mt-3" onClick={() => router.push("/shop")}>
          المتجر
        </button>
      </section>

      <p className="h-display fw-7 text-md px-1">إطاراتك</p>
      {showEmptyFrames ? (
        <div className="surf center col" style={{ padding: 24, textAlign: "center", gap: 8 }}>
          <ShellIcon name="shop" size={28} color="var(--fg-3)" />
          <p className="fw-7">لا توجد إطارات بعد</p>
          <p className="text-sm muted">ابدأ من المتجر بإطارك الأول.</p>
          <button type="button" className="btn btn-primary btn-sm mt-2" onClick={() => router.push("/shop")}>
            إلى المتجر
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {ownedFrames.map((fid) => {
            const isEq = cosmetic.avatarFrameId === fid;
            const busy = equipBusy === fid;
            return (
              <button
                key={fid}
                type="button"
                disabled={!google || busy}
                onClick={() => void equip(fid)}
                className="surf"
                style={{
                  padding: 12,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  border: isEq ? "1.5px solid var(--amber)" : "1px solid oklch(0.78 0.04 65 / .4)",
                  boxShadow: isEq ? "var(--glow-amber)" : "var(--sh-2)",
                  opacity: google ? 1 : 0.85,
                }}
              >
                <ProfileAvatar
                  cosmetic={{ ...cosmetic, avatarFrameId: fid }}
                  fallbackPhotoURL={fallbackPhotoURL}
                  displayName={displayName}
                  size="md"
                />
                {isEq ? <span className="chip chip-amber" style={{ fontSize: 9 }}>مفعّل</span> : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
