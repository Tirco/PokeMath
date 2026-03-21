// ── State ──────────────────────────────────────────────────────────────────
const progressBar      = document.getElementById("dexLoadStatus");
const pokedexContainer = document.getElementById("pokedex");
const searchInput      = document.getElementById("searchInput");

let allPokemonData     = [];   // all HTML strings for caught pokémon
let activeFilteredData = [];   // after all filters (before text search)

var genFilterKeys  = ["gen-1","gen-2","gen-3","gen-4","gen-5","gen-6","gen-7","gen-8","gen-9","gen-0"];
var typeFilterKeys = [];                 // simple toggle (AND logic)
var specialFilters = {};                 // key → 0 (off) | 1 (include) | 2 (exclude)

// ── Sort & duplicate state ──────────────────────────────────────────────────
let currentSort   = "id-asc";
let triDuplicates = 0;   // 0 = all, 1 = only dupes, 2 = only non-dupes

// ── Lazy-loading state ─────────────────────────────────────────────────────
const PAGE_SIZE      = 60;
let currentBatchData = [];
let currentPage      = 0;
let sentinel         = null;
let sentinelObserver = null;

// ── Shimmer ────────────────────────────────────────────────────────────────
function showShimmerEffect() {
  pokedexContainer.innerHTML = '<div class="skeleton"></div>'.repeat(20);
}
function removeShimmerEffect() {
  pokedexContainer.innerHTML = '';
}

// ── Init ───────────────────────────────────────────────────────────────────
let _dexLoadAllReady   = false;
let _dexPkmnInfoReady  = false;

async function _tryInitDex() {
  if (!_dexLoadAllReady || !_dexPkmnInfoReady) return;
  showShimmerEffect();
  await fetchAllPokemonData();
  initializeGenerationFilter();
  _computeAltTotal();
  updateProgressBars();
  _rebuildAndRender();
}

document.addEventListener("loadAllComplete",   () => { _dexLoadAllReady  = true; _tryInitDex(); });
document.addEventListener("pokemonInfoLoaded", () => { _dexPkmnInfoReady = true; _tryInitDex(); });

// ── Fetch ──────────────────────────────────────────────────────────────────
async function fetchAllPokemonData() {
  const unique = [...new Set(state.pkmnList)];
  allPokemonData = await Promise.all(unique.map(id => loadFromList(id, true, false, true)));
  allPokemonData = allPokemonData.filter(Boolean);
  allPokemonData.sort((a, b) => getIdFromHtml(a) - getIdFromHtml(b));
}

