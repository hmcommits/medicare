import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, auth } from './firebaseConfig';
import {
  collection, addDoc, getDocs, getDoc, setDoc, doc,
  deleteDoc, query, where, orderBy, onSnapshot,
  updateDoc, increment
} from 'firebase/firestore';
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';

// ─── Auth ────────────────────────────────────────────────────────────────────

export const loginUser = async (email, password) => {
  const creds = await signInWithEmailAndPassword(auth, email, password);

  const userDoc = await getDoc(doc(db, 'users', creds.user.uid));
  if (!userDoc.exists()) {
    // #10 — never silently default; surface the broken profile explicitly
    throw new Error('User profile not found. Please contact support or re-register.');
  }

  const data = userDoc.data();
  const role = data.role;
  await AsyncStorage.setItem('@medicare_user_role', role);

  if (role === 'patient') {
    await AsyncStorage.setItem('@medicare_patient_uid', creds.user.uid);
  } else if (role === 'guardian') {
    // #3 — restore linked patient UIDs on re-login so getActivePatientUid() works
    const linkedPatients = data.linkedPatientUids || [];
    if (linkedPatients.length > 0) {
      // Restore the first linked patient as the active one (user can switch later)
      await AsyncStorage.setItem('@medicare_linked_patient_uid', linkedPatients[0]);
      await AsyncStorage.setItem('@medicare_linked_patient_uids', JSON.stringify(linkedPatients));
    }
  }
  return role;
};

export const registerUser = async (email, password, role, name = '') => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;

  // Store name for both roles; guardians start with empty linkedPatientUids array (many-to-many)
  await setDoc(doc(db, 'users', uid), {
    email,
    role,
    name: name.trim(),
    ...(role === 'guardian' ? { linkedPatientUids: [] } : {}),
  });
  await AsyncStorage.setItem('@medicare_user_role', role);

  if (role === 'patient') {
    // Generate a unique 6-digit code with collision check
    let code = Math.floor(100000 + Math.random() * 900000).toString();
    let exists = true;
    while (exists) {
      const docSnap = await getDoc(doc(db, 'patientCodes', code));
      if (!docSnap.exists()) {
        exists = false;
      } else {
        code = Math.floor(100000 + Math.random() * 900000).toString();
      }
    }

    // guardianUids is the many-to-many list on the patient side
    await setDoc(doc(db, 'patientCodes', code), { patientUid: uid });
    await setDoc(doc(db, 'users', uid), { code, guardianUids: [] }, { merge: true });
    await AsyncStorage.setItem('@medicare_patient_uid', uid);
  }

  return userCredential;
};

export const logoutUser = async () => {
  await signOut(auth);
  await AsyncStorage.multiRemove([
    '@medicare_user_role',
    '@medicare_patient_uid',
    '@medicare_linked_patient_uid',
    '@medicare_linked_patient_uids',
  ]);
};

export const resetPassword = async (email) => {
  if (!email) throw new Error('Please enter your email address first.');
  await sendPasswordResetEmail(auth, email);
};

// ─── Patient ID resolution ────────────────────────────────────────────────────

/**
 * Resolves the active patient UID based on role.
 * Exported so Dashboard/App can set up Firestore listeners directly.
 */
export const getActivePatientUid = async () => {
  const role = await AsyncStorage.getItem('@medicare_user_role');
  if (role === 'guardian') {
    const gUid = await AsyncStorage.getItem('@medicare_linked_patient_uid');
    if (gUid) return gUid;
    throw new Error('Guardian not linked to a patient yet.');
  } else {
    if (auth.currentUser) return auth.currentUser.uid;
    const pUid = await AsyncStorage.getItem('@medicare_patient_uid');
    if (pUid) return pUid;
    throw new Error('Patient not authenticated.');
  }
};

// ─── Linking ──────────────────────────────────────────────────────────────────

export const getPatientCodeForCurrentUser = async () => {
  if (!auth.currentUser) return null;
  const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
  if (userDoc.exists()) return userDoc.data().code;
  return null;
};

