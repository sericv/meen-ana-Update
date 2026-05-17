import { HttpError, jsonError, jsonOk, requireUidFromRequest } from "@/lib/server/auth";
import { handleTacticalTool } from "@/lib/server/game-server";
import { TACTICAL_TOOL_IDS, type TacticalToolId } from "@/lib/profile/tactical-tools";

export async function POST(req: Request) {
  try {
    const uid = await requireUidFromRequest(req);
    const body = (await req.json()) as {
      roomId?: string;
      matchId?: string;
      toolId?: string;
      displayName?: string;
    };
    if (!body.roomId || !body.matchId || !body.toolId) {
      return jsonError(400, "بيانات ناقصة");
    }
    if (!TACTICAL_TOOL_IDS.includes(body.toolId as TacticalToolId)) {
      return jsonError(400, "أداة غير معروفة");
    }
    const result = await handleTacticalTool({
      roomId: body.roomId,
      matchId: body.matchId,
      uid,
      displayName: String(body.displayName ?? "لاعب").trim() || "لاعب",
      toolId: body.toolId as TacticalToolId,
    });
    return jsonOk(result);
  } catch (e) {
    if (e instanceof HttpError) return jsonError(e.status, e.message);
    const msg = String(e instanceof Error ? e.message : e);
    const map: Record<string, string> = {
      MATCH_NOT_FOUND: "المباراة غير موجودة",
      MATCH_ENDED: "انتهت المباراة",
      NOT_IN_MATCH: "لست ضمن هذه المباراة",
      NO_PLAYER: "لا يوجد ملف لاعب",
      NO_INVENTORY: "لا تملك هذه الأداة — اشترِها من المتجر",
      WRONG_PHASE: "لا يمكن استخدام هذه الأداة في هذه المرحلة",
      ALREADY_USED: "استخدمت هذه الأداة مسبقاً في هذه المباراة",
      FINAL_ROUND: "لا يمكن استخدام ضغط الوقت في الجولة الحاسمة",
      NO_OPPONENT: "لا يوجد خصم",
      INVALID_TOOL: "أداة غير صالحة",
    };
    return jsonError(400, map[msg] ?? "تعذر استخدام الأداة");
  }
}
