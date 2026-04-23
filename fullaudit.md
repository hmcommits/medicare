# Medicare App — Full Codebase Audit

> Status: **Pre-publish analysis**. Every finding is sourced directly from the code.

---

## 🔴 Critical Bugs (App-Breaking)

### 1. Reminder system is dead in Expo Go (the environment being used to test)
**File:** `App.js` (line 61), `notificationService.js` (line 22)
**Root Cause:** When `IS_EXPO_GO === true`, the `Notifications` constant is set to `null`. This makes `scheduleMedicineNotification()` and all listeners silently return early. Reminders are never scheduled and the `ReminderModal` never fires.
**Current Workaround:** The `useForegroundReminders` hook polls every 10 seconds. But this only works if the **app is open**. If the app is in the background or the device is locked, the reminder is completely silent.
**True Fix:** A production APK build with a dev EAS build profile must be used. Expo Go **cannot** support local notifications in SDK 53+. This must be prominently documented and the team must switch to EAS dev builds for all testing.

---

### 2. Inventory field name mismatch — decrement always uses 1 pill
**File:** `App.js` (line 113)
```js
await decrementInventory(med.id, med.pillsPerDose || 1);
```
The medicine object from the notification payload (`currentMedicine`) only has `{ id, name, dosage, scheduledTime }`. There is **no `pillsPerDose` field** in this object (the real field name in Firestore is `doseAmount`). This means:
- The `|| 1` fallback is **always used**, regardless of the actual dose.
- Inventory is **always decremented by 1** even if the real dose is 10ml of syrup.
- The Undo feature also reverses by 1, so it's doubly broken.

**Fix:** Fetch the full medicine document or store `doseAmount` in the notification payload data and use `med.doseAmount`.

---

### 3. `loginUser` does not handle the guardian role — linked UID is lost on re-login
**File:** `storageService.js` (lines 16–29)
```js
if (role === 'patient') {
  await AsyncStorage.setItem('@medicare_patient_uid', creds.user.uid);
}
```
When a guardian logs in, `@medicare_linked_patient_uid` is **never restored**. So after logging out and logging back in, `getActivePatientUid()` will throw `"Guardian not linked to a patient yet."`, even though the link exists in Firestore.
**Fix:** On guardian login, read the `guardianUids` via the patient's `patientCodes` document or store `linkedPatientUid` in the user's Firestore profile and restore it at login.

---

### 4. `getWeeklyAdherenceData` uses device timezone but logs are stored in UTC
**File:** `storageService.js` (line 272)
```js
const dayLogs = logs.filter(log => new Date(log.timestamp).toDateString() === dateStr);
```
`log.timestamp` is stored as `now.toISOString()` (UTC). `d.toDateString()` gives local time. On a device in UTC+5:30, a medication taken at 11:30 PM local time is stored as the next UTC day, so it will appear on the **wrong day** in the adherence graph.
**Fix:** Either store the timestamp in the local timezone or always compare both sides after converting to the same timezone.

---

### 5. Streak calculation breaks if today has no logs yet (first use of day)
**File:** `streakService.js` (line 67)
```js
if (daysBack === 0) continue; // Today not yet started → neutral, keep going
```
This logic is sound by itself, but it only continues the loop for `daysBack === 0`. If yesterday was a complete miss (no log at all), `break` is immediately called. Since `break` triggers even before today is evaluated, this results in:
- Streak correctly ending for a missed day.
But the concern is: if a user had a 7-day streak, took their pills every day, and the **app is freshly installed**, their old logs may not be fetched yet (Firestore cold start), causing the streak to flash `0` initially.
**Fix:** Add a loading state to `streakData` and show a skeleton during the initial Firestore fetch.

---

## 🟠 Data & Logic Bugs

### 6. `isDone` check uses a 1-hour rolling window — wrong for scheduled doses
**File:** `Dashboard.js` (line 204–209)
```js
const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
const isDone = logs.some(log => ... new Date(log.timestamp) > oneHourAgo);
```
If a medicine is scheduled at 8 AM and is taken, the card shows "Done". But at 9:01 AM, the medicine card will **revert to "pending"** (the 1-hour window expires), confusing the user. For most medicines, "Done" should persist for the full day.
**Fix:** Compare against today's date string (`toDateString()`), not a 1-hour rolling window. Keep the 1-hour window only for multi-dose medicines.

---

### 7. `useForegroundReminders` uses a stale `onReminderTrigger` reference
**File:** `useForegroundReminders.js` (line 74)
```js
}, [medicines, onReminderTrigger]);
```
`onReminderTrigger` is the anonymous arrow function `(medData) => { ... }` defined inline in `App.js`. This function is **recreated on every render**, which causes the `setInterval` to be cleared and reset on every single render of `App`. The `triggeredRef` set is wiped each time the effect re-runs with a new interval, which could cause a medicine to trigger its reminder multiple times in one minute.
**Fix:** Wrap the callback in `useCallback` in `App.js`, and use a `useRef` for `onReminderTrigger` inside the hook to avoid stale closures.

