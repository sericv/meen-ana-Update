import { HttpError, jsonError, jsonOk, requireUidFromRequest } from "@/lib/server/auth";
import { getAdminDb } from "@/lib/firebase/admin";
import { col } from "@/lib/firestore/paths";
import { xpProgressInCurrentLevel } from "@/lib/profile/level";
import { FieldValue } from "firebase-admin/firestore";

const VALID_REASONS = [
  "اسم غير مناسب",
  "صورة غير مناسبة",
  "إساءة أو إزعاج",
  "غش أو استغلال ثغرات",
  "انتحال شخصية",
  "محتوى مسيء",
  "سبب آخر"
];

export async function POST(req: Request) {
  try {
    const reporterUid = await requireUidFromRequest(req);
    const body = (await req.json()) as {
      reportedUid?: string;
      reason?: string;
      customReason?: string;
      matchId?: string | null;
      roomId?: string | null;
      screen?: string;
    };

    const reportedUid = String(body.reportedUid ?? "").trim();
    const reason = String(body.reason ?? "").trim();
    const customReason = String(body.customReason ?? "").trim();
    const matchId = body.matchId || null;
    const roomId = body.roomId || null;
    const screen = String(body.screen ?? "profile").trim();

    // 1. Basic validation
    if (!reportedUid) {
      throw new HttpError(400, "معرّف اللاعب المبلغ عنه مطلوب.");
    }
    if (reportedUid === reporterUid) {
      throw new HttpError(400, "لا يمكنك الإبلاغ عن نفسك.");
    }
    if (!reason) {
      throw new HttpError(400, "سبب البلاغ مطلوب.");
    }
    if (!VALID_REASONS.includes(reason)) {
      throw new HttpError(400, "سبب البلاغ غير صالح.");
    }
    if (reason === "سبب آخر" && !customReason) {
      throw new HttpError(400, "يرجى توضيح السبب الآخر.");
    }
    if (customReason.length > 300) {
      throw new HttpError(400, "يجب ألا يتجاوز الشرح 300 حرف.");
    }

    const db = getAdminDb();

    // 2. Prevent duplicate reports for the same player with the same reason within 24 hours
    // Using a deterministic doc ID in reportThrottles to avoid composite index requirements in Firestore
    const throttleDocId = `${reporterUid}_${reportedUid}_${Buffer.from(reason).toString("hex")}`;
    const throttleRef = db.collection("reportThrottles").doc(throttleDocId);
    const throttleSnap = await throttleRef.get();

    if (throttleSnap.exists) {
      const throttleData = throttleSnap.data();
      const lastReportedAt = throttleData?.createdAt?.toDate();
      if (lastReportedAt) {
        const diffMs = Date.now() - lastReportedAt.getTime();
        const twentyFourHoursMs = 24 * 60 * 60 * 1000;
        if (diffMs < twentyFourHoursMs) {
          throw new HttpError(400, "لقد قمت بتقديم بلاغ عن هذا اللاعب لنفس السبب خلال الـ 24 ساعة الماضية.");
        }
      }
    }

    // 3. Fetch reporter profile data
    const reporterSnap = await db.collection(col.users).doc(reporterUid).get();
    if (!reporterSnap.exists) {
      throw new HttpError(400, "حساب اللاعب المبلّغ غير موجود.");
    }
    const reporterData = reporterSnap.data();
    const reporterName = reporterData?.displayName || "لاعب";
    const reporterUsername = reporterData?.username || "—";

    // 4. Fetch reported player profile data
    const reportedSnap = await db.collection(col.users).doc(reportedUid).get();
    if (!reportedSnap.exists) {
      throw new HttpError(400, "حساب اللاعب المبلّغ عنه غير موجود.");
    }
    const reportedData = reportedSnap.data();
    const reportedName = reportedData?.displayName || "لاعب";
    const reportedUsername = reportedData?.username || "—";
    const reportedPhotoURL = reportedData?.photoURL || "";
    const reportedLvlInfo = xpProgressInCurrentLevel(reportedData?.lifetimeXp ?? reportedData?.xp ?? 0);
    const reportedLevel = reportedLvlInfo.level;

    // 5. Create the report document and update throttle inside a Batch
    const reportRef = db.collection("reports").doc();
    const reportData = {
      reportId: reportRef.id,
      createdAt: FieldValue.serverTimestamp(),
      reportedUid,
      reportedName,
      reportedUsername,
      reportedLevel,
      reportedPhotoURL,
      reporterUid,
      reporterName,
      reporterUsername,
      reason,
      customReason: reason === "سبب آخر" ? customReason : "",
      status: "pending",
      matchId,
      roomId,
      screen,
      appVersion: "1.0.0",
      reviewedBy: null,
      reviewedAt: null,
      adminNote: "",
      actionTaken: "none",
    };

    const batch = db.batch();
    batch.set(throttleRef, { createdAt: FieldValue.serverTimestamp() });
    batch.set(reportRef, reportData);
    await batch.commit();

    return jsonOk({ reportId: reportRef.id });
  } catch (e: any) {
    if (e instanceof HttpError) return jsonError(e.status, e.message);
    console.error("[CreateReport] Server Error:", e);
    return jsonError(500, `حدث خطأ داخلي أثناء إرسال البلاغ: ${e?.message || String(e)}`);
  }
}