// ── HTML helpers ───────────────────────────────────────────────────────────
function getIdFromHtml(html) {
  return parseInt(html.match(/pokemonId=(\d+)/)?.[1] ?? 0, 10);
}
function getNameFromHtml(html) {
  return (html.match(/alt="([^"]+)"/)?.[1] ?? "").toLowerCase();
}
function getEntryFromHtml(html) {
  return html.match(/\sid=([^\s"'>]+)/)?.[1] ?? "";
}

// ── Filter helpers ─────────────────────────────────────────────────────────
function applyFilters(data) {
  return data.filter(html => {
    if (!html || typeof html !== "string") return false;

    // Generation: must match at least one active gen
    if (genFilterKeys.length > 0 && !genFilterKeys.some(k => html.includes(k))) return false;

    // Type: must match ALL active type filters (AND)
    if (typeFilterKeys.length > 0 && !typeFilterKeys.every(k => html.includes(k))) return false;

    // Special tri-state filters
    for (const [key, st] of Object.entries(specialFilters)) {
      if (st === 1 && !html.includes(key)) return false;
      if (st === 2 &&  html.includes(key)) return false;
    }

    return true;
  });
}

function applyDuplicateFilter(data) {
  if (triDuplicates === 0) return data;
  return data.filter(html => {
    const entry = getEntryFromHtml(html);
    const count = entry ? getOccurrence(state.pkmnList, entry) : 0;
    return triDuplicates === 1 ? count > 1 : count <= 1;
  });
}

function applyTextSearch(data) {
  const q = searchInput.value.trim().toUpperCase();
  if (!q) return data;
  return data.filter(html => html && html.toUpperCase().includes(q));
}

function applySort(data) {
  if (currentSort === "id-asc") return data;
  const copy = [...data];
  switch (currentSort) {
    case "id-desc":
      return copy.sort((a, b) => getIdFromHtml(b) - getIdFromHtml(a));
    case "name-asc":
      return copy.sort((a, b) => getNameFromHtml(a).localeCompare(getNameFromHtml(b), "no"));
    case "name-desc":
      return copy.sort((a, b) => getNameFromHtml(b).localeCompare(getNameFromHtml(a), "no"));
    case "count-desc":
      return copy.sort((a, b) => {
        const ea = getEntryFromHtml(a), eb = getEntryFromHtml(b);
        return getOccurrence(state.pkmnList, eb) - getOccurrence(state.pkmnList, ea);
      });
    default:
      return copy;
  }
}

// ── Full pipeline ──────────────────────────────────────────────────────────
function buildDisplayData() {
  return applySort(applyTextSearch(applyDuplicateFilter(activeFilteredData)));
}

// ── Internal rebuild helper ────────────────────────────────────────────────
function _rebuildAndRender() {
  activeFilteredData = applyFilters(allPokemonData);
  renderPokemon(buildDisplayData());
  updateFilterButtonStates();
}

// ── "Vis alle" — resets everything ────────────────────────────────────────
function filterSelection(key) {
  if (key !== "all") return;
  genFilterKeys  = ["gen-1","gen-2","gen-3","gen-4","gen-5","gen-6","gen-7","gen-8","gen-9","gen-0"];
  typeFilterKeys = [];
  specialFilters = {};
  triDuplicates  = 0;
  document.querySelectorAll(".genCheckbox").forEach(cb => cb.checked = true);
  _rebuildAndRender();
}

// ── Type filter (simple toggle, AND logic) ─────────────────────────────────
function filterTypeSelection(key) {
  const idx = typeFilterKeys.indexOf(key);
  if (idx === -1) typeFilterKeys.push(key);
  else typeFilterKeys.splice(idx, 1);
  _rebuildAndRender();
}

// ── Special tri-state filter ───────────────────────────────────────────────
function cycleSpecialFilter(key) {
  const cur = specialFilters[key] || 0;
  const next = (cur + 1) % 3;
  if (next === 0) delete specialFilters[key];
  else specialFilters[key] = next;
  _rebuildAndRender();
}

// ── Duplicates tri-state ───────────────────────────────────────────────────
function toggleDuplicates() {
  triDuplicates = (triDuplicates + 1) % 3;
  _rebuildAndRender();
}

// ── Sort ───────────────────────────────────────────────────────────────────
function setSort(key) {
  currentSort = key;
  document.querySelectorAll("#sortContent a").forEach(a => {
    a.classList.toggle("active", a.dataset.sort === key);
  });
  closeAllDropdowns();
  renderPokemon(buildDisplayData());
}

// ── Text search ────────────────────────────────────────────────────────────
function textFilterFunction() {
  renderPokemon(buildDisplayData());
}
searchInput.addEventListener("input", textFilterFunction);

// ── Render (paginated / lazy) ──────────────────────────────────────────────
function renderPokemon(pokemonArray) {
  removeShimmerEffect();
  removeSentinel();
  currentBatchData = pokemonArray;
  currentPage      = 0;
  pokedexContainer.innerHTML = '';

  renderNextBatch();
  updateCounts(pokemonArray.length);
}

function renderNextBatch() {
  const start = currentPage * PAGE_SIZE;
  const end   = Math.min(start + PAGE_SIZE, currentBatchData.length);
  if (start >= currentBatchData.length) { removeSentinel(); return; }

  const fragment = document.createDocumentFragment();
  for (let i = start; i < end; i++) {
    const html = currentBatchData[i];
    if (!html) continue;
    const el = document.createElement("div");
    el.innerHTML = html.trim();
    const card = el.firstElementChild;
    if (card) {
      card.classList.add("show");
      fragment.appendChild(card);
    }
  }
  pokedexContainer.appendChild(fragment);
  currentPage++;

  if (currentPage * PAGE_SIZE < currentBatchData.length) {
    setupSentinel();
  } else {
    removeSentinel();
  }
}

function setupSentinel() {
  removeSentinel();
  sentinel = document.createElement("div");
  sentinel.id = "dex-sentinel";
  sentinel.style.cssText = "height:1px;width:100%;";
  pokedexContainer.after(sentinel);

  sentinelObserver = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) renderNextBatch();
  }, { rootMargin: "400px" });
  sentinelObserver.observe(sentinel);
}

