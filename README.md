# MediCare 💊

> Your personal health companion for seamless medication adherence tracking.

![MediCare Header](https://via.placeholder.com/1200x300/0F172A/00C9A7?text=MediCare+Medication+Adherence+Platform)

MediCare is a comprehensive React Native (Expo) mobile application designed to bridge the gap between patients and their caregivers. By offering real-time medication tracking, secure profile linking, and visual adherence analytics, MediCare ensures that no dose is ever missed unnoticed.

## 🌟 Key Features

### For Patients
- **Smart Reminders:** Absolute timezone-safe scheduling ensures reminders trigger exactly when they should.
- **Interactive Alerts:** "Took", "Missed", and "Snooze" actions tied directly to interactive local bottom sheets.
- **Secure Authentication:** Firebase Email & Password authentication protects health data.
- **Seamless Pairing:** Generate a unique, collision-resistant 6-digit code to securely link your profile to a guardian.

### For Guardians
- **Real-Time Dashboards:** Monitor adherence data remotely in real-time.
- **7-Day Analytics:** View a graphical representation of the patient's adherence over the last week.
- **Activity Feed:** See granular logs of exactly when a patient took, missed, or snoozed their meds.

## 🛠 Tech Stack

- **Framework:** [React Native](https://reactnative.dev/) via [Expo SDK 55](https://expo.dev/) (Fully compatible with New Architecture)
- **Database / Backend:** [Firebase Firestore](https://firebase.google.com/products/firestore) (Web SDK v12)
- **Authentication:** [Firebase Auth](https://firebase.google.com/products/auth) (Email/Password)
- **Charting:** `react-native-chart-kit`
- **Navigation:** `@react-navigation/native` & `@react-navigation/stack`
- **UI/Aesthetics:** Deep Navy Dark Mode, Glassmorphic cards, custom SVGs via `@expo/vector-icons`

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js (v18+)
- Expo CLI
- Firebase Project with Firestore and Email/Password Auth enabled.

### 1. Clone & Install
```bash
git clone https://github.com/hmcommits/medicare.git
cd medicare
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root of the project to securely provide your Firebase Web credentials:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_build_id
```

### 3. Run the App
```bash
npm start
```
*Tip: Press `a` to open in Android Studio, `i` to open in iOS Simulator, or scan the QR code via the **Expo Go** mobile app.*

## 📦 Building for Production

This project is fully configured for continuous integration using **EAS (Expo Application Services)**.

### Build an Android APK
Ensure EAS CLI is installed:
```bash
npm install -g eas-cli
eas login
```

Inject the required secrets into your EAS cloud environment, then build:
```bash
eas build -p android --profile preview
```
This will yield an internal `.apk` file ready for manual testing.

## 🔒 Security Practices Configured
- **Git Ignore:** Configured to strictly omit `.env` to prevent credential leaking.
- **UID Linking:** Data merges strictly via verified `auth.currentUser.uid` endpoints to prevent guardian cross-talk.
- **Collision Checking:** Secure validation while generating new 6-digit Patient linkage codes.

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
