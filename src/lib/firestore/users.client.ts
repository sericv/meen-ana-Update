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
import { getHintShopItem } from "@/lib/profile/hints";
import { SHOP_FRAME_ID_SET, SHOP_FRAME_PRICE } from "@/lib/profile/progression";
import {
  getTacticalShopItem,
  TACTICAL_INVENTORY_FIELDS,
  type TacticalToolId,
} from "@/lib/profile/tactical-tools";

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
        hintLetterCredits: 0,
        hintCountCredits: 0,
        tacticalExtraTime: 0,
        tacticalTimePressure: 0,
        tacticalExtraQuestion: 0,
        tacticalShield: 0,
        xp: 0,
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
  const next: { avatarId?: string; avatarFrameId?: string; lastSeen: ReturnType<typeof serverTimestamp> } = {
    lastSeen: serverTimestamp(),
  };
  if (patch.avatarId !== undefined) {
    next.avatarId = patch.avatarId && isValidAvatarId(patch.avatarId) ? patch.avatarId : DEFAULT_AVATAR_ID;
  }
  if (patch.avatarFrameId !== undefined) {
    next.avatarFrameId =
      patch.avatarFrameId && isValidFrameId(patch.avatarFrameId)
        ? patch.avatarFrameId
        : DEFAULT_FRAME_ID;
  }
  await setDoc(
    ref,
    next,
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
  | "invalid_frame"
  | "guest"
  | "invalid_hint"
  | "invalid_tactical";

export class ShopPurchaseError extends Error {
  code: ShopPurchaseErrorCode;
  constructor(message: string, code: ShopPurchaseErrorCode) {
    super(message);
    this.name = "ShopPurchaseError";
    this.code = code;
  }
}

function assertNotGuest(data: Record<string, unknown>) {
  if (data.isGuest === true) {
    throw new ShopPurchaseError("الزائر يمكنه المعاينة فقط — سجّل الدخول للشراء.", "guest");
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
    assertNotGuest(data);
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

/** Buy hint credits from the shop (letter or count type). */
export async function purchaseHintItem(uid: string, itemId: string): Promise<void> {
  const item = getHintShopItem(itemId);
  if (!item) {
    throw new ShopPurchaseError("هذا المنتج غير متوفر.", "invalid_hint");
  }
  const db = getFirebaseDb();
  const ref = doc(db, col.users, uid);
  const field = item.kind === "letter" ? "hintLetterCredits" : "hintCountCredits";
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) {
      throw new ShopPurchaseError("لا يوجد ملف لاعب بعد.", "insufficient_funds");
    }
    const data = snap.data() as Record<string, unknown>;
    assertNotGuest(data);
    const coins = typeof data.coins === "number" && Number.isFinite(data.coins) ? data.coins : 0;
    if (coins < item.price) {
      throw new ShopPurchaseError("عملاتك غير كافية لشراء التلميحات.", "insufficient_funds");
    }
    transaction.update(ref, {
      coins: increment(-item.price),
      [field]: increment(item.amount),
      lastSeen: serverTimestamp(),
    });
  });
}

/** Buy a tactical tool (single inventory unit). */
export async function purchaseTacticalTool(uid: string, toolId: TacticalToolId): Promise<void> {
  const item = getTacticalShopItem(toolId);
  if (!item) {
    throw new ShopPurchaseError("هذا المنتج غير متوفر.", "invalid_tactical");
  }
  const db = getFirebaseDb();
  const ref = doc(db, col.users, uid);
  const field = TACTICAL_INVENTORY_FIELDS[toolId];
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) {
      throw new ShopPurchaseError("لا يوجد ملف لاعب بعد.", "insufficient_funds");
    }
    const data = snap.data() as Record<string, unknown>;
    assertNotGuest(data);
    const coins = typeof data.coins === "number" && Number.isFinite(data.coins) ? data.coins : 0;
    if (coins < item.price) {
      throw new ShopPurchaseError("عملاتك غير كافية لشراء الأداة.", "insufficient_funds");
    }
    transaction.update(ref, {
      coins: increment(-item.price),
      [field]: increment(1),
      lastSeen: serverTimestamp(),
    });
  });
}

/** @deprecated Use purchaseHintItem */
export async function purchaseHintPack(uid: string): Promise<void> {
  return purchaseHintItem(uid, "letter_3");
}

/* ── XP ↔ Coins exchange ────────────────────────────────────
 *  Conversion:  500 XP  =  10 coins  (floor to nearest 500 block)
 *  Partial XP:  only exact multiples of 500 are consumed.
 *  Example: 1200 XP → consumes 1000, awards 20, leaves 200 XP.
 * ──────────────────────────────────────────────────────────── */
export const XP_EXCHANGE_BLOCK = 500;   // XP per exchange block
export const COINS_PER_BLOCK   = 10;    // coins awarded per block

/** Exchange XP for coins (client-side Firestore transaction).
 *  `xpToExchange` MUST be a positive multiple of `XP_EXCHANGE_BLOCK`.
 *  Throws `ShopPurchaseError` on validation / insufficient XP. */
export async function exchangeXpForCoins(uid: string, xpToExchange: number): Promise<{ coinsAwarded: number; xpRemaining: number }> {
  if (xpToExchange <= 0 || xpToExchange % XP_EXCHANGE_BLOCK !== 0) {
    throw new ShopPurchaseError("يجب أن تكون نقاط الاستبدال مضاعفاً من 500.", "insufficient_funds");
  }
  const coinsAwarded = (xpToExchange / XP_EXCHANGE_BLOCK) * COINS_PER_BLOCK;
  const db = getFirebaseDb();
  const ref = doc(db, col.users, uid);
  let xpRemaining = 0;
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) throw new ShopPurchaseError("لا يوجد ملف لاعب.", "insufficient_funds");
    const data = snap.data() as Record<string, unknown>;
    assertNotGuest(data);
    const currentXp = typeof data.xp === "number" && Number.isFinite(data.xp) ? Math.max(0, Math.floor(data.xp)) : 0;
    if (currentXp < xpToExchange) {
      throw new ShopPurchaseError("نقاط خبرتك غير كافية للاستبدال.", "insufficient_funds");
    }
    xpRemaining = currentXp - xpToExchange;
    transaction.update(ref, {
      xp: increment(-xpToExchange),
      coins: increment(coinsAwarded),
      lastSeen: serverTimestamp(),
    });
  });
  return { coinsAwarded, xpRemaining };
}

export { awardMatchEndRewards, awardMatchWinRewards } from "@/lib/firestore/match-rewards.client";