function removeSentinel() {
  if (sentinelObserver) { sentinelObserver.disconnect(); sentinelObserver = null; }
  if (sentinel)         { sentinel.remove(); sentinel = null; }
}

// ── Counts ─────────────────────────────────────────────────────────────────
function updateCounts(shownCount) {
  document.getElementById("amountCaught3").textContent = shownCount;
  document.getElementById("amountCaught2").textContent = allPokemonData.length;
  document.getElementById("amountCaught").textContent  = state.pkmnCaught;
  progressBar.textContent   = shownCount > 0 ? `${shownCount} Pokémon` : "Ingen funnet";
  progressBar.style.opacity = shownCount > 0 ? "0" : "1";
}

// ── Button visual state ────────────────────────────────────────────────────
function updateFilterButtonStates() {
  // "Vis alle" — active when no special/type filters are on
  const allClean = typeFilterKeys.length === 0
    && Object.keys(specialFilters).length === 0
    && triDuplicates === 0;
  document.querySelector('[data-filter="all"]')?.classList.toggle("active", allClean);

  // Type buttons (simple active/inactive)
  document.querySelectorAll(".typecard2[data-filter]").forEach(el => {
    el.classList.toggle("active", typeFilterKeys.includes(el.getAttribute("data-filter")));
  });

  // Special tri-state buttons
  document.querySelectorAll("#filterButtons .btn[data-filter]").forEach(btn => {
    const key = btn.getAttribute("data-filter");
    if (!key || key === "all") return;
    const st = specialFilters[key] || 0;
    btn.classList.toggle("filter-include", st === 1);
    btn.classList.toggle("filter-exclude", st === 2);
  });

  // Duplicates button
  const dupeBtn = document.getElementById("duplicatesBtn");
  if (dupeBtn) {
    dupeBtn.classList.toggle("filter-include", triDuplicates === 1);
    dupeBtn.classList.toggle("filter-exclude", triDuplicates === 2);
  }
}

// ── Dropdown system ────────────────────────────────────────────────────────
function openDropdown(btnId, panelId) {
  const btn    = document.getElementById(btnId);
  const panel  = document.getElementById(panelId);
  const rect   = btn.getBoundingClientRect();
  const isOpen = panel.style.display !== "none" && panel.style.display !== "";

  closeAllDropdowns();
  if (isOpen) return;

  panel.style.top     = (rect.bottom + 6) + "px";
  panel.style.left    = Math.min(rect.left, window.innerWidth - 300) + "px";
  panel.style.display = panel.dataset.display || "block";
  btn.classList.add("active");
}

