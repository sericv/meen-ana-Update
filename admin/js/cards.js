// ═══════════════════════════════════════════════════════
//  Cards Section — CRUD, Rendering, Image Handling
// ═══════════════════════════════════════════════════════

import { fetchCards, addCard, updateCard, deleteCard, toggleCardEnabled } from "./firebase.js";
import { openModal, closeModal, getModalBody, toast, confirm, setButtonLoading } from "./ui.js";
import { DEFAULT_CATEGORIES, DIFFICULTY_LABELS } from "./config.js";

// ── State ─────────────────────────────────────────────
let _allCards   = [];
let _categories = [];
let _search     = "";
let _filterCat  = "";
let _filterStat = "";

const grid     = document.getElementById("cards-grid");
const empty    = document.getElementById("cards-empty");
const loading  = document.getElementById("cards-loading");
const subtitle = document.getElementById("cards-subtitle");
const navCount = document.getElementById("nav-cards-count");

// ── Init ─────────────────────────────────────────────
export async function initCards(categories) {
  _categories = categories;
  populateCategoryFilter(categories);
  await loadCards();

  document.getElementById("btn-add-card")?.addEventListener("click", () => openCardForm(null));
  document.getElementById("btn-add-card-empty")?.addEventListener("click", () => openCardForm(null));
  document.getElementById("search-cards")?.addEventListener("input", (e) => {
    _search = e.target.value.toLowerCase();
    renderCards();
  });
  document.getElementById("filter-cat")?.addEventListener("change", (e) => {
    _filterCat = e.target.value;
    renderCards();
  });
  document.getElementById("filter-status")?.addEventListener("change", (e) => {
    _filterStat = e.target.value;
    renderCards();
  });
}

async function loadCards() {
  loading.classList.remove("hidden");
  grid.classList.add("hidden");
  empty.classList.add("hidden");
  try {
    _allCards = await fetchCards();
    renderCards();
  } catch (e) {
    toast("فشل تحميل البطاقات: " + e.message, "error");
  } finally {
    loading.classList.add("hidden");
    grid.classList.remove("hidden");
  }
}

// ── Filtering & Rendering ─────────────────────────────
function filteredCards() {
  return _allCards.filter(c => {
    if (_filterCat  && c.categoryId !== _filterCat) return false;
    if (_filterStat === "enabled"  && !c.enabled)   return false;
    if (_filterStat === "disabled" && c.enabled)    return false;
    if (_search) {
      const haystack = [
        c.nameAr, c.name,
        ...(c.tags ?? []),
        getCatName(c.categoryId),
      ].join(" ").toLowerCase();
      if (!haystack.includes(_search)) return false;
    }
    return true;
  });
}

function renderCards() {
  const cards = filteredCards();
  const total = _allCards.length;
  const shown = cards.length;

  subtitle.textContent = `${total} بطاقة · ${shown} ظاهرة`;
  navCount.textContent  = total;

  empty.classList.toggle("hidden", cards.length > 0);
  grid.innerHTML = "";

  cards.forEach(card => {
    grid.appendChild(buildCardItem(card));
  });
}

