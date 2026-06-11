// ═══════════════════════════════════════════════════════
//  Categories Section — CRUD, Rendering
// ═══════════════════════════════════════════════════════

import { fetchCategories, saveCategory, deleteCategory, countCardsInCategory } from "./firebase.js";
import { openModal, closeModal, getModalBody, toast, confirm, setButtonLoading } from "./ui.js";
import { DEFAULT_CATEGORIES, CATEGORY_EMOJIS } from "./config.js";

let _cats = [];

const list     = document.getElementById("cats-list");
const loading  = document.getElementById("cats-loading");
const subtitle = document.getElementById("cats-subtitle");
const navCount = document.getElementById("nav-cats-count");

// ── Init ─────────────────────────────────────────────
export async function initCategories() {
  await loadCategories();
  document.getElementById("btn-add-cat")?.addEventListener("click", () => openCatForm(null));
  return _cats;
}

async function loadCategories() {
  loading?.classList.remove("hidden");
  try {
    let firestoreCats = await fetchCategories();

    // Seed default categories if Firestore is empty
    if (firestoreCats.length === 0) {
      await seedDefaults();
      firestoreCats = await fetchCategories();
    }

    _cats = firestoreCats;
    await renderCategories();
  } catch (e) {
    // Fall back to defaults on permission/network error
    _cats = DEFAULT_CATEGORIES.map(c => ({ ...c }));
    renderCategoriesSync();
    toast("تعذّر تحميل التصنيفات من السحابة — يُعرض النسخة المحلية", "info");
  } finally {
    loading?.classList.add("hidden");
  }
}

async function seedDefaults() {
  for (const cat of DEFAULT_CATEGORIES) {
    await saveCategory(cat).catch(() => {});
  }
}

// ── Rendering ─────────────────────────────────────────
async function renderCategories() {
  list.innerHTML = "";
  subtitle.textContent = `${_cats.length} تصنيف`;
  navCount.textContent  = _cats.length;

  for (const cat of _cats) {
    let count = 0;
    try { count = await countCardsInCategory(cat.id); } catch (_) {}
    list.appendChild(buildCatItem(cat, count));
  }
}

function renderCategoriesSync() {
  list.innerHTML = "";
  subtitle.textContent = `${_cats.length} تصنيف`;
  navCount.textContent  = _cats.length;
  _cats.forEach(cat => list.appendChild(buildCatItem(cat, "—")));
}

function buildCatItem(cat, cardCount) {
  const el = document.createElement("div");
  el.className = "cat-item";
  el.dataset.id = cat.id;

  el.innerHTML = `
    <div class="cat-color-dot">${cat.emoji ?? "🌐"}</div>
    <div class="cat-info">
      <div class="cat-name">${escHtml(cat.nameAr)}</div>
      <div class="cat-id">${cat.id}</div>
    </div>
    <span class="cat-card-count">${cardCount} بطاقة</span>
    <div class="cat-actions">
      <button class="btn-icon btn-cat-edit" title="تعديل" data-id="${cat.id}">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9.5 2L12 4.5 5.5 11H3v-2.5L9.5 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        </svg>
      </button>
      ${!isDefaultCat(cat.id) ? `
        <button class="btn-icon btn-cat-delete" title="حذف" data-id="${cat.id}">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 3.5h10M5.5 3.5V2h3v1.5M3 3.5l.8 8h6.4l.8-8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      ` : ""}
    </div>
  `;

  el.querySelector(".btn-cat-edit").addEventListener("click", () => openCatForm(cat));
  el.querySelector(".btn-cat-delete")?.addEventListener("click", () => handleDeleteCat(cat));

  return el;
}

