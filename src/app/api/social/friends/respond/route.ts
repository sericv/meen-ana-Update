import { HttpError, jsonError, jsonOk, requireUidFromRequest } from "@/lib/server/auth";
import { respondFriendRequest } from "@/lib/server/social-server";
import { AdminConfigError } from "@/lib/firebase/admin";

export async function POST(req: Request) {
  try {
    const uid = await requireUidFromRequest(req);
    const body = (await req.json()) as { fromUid?: string; accept?: boolean };
    const fromUid = String(body.fromUid ?? "").trim();
    const accept = Boolean(body.accept);
    if (!fromUid) throw new HttpError(400, "معرّف المرسل مفقود.");
    await respondFriendRequest(uid, fromUid, accept);
    return jsonOk({});
  } catch (e) {
    if (e instanceof HttpError) return jsonError(e.status, e.message);
    if (e instanceof AdminConfigError) return jsonError(503, "الخادم غير مهيأ.");
    return jsonError(400, "تعذر معالجة الطلب.");
  }
}