export const linkGuardianToPatient = async (code) => {
  const docSnap = await getDoc(doc(db, 'patientCodes', code));
  if (!docSnap.exists()) return false;

  const pUid = docSnap.data().patientUid;

  if (!auth.currentUser) return false;
  const gUid = auth.currentUser.uid;

  // ── Many-to-many: update patient side ────────────────────────────────────
  const patientDoc = await getDoc(doc(db, 'users', pUid));
  const existingGuardians = patientDoc.exists() ? (patientDoc.data().guardianUids || []) : [];
  const updatedGuardians = [...new Set([...existingGuardians, gUid])];
  await setDoc(doc(db, 'users', pUid), { guardianUids: updatedGuardians }, { merge: true });

  // ── Many-to-many: update guardian side ───────────────────────────────────
  const guardianDoc = await getDoc(doc(db, 'users', gUid));
  const existingPatients = guardianDoc.exists() ? (guardianDoc.data().linkedPatientUids || []) : [];
  const updatedPatients = [...new Set([...existingPatients, pUid])];
  await setDoc(doc(db, 'users', gUid), { linkedPatientUids: updatedPatients }, { merge: true });

  // ── Local cache: store all linked patient UIDs + set the active one ──────
  await AsyncStorage.setItem('@medicare_linked_patient_uid', pUid);
  await AsyncStorage.setItem('@medicare_linked_patient_uids', JSON.stringify(updatedPatients));

  return true;
};

/**
 * Switches the guardian's active patient (for many-to-many support).
 * @param {string} pUid - UID of the patient to make active
 */
export const switchActivePatient = async (pUid) => {
  await AsyncStorage.setItem('@medicare_linked_patient_uid', pUid);
};

/**
 * Returns all patient UIDs a guardian is linked to.
 * @returns {string[]}
 */
export const getLinkedPatientUids = async () => {
  const raw = await AsyncStorage.getItem('@medicare_linked_patient_uids');
  if (raw) return JSON.parse(raw);
  // Fallback: read from Firestore
  if (!auth.currentUser) return [];
  const doc_ = await getDoc(doc(db, 'users', auth.currentUser.uid));
  return doc_.exists() ? (doc_.data().linkedPatientUids || []) : [];
};

// ─── Medicines ───────────────────────────────────────────────────────────────

export const saveMedicine = async (newMedicine) => {
  try {
    const pUid = await getActivePatientUid();
    const medicinesRef = collection(db, 'patients', pUid, 'medicines');
    const docRef = await addDoc(medicinesRef, newMedicine);
    // Return the saved medicine with its Firestore-generated ID
    return { ...newMedicine, id: docRef.id };
  } catch (error) {
    console.error('Error saving medicine to Firestore:', error);
    throw error;
  }
};

export const deleteMedicine = async (medicineId) => {
  try {
    const pUid = await getActivePatientUid();
    await deleteDoc(doc(db, 'patients', pUid, 'medicines', medicineId));
    return true;
  } catch (error) {
    console.error('Error deleting medicine:', error);
    throw error;
  }
};

export const getMedicines = async () => {
  try {
    const pUid = await getActivePatientUid();
    const snapshot = await getDocs(collection(db, 'patients', pUid, 'medicines'));
    return snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
  } catch (error) {
    console.error('Error fetching medicines:', error);
    return [];
  }
};

/**
 * Attaches a real-time onSnapshot listener to the medicines collection.
 * @param {string} pUid - Patient UID
 * @param {function} callback - Called with the medicines array on every change
 * @returns {function} Unsubscribe function
 */
export const subscribeMedicines = (pUid, callback) => {
  const medicinesRef = collection(db, 'patients', pUid, 'medicines');
  return onSnapshot(medicinesRef, (snap) => {
    callback(snap.docs.map(d => ({ ...d.data(), id: d.id })));
  });
};

// ─── Adherence Logs ──────────────────────────────────────────────────────────

/**
 * Logs a medicine adherence event.
 * Includes the specific scheduledTime slot to prevent the "broad window"
 * bug where two doses close together suppress each other.
 *
 * Duplicate check: queries only logs for this (medicineId + scheduledTime)
 * in the last 60 seconds — no full table scan.
 *
 * @param {string} medicineId
 * @param {'Took'|'Missed'|'Snoozed'} status
 * @param {string|null} scheduledTime - ISO string of the scheduled time slot
 */