// ── Add / Edit Form ───────────────────────────────────
function openCatForm(cat) {
  const isEdit = !!cat;
  let selectedEmoji = cat?.emoji ?? "🌐";

  const emojiGrid = CATEGORY_EMOJIS.map(e =>
    `<button type="button" class="emoji-btn${e === selectedEmoji ? " selected" : ""}" data-emoji="${e}">${e}</button>`
  ).join("");

  const html = `
    <form id="cat-form" class="cat-form" autocomplete="off">
      <div class="field-group">
        <label class="field-label" for="c-name">الاسم العربي <span class="field-required">*</span></label>
        <input type="text" id="c-name" class="field-input" placeholder="مثال: طبيعة" required
          value="${escAttr(cat?.nameAr ?? "")}">
      </div>
      ${!isEdit ? `
        <div class="field-group">
          <label class="field-label" for="c-id">المعرّف (ID) <span class="field-required">*</span></label>
          <input type="text" id="c-id" class="field-input" placeholder="مثال: cat_nature" required
            pattern="cat_[a-z_]+" title="يجب أن يبدأ بـ cat_ ويحتوي على أحرف إنجليزية صغيرة وشرطات سفلية">
          <span style="font-size:11px;color:var(--text-3)">مثال: cat_nature — لا يمكن تغييره لاحقاً</span>
        </div>
        <div class="field-group">
          <label class="field-label" for="c-slug">الـ Slug</label>
          <input type="text" id="c-slug" class="field-input" placeholder="مثال: nature">
        </div>
      ` : ""}
      <div class="field-group">
        <label class="field-label">الإيموجي</label>
        <div class="emoji-grid" id="emoji-grid">
          ${emojiGrid}
        </div>
      </div>
      <div class="field-group">
        <label class="field-label" for="c-order">ترتيب العرض</label>
        <input type="number" id="c-order" class="field-input" placeholder="99" min="1" max="999"
          value="${escAttr(String(cat?.order ?? 99))}">
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-ghost" id="btn-cat-cancel">إلغاء</button>
        <button type="submit" class="btn btn-primary" id="btn-cat-save">
          ${isEdit ? "حفظ التغييرات" : "إضافة التصنيف"}
        </button>
      </div>
    </form>
  `;

  openModal(isEdit ? `تعديل: ${cat.nameAr}` : "إضافة تصنيف جديد", html);
  const body = getModalBody();

  // Auto-fill slug from ID input
  if (!isEdit) {
    const idInput   = body.querySelector("#c-id");
    const slugInput = body.querySelector("#c-slug");
    idInput?.addEventListener("input", () => {
      slugInput.value = idInput.value.replace(/^cat_/, "");
    });
  }

  // Emoji picker
  body.querySelector("#emoji-grid")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".emoji-btn");
    if (!btn) return;
    selectedEmoji = btn.dataset.emoji;
    body.querySelectorAll(".emoji-btn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
  });

  body.querySelector("#btn-cat-cancel").addEventListener("click", closeModal);

  body.querySelector("#cat-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nameAr = body.querySelector("#c-name").value.trim();
    const order  = parseInt(body.querySelector("#c-order")?.value ?? "99", 10);

    if (!nameAr) { toast("الاسم مطلوب", "error"); return; }

    let catId   = cat?.id;
    let catSlug = cat?.slug ?? "";
    if (!isEdit) {
      catId   = body.querySelector("#c-id").value.trim();
      catSlug = body.querySelector("#c-slug").value.trim() || catId.replace("cat_", "");
      if (!catId.match(/^cat_[a-z_]+$/)) {
        toast("المعرّف يجب أن يبدأ بـ cat_ ويحتوي أحرفاً إنجليزية", "error");
        return;
      }
    }

    const saveBtn = body.querySelector("#btn-cat-save");
    setButtonLoading(saveBtn, true, "جاري الحفظ…");

    try {
      const payload = { id: catId, nameAr, slug: catSlug, emoji: selectedEmoji, order: isNaN(order) ? 99 : order };
      await saveCategory(payload);

      if (isEdit) {
        const idx = _cats.findIndex(c => c.id === catId);
        if (idx !== -1) _cats[idx] = { ..._cats[idx], ...payload };
        toast("تم تحديث التصنيف", "success");
      } else {
        _cats.push(payload);
        toast("تمت إضافة التصنيف", "success");
      }

      renderCategoriesSync();
      closeModal();
    } catch (err) {
      toast("فشل الحفظ: " + err.message, "error");
      setButtonLoading(saveBtn, false);
    }
  });
}

// ── Delete ────────────────────────────────────────────
async function handleDeleteCat(cat) {
  const ok = await confirm(`هل تريد حذف تصنيف "${cat.nameAr}"؟ ستبقى البطاقات المرتبطة به.`);
  if (!ok) return;
  try {
    await deleteCategory(cat.id);
    _cats = _cats.filter(c => c.id !== cat.id);
    renderCategoriesSync();
    toast("تم حذف التصنيف", "success");
  } catch (e) {
    toast("فشل الحذف: " + e.message, "error");
  }
}

export function getCategories() { return _cats; }

function isDefaultCat(id) {
  return ["cat_general","cat_celebrities","cat_animals","cat_games","cat_anime"].includes(id);
}

function escHtml(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function escAttr(s) {
  return String(s ?? "").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
