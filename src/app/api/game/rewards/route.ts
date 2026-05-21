import { HttpError, jsonError, jsonOk, requireUidFromRequest } from "@/lib/server/auth";
import { awardMatchRewards } from "@/lib/server/match-rewards-server";

export async function POST(req: Request) {
  try {
    const uid = await requireUidFromRequest(req);
    const body = (await req.json()) as { matchId?: string };
    if (!body.matchId?.trim()) {
      return jsonError(400, "بيانات ناقصة");
    }
    const result = await awardMatchRewards({ matchId: body.matchId.trim(), uid });
    return jsonOk(result as unknown as Record<string, unknown>);
  } catch (e) {
    if (e instanceof HttpError) return jsonError(e.status, e.message);
    const msg = String(e instanceof Error ? e.message : e);
    const map: Record<string, string> = {
      MATCH_NOT_FOUND: "المباراة غير موجودة",
      MATCH_NOT_ENDED: "لم تنتهِ المباراة بعد",
      NOT_IN_MATCH: "لست ضمن هذه المباراة",
    };
    return jsonError(400, map[msg] ?? "تعذر منح المكافآت");
  }
}
