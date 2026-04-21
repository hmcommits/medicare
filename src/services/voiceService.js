/**
 * Voice service — wraps expo-speech (TTS) and provides the command parser.
 * STT lifecycle (start/stop listening) is handled in individual components
 * using expo-speech-recognition hooks (useSpeechRecognitionEvent).
 *
 * This service handles:
 *  1. Text-to-speech (reading medicines aloud)
 *  2. Command detection from transcribed text (keyword matching)
 *  3. Fuzzy medicine name matching (Levenshtein distance via fastest-levenshtein)
 */

import * as Speech from 'expo-speech';
import { distance } from 'fastest-levenshtein';
import VOICE_KEYWORDS, { LOCALE_MAP } from '../constants/voiceKeywords';

// ─── TTS ─────────────────────────────────────────────────────────────────────

/**
 * Speaks text using the device's built-in TTS engine.
 * @param {string} text - text to speak
 * @param {string} language - 'en' | 'hi' | 'mr'
 */
export async function speak(text, language = 'en') {
  try {
    if (await Speech.isSpeakingAsync()) {
      await Speech.stop();
    }
    Speech.speak(text, {
      language: LOCALE_MAP[language] || 'en-US',
      pitch: 1.0,
      rate: 0.95,
    });
  } catch (err) {
    console.warn('[voiceService] TTS error:', err.message);
  }
}

/** Stops any ongoing speech. */
export async function stopSpeaking() {
  try {
    await Speech.stop();
  } catch (_) {}
}

/**
 * Builds a readable summary of today's pending medicines.
 * @param {Array} medicines - all medicines
 * @param {Array} logs - all logs
 * @param {Function} t - translation helper
 * @returns {string}
 */
export function buildTodaysMedicineScript(medicines, logs, t) {
  const now = new Date();
  const todayStr = now.toDateString();
  const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

  const pending = medicines.filter(med => {
    const takenRecently = logs.some(
      log =>
        log.medicineId === med.id &&
        log.status === 'Took' &&
        new Date(log.timestamp) > lastHour
    );
    return !takenRecently;
  });

  if (pending.length === 0) return t('noMedicinesToday');

  return (
    t('todaysMedicines') +
    '. ' +
    pending.map(m => `${m.name}, ${m.dosage}`).join('. ') +
    '.'
  );
}

// ─── Command Parser ───────────────────────────────────────────────────────────

/**
 * Normalizes a string for keyword matching.
 * Lowercases, removes punctuation, trims extra whitespace.
 */
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if a normalized transcript contains any keyword from an array.
 * Supports partial substring matching.
 */
function containsKeyword(normalized, keywords) {
  return keywords.some(kw => normalized.includes(kw));
}

/**
 * Fuzzy-matches a spoken word against a list of medicine names.
 * Uses normalized Levenshtein distance (0 = perfect match, 1 = completely different).
 * Returns the best match if confidence ≥ 0.55 (45% of chars can differ).
 *
 * @param {string} spokenText - raw STT output
 * @param {string[]} medicineNames - names from the user's medicines collection
 * @returns {{ matched: string|null, confidence: number }}
 */
export function fuzzyMatchMedicine(spokenText, medicineNames) {
  if (!spokenText || medicineNames.length === 0) return { matched: null, confidence: 0 };

  const normalizedSpoken = normalize(spokenText);
  let best = { matched: null, confidence: 0 };

  for (const medName of medicineNames) {
    const normalizedMed = normalize(medName);

    // Try full name comparison
    const fullDist = distance(normalizedSpoken, normalizedMed);
    const maxLen = Math.max(normalizedSpoken.length, normalizedMed.length);
    const fullConf = maxLen === 0 ? 0 : 1 - fullDist / maxLen;

    // Also try individual word comparison (STT often catches just the drug name)
    const words = normalizedSpoken.split(' ');
    const medWords = normalizedMed.split(' ');
    let wordConf = 0;
    for (const w of words) {
      for (const mw of medWords) {
        const wLen = Math.max(w.length, mw.length);
        if (wLen < 3) continue; // skip very short words
        const conf = 1 - distance(w, mw) / wLen;
        if (conf > wordConf) wordConf = conf;
      }
    }

    const confidence = Math.max(fullConf, wordConf);
    if (confidence > best.confidence) {
      best = { matched: medName, confidence };
    }
  }

  return best.confidence >= 0.55 ? best : { matched: null, confidence: best.confidence };
}

/**
 * Parses a voice command transcript into an action.
 *
 * @param {string} spokenText - raw STT transcript
 * @param {Array<{id:string, name:string}>} medicines - user's medicines
 * @returns {{ action: 'took'|'missed'|'snoozed'|null, medicine: object|null }}
 */
export function parseVoiceCommand(spokenText, medicines) {
  if (!spokenText) return { action: null, medicine: null };

  const normalized = normalize(spokenText);

  // Detect action
  let action = null;
  if (containsKeyword(normalized, VOICE_KEYWORDS.took)) action = 'took';
  else if (containsKeyword(normalized, VOICE_KEYWORDS.missed)) action = 'missed';
  else if (containsKeyword(normalized, VOICE_KEYWORDS.snoozed)) action = 'snoozed';

  // Detect medicine name via fuzzy match
  const medicineNames = medicines.map(m => m.name);
  const { matched } = fuzzyMatchMedicine(normalized, medicineNames);
  const medicine = matched ? medicines.find(m => normalize(m.name) === normalize(matched)) ?? null : null;

  return { action, medicine };
}
