import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './firebaseConfig';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';

const getActivePatientCode = async () => {
  const code = await AsyncStorage.getItem('@medicare_active_patient_code');
  if (!code) {
    throw new Error("No active patient code found. Please navigate to the link screen first.");
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
