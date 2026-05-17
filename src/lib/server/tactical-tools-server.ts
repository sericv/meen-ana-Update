import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { col } from "@/lib/firestore/paths";
import {
  EXTRA_TIME_BONUS_SEC,
  SHIELD_DURATION_MS,
  TIME_PRESSURE_MAX_QUESTIONS_BEFORE_FINAL,
  TIME_PRESSURE_QUESTION_SEC,
  type TacticalToolId,
  getTacticalShopItem,
  TACTICAL_INVENTORY_FIELDS,
} from "@/lib/profile/tactical-tools";

export type StoredTacticalPlayerState = {
  usedExtraTime?: boolean;
  usedTimePressure?: boolean;
  usedExtraQuestion?: boolean;
  usedShield?: boolean;
  shieldActiveUntilMs?: number | null;
  extraQuestionPending?: boolean;
};

export type TacticalEventPayload = {
  id: string;
  actorUid: string;
  actorName: string;
  toolId: TacticalToolId;
  titleAr: string;
  bodyAr: string;
  blocked?: boolean;
  targetUid?: string;
};

function opponentOf(order: string[], uid: string): string | null {
  return order.find((u) => u !== uid) ?? null;
}

function parseTacticalByUid(raw: unknown): Record<string, StoredTacticalPlayerState> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, StoredTacticalPlayerState> = {};
  for (const [uid, val] of Object.entries(raw as Record<string, unknown>)) {
    if (!val || typeof val !== "object" || Array.isArray(val)) continue;
    const o = val as Record<string, unknown>;
    const shieldMs =
      o.shieldActiveUntil && typeof (o.shieldActiveUntil as Timestamp).toMillis === "function"
        ? (o.shieldActiveUntil as Timestamp).toMillis()
        : typeof o.shieldActiveUntilMs === "number"
          ? o.shieldActiveUntilMs
          : null;
    out[uid] = {
      usedExtraTime: o.usedExtraTime === true,
      usedTimePressure: o.usedTimePressure === true,
      usedExtraQuestion: o.usedExtraQuestion === true,
      usedShield: o.usedShield === true,
      shieldActiveUntilMs: shieldMs,
      extraQuestionPending: o.extraQuestionPending === true,
    };
  }
  return out;
}

function playerState(
  map: Record<string, StoredTacticalPlayerState>,
  uid: string,
): StoredTacticalPlayerState {
  return map[uid] ?? {};
}

function shieldActive(st: StoredTacticalPlayerState, nowMs: number): boolean {
  const until = st.shieldActiveUntilMs ?? 0;
  return until > nowMs;
}

/** Question-phase deadline seconds for `actorUid`, applying one-shot time pressure. */
export function questionSecondsForActor(
  m: Record<string, unknown>,
  actorUid: string,
  baseQSec: number,
): { seconds: number; clearTimePressure: boolean } {
  const target = typeof m.timePressureTargetUid === "string" ? m.timePressureTargetUid : null;
  if (target && target === actorUid) {
    return { seconds: TIME_PRESSURE_QUESTION_SEC, clearTimePressure: true };
  }
  return { seconds: baseQSec, clearTimePressure: false };
}

export function buildQuestionDeadline(
  m: Record<string, unknown>,
  actorUid: string,
  baseQSec: number,
): { deadline: Timestamp; patch: Record<string, unknown> } {
  const { seconds, clearTimePressure } = questionSecondsForActor(m, actorUid, baseQSec);
  const patch: Record<string, unknown> = {
    turnDeadline: Timestamp.fromMillis(Date.now() + seconds * 1000),
  };
  if (clearTimePressure) {
    patch.timePressureTargetUid = FieldValue.delete();
  }
  return { deadline: patch.turnDeadline as Timestamp, patch };
}

