import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './firebaseConfig';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';

const getActivePatientCode = async () => {
  let code = await AsyncStorage.getItem('@medicare_active_patient_code');
  if (!code) {
    // If the user hasn't visited the link screen yet, generate a generic code for them
    code = Math.floor(100000 + Math.random() * 900000).toString();
    await AsyncStorage.setItem('@medicare_active_patient_code', code);
    console.log("Auto-generated fallback Patient Code:", code);
  }
  return code;
};

export const saveMedicine = async (newMedicine) => {
  try {
    const patientCode = await getActivePatientCode();
    
    // Add new medicine to the subcollection
    const medicinesRef = collection(db, 'patients', patientCode, 'medicines');
    await addDoc(medicinesRef, newMedicine);
    
    // The previous implementation returned the whole array but it wasn't strictly necessary.
    // Dashboard.js refetches on focus anyway.
    return true;
  } catch (error) {
    console.error('Error saving medicine to Firestore:', error);
    throw error;
  }
};

export const getMedicines = async () => {
  try {
    const patientCode = await getActivePatientCode();
    
    const medicinesRef = collection(db, 'patients', patientCode, 'medicines');
    const snapshot = await getDocs(medicinesRef);
    
    const medicines = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }));
    
    return medicines;
  } catch (error) {
    console.error('Error fetching medicines from Firestore:', error);
    // If there's an error (like code missing on first ever boot before linking), return empty array
    return [];
  }
};

export const logAdherence = async (medicineId, status) => {
  try {
    const patientCode = await getActivePatientCode();
    
    const newLog = {
      medicineId,
      status, // 'Took', 'Missed', 'Snoozed'
      timestamp: new Date().toISOString()
    };
    
    const logsRef = collection(db, 'patients', patientCode, 'adherenceLogs');
    await addDoc(logsRef, newLog);
    
    return true;
  } catch (error) {
    console.error('Error logging adherence to Firestore:', error);
    throw error;
  }
};

export const getAdherenceLogs = async () => {
  try {
    const patientCode = await getActivePatientCode();
    
    const logsRef = collection(db, 'patients', patientCode, 'adherenceLogs');
    const snapshot = await getDocs(logsRef);
    
    const logs = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }));
    
    return logs;
  } catch (error) {
    console.error('Error fetching adherence logs from Firestore:', error);
    return [];
  }
};

export const getWeeklyAdherenceData = async (patientCode) => {
  try {
    // If patientCode isn't explicitly passed, get the active one
    const codeToUse = patientCode || await getActivePatientCode();
    
    const logsRef = collection(db, 'patients', codeToUse, 'adherenceLogs');
    const snapshot = await getDocs(logsRef);
    const logs = snapshot.docs.map(doc => doc.data());

    // Initialize array for the last 7 days
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
    console.error('Error calculating weekly adherence data:', error);
    return Array(7).fill(0);
  }
};