export const logAdherence = async (medicineId, status, scheduledTime = null) => {
  try {
    const pUid = await getActivePatientUid();
    const logsRef = collection(db, 'patients', pUid, 'adherenceLogs');

    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60_000).toISOString();

    // Efficient targeted query — no full table scan
    const dupQuery = query(
      logsRef,
      where('medicineId', '==', medicineId),
      where('scheduledTime', '==', scheduledTime ?? ''),
      where('timestamp', '>', oneMinuteAgo)
    );

    const dupSnap = await getDocs(dupQuery);
    if (!dupSnap.empty) {
      console.log('[logAdherence] Duplicate within 60s — skipping.');
      return { success: true, docId: dupSnap.docs[0].id, isDuplicate: true };
    }

    const docRef = await addDoc(logsRef, {
      medicineId,
      scheduledTime: scheduledTime ?? '',
      status,
      timestamp: now.toISOString(),
    });

    return { success: true, docId: docRef.id };
  } catch (error) {
    console.error('Error logging adherence:', error);
    throw error;
  }
};

/**
 * Deletes an adherence log by its Firestore ID. Used for the "Undo" feature.
 * @param {string} logId
 */
export const deleteAdherenceLog = async (logId) => {
  try {
    const pUid = await getActivePatientUid();
    await deleteDoc(doc(db, 'patients', pUid, 'adherenceLogs', logId));
    return true;
  } catch (error) {
    console.error('Error deleting adherence log:', error);
    return false;
  }
};

export const getAdherenceLogs = async () => {
  try {
    const pUid = await getActivePatientUid();
    const snapshot = await getDocs(collection(db, 'patients', pUid, 'adherenceLogs'));
    return snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
  } catch (error) {
    console.error('Error fetching logs:', error);
    return [];
  }
};

/**
 * Attaches a real-time onSnapshot listener to the adherence logs collection.
 * @param {string} pUid - Patient UID
 * @param {function} callback - Called with the log array on every change
 * @returns {function} Unsubscribe function
 */
export const subscribeLogs = (pUid, callback) => {
  // #17 — only fetch the last 90 days to control Firestore read costs
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const logsRef = query(
    collection(db, 'patients', pUid, 'adherenceLogs'),
    where('timestamp', '>', ninetyDaysAgo.toISOString()),
    orderBy('timestamp', 'desc')
  );
  return onSnapshot(logsRef, (snap) => {
    const logs = snap.docs.map(d => ({ ...d.data(), id: d.id }));
    callback(logs);
  });
};

export const getWeeklyAdherenceData = (logs) => {
  // #4 — compare both sides in local timezone to avoid UTC midnight drift
  const toLocalDateStr = (isoString) => {
    const d = new Date(isoString);
    // Use locale date parts (respects device timezone)
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  };

  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return toLocalDateStr(d.toISOString());
  }).reverse();

  return last7Days.map(dateStr => {
    const dayLogs = logs.filter(log => toLocalDateStr(log.timestamp) === dateStr);
    if (dayLogs.length === 0) return 0;
    const tookCount = dayLogs.filter(log => log.status === 'Took').length;
    return Math.round((tookCount / dayLogs.length) * 100);
  });
};

// ─── Inventory ────────────────────────────────────────────────────────────────

/**
 * Atomically decrements a medicine's quantity when a dose is taken.
 * Safe against concurrent updates (no read-modify-write race).
 */
export const decrementInventory = async (medicineId, pillsPerDose = 1) => {
  try {
    const pUid = await getActivePatientUid();
    const medRef = doc(db, 'patients', pUid, 'medicines', medicineId);
    await updateDoc(medRef, { quantity: increment(-Math.abs(pillsPerDose)) });
  } catch (error) {
    console.error('[storageService] Error decrementing inventory:', error);
  }
};

/**
 * Atomically increments a medicine's quantity (used when undoing a dose).
 */
export const incrementInventory = async (medicineId, pillsPerDose = 1) => {
  try {
    const pUid = await getActivePatientUid();
    const medRef = doc(db, 'patients', pUid, 'medicines', medicineId);
    await updateDoc(medRef, { quantity: increment(Math.abs(pillsPerDose)) });
  } catch (error) {
    console.error('[storageService] Error incrementing inventory:', error);
  }
};

/**
 * Refills a medicine by adding the given pill count to the current quantity.
 * Also records lastRefilledAt timestamp.
 */
