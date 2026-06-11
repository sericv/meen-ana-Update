import type { FrameRarity } from "@/lib/profile/cosmetics";

export function rarityColor(r: FrameRarity): string {
  return r === "legendary"
    ? "var(--gold)"
    : r === "epic"
      ? "oklch(0.72 0.16 320)"
      : r === "rare"
        ? "var(--teal)"
        : "var(--fg-3)";
}

export function rarityLabel(r: FrameRarity): string {
  return r === "legendary"
    ? "نادر جدًا"
    : r === "epic"
      ? "نادر"
      : r === "rare"
        ? "ممتاز"
        : "عادي";
}
