"use client";

import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import type { PlayerCosmetic } from "@/lib/profile/cosmetics";

type FrameStyle = "gold" | "silver" | "bronze" | "simple";

type Props = {
  cosmetic: PlayerCosmetic | null | undefined;
  fallbackPhotoURL?: string | null;
  displayName?: string;
  size: number;
  /** @deprecated Home/social avatars are now shown plain without decorative frame chrome. */
  frame?: FrameStyle;
  online?: boolean;
};

const SIZE_TO_PROFILE = (px: number): "xs" | "sm" | "md" | "lg" | "xl" => {
  if (px <= 34) return "xs";
  if (px <= 44) return "sm";
  if (px <= 56) return "md";
  if (px <= 78) return "lg";
  return "xl";
};

export function ShellFramedAvatar({
  cosmetic,
  fallbackPhotoURL,
  displayName,
  size,
  online,
}: Props) {
  const plainCosmetic = cosmetic ? { ...cosmetic, avatarFrameId: "none" } : cosmetic;

  return (
    <ProfileAvatar
      cosmetic={plainCosmetic}
      fallbackPhotoURL={fallbackPhotoURL}
      displayName={displayName}
      size={SIZE_TO_PROFILE(size)}
      showPulseDot={online}
      idle={online}
    />
  );
}
