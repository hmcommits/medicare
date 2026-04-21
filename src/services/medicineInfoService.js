/**
 * Medicine information service.
 * Uses two 100% free, no-API-key US government APIs:
 *   - RxNorm (NIH): drug name autocomplete
 *   - OpenFDA: drug label details (usage, dosage, warnings)
 *
 * Both work globally for common medicines.
 * For Indian brand names not in RxNorm, a generic name fallback is attempted via OpenFDA.
 */

const RXNORM_BASE = 'https://rxnav.nlm.nih.gov/REST';
const OPENFDA_BASE = 'https://api.fda.gov/drug/label.json';

/**
 * Search for medicine names using RxNorm.
 * Returns an array of clean drug name strings (generic, semantic clinical drugs).
 * Max 8 results. Debounce this call (≥400ms) in the UI.
 *
 * @param {string} query - at least 2 characters
 * @returns {Promise<string[]>}
 */
export async function searchMedicineNames(query) {
  if (!query || query.trim().length < 2) return [];
  try {
    const url = `${RXNORM_BASE}/drugs.json?name=${encodeURIComponent(query.trim())}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];

    const data = await res.json();
    const groups = data?.drugGroup?.conceptGroup || [];

    // Prefer SCD (Semantic Clinical Drug) — generic, clean names like "aspirin 81 MG Oral Tablet"
    // Fall back to SBD (brand names) if no SCD results
    let names = [];

    const scdGroup = groups.find(g => g.tty === 'SCD');
    if (scdGroup?.conceptProperties?.length) {
      names = scdGroup.conceptProperties.map(p => p.name);
    }

    if (names.length === 0) {
      const sbdGroup = groups.find(g => g.tty === 'SBD');
      if (sbdGroup?.conceptProperties?.length) {
        names = sbdGroup.conceptProperties.map(p => p.name);
      }
    }

    // Deduplicate and limit
    return [...new Set(names)].slice(0, 8);
  } catch (err) {
    console.warn('[medicineInfoService] RxNorm search failed:', err.message);
    return [];
  }
}

/**
 * Fetches drug label details from OpenFDA for a given medicine name.
 * Returns a structured info object or null if not found.
 *
 * @param {string} name - exact or close-match medicine name
 * @returns {Promise<{usage:string, dosage:string, warning:string}|null>}
 */
export async function getMedicineInfo(name) {
  if (!name) return null;
  try {
    // Try brand name first, then generic name
    const cleanName = name.split('(')[0].split('[')[0].trim();
    const url = `${OPENFDA_BASE}?search=openfda.brand_name:"${encodeURIComponent(cleanName)}"&limit=1`;
    let res = await fetch(url, { signal: AbortSignal.timeout(6000) });

    // Fallback: search by generic name
    if (!res.ok || res.status === 404) {
      const genericUrl = `${OPENFDA_BASE}?search=openfda.generic_name:"${encodeURIComponent(cleanName)}"&limit=1`;
      res = await fetch(genericUrl, { signal: AbortSignal.timeout(6000) });
    }

    if (!res.ok) return null;
    const data = await res.json();
    const result = data?.results?.[0];
    if (!result) return null;

    // Extract key fields and truncate for UI
    const truncate = (arr, maxChars = 200) => {
      if (!arr || !arr[0]) return null;
      const text = arr[0].replace(/\s+/g, ' ').trim();
      return text.length > maxChars ? text.slice(0, maxChars) + '…' : text;
    };

    return {
      usage: truncate(result.indications_and_usage, 250) ||
             truncate(result.purpose, 200),
      dosage: truncate(result.dosage_and_administration, 200),
      warning: truncate(result.warnings, 300) ||
               truncate(result.do_not_use, 200),
      activeIngredient: truncate(result.active_ingredient, 150),
    };
  } catch (err) {
    console.warn('[medicineInfoService] OpenFDA fetch failed:', err.message);
    return null;
  }
}
