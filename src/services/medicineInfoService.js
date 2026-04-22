/**
 * Medicine information service.
 *
 * Autocomplete uses a 3-source waterfall — all free, no API key required:
 *   1. DailyMed (NLM)  — fastest, clean drug trade names, startswith search
 *   2. OpenFDA count   — most common brand names matching the query
 *   3. RxNorm (NIH)    — generic/clinical drug names as final fallback
 *
 * Drug info panel uses OpenFDA label search.
 *
 * Fix: AbortSignal.timeout() does not exist in Hermes (React Native).
 *      Uses a manual AbortController + setTimeout polyfill throughout.
 */

const DAILYMED_BASE = 'https://dailymed.nlm.nih.gov/dailymed/services/v2';
const OPENFDA_BASE  = 'https://api.fda.gov/drug/label.json';
const RXNORM_BASE   = 'https://rxnav.nlm.nih.gov/REST';

// ─── Polyfill: AbortSignal.timeout() ─────────────────────────────────────────
function makeTimeoutSignal(ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  controller.signal.addEventListener('abort', () => clearTimeout(timer), { once: true });
  return controller.signal;
}

// ─── Title-case helper ────────────────────────────────────────────────────────
function toTitleCase(str) {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Cleans and ranks a list of drug name suggestions.
 * - Removes complex combination names (>2 commas), leading dots, very long names
 * - Sorts: names that START with the query come first, then by ascending length
 */
function cleanSuggestions(names, query) {
  const q = query.toLowerCase();
  return names
    .filter(name => {
      if (!name || name.length < 2)       return false; // empty
      if (name.startsWith('.'))            return false; // DailyMed artifact
      if (name.length > 60)               return false; // too long to be useful
      const commaCount = (name.match(/,/g) ?? []).length;
      if (commaCount > 2)                 return false; // complex combination drug
      return true;
    })
    .sort((a, b) => {
      const aStarts = a.toLowerCase().startsWith(q);
      const bStarts = b.toLowerCase().startsWith(q);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return  1;
      return a.length - b.length; // shorter names first
    });
}

// ─── Source 1: DailyMed drug name search ─────────────────────────────────────
async function searchDailyMed(query) {
  try {
    const url = `${DAILYMED_BASE}/drugnames.json?drug_name=${encodeURIComponent(query)}&type=startswith&pagesize=10`;
    const res = await fetch(url, { signal: makeTimeoutSignal(4000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.data ?? [])
      .map(d => toTitleCase(String(d.drug_name ?? '')))
      .filter(n => n.length > 1)
      .slice(0, 8);
  } catch (err) {
    if (err.name !== 'AbortError') console.warn('[DailyMed] failed:', err.message);
    return [];
  }
}

// ─── Source 2: OpenFDA brand-name count  ─────────────────────────────────────
// Uses OpenFDA's count endpoint to get the most common matching brand names.
async function searchOpenFDABrandNames(query) {
  try {
    // Try exact brand prefix, then generic prefix as fallback
    const brandUrl   = `${OPENFDA_BASE}?search=openfda.brand_name:"${encodeURIComponent(query)}"&count=openfda.brand_name.exact&limit=8`;
    const genericUrl = `${OPENFDA_BASE}?search=openfda.generic_name:"${encodeURIComponent(query)}"&count=openfda.generic_name.exact&limit=8`;

    const [brandRes, genericRes] = await Promise.allSettled([
      fetch(brandUrl,   { signal: makeTimeoutSignal(4000) }).then(r => r.json()),
      fetch(genericUrl, { signal: makeTimeoutSignal(4000) }).then(r => r.json()),
    ]);

    const brandNames   = brandRes.status   === 'fulfilled' ? (brandRes.value?.results   ?? []).map(r => toTitleCase(r.term)) : [];
    const genericNames = genericRes.status === 'fulfilled' ? (genericRes.value?.results ?? []).map(r => toTitleCase(r.term)) : [];

    return [...new Set([...brandNames, ...genericNames])].slice(0, 8);
  } catch (err) {
    if (err.name !== 'AbortError') console.warn('[OpenFDA brand] failed:', err.message);
    return [];
  }
}

// ─── Source 3: RxNorm (fallback) ──────────────────────────────────────────────
async function searchRxNorm(query) {
  try {
    // Use the approximate matching endpoint — much more reliable than /drugs.json
    const url = `${RXNORM_BASE}/approximateTerm.json?term=${encodeURIComponent(query)}&maxEntries=8`;
    const res = await fetch(url, { signal: makeTimeoutSignal(4000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.approximateGroup?.candidate ?? [])
      .map(c => toTitleCase(String(c.name ?? '')))
      .filter(n => n.length > 1)
      .slice(0, 5);
  } catch (err) {
    if (err.name !== 'AbortError') console.warn('[RxNorm] failed:', err.message);
    return [];
  }
}

// ─── Public: searchMedicineNames ─────────────────────────────────────────────

/**
 * Searches for medicine names across DailyMed, OpenFDA, and RxNorm.
 * Runs DailyMed + OpenFDA in parallel, then merges results.
 * Falls back to RxNorm if both return nothing.
 *
 * Debounce ≥ 400ms in the UI before calling this.
 *
 * @param {string} query — minimum 2 characters
 * @returns {Promise<string[]>}
 */
export async function searchMedicineNames(query) {
  const q = query?.trim();
  if (!q || q.length < 2) return [];

  // Run DailyMed + OpenFDA in parallel (fast path)
  const [dailyMedResults, openFdaResults] = await Promise.allSettled([
    searchDailyMed(q),
    searchOpenFDABrandNames(q),
  ]);

  const dailyMed = dailyMedResults.status === 'fulfilled' ? dailyMedResults.value : [];
  const openFda  = openFdaResults.status  === 'fulfilled' ? openFdaResults.value  : [];

  // Merge: DailyMed first (most user-friendly names), deduplicate, clean
  let merged = cleanSuggestions([...new Set([...dailyMed, ...openFda])], q).slice(0, 8);

  // Only hit RxNorm if both primary sources came back empty
  if (merged.length === 0) {
    const rxResults = await searchRxNorm(q);
    merged = cleanSuggestions(rxResults, q).slice(0, 8);
  }

  return merged;
}

// ─── Public: getMedicineInfo ──────────────────────────────────────────────────

/**
 * Fetches drug label details from OpenFDA.
 * Tries brand name first, then generic name as fallback.
 *
 * @param {string} name
 * @returns {Promise<{usage:string, dosage:string, warning:string, activeIngredient:string}|null>}
 */
export async function getMedicineInfo(name) {
  if (!name) return null;
  const cleanName = name.split('(')[0].split('[')[0].trim();

  const tryFetch = async (searchParam) => {
    try {
      const res = await fetch(
        `${OPENFDA_BASE}?search=${searchParam}&limit=1`,
        { signal: makeTimeoutSignal(6000) }
      );
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      if (err.name !== 'AbortError') console.warn('[OpenFDA info] fetch failed:', err.message);
      return null;
    }
  };

  const truncate = (arr, max = 220) => {
    const text = arr?.[0]?.replace(/\s+/g, ' ')?.trim();
    if (!text) return null;
    return text.length > max ? text.slice(0, max) + '…' : text;
  };

  // Try brand name → generic name → substance name
  let data = await tryFetch(`openfda.brand_name:"${encodeURIComponent(cleanName)}"`);
  if (!data?.results?.[0]) data = await tryFetch(`openfda.generic_name:"${encodeURIComponent(cleanName)}"`);
  if (!data?.results?.[0]) data = await tryFetch(`openfda.substance_name:"${encodeURIComponent(cleanName)}"`);

  const result = data?.results?.[0];
  if (!result) return null;

  return {
    usage:            truncate(result.indications_and_usage, 250) ?? truncate(result.purpose, 200),
    dosage:           truncate(result.dosage_and_administration, 200),
    warning:          truncate(result.warnings, 300) ?? truncate(result.do_not_use, 200),
    activeIngredient: truncate(result.active_ingredient, 150),
  };
}