---

### 8. `computeStreak` recomputes from scratch every time logs update
**File:** `Dashboard.js` (line 72–73, called inside `subscribeLogs`)
`computeStreak` and `computeBadges` iterate over 365 days every time a new adherence log arrives. This is a `O(n * 365)` computation on the UI thread inside a Firestore real-time listener.
**Fix:** Memoize with `useMemo`. Recompute only when the logs array reference changes, not on every render.

---

### 9. `ProfileScreen` opens duplicate Firestore subscriptions and doesn't guard guardian role
**File:** `ProfileScreen.js` (line 46)
```js
if (userData.role === 'patient') {
  // subscribes to logs and medicines
}
```
This is correct for patients. However, when a guardian views their own profile, the code reads `auth.currentUser.uid` directly to fetch the user doc — but the guardian's Firestore profile has none of the stats data (totalMeds, etc.). The stats grid is hidden with `{profile?.role === 'patient' && ...}`, so it won't crash, but the `subscribeLogs` and `subscribeMedicines` fire once with `pUid = user.uid` (the guardian UID), not the linked patient UID. This silently returns empty data.

---

### 10. `loginUser` defaults to `'patient'` if the Firestore user doc doesn't exist
**File:** `storageService.js` (line 28)
```js
return 'patient'; // default if doc doesn't exist
```
If the Firestore write during registration fails (network drop, quota exceeded), the user document may not exist. On the next login, the user is silently treated as a `patient` even if they registered as a `guardian`. There is no visible error.
**Fix:** Throw an error or show a "Profile not found" state rather than silently defaulting.

---

## 🟡 UX & Flow Issues

### 11. Guardian can navigate directly to Dashboard without ever linking
**File:** `AppNavigator.js` — no auth guard
After logging in as a guardian, the app navigates to `GuardianLink`. The user can press back to go to `Login` and then manually type `/Dashboard` is not possible via URL, but the **back button on Android** can take them to previous screens in the stack without a link being established. `getActivePatientUid()` will then throw, crashing the Dashboard silently.
**Fix:** Add a guard in the Dashboard `useFocusEffect` that redirects the user to `GuardianLink` if `getActivePatientUid()` throws.

---

### 12. No "Forgot Password" flow
**File:** `LoginScreen.js` — not present
Firebase Auth has a built-in `sendPasswordResetEmail` function. Not having this is a critical omission for a published app, especially for elderly users who frequently forget passwords.

---

### 13. Refill adds a hardcoded 30 pills — not configurable
**File:** `Dashboard.js` (line 178)
```js
await refillMedicine(item.id, 30);
```
The refill quantity is always 30 regardless of whether the medicine is a syrup (measured in ml) or uses a stock of 90-count tablets. The button text also says "Refill 30 💊" which shows the pill emoji even for liquid medicines.
**Fix:** Add a simple quantity input dialog or use the medicine's `doseType` to pick the right default.

---

