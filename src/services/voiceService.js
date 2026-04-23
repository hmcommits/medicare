/**
 * Voice service — wraps expo-speech (TTS) for reading medicines aloud.
 * Note: Voice recognition (STT) and command detection features have been fully removed.
 *
 * This service handles:
 *  1. Text-to-speech (reading medicines aloud)
 */

import * as Speech from 'expo-speech';
import { LOCALE_MAP } from '../constants/localeMap';

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


