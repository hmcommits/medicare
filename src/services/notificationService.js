export async function requestNotificationPermissions() {
  // Mocking permission to avoid Expo Go Android SDK 53 crash
  return true;
}

export async function scheduleMedicineNotification(medicine) {
  // Expo Go SDK 53+ removed push notifications from the Android client.
  // To avoid the `runtime not ready` crash, we are silencing this native call.
  // Actual reminder logic is now handled robustly in App.js via a foreground interval checking getMedicines()!
  console.log(`[Local Sync] Medicine saved. Foreground timer will handle ${medicine.name} reminders.`);
}
