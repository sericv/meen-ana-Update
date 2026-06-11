import { TIME_PRESSURE_MAX_QUESTIONS_BEFORE_FINAL } from "@/lib/profile/tactical-tools";
import type { MatchState } from "@/types";
import type { TacticalToolId } from "@/lib/profile/tactical-tools";
import type { TacticalInventory } from "@/lib/profile/tactical-tools";

function myTactical(match: MatchState | null, uid: string | null) {
  if (!match || !uid) return {};
  return match.tacticalByUid?.[uid] ?? {};
}

function shieldUp(st: { shieldActiveUntil?: { toMillis?: () => number } | null } | undefined): boolean {
  const t = st?.shieldActiveUntil;
  if (!t || typeof t.toMillis !== "function") return false;
  return t.toMillis() > Date.now();
}

export function canUseTacticalTool(args: {
  toolId: TacticalToolId;
  match: MatchState | null;
  uid: string | null;
  myTurn: boolean;
  phase: string;
  inventory: TacticalInventory;
}): { ok: boolean; reason?: string } {
  const { toolId, match, uid, myTurn, phase, inventory } = args;
  if (!match || match.status !== "active" || !uid) {
    return { ok: false, reason: "المباراة غير نشطة" };
  }
  if (inventory[toolId] < 1) {
    return { ok: false, reason: "لا توجد أداة في المخزون" };
  }
  const me = myTactical(match, uid);

  switch (toolId) {
    case "extra_time": {
      if (!myTurn || phase !== "question") return { ok: false, reason: "في دور سؤالك فقط" };
      if (me.usedExtraTime) return { ok: false, reason: "استُخدمت مسبقاً" };
      return { ok: true };
    }
    case "extra_question": {
      if (!myTurn || phase !== "question") return { ok: false, reason: "في دور سؤالك فقط" };
      if (me.usedExtraQuestion) return { ok: false, reason: "استُخدمت مسبقاً" };
      return { ok: true };
    }
    case "time_pressure": {
      if (me.usedTimePressure) return { ok: false, reason: "استُخدمت مسبقاً" };
      const total = match.questionCountTotal ?? 0;
      if (total >= TIME_PRESSURE_MAX_QUESTIONS_BEFORE_FINAL) {
        return { ok: false, reason: "الجولة الحاسمة — معطّل" };
      }
      return { ok: true };
    }
    case "shield": {
      if (me.usedShield && !shieldUp(me)) {
        /* usedShield set on activation; if shield expired without block, still once per match */
      }
      if (me.usedShield) return { ok: false, reason: "استُخدمت مسبقاً" };
      if (shieldUp(me)) return { ok: false, reason: "الدرع مفعّل" };
      return { ok: true };
    }
    default:
      return { ok: false };
  }
}
