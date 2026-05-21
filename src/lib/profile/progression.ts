import { FRAME_REGISTRY, type FrameId } from "@/lib/profile/cosmetics";
import { normalizeTacticalInventory, type TacticalInventory } from "@/lib/profile/tactical-tools";

/** Single soft currency — spent in the frame shop and on hints. */
export const SHOP_FRAME_PRICE = 50;
/** @deprecated In-match coin hints removed — buy from shop only. */
export const HINT_COIN_PRICE = 20;
/** @deprecated Use `HINT_SHOP_ITEMS` */
export const HINT_PACK_SIZE = 3;
/** @deprecated Use `HINT_SHOP_ITEMS` */
export const HINT_PACK_PRICE = 45;
/** Free hints granted each active match. Kept for old imports; current gameplay grants none. */
export const MATCH_FREE_HINTS = 0;

/** Purchasable frame IDs (excludes the free “none” frame). */
export const SHOP_FRAME_IDS: FrameId[] = FRAME_REGISTRY.filter((f) => f.id !== "none").map(
  (f) => f.id,
);

export const SHOP_FRAME_ID_SET = new Set<string>(SHOP_FRAME_IDS);

export type PlayerProgress = {
  coins: number;
  /** @deprecated Legacy — migrated to typed credits on read. */
  hintCredits: number;
  hintLetterCredits: number;
  hintCountCredits: number;
  /** Lifetime experience — level is derived from this in `level.ts`. */
  xp: number;
  matchWins: number;
  /**
   * When true, the Firestore doc has no `ownedFrameIds` field (players before the shop).
   * They keep full access to every shop frame without purchasing.
   */
  legacyFullCatalog: boolean;
  /** Present shop frames for accounts created under the economy (empty = none bought yet). */
  ownedShopFrameIds: Set<string>;
  /** Tactical tools inventory (shop purchases, consumed in matches). */
  tacticalInventory: TacticalInventory;
};

export function normalizePlayerProgress(raw: Record<string, unknown> | undefined): PlayerProgress {
  const coins =
    typeof raw?.coins === "number" && Number.isFinite(raw.coins)
      ? Math.max(0, Math.floor(raw.coins))
      : 0;
  const legacyHints =
    typeof raw?.hintCredits === "number" && Number.isFinite(raw.hintCredits)
      ? Math.max(0, Math.floor(raw.hintCredits))
      : 0;
  const hintLetterCredits =
    typeof raw?.hintLetterCredits === "number" && Number.isFinite(raw.hintLetterCredits)
      ? Math.max(0, Math.floor(raw.hintLetterCredits))
      : legacyHints;
  const hintCountCredits =
    typeof raw?.hintCountCredits === "number" && Number.isFinite(raw.hintCountCredits)
      ? Math.max(0, Math.floor(raw.hintCountCredits))
      : 0;
  const hintCredits = hintLetterCredits + hintCountCredits;
  const xp =
    typeof raw?.xp === "number" && Number.isFinite(raw.xp)
      ? Math.max(0, Math.floor(raw.xp))
      : 0;
  const matchWins =
    typeof raw?.matchWins === "number" && Number.isFinite(raw.matchWins)
      ? Math.max(0, Math.floor(raw.matchWins))
      : 0;
  const legacyFullCatalog = raw === undefined || !Object.prototype.hasOwnProperty.call(raw, "ownedFrameIds");
  const ownedShopFrameIds = new Set<string>();
  if (!legacyFullCatalog && Array.isArray(raw?.ownedFrameIds)) {
    for (const id of raw.ownedFrameIds) {
      if (typeof id === "string" && SHOP_FRAME_ID_SET.has(id)) ownedShopFrameIds.add(id);
    }
  }
  return {
    coins,
    hintCredits,
    hintLetterCredits,
    hintCountCredits,
    xp,
    matchWins,
    legacyFullCatalog,
    ownedShopFrameIds,
    tacticalInventory: normalizeTacticalInventory(raw),
  };
}

export function ownsShopFrame(p: PlayerProgress, frameId: string): boolean {
  if (frameId === "none") return true;
  if (!SHOP_FRAME_ID_SET.has(frameId)) return false;
  if (p.legacyFullCatalog) return true;
  return p.ownedShopFrameIds.has(frameId);
}

/** All shop frames the player currently owns (excludes `none`). */
export function ownedShopFramesList(p: PlayerProgress): FrameId[] {
  if (p.legacyFullCatalog) return [...SHOP_FRAME_IDS];
  return SHOP_FRAME_IDS.filter((id) => p.ownedShopFrameIds.has(id));
}

/** Frames the player may pick on their profile (always includes `none`). */
export function selectableShopFrameIds(p: PlayerProgress): FrameId[] {
  return FRAME_REGISTRY.filter((f) => f.id === "none" || ownsShopFrame(p, f.id)).map((f) => f.id);
}

