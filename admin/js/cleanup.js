// ═══════════════════════════════════════════════════════
//  Cleanup — Safe Deletion Tools + Danger Zone
// ═══════════════════════════════════════════════════════

import { previewCleanup, executeCleanup } from "./firebase.js";
import { toast, confirm } from "./ui.js";

const CONFIRMATION_PHRASE = "أكد الحذف";

// ── Init ─────────────────────────────────────────────
export function initCleanup() {
  wireCleanupTool("matches", "حذف مباريات منتهية");
  wireCleanupTool("rooms",   "حذف غرف مهجورة");
  wireDangerZone();
}

// ── Cleanup tool ──────────────────────────────────────
function wireCleanupTool(type, label) {
  const previewBtn = document.getElementById(`btn-preview-${type}`);
  const deleteBtn  = document.getElementById(`btn-delete-${type}`);
  const daysEl     = document.getElementById(`days-${type}`);
  const resultEl   = document.getElementById(`result-${type}`);
  if (!previewBtn || !deleteBtn) return;

  let previewCount = null;

  previewBtn.addEventListener("click", async () => {
    const days = parseInt(daysEl?.value ?? "30", 10);
    if (!days || days < 1) { toast("أدخل عدد أيام صالح", "error"); return; }

    previewBtn.textContent = "جاري الفحص…";
    previewBtn.disabled = true;
    resultEl.innerHTML = "";

    try {
      previewCount = await previewCleanup(type, days);
      resultEl.innerHTML = `
        <div class="preview-result ${previewCount === 0 ? "preview-zero" : "preview-warn"}">
          ${previewCount === 0
            ? "✓ لا توجد وثائق بحاجة إلى حذف"
            : `⚠️ سيتم حذف <strong>${previewCount}</strong> وثيقة — المباريات والغرف النشطة محمية`}
        </div>
      `;
      deleteBtn.disabled = previewCount === 0;
    } catch (e) {
      toast("فشل الفحص: " + e.message, "error");
    } finally {
      previewBtn.textContent = "فحص";
      previewBtn.disabled = false;
    }
  });

  deleteBtn.addEventListener("click", async () => {
    const days = parseInt(daysEl?.value ?? "30", 10);
    if (previewCount === null) { toast("افحص أولاً قبل الحذف", "error"); return; }
    if (previewCount === 0)    { toast("لا يوجد شيء للحذف", "info"); return; }

    const ok = await confirm(`تأكيد: حذف ${previewCount} وثيقة من "${label}" (أقدم من ${days} يوم)؟\n\nالمباريات والغرف النشطة محمية ولن تُمس.`);
    if (!ok) return;

    deleteBtn.textContent = "جاري الحذف…";
    deleteBtn.disabled = true;
    previewBtn.disabled = true;

    try {
      const deleted = await executeCleanup(type, days, (n) => {
        deleteBtn.textContent = `حُذف ${n}…`;
      });
      resultEl.innerHTML = `<div class="preview-result preview-done">✓ تم حذف ${deleted} وثيقة بنجاح</div>`;
      toast(`✓ تم حذف ${deleted} وثيقة`, "success");
      previewCount = null;
      deleteBtn.disabled = true;
    } catch (e) {
      toast("فشل الحذف: " + e.message, "error");
    } finally {
      deleteBtn.textContent = "حذف";
      previewBtn.disabled = false;
    }
  });
}

// ── Danger zone ───────────────────────────────────────
function wireDangerZone() {
  const confirmInput = document.getElementById("danger-confirm-input");
  const dangerBtn    = document.getElementById("btn-danger-execute");
  const dangerAction = document.getElementById("danger-action-select");
  if (!confirmInput || !dangerBtn) return;

  confirmInput.addEventListener("input", () => {
    dangerBtn.disabled = confirmInput.value.trim() !== CONFIRMATION_PHRASE;
  });

  dangerBtn.addEventListener("click", async () => {
    if (confirmInput.value.trim() !== CONFIRMATION_PHRASE) return;

    const action = dangerAction?.value ?? "";
    if (!action) { toast("اختر العملية أولاً", "error"); return; }

    const ok = await confirm(`⚠️ تحذير: هذه العملية خطرة وغير قابلة للتراجع.\n\nهل أنت متأكد من تنفيذ "${action}"؟`);
    if (!ok) {
      confirmInput.value = "";
      dangerBtn.disabled = true;
      return;
    }

    dangerBtn.textContent = "جاري التنفيذ…";
    dangerBtn.disabled = true;

    try {
      if (action === "clean-all-old-matches") {
        const deleted = await executeCleanup("matches", 0);
        toast(`✓ تم حذف ${deleted} مباراة منتهية`, "success");
      } else if (action === "clean-all-old-rooms") {
        const deleted = await executeCleanup("rooms", 0);
        toast(`✓ تم حذف ${deleted} غرفة منتهية`, "success");
      } else {
        toast("عملية غير معروفة", "error");
      }
    } catch (e) {
      toast("فشل التنفيذ: " + e.message, "error");
    } finally {
      dangerBtn.textContent = "تنفيذ";
      confirmInput.value = "";
      dangerBtn.disabled = true;
    }
  });
}
