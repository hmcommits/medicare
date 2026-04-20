import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, auth } from './firebaseConfig';
import { collection, addDoc, getDocs, query, orderBy, doc, getDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';

export const loginUser = async (email, password) => {
  const creds = await signInWithEmailAndPassword(auth, email, password);
  
  // Fetch user role
  const userDoc = await getDoc(doc(db, 'users', creds.user.uid));
  if (userDoc.exists()) {
    const role = userDoc.data().role;
    await AsyncStorage.setItem('@medicare_user_role', role);
    if (role === 'patient') {
      await AsyncStorage.setItem('@medicare_patient_uid', creds.user.uid);
    }
    return role;
  }
  return 'patient';
};

export const registerUser = async (email, password, role) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;
  
  await setDoc(doc(db, 'users', uid), { email, role });
  await AsyncStorage.setItem('@medicare_user_role', role);

  if (role === 'patient') {
    let code = Math.floor(100000 + Math.random() * 900000).toString();
    // Collision check
    let exists = true;
    while(exists) {
        const docRef = doc(db, 'patientCodes', code);
        const docSnap = await getDoc(docRef);
        if(!docSnap.exists()){
            exists = false;
        } else {
            code = Math.floor(100000 + Math.random() * 900000).toString();
        }
    }
    
    await setDoc(doc(db, 'patientCodes', code), { patientUid: uid });
    await setDoc(doc(db, 'users', uid), { code }, { merge: true });
    await AsyncStorage.setItem('@medicare_patient_uid', uid);
  }
  
  return userCredential;
};

export const getPatientCodeForCurrentUser = async () => {
    if (!auth.currentUser) return null;
    const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
    if (userDoc.exists()) {
        return userDoc.data().code;
    }
    return null;
}

export const linkGuardianToPatient = async (code) => {
    const docRef = doc(db, 'patientCodes', code);
    const docSnap = await getDoc(docRef);
    if(docSnap.exists()){
        const pUid = docSnap.data().patientUid;
        await AsyncStorage.setItem('@medicare_linked_patient_uid', pUid);
        return true;
    }
    return false;
}

const getActivePatientUid = async () => {
  const role = await AsyncStorage.getItem('@medicare_user_role');
  if (role === 'guardian') {
      const gUid = await AsyncStorage.getItem('@medicare_linked_patient_uid');
      if (gUid) return gUid;
      throw new Error("Guardian not linked to a patient yet.");
  } else {
      if(auth.currentUser) return auth.currentUser.uid;
      const pUid = await AsyncStorage.getItem('@medicare_patient_uid');
      if (pUid) return pUid;
      throw new Error("Patient not authenticated.");
  }
};

export const saveMedicine = async (newMedicine) => {
  try {
    const pUid = await getActivePatientUid();
    const medicinesRef = collection(db, 'patients', pUid, 'medicines');
    await addDoc(medicinesRef, newMedicine);
    return true;
  } catch (error) {
    console.error('Error saving medicine to Firestore:', error);
    throw error;
  }
};

export const getMedicines = async () => {
  try {
    const pUid = await getActivePatientUid();
    const medicinesRef = collection(db, 'patients', pUid, 'medicines');
    const snapshot = await getDocs(medicinesRef);
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }));
  } catch (error) {
    console.error('Error fetching medicines:', error);
    return [];
  }
};

export const logAdherence = async (medicineId, status) => {
  try {
    const pUid = await getActivePatientUid();
    const logsRef = collection(db, 'patients', pUid, 'adherenceLogs');
    const snapshot = await getDocs(logsRef);
    
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);

    const duplicateExists = snapshot.docs.some(doc => {
      const log = doc.data();
      return log.medicineId === medicineId && new Date(log.timestamp) > oneMinuteAgo;
    });

    if (duplicateExists) return true;

    await addDoc(logsRef, {
      medicineId,
      status, 
      timestamp: now.toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error logging adherence:', error);
    throw error;
  }
};

export const getAdherenceLogs = async () => {
  try {
    const pUid = await getActivePatientUid();
    const logsRef = collection(db, 'patients', pUid, 'adherenceLogs');
    const snapshot = await getDocs(logsRef);
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }));
  } catch (error) {
    console.error('Error fetching logs:', error);
    return [];
  }
};

export const getWeeklyAdherenceData = async () => {
  try {
    const pUid = await getActivePatientUid();
    const logsRef = collection(db, 'patients', pUid, 'adherenceLogs');
    const snapshot = await getDocs(logsRef);
    const logs = snapshot.docs.map(doc => doc.data());

    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toDateString();
    }).reverse();

    return last7Days.map(dateStr => {
      const dayLogs = logs.filter(log => new Date(log.timestamp).toDateString() === dateStr);
      if (dayLogs.length === 0) return 0;
      
      const tookCount = dayLogs.filter(log => log.status === 'Took').length;
      return Math.round((tookCount / dayLogs.length) * 100);
    });

  } catch (error) {
    console.error('Error calculating weekly data:', error);
    return Array(7).fill(0);
  }
};