export const refillMedicine = async (medicineId, addedQuantity) => {
  try {
    const pUid = await getActivePatientUid();
    const medRef = doc(db, 'patients', pUid, 'medicines', medicineId);
    await updateDoc(medRef, {
      quantity: increment(Math.abs(addedQuantity)),
      lastRefilledAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('[storageService] Error refilling medicine:', error);
    throw error;
  }
};

// ─── Streak Freeze (Mercy Rule) ───────────────────────────────────────────────

/**
 * Reads the current streak freeze status for the logged-in patient.
 * Automatically resets to 1 at the start of each new calendar month.
 * Returns { count: number, resetMonth: string }
 */
export const getStreakFreeze = async () => {
  try {
    const pUid = await getActivePatientUid();
    const userDoc = await getDoc(doc(db, 'users', pUid));
    const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

    if (!userDoc.exists()) return { count: 1, resetMonth: currentMonth };

    const meta = userDoc.data().streakFreeze || {};
    if (meta.resetMonth !== currentMonth) {
      // New month — reset freeze count (don't write yet; write happens on consume)
      return { count: 1, resetMonth: currentMonth };
    }
    return { count: meta.count ?? 1, resetMonth: meta.resetMonth };
  } catch (error) {
    console.error('[storageService] Error reading streak freeze:', error);
    return { count: 0, resetMonth: '' };
  }
};

/**
 * Marks the monthly streak freeze as used for the current patient.
 * Should only be called once per month.
 */
export const consumeStreakFreeze = async () => {
  try {
    const pUid = await getActivePatientUid();
    const currentMonth = new Date().toISOString().slice(0, 7);
    await setDoc(
      doc(db, 'users', pUid),
      { streakFreeze: { count: 0, resetMonth: currentMonth } },
      { merge: true }
    );
  } catch (error) {
    console.error('[storageService] Error consuming streak freeze:', error);
  }
};

// ─── Achievements (Badges) ────────────────────────────────────────────────────

/** Persists a newly unlocked badge to Firestore. Idempotent — safe to call multiple times. */
export const saveAchievement = async (badgeId) => {
  try {
    const pUid = await getActivePatientUid();
    await setDoc(
      doc(db, 'patients', pUid, 'achievements', badgeId),
      { badgeId, unlockedAt: new Date().toISOString() },
      { merge: true }
    );
  } catch (error) {
    console.error('[storageService] Error saving achievement:', error);
  }
};

/** Fetches all previously unlocked badge IDs for the current patient. */
export const getAchievements = async () => {
  try {
    const pUid = await getActivePatientUid();
    const snap = await getDocs(collection(db, 'patients', pUid, 'achievements'));
    return snap.docs.map(d => d.data().badgeId).filter(Boolean);
  } catch (error) {
    console.error('[storageService] Error fetching achievements:', error);
    return [];
  }
};

// ─── Push Tokens (for guardian↔patient high-five) ─────────────────────────────

/**
 * Saves the current user's Expo push token to their Firestore user document.
 * Called once after auth is established (in App.js).
 */
export const savePushToken = async (token) => {
  try {
    if (!auth.currentUser || !token) return;
    await setDoc(
      doc(db, 'users', auth.currentUser.uid),
      { pushToken: token },
      { merge: true }
    );
  } catch (error) {
    console.error('[storageService] Error saving push token:', error);
  }
};

/**
 * Reads the Expo push token for any user by their UID.
 * Used by guardian to fetch patient's token, and vice versa.
 */
export const getUserPushToken = async (uid) => {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data().pushToken ?? null) : null;
  } catch (error) {
    console.error('[storageService] Error fetching push token:', error);
    return null;
  }
};

/**
 * Fetches push tokens for all guardians linked to the current patient.
 * Used by the patient's app to send milestone notifications to guardians.
 */
export const getGuardianPushTokens = async () => {
  try {
    const pUid = await getActivePatientUid();
    const userDoc = await getDoc(doc(db, 'users', pUid));
    if (!userDoc.exists()) return [];
    const guardianUids = userDoc.data().guardianUids || [];
    const tokens = await Promise.all(guardianUids.map(uid => getUserPushToken(uid)));
    return tokens.filter(Boolean);
  } catch (error) {
    console.error('[storageService] Error fetching guardian push tokens:', error);
    return [];
  }
};
