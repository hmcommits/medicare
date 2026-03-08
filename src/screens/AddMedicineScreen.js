import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { saveMedicine } from '../services/storageService';

export default function AddMedicineScreen({ navigation }) {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [time, setTime] = useState('');

  const handleSave = async () => {
    if (!name || !dosage || !time) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    const newMedicine = { name, dosage, time };
    
    try {
      await saveMedicine(newMedicine);
      Alert.alert('Success', 'Medicine saved successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save medicine.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Add New Medicine</Text>

      <Text style={styles.label}>Name of Medicine</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., Aspirin"
        placeholderTextColor="#BDC3C7"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Dosage</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 1 tablet"
        placeholderTextColor="#BDC3C7"
        value={dosage}
        onChangeText={setDosage}
      />

      <Text style={styles.label}>Time</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 8:00 AM"
        placeholderTextColor="#BDC3C7"
        value={time}
        onChangeText={setTime}
      />

      <TouchableOpacity 
        style={styles.button}
        onPress={handleSave}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Save Medicine</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F7F9FC',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 30,
    textAlign: 'center',
  },
  label: {
    fontSize: 18,
    color: '#34495E',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#BDC3C7',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    fontSize: 18,
    marginBottom: 25,
    color: '#2C3E50',
  },
  button: {
    backgroundColor: '#3498DB',
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
});
