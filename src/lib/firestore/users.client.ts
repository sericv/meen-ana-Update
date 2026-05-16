"use client";

import type { User } from "firebase/auth";
import {
  arrayUnion,
  doc,
  getDoc,
  increment,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import { col } from "@/lib/firestore/paths";
import { DEFAULT_AVATAR_ID, DEFAULT_FRAME_ID, isValidAvatarId, isValidFrameId } from "@/lib/profile/cosmetics";
import { SHOP_FRAME_ID_SET, SHOP_FRAME_PRICE } from "@/lib/profile/progression";

export async function upsertUserDocument(user: User) {
  const db = getFirebaseDb();
  const ref = doc(db, col.users, user.uid);
  const snap = await getDoc(ref);
  const displayFromEmail =
    user.displayName?.trim() ||
    (user.email ? user.email.split("@")[0]?.trim() : "") ||
    "";
  const base = {
    displayName: displayFromEmail || "زائر",
    photoURL: user.photoURL || null,
    isGuest: user.isAnonymous,
    lastSeen: serverTimestamp(),
  };
  if (!snap.exists()) {
    await setDoc(
      ref,
      {
        ...base,
        coins: 0,
        matchWins: 0,
        ownedFrameIds: [] as string[],
      },
      { merge: true },
    );
  } else {
    await setDoc(ref, base, { merge: true });
  }
}

/** Persist cosmetic choices (illustrated avatar preset + animated frame). */
export async function updateUserCosmetics(
  uid: string,
  patch: { avatarId?: string; avatarFrameId?: string },
): Promise<void> {
  const db = getFirebaseDb();
  const ref = doc(db, col.users, uid);
  const avatarId =
    patch.avatarId && isValidAvatarId(patch.avatarId) ? patch.avatarId : DEFAULT_AVATAR_ID;
  const avatarFrameId =
    patch.avatarFrameId && isValidFrameId(patch.avatarFrameId)
      ? patch.avatarFrameId
      : DEFAULT_FRAME_ID;
  await setDoc(
    ref,
    {
      avatarId,
      avatarFrameId,
      lastSeen: serverTimestamp(),
    },
    { merge: true },
  );
}

/** Set profile photo URL from Google/email provider or clear to use illustrated preset. */
export async function updateUserPhotoURL(uid: string, photoURL: string | null): Promise<void> {
  const db = getFirebaseDb();
  const ref = doc(db, col.users, uid);
  await setDoc(
    ref,
    {
      photoURL: photoURL ?? null,
      lastSeen: serverTimestamp(),
    },
    { merge: true },
  );
}

export type ShopPurchaseErrorCode =
  | "legacy_catalog"
  | "already_owned"
  | "insufficient_funds"
  | "invalid_frame";

export class ShopPurchaseError extends Error {
  code: ShopPurchaseErrorCode;
  constructor(message: string, code: ShopPurchaseErrorCode) {
    super(message);
    this.name = "ShopPurchaseError";
    this.code = code;
  }
}

/** Buy a shop frame with soft currency. Legacy accounts (no `ownedFrameIds`) already own the catalog. */
export async function purchaseShopFrame(uid: string, frameId: string): Promise<void> {
  if (!SHOP_FRAME_ID_SET.has(frameId)) {
    throw new ShopPurchaseError("هذا الإطار غير متوفر في المتجر.", "invalid_frame");
  }
  const db = getFirebaseDb();
  const ref = doc(db, col.users, uid);
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) {
      throw new Error("لا يوجد ملف لاعب بعد — حاول مجدداً بعد لحظات.");
    }
    const data = snap.data() as Record<string, unknown>;
    if (!Object.prototype.hasOwnProperty.call(data, "ownedFrameIds")) {
      throw new ShopPurchaseError("تمتلك بالفعل كل الإطارات على هذا الحساب.", "legacy_catalog");
    }
    const coins = typeof data.coins === "number" && Number.isFinite(data.coins) ? data.coins : 0;
    const owned = Array.isArray(data.ownedFrameIds)
      ? new Set((data.ownedFrameIds as unknown[]).filter((x): x is string => typeof x === "string"))
      : new Set<string>();
    if (owned.has(frameId)) {
      throw new ShopPurchaseError("تمتلك هذا الإطار بالفعل.", "already_owned");
    }
    if (coins < SHOP_FRAME_PRICE) {
      throw new ShopPurchaseError("عملاتك غير كافية للشراء.", "insufficient_funds");
    }
    transaction.update(ref, {
      coins: increment(-SHOP_FRAME_PRICE),
      ownedFrameIds: arrayUnion(frameId),
      lastSeen: serverTimestamp(),
    });
  });
}

/** +1 coin and +1 win tally after a match victory (client-side; best paired with session de-dupe). */
export async function awardMatchWinRewards(uid: string): Promise<void> {
  const db = getFirebaseDb();
  const ref = doc(db, col.users, uid);
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) {
      transaction.set(
        ref,
        {
          coins: 1,
          matchWins: 1,
          ownedFrameIds: [] as string[],
          lastSeen: serverTimestamp(),
        },
        { merge: true },
      );
      return;
    }
    transaction.update(ref, {
      coins: increment(1),
      matchWins: increment(1),
      lastSeen: serverTimestamp(),
    });
  });
}
