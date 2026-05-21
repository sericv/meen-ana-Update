import { HttpError, jsonError, jsonOk, requireUidFromRequest } from "@/lib/server/auth";
import { handleHint } from "@/lib/server/game-server";

export async function POST(req: Request) {
  try {
    const uid = await requireUidFromRequest(req);
    const body = (await req.json()) as {
      roomId?: string;
      matchId?: string;
      kind?: "letter" | "count";
    };
    if (!body.roomId || !body.matchId || (body.kind !== "letter" && body.kind !== "count")) {
      return jsonError(400, "بيانات ناقصة");
    }
    const result = await handleHint({
      roomId: body.roomId,
      matchId: body.matchId,
      uid,
      kind: body.kind,
    });
    return jsonOk(result);
  } catch (e) {
    if (e instanceof HttpError) return jsonError(e.status, e.message);
    const msg = String(e instanceof Error ? e.message : e);
    const map: Record<string, string> = {
      MATCH_NOT_FOUND: "المباراة غير موجودة",
      MATCH_ENDED: "انتهت المباراة",
      NOT_IN_MATCH: "لست ضمن هذه المباراة",
      CARD_NOT_FOUND: "بطاقتك غير جاهزة",
      NO_HINTS_LEFT: "لا تلميحات متبقية",
      HINT_ALREADY_USED: "استخدمت تلميحك الوحيد في هذه المباراة",
      ALL_REVEALED: "كُشفت كل الأحرف",
      COUNT_ALREADY: "عرفت عدد الأحرف مسبقاً",
    };
    return jsonError(400, map[msg] ?? "تعذر استخدام التلميح");
  }
}
