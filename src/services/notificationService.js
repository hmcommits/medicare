import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// When the app is in the FOREGROUND we suppress the OS banner and
// let App.js show our own ReminderModal instead.
// When backgrounded/killed, the OS delivers the notification normally.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false, // App.js handles this via addNotificationReceivedListener
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Requests notification permissions from the OS.
 * Returns true if granted, false otherwise.
 */
export async function requestNotificationPermissions() {
  if (Platform.OS === 'web') return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Schedules repeating weekly OS-level notifications for a medicine.
 * One notification per (time slot × day-of-week) combination.
 * Identifier format: `med_{medicineId}_{hour}_{minute}_{dayOfWeek}`
 *
 * @param {object} medicine - Must have { id, name, dosage, times, days }
 */
export async function scheduleMedicineNotification(medicine) {
  if (Platform.OS === 'web') return;
  if (!medicine?.id || !medicine?.times) return;

  // Cancel existing notifications for this medicine before rescheduling
  await cancelMedicineNotifications(medicine.id);

  const granted = await requestNotificationPermissions();
  if (!granted) {
    console.warn('[Notifications] Permission not granted — skipping schedule.');
    return;
  }

  const daysToSchedule =
    Array.isArray(medicine.days) && medicine.days.length > 0
      ? medicine.days
      : [0, 1, 2, 3, 4, 5, 6];

  for (const timeStr of medicine.times) {
    const medTime = new Date(timeStr);
    const hour = medTime.getHours();
    const minute = medTime.getMinutes();

    for (const jsDay of daysToSchedule) {
      // Expo weekday: 1 = Sunday … 7 = Saturday (same as JS getDay() + 1)
      const expoWeekday = jsDay + 1;

      const identifier = `med_${medicine.id}_${hour}_${minute}_${jsDay}`;

      try {
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
              scheduledTime: timeStr,
            },
          },
          trigger: {
            weekday: expoWeekday,
            hour,
            minute,
            repeats: true,
          },
        });
      } catch (err) {
        console.error(`[Notifications] Failed to schedule ${identifier}:`, err);
      }
    }
  }

  console.log(
    `[Notifications] Scheduled ${medicine.times.length * daysToSchedule.length} alarm(s) for "${medicine.name}"`
  );
}

/**
 * Cancels all scheduled notifications for a specific medicine.
 * @param {string} medicineId
 */
export async function cancelMedicineNotifications(medicineId) {
  if (Platform.OS === 'web') return;

  try {
    const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
    const prefix = `med_${medicineId}_`;
    const toCancel = allScheduled.filter(n => n.identifier.startsWith(prefix));

    await Promise.all(
      toCancel.map(n => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );

    if (toCancel.length > 0) {
      console.log(`[Notifications] Cancelled ${toCancel.length} alarm(s) for medicine ${medicineId}`);
    }
  } catch (err) {
    console.error('[Notifications] Error cancelling notifications:', err);
  }
}

/**
 * Schedules a one-time "snooze" notification 5 minutes from now.
 * @param {object} medicine
 */
export async function scheduleSnoozedReminder(medicine) {
  if (Platform.OS === 'web') return;

  const identifier = `snooze_${medicine.id}_${Date.now()}`;

  await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title: '💊 Snoozed Reminder',
      body: `${medicine.name} — ${medicine.dosage}`,
      sound: true,
      data: {
        medicineId: medicine.id,
        medicineName: medicine.name,
        dosage: medicine.dosage,
        scheduledTime: medicine.scheduledTime || null,
      },
    },
    trigger: {
      seconds: 5 * 60, // 5 minutes
      repeats: false,
    },
  });

  console.log(`[Notifications] Snooze set for "${medicine.name}" in 5 minutes.`);
}

/**
 * Cancels all scheduled notifications (useful for logout).
 */
export async function cancelAllMedicineNotifications() {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('[Notifications] All medication notifications cancelled.');
}

// ─── Expo Push API (guardian ↔ patient high-five) ────────────────────────────
// Uses Expo's free push notification service — no server required.
// Tokens are stored per-user in Firestore (see storageService.savePushToken).

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Sends a push notification to any Expo push token via Expo's free push service.
 * @param {string} to - ExponentPushToken[...] format token
 * @param {string} title
 * @param {string} body
 * @param {object} data - extra payload
 */
export async function sendExpoPush(to, title, body, data = {}) {
  if (!to || !to.startsWith('ExponentPushToken')) {
    console.warn('[Push] Invalid push token — skipping.');
    return;
  }
  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, title, body, data, sound: 'default' }),
    });
    const json = await res.json();
    if (json.data?.status === 'error') {
      console.warn('[Push] Expo push error:', json.data.message);
    }
  } catch (err) {
    console.error('[Push] Network error sending push:', err.message);
  }
}

/**
 * Notifies all linked guardian push tokens when the patient hits a streak milestone.
 * Called from the patient's app — no server required.
 *
 * @param {string[]} guardianTokens - array of guardian Expo push tokens
 * @param {number} days - milestone (e.g. 7)
 * @param {Function} t - translation helper
 */
export async function notifyGuardiansOfMilestone(guardianTokens, days, t) {
  if (!Array.isArray(guardianTokens) || guardianTokens.length === 0) return;
  await Promise.all(
    guardianTokens.map(token =>
      sendExpoPush(
        token,
        t('notifHighFivePromptTitle'),
        t('notifHighFivePromptBody', days),
        { type: 'milestone_prompt', days }
      )
    )
  );
}

/**
 * Sends a high-five push notification from the guardian to the patient.
 *
 * @param {string} patientToken - patient's Expo push token
 * @param {Function} t - translation helper
 */
export async function sendHighFiveToPatient(patientToken, t) {
  await sendExpoPush(
    patientToken,
    t('notifHighFiveTitle'),
    t('notifHighFiveBody'),
    { type: 'high_five' }
  );
}

/**
 * Schedules a one-time local notification for a refill reminder.
 * Fires immediately (0s delay) since the check happens at the right time.
 *
 * @param {object} medicine - { name, id }
 * @param {number} daysLeft - estimated days of supply remaining
 * @param {Function} t - translation helper
 */
export async function scheduleRefillReminder(medicine, daysLeft, t) {
  if (Platform.OS === 'web') return;
  const identifier = `refill_${medicine.id}`;
  try {
    // Cancel any existing refill reminder for this medicine
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