function closeAllDropdowns() {
  ["typecontent", "generationContent", "sortContent"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
  ["typeDropdownBtn", "generationDropdown", "sortDropdownBtn"].forEach(id => {
    document.getElementById(id)?.classList.remove("active");
  });
}

document.getElementById("typeDropdownBtn").addEventListener("click", () => {
  openDropdown("typeDropdownBtn", "typecontent");
});
document.getElementById("generationDropdown").addEventListener("click", () => {
  openDropdown("generationDropdown", "generationContent");
});
document.getElementById("sortDropdownBtn").addEventListener("click", () => {
  openDropdown("sortDropdownBtn", "sortContent");
});

document.addEventListener("click", (e) => {
  if (e.target.closest("#typeDropdownBtn, #generationDropdown, #sortDropdownBtn")) return;
  closeAllDropdowns();
});

document.getElementById("generationContent")?.addEventListener("click", e => e.stopPropagation());

// ── Generation checkboxes ──────────────────────────────────────────────────
function initializeGenerationFilter() {
  document.querySelectorAll(".genCheckbox").forEach(checkbox => {
    checkbox.addEventListener("change", () => {
      const key = checkbox.value;
      if (checkbox.checked) {
        if (!genFilterKeys.includes(key)) genFilterKeys.push(key);
      } else {
        genFilterKeys = genFilterKeys.filter(k => k !== key);
      }
      // Never let all gens be deselected
      if (genFilterKeys.filter(k => k !== "gen-0").length === 0) {
        genFilterKeys = ["gen-1","gen-2","gen-3","gen-4","gen-5","gen-6","gen-7","gen-8","gen-9","gen-0"];
        document.querySelectorAll(".genCheckbox").forEach(cb => cb.checked = true);
      }
      _rebuildAndRender();
    });
  });
}

// ── Progress bars ──────────────────────────────────────────────────────────
let _dexTotalAlt = 0;

function _computeAltTotal() {
  if (!pkmnInfoData) return;
  let count = 0;
  for (const variants of Object.values(pkmnInfoData)) {
    count += Object.keys(variants).filter(k => k !== '0').length;
  }
  _dexTotalAlt = count;
}

function _calcProgress() {
  const unique = new Set(state.pkmnList);
  let baseN = 0, baseS = 0, altN = 0, altS = 0;
  for (const entry of unique) {
    const isShiny = entry[0] === 'S';
    const rest    = entry.slice(1);
    if (rest.includes('-')) {
      if (isShiny) altS++; else altN++;
    } else {
      const dex = parseInt(rest);
      if (!isNaN(dex) && dex >= 0 && dex <= 1025) {
        if (isShiny) baseS++; else baseN++;
      }
    }
  }
  return { baseN, baseS, altN, altS };
}

function updateProgressBars() {
  const el = document.getElementById('dexProgressBars');
  if (!el) return;

  const { baseN, baseS, altN, altS } = _calcProgress();
  const totalAll   = baseN + baseS + altN + altS;
  const grandTotal = 1026 * 2 + _dexTotalAlt * 2;

  const bars = [
    { label: "Normal",     caught: baseN,    total: 1026,         color: "#2cbb63" },
    { label: "Shiny",      caught: baseS,    total: 1026,         color: "#e8c030" },
    { label: "Alt. form",  caught: altN,     total: _dexTotalAlt, color: "#3a8fff" },
    { label: "Alt. shiny", caught: altS,     total: _dexTotalAlt, color: "#e67e22" },
    { label: "Totalt",     caught: totalAll, total: grandTotal,   color: "#cc1a1a" },
  ];

  // Restore collapsed state
  const wasCollapsed = localStorage.getItem('dexBarsCollapsed') === '1';
  el.classList.toggle('collapsed', wasCollapsed);
  document.getElementById('progressToggleBtn')?.classList.toggle('collapsed', wasCollapsed);
  document.querySelector('.main')?.classList.toggle('dex-bars-hidden', wasCollapsed);

  el.innerHTML = bars.map(b => {
    const pct = b.total > 0 ? Math.min(100, (b.caught / b.total) * 100) : 0;
    return `<div class="dex-pbar">
      <span class="dex-pbar-label">${b.label}</span>
      <div class="dex-pbar-track">
        <div class="dex-pbar-fill" style="width:${pct.toFixed(2)}%;background:${b.color}"></div>
      </div>
      <span class="dex-pbar-text">${b.caught.toLocaleString('no-NO')} / ${b.total.toLocaleString('no-NO')} &nbsp;(${pct.toFixed(1)}%)</span>
    </div>`;
  }).join('');
}

function toggleProgressBars() {
  const bars = document.getElementById('dexProgressBars');
  const btn  = document.getElementById('progressToggleBtn');
  const main = document.querySelector('.main');
  const hidden = bars.classList.toggle('collapsed');
  btn.classList.toggle('collapsed', hidden);
  main?.classList.toggle('dex-bars-hidden', hidden);
  localStorage.setItem('dexBarsCollapsed', hidden ? '1' : '0');
}

// ── Helpers ────────────────────────────────────────────────────────────────
function parseIdAndSuffix(id) {
  const cleaned = id ? id.replace(/^\D+/g, "") : null;
  const match   = cleaned ? cleaned.match(/^(\d+)(-\d+|shiny)?$/) : null;
  if (!match) return { base: null, suffix: "" };
  return { base: parseInt(match[1], 10), suffix: match[2] ?? "" };
}
