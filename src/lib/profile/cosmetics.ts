/** Built-in avatar keys (stored in Firestore `users/{uid}.avatarId`). */
export const DEFAULT_AVATAR_ID = "star";
export const DEFAULT_FRAME_ID = "none";

export const AVATAR_PRESETS = [
  { id: "star", glyph: "⭐", labelAr: "نجم" },
  { id: "fox", glyph: "🦊", labelAr: "ثعلب" },
  { id: "lion", glyph: "🦁", labelAr: "أسد" },
  { id: "panda", glyph: "🐼", labelAr: "باندا" },
  { id: "robot", glyph: "🤖", labelAr: "روبوت" },
  { id: "alien", glyph: "👽", labelAr: "فضائي" },
  { id: "ghost", glyph: "👻", labelAr: "شبح" },
  { id: "crown", glyph: "👑", labelAr: "تاج" },
] as const;

export type AvatarPresetId = (typeof AVATAR_PRESETS)[number]["id"];

export const FRAME_OPTIONS = [
  { id: "none", labelAr: "بدون إطار" },
  { id: "crown", labelAr: "تاج ذهبي" },
  { id: "neon", labelAr: "نبض نيون" },
  { id: "cat", labelAr: "آذان قطّ" },
  { id: "orbit", labelAr: "حلقة طاقة" },
  { id: "crystal", labelAr: "كريستال" },
] as const;

export type FrameId = (typeof FRAME_OPTIONS)[number]["id"];

export type PlayerCosmetic = {
  avatarId: string;
  avatarFrameId: string;
  photoURL: string | null;
};

export function normalizeCosmetic(raw: Record<string, unknown> | undefined): PlayerCosmetic {
  return {
    avatarId: typeof raw?.avatarId === "string" && raw.avatarId ? raw.avatarId : DEFAULT_AVATAR_ID,
    avatarFrameId:
      typeof raw?.avatarFrameId === "string" && raw.avatarFrameId ? raw.avatarFrameId : DEFAULT_FRAME_ID,
    photoURL: typeof raw?.photoURL === "string" ? raw.photoURL : null,
  };
}

export function glyphForAvatarId(id: string): string {
  const p = AVATAR_PRESETS.find((a) => a.id === id);
  return p?.glyph ?? AVATAR_PRESETS[0]!.glyph;
}

export function isValidFrameId(id: string): id is FrameId {
  return FRAME_OPTIONS.some((f) => f.id === id);
}

export function isValidAvatarId(id: string): id is AvatarPresetId {
  return AVATAR_PRESETS.some((a) => a.id === id);
}
