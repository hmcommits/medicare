/**
 * notificationService.js
 *
 * All notification functionality lives here. In Expo Go (SDK 53+), Android
 * push infrastructure was removed from the binary. Importing expo-notifications
 * at the module level triggers a native crash. We use a conditional lazy require
 * so the module is never loaded in Expo Go, keeping all production code intact.
 *
 * ✅ Production APK / Dev Build  → Full functionality
 * ⚠️  Expo Go                    → All functions are no-ops; no crash
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ─── Expo Go Detection (synchronous, available before any require) ─────────────
export const IS_EXPO_GO = Constants.appOwnership === 'expo';

// ─── Lazy-load expo-notifications only in real builds ─────────────────────────
// In Expo Go: Notifications === null → every function in this file returns early.
// In a Dev Build / APK: fully initialized with setNotificationHandler.
const Notifications = IS_EXPO_GO ? null : (() => {
  const N = require('expo-notifications');
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: false, // App.js shows our own ReminderModal in foreground
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
  return N;
})();

// ─── Permissions ──────────────────────────────────────────────────────────────

/**
 * Requests notification permissions from the OS.
 * Returns true if granted, false otherwise (always false in Expo Go).
 */
export async function requestNotificationPermissions() {
  if (Platform.OS === 'web' || !Notifications) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ─── Local Notification Scheduling ───────────────────────────────────────────

/**
 * Schedules repeating OS-level notifications for a medicine.
 * Creates one notification per (time × day) combination so each slot
 * can be individually cancelled later.
 */
export async function scheduleMedicineNotification(medicine) {
  if (!Notifications || Platform.OS === 'web') return;
  if (!medicine?.times?.length || !medicine?.days?.length) return;

  for (const timeISO of medicine.times) {
    const timeDate = new Date(timeISO);
    const hours   = timeDate.getHours();
    const minutes = timeDate.getMinutes();

    for (const dayOfWeek of medicine.days) {
      const identifier = `med_${medicine.id}_${hours}_${minutes}_day${dayOfWeek}`;
      try {
        await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});
        await Notifications.scheduleNotificationAsync({
          identifier,
          content: {
            title: '💊 Time for your medicine!',
            body: `${medicine.name} — ${medicine.dosage}`,
            sound: true,
            data: {
              medicineId: medicine.id,
              medicineName: medicine.name,
              dosage: medicine.dosage,
              // #2 — include doseAmount so App.js doesn't need an extra Firestore read
              doseAmount: medicine.doseAmount ?? 1,
              scheduledTime: timeISO,
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: dayOfWeek + 1, // Expo: 1=Sun … 7=Sat
            hour: hours,
            minute: minutes,
            repeats: true,
          },
        });
      } catch (err) {
        console.error(`[Notifications] Failed to schedule ${identifier}:`, err.message);
      }
    }
  }
}

/**
 * Cancels all scheduled notifications for a specific medicine (on delete).
 */
export async function cancelMedicineNotifications(medicineId) {
  if (!Notifications || Platform.OS === 'web') return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const toCancel = scheduled.filter(n => n.identifier.startsWith(`med_${medicineId}_`));
    await Promise.all(toCancel.map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)));
  } catch (err) {
    console.error('[Notifications] Error cancelling medicine notifications:', err.message);
  }
}

/**
 * Schedules a one-time snooze reminder 5 minutes from now.
 */
export async function scheduleSnoozedReminder(medicine) {
  if (!Notifications || Platform.OS === 'web') return;
  const identifier = `snooze_${medicine.id}_${Date.now()}`;
  try {
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: '⏰ Snooze Reminder',
        body: `${medicine.name} — ${medicine.dosage}`,
        sound: true,
        data: {
          medicineId: medicine.id,
          medicineName: medicine.name,
          dosage: medicine.dosage,
          scheduledTime: medicine.scheduledTime ?? null,
        },
      },
      trigger: { seconds: 5 * 60, repeats: false },
    });
  } catch (err) {
    console.error('[Notifications] Failed to schedule snooze:', err.message);
  }
}

/**
 * Cancels all scheduled notifications (used on logout).
 */
export async function cancelAllMedicineNotifications() {
  if (!Notifications || Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ─── Expo Push API (guardian ↔ patient high-five) ─────────────────────────────
// Server-free push via Expo's free relay. Tokens stored in Firestore.
// No-ops silently in Expo Go — all production code is preserved as-is.

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export async function sendExpoPush(to, title, body, data = {}) {
  if (IS_EXPO_GO) return;
  if (!to?.startsWith('ExponentPushToken')) { console.warn('[Push] Invalid token'); return; }
  try {
    const res  = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, title, body, data, sound: 'default' }),
    });
    const json = await res.json();
    if (json.data?.status === 'error') console.warn('[Push] Error:', json.data.message);
  } catch (err) {
    console.error('[Push] Network error:', err.message);
  }
}

export async function notifyGuardiansOfMilestone(guardianTokens, days, t) {
  if (IS_EXPO_GO || !Array.isArray(guardianTokens) || guardianTokens.length === 0) return;
  await Promise.all(
    guardianTokens.map(token =>
      sendExpoPush(token, t('notifHighFivePromptTitle'), t('notifHighFivePromptBody', days), { type: 'milestone_prompt', days })
    )
  );
}

export async function sendHighFiveToPatient(patientToken, t) {
  await sendExpoPush(patientToken, t('notifHighFiveTitle'), t('notifHighFiveBody'), { type: 'high_five' });
}

export async function scheduleRefillReminder(medicine, daysLeft, t) {
  if (!Notifications || Platform.OS === 'web') return;
  const identifier = `refill_${medicine.id}`;
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: t('notifRefillTitle'),
        body: t('notifRefillBody', medicine.name, Math.ceil(daysLeft)),
        sound: true,
        data: { type: 'refill', medicineId: medicine.id },
      },
      trigger: { seconds: 1, repeats: false },
    });
  } catch (err) {
    console.error('[Notifications] Failed to schedule refill reminder:', err.message);
  }
}
