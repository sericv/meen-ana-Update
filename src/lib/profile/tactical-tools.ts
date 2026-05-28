/** Tactical single-use tools — purchased in shop, consumed in matches. */

export type TacticalToolId = "extra_time" | "time_pressure" | "extra_question" | "shield";

export type TacticalShopItem = {
  id: TacticalToolId;
  price: number;
  nameAr: string;
  subtitleAr: string;
  descriptionAr: string;
  rulesAr: string;
};

export const EXTRA_TIME_BONUS_SEC = 15;
export const TIME_PRESSURE_QUESTION_SEC = 10;
export const SHIELD_DURATION_MS = 10 * 60 * 1000;
/** Total questions asked in match — time pressure blocked at or above this. */
export const TIME_PRESSURE_MAX_QUESTIONS_BEFORE_FINAL = 6;

export const TACTICAL_SHOP_ITEMS: readonly TacticalShopItem[] = [
  {
    id: "extra_time",
    price: 6,
    nameAr: "وقت إضافي",
    subtitleAr: "+١٥ ثانية لطرح سؤالك الآن",
    descriptionAr:
      "امنح نفسك نفسًا إضافيًا في لحظة حاسمة — تمديد ذكي لعداد السؤال فقط أثناء دورك.",
    rulesAr: "مرة واحدة في المباراة · دورك · مرحلة السؤال فقط · لا يؤثر على وقت الإجابة",
  },
  {
    id: "time_pressure",
    price: 8,
    nameAr: "ضغط الوقت",
    subtitleAr: "سؤال الخصم القادم = ١٠ ثوانٍ فقط",
    descriptionAr:
      "اضغط على خصمك قبل أن يفكر — يُقصَّر سؤاله التالي إلى عشر ثوانٍ دون المساس بوقت إجابته.",
    rulesAr: "مرة واحدة · سؤال واحد للخصم · لا يعمل في الجولة الحاسمة الأخيرة",
  },
  {
    id: "extra_question",
    price: 6,
    nameAr: "سؤال إضافي",
    subtitleAr: "اطرح سؤالين قبل أن يجيب الخصم",
    descriptionAr:
      "ضاعف فرص الاستكشاف في نفس الدور — سؤالان متتاليان ثم يجيب الخصم مرة واحدة.",
    rulesAr: "مرة واحدة · دورك · مرحلة السؤال · سؤال إضافي واحد فقط",
  },
  {
    id: "shield",
    price: 10,
    nameAr: "الدرع",
    subtitleAr: "صدّ هجوم تكتيكي واحد",
    descriptionAr:
      "حماية استراتيجية لعشر دقائق — يبطل أول أداة سلبية يوجّهها الخصم إليك، ويُستهلك هجومه أيضًا.",
    rulesAr: "مرة واحدة · يصد ضغط الوقت والهجمات السلبية · يُستهلك بعد صدّ واحد أو انتهاء المدة",
  },
] as const;

export const TACTICAL_TOOL_IDS = TACTICAL_SHOP_ITEMS.map((i) => i.id);

export function getTacticalShopItem(id: string): TacticalShopItem | undefined {
  return TACTICAL_SHOP_ITEMS.find((i) => i.id === id);
}

/** Firestore user field per tool id. */
export const TACTICAL_INVENTORY_FIELDS: Record<TacticalToolId, string> = {
  extra_time: "tacticalExtraTime",
  time_pressure: "tacticalTimePressure",
  extra_question: "tacticalExtraQuestion",
  shield: "tacticalShield",
};

export type TacticalInventory = Record<TacticalToolId, number>;

export function emptyTacticalInventory(): TacticalInventory {
  return {
    extra_time: 0,
    time_pressure: 0,
    extra_question: 0,
    shield: 0,
  };
}

export function normalizeTacticalInventory(raw: Record<string, unknown> | undefined): TacticalInventory {
  const out = emptyTacticalInventory();
  if (!raw) return out;
  for (const id of TACTICAL_TOOL_IDS) {
    const field = TACTICAL_INVENTORY_FIELDS[id];
    const v = raw[field];
    if (typeof v === "number" && Number.isFinite(v)) {
      out[id] = Math.max(0, Math.floor(v));
    }
  }
  return out;
}

export function tacticalInventoryCount(inv: TacticalInventory, id: TacticalToolId): number {
  return inv[id] ?? 0;
}
