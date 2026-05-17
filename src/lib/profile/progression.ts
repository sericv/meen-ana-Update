import { FRAME_REGISTRY, type FrameId } from "@/lib/profile/cosmetics";

/** Single soft currency — spent in the frame shop and on hints. */
export const SHOP_FRAME_PRICE = 100;
/** Hint pack in shop: +3 bonus hints stored on profile. */
export const HINT_PACK_SIZE = 3;
export const HINT_PACK_PRICE = 45;
/** Per-hint coin cost when free match hints and bonus credits are exhausted. */
export const HINT_COIN_PRICE = 20;
/** Free hints granted each active match. */
export const MATCH_FREE_HINTS = 2;

/** Purchasable frame IDs (excludes the free “none” frame). */
export const SHOP_FRAME_IDS: FrameId[] = FRAME_REGISTRY.filter((f) => f.id !== "none").map(
  (f) => f.id,
);

export const SHOP_FRAME_ID_SET = new Set<string>(SHOP_FRAME_IDS);

export type PlayerProgress = {
  coins: number;
  /** Purchased hint credits usable across matches (after free per-match hints). */
  hintCredits: number;
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
};

export function normalizePlayerProgress(raw: Record<string, unknown> | undefined): PlayerProgress {
  const coins =
    typeof raw?.coins === "number" && Number.isFinite(raw.coins)
      ? Math.max(0, Math.floor(raw.coins))
      : 0;
  const hintCredits =
    typeof raw?.hintCredits === "number" && Number.isFinite(raw.hintCredits)
      ? Math.max(0, Math.floor(raw.hintCredits))
      : 0;
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
  return { coins, hintCredits, xp, matchWins, legacyFullCatalog, ownedShopFrameIds };
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

