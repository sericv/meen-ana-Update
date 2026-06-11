// ═══════════════════════════════════════════════════════
//  Analytics — Overview Stats + Charts
// ═══════════════════════════════════════════════════════

import { getOverviewStats, fetchRecentMatchesForChart, fetchCategories } from "./firebase.js";
import { toast } from "./ui.js";

// ── Overview ─────────────────────────────────────────

export async function initOverview() {
  document.getElementById("btn-refresh-overview")?.addEventListener("click", loadOverview);
  await loadOverview();
}

async function loadOverview() {
  const btn = document.getElementById("btn-refresh-overview");
  if (btn) { btn.textContent = "جاري…"; btn.disabled = true; }

  try {
    const stats = await getOverviewStats();
    setStatVal("stat-total-users",    stats.totalUsers.toLocaleString("ar"));
    setStatVal("stat-active-matches", stats.activeMatches.toLocaleString("ar"));
    setStatVal("stat-total-matches",  stats.totalMatches.toLocaleString("ar"));
    setStatVal("stat-online",         stats.onlineApprox.toLocaleString("ar"));
    setStatVal("stat-total-cards",    stats.totalCards.toLocaleString("ar"));
    setStatVal("stat-total-cats",     stats.totalCats.toLocaleString("ar"));
  } catch (e) {
    toast("فشل تحميل الإحصائيات: " + e.message, "error");
  } finally {
    if (btn) { btn.textContent = "تحديث"; btn.disabled = false; }
  }
}

function setStatVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ── Analytics page ────────────────────────────────────

export async function initAnalytics() {
  document.getElementById("btn-refresh-analytics")?.addEventListener("click", loadAnalytics);
  await loadAnalytics();
}

async function loadAnalytics() {
  const btn = document.getElementById("btn-refresh-analytics");
  if (btn) { btn.textContent = "جاري…"; btn.disabled = true; }

  try {
    const [matches, categories] = await Promise.all([
      fetchRecentMatchesForChart(30),
      fetchCategories(),
    ]);

    renderDailyChart(matches);
    renderCategoryChart(matches, categories);
    renderWinReasonChart(matches);
    renderSummaryStats(matches);
  } catch (e) {
    toast("فشل تحميل التحليلات: " + e.message, "error");
  } finally {
    if (btn) { btn.textContent = "تحديث"; btn.disabled = false; }
  }
}

// ── Last 30 days bar chart ────────────────────────────
function renderDailyChart(matches) {
  const container = document.getElementById("chart-daily");
  if (!container) return;

  // Group by day
  const days = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("en-CA"); // YYYY-MM-DD
    const label = d.toLocaleDateString("ar", { day: "numeric", month: "short" });
    days[key] = { count: 0, label };
  }
  for (const m of matches) {
    const ts = m.startedAt?.toDate?.() ?? null;
    if (!ts) continue;
    const key = ts.toLocaleDateString("en-CA");
    if (days[key]) days[key].count++;
  }

  const vals   = Object.values(days);
  const max    = Math.max(...vals.map(v => v.count), 1);
  const weekly = vals.slice(-7);

  container.innerHTML = `
    <div class="chart-header">
      <span class="chart-title">المباريات اليومية — آخر ٧ أيام</span>
      <span class="chart-total">${weekly.reduce((s,v)=>s+v.count,0)} مباراة</span>
    </div>
    <div class="chart-bars">
      ${weekly.map(v => `
        <div class="chart-col">
          <div class="chart-bar" style="height:${Math.round((v.count/max)*72)+4}px" title="${v.count}">
            ${v.count > 0 ? `<span class="chart-bar-val">${v.count}</span>` : ""}
          </div>
          <span class="chart-bar-label">${v.label}</span>
        </div>
      `).join("")}
    </div>
  `;
}

// ── Category popularity ───────────────────────────────
function renderCategoryChart(matches, categories) {
  const container = document.getElementById("chart-categories");
  if (!container) return;

  const catMap = {};
  for (const m of matches) {
    const id = m.categoryId ?? "unknown";
    catMap[id] = (catMap[id] ?? 0) + 1;
  }
  const catName = id => categories.find(c => c.id === id)?.nameAr ?? id;
  const sorted = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const max = sorted[0]?.[1] ?? 1;

  container.innerHTML = `
    <div class="chart-header">
      <span class="chart-title">أكثر التصنيفات لعبًا</span>
    </div>
    <div class="hbar-list">
      ${sorted.map(([id, count]) => `
        <div class="hbar-row">
          <span class="hbar-label">${catName(id)}</span>
          <div class="hbar-track">
            <div class="hbar-fill" style="width:${Math.round((count/max)*100)}%"></div>
          </div>
          <span class="hbar-val">${count}</span>
        </div>
      `).join("")}
    </div>
  `;
}

// ── Win reason breakdown ─────────────────────────────
function renderWinReasonChart(matches) {
  const container = document.getElementById("chart-win-reason");
  if (!container) return;

  const reasons = { guess: 0, forfeit: 0, guess_limit: 0, timeout: 0, other: 0 };
  const labels = {
    guess: "تخمين صحيح",
    forfeit: "استسلام",
    guess_limit: "نفاد المحاولات",
    timeout: "انتهاء الوقت",
    other: "أخرى",
  };
  for (const m of matches) {
    if (m.status !== "ended") continue;
    const r = m.winReason ?? "other";
    if (r in reasons) reasons[r]++;
    else reasons.other++;
  }

  const total = Object.values(reasons).reduce((s, v) => s + v, 0) || 1;
  container.innerHTML = `
    <div class="chart-header">
      <span class="chart-title">أسباب الفوز</span>
    </div>
    <div class="reason-list">
      ${Object.entries(reasons)
        .filter(([,v]) => v > 0)
        .sort((a,b)=>b[1]-a[1])
        .map(([k, v]) => `
          <div class="reason-row">
            <span class="reason-label">${labels[k] ?? k}</span>
            <div class="hbar-track">
              <div class="hbar-fill hbar-fill-2" style="width:${Math.round((v/total)*100)}%"></div>
            </div>
            <span class="reason-pct">${Math.round((v/total)*100)}%</span>
          </div>
        `).join("")}
    </div>
  `;
}

// ── Summary numbers ───────────────────────────────────
function renderSummaryStats(matches) {
  const ended = matches.filter(m => m.status === "ended" && m.startedAt && m.endedAt);
  let totalDurMs = 0;
  for (const m of ended) {
    const s = m.startedAt?.toMillis?.() ?? 0;
    const e = m.endedAt?.toMillis?.() ?? 0;
    if (e > s) totalDurMs += (e - s);
  }
  const avgDurMin = ended.length > 0 ? Math.round(totalDurMs / ended.length / 60000) : 0;

  const el = document.getElementById("analytics-summary");
  if (!el) return;
  el.innerHTML = `
    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-val">${matches.length}</div>
        <div class="summary-lbl">مباراة (آخر ٣٠ يوم)</div>
      </div>
      <div class="summary-card">
        <div class="summary-val">${avgDurMin}<span class="summary-unit">د</span></div>
        <div class="summary-lbl">متوسط مدة المباراة</div>
      </div>
      <div class="summary-card">
        <div class="summary-val">${ended.length}</div>
        <div class="summary-lbl">مباراة منتهية</div>
      </div>
    </div>
  `;
}