function eventForTool(
  toolId: TacticalToolId,
  actorName: string,
  blocked: boolean,
): { titleAr: string; bodyAr: string } {
  const name = actorName.trim() || "لاعب";
  if (blocked) {
    return {
      titleAr: "تم صد الأداة",
      bodyAr: `تم صد الهجوم التكتيكي بواسطة درع الخصم — استُهلكت أداة ${name} دون تأثير.`,
    };
  }
  switch (toolId) {
    case "extra_time":
      return {
        titleAr: "وقت إضافي",
        bodyAr: `${name} استخدم وقتًا إضافيًا — +${EXTRA_TIME_BONUS_SEC} ثانية لسؤاله الحالي.`,
      };
    case "time_pressure":
      return {
        titleAr: "ضغط الوقت",
        bodyAr: `${name} فعّل ضغط الوقت — سؤال الخصم القادم ${TIME_PRESSURE_QUESTION_SEC} ثوانٍ فقط.`,
      };
    case "extra_question":
      return {
        titleAr: "سؤال إضافي",
        bodyAr: `${name} استخدم سؤالًا إضافيًا — يمكنه طرح سؤالين قبل إجابة الخصم.`,
      };
    case "shield":
      return {
        titleAr: "الدرع",
        bodyAr: `${name} فعّل الدرع — محمي من هجوم تكتيكي واحد لمدة ١٠ دقائق.`,
      };
    default:
      return { titleAr: "أداة تكتيكية", bodyAr: `${name} استخدم أداة.` };
  }
}

function writeEvent(
  toolId: TacticalToolId,
  actorUid: string,
  actorName: string,
  blocked: boolean,
  targetUid?: string,
): TacticalEventPayload {
  const { titleAr, bodyAr } = eventForTool(toolId, actorName, blocked);
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    actorUid,
    actorName,
    toolId,
    titleAr,
    bodyAr,
    blocked: blocked || undefined,
    targetUid,
  };
}

export async function handleTacticalTool(args: {
  roomId: string;
  matchId: string;
  uid: string;
  displayName: string;
  toolId: TacticalToolId;
}): Promise<{ event: TacticalEventPayload }> {
  const item = getTacticalShopItem(args.toolId);
  if (!item) throw new Error("INVALID_TOOL");

  const db = getAdminDb();
  const matchRef = db.collection(col.matches).doc(args.matchId);
  const userRef = db.collection(col.users).doc(args.uid);
  const invField = TACTICAL_INVENTORY_FIELDS[args.toolId];

  const event = await db.runTransaction(async (tx) => {
    const [matchSnap, userSnap] = await Promise.all([tx.get(matchRef), tx.get(userRef)]);
    if (!matchSnap.exists) throw new Error("MATCH_NOT_FOUND");
    if (!userSnap.exists) throw new Error("NO_PLAYER");
    const m = matchSnap.data()!;
    if (m.status !== "active") throw new Error("MATCH_ENDED");

    const order = (m.playerOrder as string[]) ?? [];
    if (!order.includes(args.uid)) throw new Error("NOT_IN_MATCH");

    const userData = userSnap.data() as Record<string, unknown>;
    const inv =
      typeof userData[invField] === "number" && Number.isFinite(userData[invField])
        ? Math.max(0, Math.floor(userData[invField] as number))
        : 0;
    if (inv < 1) throw new Error("NO_INVENTORY");

    const nowMs = Date.now();
    const tacticalByUid = parseTacticalByUid(m.tacticalByUid);
    const me = { ...playerState(tacticalByUid, args.uid) };
    const oppUid = opponentOf(order, args.uid);
    const actorUid = String(m.actorUid ?? "");
    const phase = (m.chatPhase as string) === "answer" ? "answer" : "question";
    const questionTotal =
      typeof m.questionCountTotal === "number" && Number.isFinite(m.questionCountTotal)
        ? Math.max(0, Math.floor(m.questionCountTotal))
        : 0;

    let ev: TacticalEventPayload;
    const matchPatch: Record<string, unknown> = {};

    switch (args.toolId) {
      case "extra_time": {
        if (actorUid !== args.uid || phase !== "question") throw new Error("WRONG_PHASE");
        if (me.usedExtraTime) throw new Error("ALREADY_USED");
        const dl = m.turnDeadline as Timestamp | undefined;
        const dlMs = dl?.toMillis?.() ?? nowMs;
        const base = Math.max(nowMs, dlMs);
        matchPatch.turnDeadline = Timestamp.fromMillis(base + EXTRA_TIME_BONUS_SEC * 1000);
        me.usedExtraTime = true;
        ev = writeEvent("extra_time", args.uid, args.displayName, false);
        break;
      }
      case "time_pressure": {
        if (me.usedTimePressure) throw new Error("ALREADY_USED");
        if (questionTotal >= TIME_PRESSURE_MAX_QUESTIONS_BEFORE_FINAL) {
          throw new Error("FINAL_ROUND");
        }
        if (!oppUid) throw new Error("NO_OPPONENT");
        const opp = { ...playerState(tacticalByUid, oppUid) };
        if (shieldActive(opp, nowMs)) {
          opp.shieldActiveUntilMs = null;
          opp.usedShield = true;
          me.usedTimePressure = true;
          tacticalByUid[oppUid] = opp;
          tacticalByUid[args.uid] = me;
          ev = writeEvent("time_pressure", args.uid, args.displayName, true, oppUid);
        } else {
          me.usedTimePressure = true;
          matchPatch.timePressureTargetUid = oppUid;
          ev = writeEvent("time_pressure", args.uid, args.displayName, false, oppUid);
        }
        tacticalByUid[args.uid] = me;
        if (oppUid && ev.blocked) tacticalByUid[oppUid] = opp;
        break;
      }
      case "extra_question": {
        if (actorUid !== args.uid || phase !== "question") throw new Error("WRONG_PHASE");
        if (me.usedExtraQuestion) throw new Error("ALREADY_USED");
        me.usedExtraQuestion = true;
        me.extraQuestionPending = true;
        tacticalByUid[args.uid] = me;
        ev = writeEvent("extra_question", args.uid, args.displayName, false);
        break;
      }
      case "shield": {
        if (me.usedShield) throw new Error("ALREADY_USED");
        me.usedShield = true;
        me.shieldActiveUntilMs = nowMs + SHIELD_DURATION_MS;
        tacticalByUid[args.uid] = me;
        ev = writeEvent("shield", args.uid, args.displayName, false);
        break;
      }
      default:
        throw new Error("INVALID_TOOL");
    }

    tacticalByUid[args.uid] = me;
    const serialized: Record<string, unknown> = {};
    for (const [uid, st] of Object.entries(tacticalByUid)) {
      const entry: Record<string, unknown> = {};
      if (st.usedExtraTime) entry.usedExtraTime = true;
      if (st.usedTimePressure) entry.usedTimePressure = true;
      if (st.usedExtraQuestion) entry.usedExtraQuestion = true;
      if (st.usedShield) entry.usedShield = true;
      if (st.extraQuestionPending) entry.extraQuestionPending = true;
      if (st.shieldActiveUntilMs && st.shieldActiveUntilMs > nowMs) {
        entry.shieldActiveUntil = Timestamp.fromMillis(st.shieldActiveUntilMs);
      }
      if (Object.keys(entry).length) serialized[uid] = entry;
    }

    matchPatch.tacticalByUid = serialized;
    matchPatch.lastTacticalEvent = {
      ...ev,
      at: FieldValue.serverTimestamp(),
    };

    tx.update(matchRef, matchPatch);
    tx.update(userRef, {
      [invField]: FieldValue.increment(-1),
      lastSeen: FieldValue.serverTimestamp(),
    });

    return ev;
  });

  return { event };
}

