# Medicare Audit Fixes — Task List

## Critical Bugs
- [x] **#2** Fix `pillsPerDose` → `doseAmount` in App.js (inventory decrement)
- [x] **#3** Fix guardian login not restoring `linkedPatientUid` in storageService.js
- [x] **#4** Fix timezone bug in `getWeeklyAdherenceData` (UTC vs local)
- [x] **#5** Add loading skeleton state for streakData in Dashboard.js

## Data & Logic Bugs
- [x] **#6** Fix `isDone` rolling 1-hour window → full-day check in Dashboard.js
- [x] **#7** Wrap `onReminderTrigger` in `useCallback` in App.js + fix hook stale ref
- [x] **#8** Memoize `computeStreak` / `computeBadges` with `useMemo` in Dashboard.js
- [x] **#9** Fix ProfileScreen guardian role bug (wrong UID for stats subscriptions)
- [x] **#10** Throw proper error instead of silently defaulting to 'patient' in storageService.js

## UX & Flow
- [x] **#11** Add guard in Dashboard useFocusEffect to redirect guardians without link
- [x] **#12** Add "Forgot Password" flow to LoginScreen.js
- [x] **#13** Fix hardcoded 30-pill refill → prompt for quantity in Dashboard.js
- [x] **#14** Filter medicines by day-of-week in Dashboard.js
- [x] **#15** Add top-level ErrorBoundary component

## Performance
- [x] **#16** Extract `MedicineCard` as `React.memo` in Dashboard.js
- [x] **#17** Add 90-day date filter to `subscribeLogs` in storageService.js
- [x] **#18** Cache `freezeInfo` in state, don't re-fetch on every log update
- [x] **#19** Update stale JSDoc in voiceService.js
- [x] **#20** Rename/refactor voiceKeywords.js → localeMap.js

## Security
- [x] **#22** Add email validation in RegisterScreen.js and LoginScreen.js

## New Feature
- [x] Add `name` field to registration (both patient and guardian)
- [x] Make patient↔guardian relationship many-to-many (patients can have multiple guardians, guardians can monitor multiple patients) (storageService done)
- [x] Show name in ProfileScreen
