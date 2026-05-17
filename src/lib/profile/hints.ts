/** Purchasable hint products — only from the shop (not during matches). */
export type HintKind = "letter" | "count";

export type HintShopItem = {
  id: string;
  kind: HintKind;
  amount: number;
  price: number;
  nameAr: string;
  subtitleAr: string;
};

export const HINT_SHOP_ITEMS: readonly HintShopItem[] = [
  {
    id: "letter_1",
    kind: "letter",
    amount: 1,
    price: 35,
    nameAr: "تلميح حرف",
    subtitleAr: "يكشف حرفًا عشوائيًا من كرتك",
  },
  {
    id: "letter_3",
    kind: "letter",
    amount: 3,
    price: 90,
    nameAr: "حزمة ٣ أحرف",
    subtitleAr: "ثلاثة تلميحات حرف محفوظة",
  },
  {
    id: "count_1",
    kind: "count",
    amount: 1,
    price: 45,
    nameAr: "تلميح العدد",
    subtitleAr: "يكشف عدد مربعات كرتك",
  },
  {
    id: "count_3",
    kind: "count",
    amount: 3,
    price: 110,
    nameAr: "حزمة ٣ عدد",
    subtitleAr: "ثلاثة تلميحات عدد محفوظة",
  },
] as const;

export function getHintShopItem(id: string): HintShopItem | undefined {
  return HINT_SHOP_ITEMS.find((i) => i.id === id);
}