/** After posting a question — stay in question phase if extra question pending. */
export function applyExtraQuestionAfterQuestion(args: {
  m: Record<string, unknown>;
  uid: string;
  baseQSec: number;
}): { stayInQuestionPhase: boolean; patch: Record<string, unknown> } {
  const tacticalByUid = parseTacticalByUid(args.m.tacticalByUid);
  const me = playerState(tacticalByUid, args.uid);
  if (!me.extraQuestionPending) {
    return { stayInQuestionPhase: false, patch: {} };
  }
  me.extraQuestionPending = false;
  tacticalByUid[args.uid] = me;
  const { patch } = buildQuestionDeadline(args.m, args.uid, args.baseQSec);
  const serialized: Record<string, unknown> = {};
  for (const [uid, st] of Object.entries(tacticalByUid)) {
    const entry: Record<string, unknown> = {};
    if (st.usedExtraTime) entry.usedExtraTime = true;
    if (st.usedTimePressure) entry.usedTimePressure = true;
    if (st.usedExtraQuestion) entry.usedExtraQuestion = true;
    if (st.extraQuestionPending) entry.extraQuestionPending = true;
    if (st.shieldActiveUntilMs) entry.shieldActiveUntil = Timestamp.fromMillis(st.shieldActiveUntilMs);
    if (Object.keys(entry).length) serialized[uid] = entry;
  }
  return {
    stayInQuestionPhase: true,
    patch: {
      ...patch,
      chatPhase: "question",
      actorUid: args.uid,
      tacticalByUid: serialized,
    },
  };
}

export function incrementQuestionCountPatch(m: Record<string, unknown>): Record<string, unknown> {
  const n =
    typeof m.questionCountTotal === "number" && Number.isFinite(m.questionCountTotal)
      ? Math.max(0, Math.floor(m.questionCountTotal))
      : 0;
  return { questionCountTotal: n + 1 };
}