function buildCardItem(card) {
  const catName  = getCatName(card.categoryId);
  const diffCls  = `diff-${card.difficulty ?? "medium"}`;
  const diffLabel = DIFFICULTY_LABELS[card.difficulty] ?? "متوسط";
  const tags     = (card.tags ?? []).slice(0, 4);

  const el = document.createElement("div");
  el.className = `card-item${card.enabled === false ? " disabled" : ""}`;
  el.dataset.id = card.id;

  el.innerHTML = `
    <div class="card-thumb">
      ${card.imageUrl
        ? `<img src="${card.imageUrl}" alt="${card.nameAr}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\"card-thumb-placeholder\\">🃏</div>'">`
        : `<div class="card-thumb-placeholder">🃏</div>`}
    </div>
    <div class="card-body">
      <div class="card-name">${escHtml(card.nameAr)}</div>
      ${card.name ? `<div class="card-name-en">${escHtml(card.name)}</div>` : ""}
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
        <span class="card-cat-badge">${escHtml(catName)}</span>
        <span class="diff-badge ${diffCls}">${diffLabel}</span>
      </div>
      <div class="card-aliases">
        ${tags.map(t => `<span class="alias-chip">${escHtml(t)}</span>`).join("")}
        ${(card.tags ?? []).length > 4 ? `<span class="alias-chip">+${card.tags.length - 4}</span>` : ""}
      </div>
    </div>
    <div class="card-footer">
      <label class="toggle-switch${card.enabled !== false ? " on" : ""}" title="${card.enabled !== false ? "مفعّل" : "معطّل"}">
        <span class="toggle-track"></span>
        <span class="toggle-label-text">${card.enabled !== false ? "مفعّل" : "معطّل"}</span>
      </label>
      <div class="card-actions">
        <button class="btn-icon btn-edit" title="تعديل" data-id="${card.id}">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9.5 2L12 4.5 5.5 11H3v-2.5L9.5 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="btn-icon btn-delete" title="حذف" data-id="${card.id}">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 3.5h10M5.5 3.5V2h3v1.5M3 3.5l.8 8h6.4l.8-8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  `;

  el.querySelector(".toggle-switch").addEventListener("click", (e) => {
    e.stopPropagation();
    handleToggle(card.id, card.enabled !== false);
  });
  el.querySelector(".btn-edit").addEventListener("click", (e) => {
    e.stopPropagation();
    openCardForm(card);
  });
  el.querySelector(".btn-delete").addEventListener("click", (e) => {
    e.stopPropagation();
    handleDelete(card.id, card.nameAr);
  });

  return el;
}

// ── Toggle enabled ────────────────────────────────────
async function handleToggle(id, currentEnabled) {
  const newVal = !currentEnabled;
  const card = _allCards.find(c => c.id === id);
  if (card) card.enabled = newVal;
  renderCards();
  try {
    await toggleCardEnabled(id, newVal);
  } catch (e) {
    if (card) card.enabled = currentEnabled;
    renderCards();
    toast("تعذّر تحديث الحالة", "error");
  }
}

// ── Delete ────────────────────────────────────────────
async function handleDelete(id, name) {
  const ok = await confirm(`هل تريد حذف بطاقة "${name}" نهائياً؟`);
  if (!ok) return;
  try {
    await deleteCard(id);
    _allCards = _allCards.filter(c => c.id !== id);
    renderCards();
    toast("تم حذف البطاقة", "success");
  } catch (e) {
    toast("فشل الحذف: " + e.message, "error");
  }
}

// ── Add / Edit Form ───────────────────────────────────
function openCardForm(card) {
  const isEdit = !!card;
  const aliases = card?.tags ? [...card.tags] : [];
  let imageUrl  = card?.imageUrl ?? "";
  let pendingImg = imageUrl;

  const catOptions = _categories
    .map(c => `<option value="${c.id}" ${card?.categoryId === c.id ? "selected" : ""}>${c.nameAr}</option>`)
    .join("");

  const html = `
    <form id="card-form" class="card-form" autocomplete="off">
      <div class="form-layout">
        <!-- Image side -->
        <div class="form-image-side">
          <div class="image-uploader${imageUrl ? " has-image" : ""}" id="img-drop">
            ${imageUrl
              ? `<img class="image-preview-img" id="img-preview" src="${imageUrl}" alt="معاينة">`
              : `<div class="upload-prompt"><span class="upload-icon">📷</span><span class="upload-text">انقر لرفع صورة</span><span class="upload-hint">JPEG · PNG · WebP · 500KB+</span></div>`
            }
            <input type="file" id="img-file" accept="image/*" style="display:none">
          </div>
          ${imageUrl ? `<button type="button" class="btn-remove-img" id="btn-remove-img">حذف الصورة</button>` : ""}
        </div>

        <!-- Fields side -->
        <div class="form-fields-side">
          <div class="field-group">
            <label class="field-label" for="f-name-ar">الاسم العربي <span class="field-required">*</span></label>
            <input type="text" id="f-name-ar" class="field-input" placeholder="مثال: بلايستيشن" required value="${escAttr(card?.nameAr ?? "")}">
          </div>
          <div class="field-group">
            <label class="field-label" for="f-name-en">الاسم الإنجليزي</label>
            <input type="text" id="f-name-en" class="field-input" placeholder="مثال: PlayStation" value="${escAttr(card?.name ?? "")}">
          </div>
          <div class="field-group">
            <label class="field-label" for="f-cat">التصنيف <span class="field-required">*</span></label>
            <select id="f-cat" class="field-input" required>
              <option value="">اختر التصنيف…</option>
              ${catOptions}
            </select>
          </div>
          <div class="field-group">
            <label class="field-label">الإجابات المقبولة <span class="field-required">*</span></label>
            <div class="aliases-area">
              <div class="alias-add-row">
                <input type="text" id="f-alias" class="field-input" placeholder="أضف إجابة مقبولة…">
                <button type="button" class="btn btn-secondary btn-sm" id="btn-alias-add">إضافة</button>
              </div>
              <div id="f-chips" class="chips-display"></div>
            </div>
          </div>
          <div class="field-row">
            <div class="field-group">
              <label class="field-label" for="f-diff">الصعوبة</label>
              <select id="f-diff" class="field-input">
                <option value="easy"   ${(card?.difficulty ?? "medium") === "easy"   ? "selected" : ""}>سهل</option>
                <option value="medium" ${(card?.difficulty ?? "medium") === "medium" ? "selected" : ""}>متوسط</option>
                <option value="hard"   ${(card?.difficulty ?? "medium") === "hard"   ? "selected" : ""}>صعب</option>
              </select>
            </div>
            <div class="field-group">
              <label class="field-label">الحالة</label>
              <div class="toggle-field">
                <label class="toggle-switch${card?.enabled !== false ? " on" : ""}" id="enabled-toggle" style="cursor:pointer">
                  <span class="toggle-track"></span>
                  <span class="toggle-label-text" id="enabled-label">${card?.enabled !== false ? "مفعّل" : "معطّل"}</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-ghost" id="btn-form-cancel">إلغاء</button>
        <button type="submit" class="btn btn-primary" id="btn-form-save">
          ${isEdit ? "حفظ التغييرات" : "إضافة البطاقة"}
        </button>
      </div>
    </form>
  `;

  openModal(isEdit ? `تعديل: ${card.nameAr}` : "إضافة بطاقة جديدة", html);
  const body = getModalBody();

  // Render initial aliases
  renderChips(body.querySelector("#f-chips"), aliases);

  // Enabled toggle
  let enabled = card?.enabled !== false;
  const toggleEl = body.querySelector("#enabled-toggle");
  const labelEl  = body.querySelector("#enabled-label");
  toggleEl.addEventListener("click", () => {
    enabled = !enabled;
    toggleEl.classList.toggle("on", enabled);
    labelEl.textContent = enabled ? "مفعّل" : "معطّل";
  });

  // Alias add
  const aliasInput = body.querySelector("#f-alias");
  const addAliasBtn = body.querySelector("#btn-alias-add");
  const chipsEl = body.querySelector("#f-chips");

  function addAlias() {
    const val = aliasInput.value.trim();
    if (!val) return;
    if (aliases.includes(val)) { aliasInput.value = ""; return; }
    aliases.push(val);
    aliasInput.value = "";
    renderChips(chipsEl, aliases);
  }
  addAliasBtn.addEventListener("click", addAlias);
  aliasInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); addAlias(); }
  });

  // Image upload
  const dropEl   = body.querySelector("#img-drop");
  const fileInput = body.querySelector("#img-file");
  dropEl.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;
    if (file.size > 800 * 1024) { toast("الصورة أكبر من 800KB، جرّب ضغطها أولاً", "error"); return; }
    convertToBase64(file).then(b64 => {
      pendingImg = b64;
      dropEl.classList.add("has-image");
      dropEl.innerHTML = `<img class="image-preview-img" src="${b64}" alt="معاينة">
        <input type="file" id="img-file" accept="image/*" style="display:none">`;
      dropEl.querySelector("input").addEventListener("change", () => fileInput.click());
    });
  });

  // Remove image
  body.querySelector("#btn-remove-img")?.addEventListener("click", () => {
    pendingImg = "";
    dropEl.classList.remove("has-image");
    dropEl.innerHTML = `<div class="upload-prompt"><span class="upload-icon">📷</span><span class="upload-text">انقر لرفع صورة</span><span class="upload-hint">JPEG · PNG · WebP</span></div>
      <input type="file" id="img-file" accept="image/*" style="display:none">`;
    dropEl.querySelector("input").addEventListener("change", (ev) => {
      const f = ev.target.files[0];
      if (!f) return;
      convertToBase64(f).then(b64 => {
        pendingImg = b64;
        dropEl.classList.add("has-image");
        dropEl.innerHTML = `<img class="image-preview-img" src="${b64}" alt="معاينة">`;
      });
    });
    dropEl.addEventListener("click", () => dropEl.querySelector("input")?.click());
  });

  // Cancel
  body.querySelector("#btn-form-cancel").addEventListener("click", closeModal);

  // Submit
  body.querySelector("#card-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nameAr = body.querySelector("#f-name-ar").value.trim();
    const nameEn = body.querySelector("#f-name-en").value.trim();
    const catId  = body.querySelector("#f-cat").value;
    const diff   = body.querySelector("#f-diff").value;

    if (!nameAr) { toast("الاسم العربي مطلوب", "error"); return; }
    if (!catId)  { toast("يرجى اختيار التصنيف", "error"); return; }
    if (aliases.length === 0) { toast("أضف إجابة مقبولة واحدة على الأقل", "error"); return; }

    const saveBtn = body.querySelector("#btn-form-save");
    setButtonLoading(saveBtn, true, "جاري الحفظ…");

    const payload = {
      nameAr,
      name:       nameEn || nameAr,
      imageUrl:   pendingImg,
      categoryId: catId,
      tags:       aliases,
      difficulty: diff,
      enabled,
    };

    try {
      if (isEdit) {
        await updateCard(card.id, payload);
        const idx = _allCards.findIndex(c => c.id === card.id);
        if (idx !== -1) _allCards[idx] = { ..._allCards[idx], ...payload };
        toast("تم تحديث البطاقة", "success");
      } else {
        const newId = await addCard(payload);
        _allCards.unshift({ id: newId, ...payload, createdAt: null });
        toast("تمت إضافة البطاقة", "success");
      }
      renderCards();
      closeModal();
    } catch (err) {
      toast("فشل الحفظ: " + err.message, "error");
      setButtonLoading(saveBtn, false);
    }
  });
}

// ── Helpers ───────────────────────────────────────────
function renderChips(container, aliases) {
  container.innerHTML = aliases.map((a, i) => `
    <span class="alias-chip">
      ${escHtml(a)}
      <button type="button" class="alias-chip-remove" data-i="${i}" title="حذف">✕</button>
    </span>
  `).join("");
  container.querySelectorAll(".alias-chip-remove").forEach(btn => {
    btn.addEventListener("click", () => {
      aliases.splice(Number(btn.dataset.i), 1);
      renderChips(container, aliases);
    });
  });
}

function convertToBase64(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload  = () => res(reader.result);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

function getCatName(catId) {
  return _categories.find(c => c.id === catId)?.nameAr ?? catId ?? "";
}

function populateCategoryFilter(cats) {
  const sel = document.getElementById("filter-cat");
  if (!sel) return;
  sel.innerHTML = `<option value="">كل التصنيفات</option>` +
    cats.map(c => `<option value="${c.id}">${c.nameAr}</option>`).join("");
}

function escHtml(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escAttr(s) {
  return String(s ?? "").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
