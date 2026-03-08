import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@medicare_medicines';

export const saveMedicine = async (newMedicine) => {
  try {
    const existingMedicinesJson = await AsyncStorage.getItem(STORAGE_KEY);
    const existingMedicines = existingMedicinesJson ? JSON.parse(existingMedicinesJson) : [];
    
    // Add new medicine to the list with a unique ID
    // Note: newMedicine now contains arrays for 'times' and 'days' which stringify automatically
    const updatedMedicines = [...existingMedicines, { ...newMedicine, id: Date.now().toString() }];
    
    // Save back to storage
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMedicines));
    return updatedMedicines;
  } catch (error) {
    console.error('Error saving medicine:', error);
    throw error;
  }
};

export const getMedicines = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Error fetching medicines:', error);
    throw error;
  }
};

const ADHERENCE_KEY = '@medicare_adherence';

export const logAdherence = async (medicineId, status) => {
  try {
    const existingLogsJson = await AsyncStorage.getItem(ADHERENCE_KEY);
    const existingLogs = existingLogsJson ? JSON.parse(existingLogsJson) : [];
    
    const newLog = {
      id: Date.now().toString(),
      medicineId,
      status, // 'Took', 'Missed', 'Snoozed'
      timestamp: new Date().toISOString()
    };
    
    const updatedLogs = [...existingLogs, newLog];
    await AsyncStorage.setItem(ADHERENCE_KEY, JSON.stringify(updatedLogs));
    
    return updatedLogs;
  } catch (error) {
    console.error('Error logging adherence:', error);
    throw error;
  }
};

export const getAdherenceLogs = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(ADHERENCE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Error fetching adherence logs:', error);
    throw error;
  }
};
