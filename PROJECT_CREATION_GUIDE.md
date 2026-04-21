# MediCare: Project Creation Guide

This document serves as a comprehensive reference detailing exactly how the MediCare application was architected, stabilized, and styled from the ground up.

---

## 🏗️ 1. Project Scaffolding
The application was built using **React Native** managed by **Expo SDK 55**. 
- Using Expo allows the application to stay deeply cross-platform without needing to manipulate underlying iOS/Android native code. 
- The project implements React Native's **New Architecture**, enabling next-generation rendering speed via Fabric.
- The UI leverages `@react-navigation` to structure a Stack-based routing hierarchy spanning from Auth to Dashboards.

---

## 🔒 2. Authentication & Data Architecture

### Firebase Initialization (`firebaseConfig.js`)
We integrated the Firebase Web SDK (v12) to handle identity management and data storage. We specifically mapped `@react-native-async-storage/async-storage` into the Firebase standard initialization to force persistent sessions. 
- Once a user signs in, they stay signed in even when the app fully closes.

### The Problem with Original Linking 
Initially, patients generated a random code stored locally via `AsyncStorage`. If they uninstalled the app, their linked guardian completely lost access.

### The Solution: UID Mapping
1. A user visits `RegisterScreen.js` and signs up as a **Patient** or **Guardian**.
2. **Registration:** `storageService.js` creates their Email/Password Profile.
3. If they are a **Patient**, the service generates a random strictly 6-digit code.
4. The service writes a document uniquely identifying that code back to the `patientCodes` Firestore collection. The stored payload simply contains the real string `patientUid`.
5. Now, instead of linking directly to a fragile local code, Guardians link to an immortal `uid`. 

---

## ⏰ 3. The 60-Second "Heartbeat" Engine

Reliable medication reminders are notoriously difficult to implement gracefully in mobile. We built a continuous, stabilized polling engine in `App.js`.

### How It Works:
1. When the App mounts, a global interval fires every `60,000ms` (1 minute).
2. The `checkAlarms` function iterates through every medication fetched from Firestore.
3. It compares the current hour/minute against the medication's localized ISO time string (`YYYY-MM-DDTHH:MM:00`).
4. If it matches, it triggers the global `ReminderModal`.

### The Snooze Solution
To prevent recursive modal spawning (where the 60-second heartbeat keeps catching the exact same minute and reopening the modal), we integrated deep timestamping logic:
- When "Snooze" is clicked, we update the medication array dynamically to push the check window `+5 Minutes` forward.
- The modal unmounts seamlessly.

---

## 🎨 4. Deep-Navy Glassmorphic UI/UX

We conducted a massive aesthetic refactoring passing through all 7 components:

### The Palette
- **Backgrounds:** Deep Navy (`#0F172A`) & Card Surfaces (`#1E293B`)
- **Accents:** Neon Teal (`#00C9A7`) applied everywhere linking to Patients. Bright Purple (`#818CF8`) mapping Guardian-focused components.
- **Errors/Missed:** Vibrant Red (`#F87171`) 

### Input Engineering
We built interactive form states everywhere. Whenever an email or password generic `TextInput` is brought into focus, `onFocus{}` triggers a state block to paint the border and icon colors dynamically, enforcing visual hierarchy during typing.

---

## 🛡️ 5. Security & Deployment Architecture

### Hiding API Secrets
We ripped all plain-text API credentials out of the codebase. We shifted the entire initialization block to rely on `process.env.EXPO_PUBLIC_*` properties mapped directly from a localized `.env` file that git heavily ignores.

### Expo Application Services (EAS) CI/CD
To ensure the app could be deployed to the Google Play Store natively (not just wrapped via Expo Go), we defined explicit standalone EAS architectures:
- `eas.json` establishes strict rules for generating debug (`development`), internal (`preview`), and AAB (`production`) binaries dynamically.
- `app.json` was augmented inserting the required `com.hmcommits.medicare` explicit android package definitions.

*When triggering `eas build`, those hidden `.env` secrets can be securely passed through Expo's encrypted channels to yield a safe, secure, independently-installable APK.*