### 14. Medicine card "Done" status does not account for day of week
**File:** `Dashboard.js`
If a medicine is scheduled only for Monday and Wednesday, it still appears on every day with a "pending" status dot because there's no check to filter medicines by the current day of the week before rendering. The card renders for all medicines all the time.
**Fix:** Filter `medicines` by `medicine.days.includes(new Date().getDay())` before rendering the list (or show a visual indicator that it's not scheduled today).

---

### 15. No app-level error boundary
**File:** All screens
If any screen throws a JavaScript exception at render time, React Native shows the full red error screen in development and a blank white screen in production. There is no `ErrorBoundary` component wrapping the navigator.
**Fix:** Add a top-level React `ErrorBoundary` that shows a friendly "Something went wrong — restart the app" screen with a reload button.

---

## 🔵 Performance & Optimization

### 16. `renderMedicineCard` is a function inside the component — creates new function reference every render
**File:** `Dashboard.js` (line 201)
`renderMedicineCard` is defined inline and called via `medicines.map(item => renderMedicineCard(item))`. This means React can't optimize it. Each re-render (which happens every 10 seconds due to the foreground reminder poll) re-creates the entire medicine card subtree.
**Fix:** Extract `MedicineCard` as a pure `React.memo` component that only re-renders when its specific `item` or `isDone` prop changes.

---

### 17. `subscribeLogs` fetches the entire `adherenceLogs` collection — no date filter
**File:** `storageService.js` (line 254–259)
```js
const logsRef = collection(db, 'patients', pUid, 'adherenceLogs');
return onSnapshot(logsRef, ...);
```
Every single adherence log ever recorded is fetched and subscribed to. For a patient who has used the app for 6 months, this could be **thousands of documents** downloaded to the device in a single query, impacting:
- Firestore read costs (billing risk for a published app)
- Memory usage
- Startup time
**Fix:** Add a Firestore query filter: `where('timestamp', '>', ninetyDaysAgo)` — 90 days is more than enough for streak computation and the weekly chart.

---

### 18. `getStreakFreeze` makes a Firestore read on every `subscribeLogs` callback
**File:** `Dashboard.js` (line 72)
```js
const freezeInfo = await getStreakFreeze();
```
This is called inside `subscribeLogs`'s callback. Every time a log is added or changed, a **separate** Firestore document read is triggered. If a patient has a noisy listener (e.g., the guardian and patient apps both open), this doubles the reads.
**Fix:** Cache the `freezeInfo` result in state after the initial load and only re-fetch it once per app session or after it's consumed.

---

### 19. `voiceService.js` still has a stale JSDoc comment referencing removed features
**File:** `voiceService.js` (lines 1–10)
The file header still describes `expo-speech-recognition` and `fastest-levenshtein` that were removed. This will confuse future developers.
**Fix:** Update the JSDoc to only describe the current TTS functionality.

---

### 20. `constants/voiceKeywords.js` file name is misleading
**File:** `voiceKeywords.js`
The file is now only an export of `LOCALE_MAP` but is still called `voiceKeywords`. This should be renamed to `localeMap.js` or merged into `voiceService.js` directly.

---

## 🔒 Security Issues

### 21. Firebase API key exposed in `.env` — no `.env.example` documented
**File:** `.env`
The `.env` file is listed in `.gitignore` which is correct. However, there is no `.env.example` file, making it hard for future contributors to know which variables are required. More critically, `EXPO_PUBLIC_*` variables in Expo are **bundled into the JavaScript bundle** and readable by anyone who reverse-engineers the APK.
**Mitigation:** This is expected for client-side Firebase config, but ensure Firestore Security Rules are tight (which they now are). Additionally add App Check to Firebase to prevent API abuse.

### 22. No email validation before submitting to Firebase Auth
**File:** `RegisterScreen.js`, `LoginScreen.js`
The only check is `if (!email || !password)`. An invalid email format is passed directly to Firebase, which returns a generic error message. A proper regex or HTML `keyboardType="email-address"` alone is insufficient.
**Fix:** Add a simple email format check (`/\S+@\S+\.\S+/.test(email)`) before the `setLoading(true)` call to give an immediate, clear error.

---

## Summary Table

| # | Severity | Category | File(s) | Fix Complexity |
|---|----------|----------|---------|----------------|
| 1 | 🔴 Critical | Notifications | `App.js`, `notificationService.js` | High (needs EAS build) |
| 2 | 🔴 Critical | Inventory | `App.js` | Low |
| 3 | 🔴 Critical | Auth/Session | `storageService.js` | Medium |
| 4 | 🔴 Critical | Date/Timezone | `storageService.js` | Medium |
| 5 | 🔴 Critical | UX Loading | `Dashboard.js` | Low |
| 6 | 🟠 Major | Logic | `Dashboard.js` | Low |
| 7 | 🟠 Major | Performance | `useForegroundReminders.js`, `App.js` | Medium |
| 8 | 🟠 Major | Performance | `streakService.js`, `Dashboard.js` | Low |
| 9 | 🟠 Major | Data | `ProfileScreen.js` | Low |
| 10 | 🟠 Major | Auth | `storageService.js` | Low |
| 11 | 🟡 Medium | UX/Nav | `AppNavigator.js`, `Dashboard.js` | Low |
| 12 | 🟡 Medium | UX | `LoginScreen.js` | Low |
| 13 | 🟡 Medium | UX | `Dashboard.js` | Low |
| 14 | 🟡 Medium | UX | `Dashboard.js` | Low |
| 15 | 🟡 Medium | Reliability | All screens | Low |
| 16 | 🔵 Optimize | Performance | `Dashboard.js` | Low |
| 17 | 🔵 Optimize | Firestore Cost | `storageService.js` | Low |
| 18 | 🔵 Optimize | Firestore Cost | `Dashboard.js` | Low |
| 19 | 🔵 Optimize | DX | `voiceService.js` | Trivial |
| 20 | 🔵 Optimize | DX | `voiceKeywords.js` | Trivial |
| 21 | 🔒 Security | Firebase | `.env`, config | Medium |
| 22 | 🔒 Security | Input | `RegisterScreen.js` | Trivial |
