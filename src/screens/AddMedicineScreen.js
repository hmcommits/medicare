import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { saveMedicine } from '../services/storageService';

const DAYS_OF_WEEK = [
  { label: 'S', value: 0 },
  { label: 'M', value: 1 },
  { label: 'T', value: 2 },
  { label: 'W', value: 3 },
  { label: 'T', value: 4 },
  { label: 'F', value: 5 },
  { label: 'S', value: 6 },
];

export default function AddMedicineScreen({ navigation }) {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  
  // State for multiple times
  const [times, setTimes] = useState([new Date()]); // default one time
  
  // State for selected days (indecies 0-6)
  const [selectedDays, setSelectedDays] = useState([0, 1, 2, 3, 4, 5, 6]); // Default all days

  const handleTimeChange = (event, selectedTime, index) => {
    if (selectedTime) {
      const newTimes = [...times];
      newTimes[index] = selectedTime;
      setTimes(newTimes);
    }
  };

  const addAnotherTime = () => {
    setTimes([...times, new Date()]);
  };

  const removeTime = (indexToRemove) => {
    setTimes(times.filter((_, index) => index !== indexToRemove));
  };

  const toggleDay = (dayValue) => {
    setSelectedDays(prevDays => 
      prevDays.includes(dayValue) 
        ? prevDays.filter(d => d !== dayValue) 
        : [...prevDays, dayValue].sort()
    );
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSave = async () => {
    if (!name.trim() || !dosage.trim()) {
      Alert.alert('Error', 'Please enter the medicine name and dosage.');
      return;
    }
    
    if (selectedDays.length === 0) {
      Alert.alert('Error', 'Please select at least one day for this medicine.');
      return;
    }
    
    if (times.length === 0) {
      Alert.alert('Error', 'Please add at least one time for this medicine.');
      return;
    }

    // Convert date objects to ISO strings for consistent storage
    const timesToSave = times.map(t => t.toISOString());

    const newMedicine = { 
      name: name.trim(), 
      dosage: dosage.trim(), 
      times: timesToSave,
      days: selectedDays
    };
    
    try {
      await saveMedicine(newMedicine);
      Alert.alert('Success', 'Medicine saved successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      
      // If web development, simulate navigation
      if(Platform.OS === 'web'){
          navigation.goBack();
      }
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

      <Text style={styles.label}>Repeat on</Text>
      <View style={styles.daysContainer}>
        {DAYS_OF_WEEK.map((day) => {
          const isSelected = selectedDays.includes(day.value);
          return (
            <TouchableOpacity
              key={day.value}
              style={[
                styles.dayCircle,
                isSelected ? styles.dayCircleSelected : null
              ]}
              onPress={() => toggleDay(day.value)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dayText,
                isSelected ? styles.dayTextSelected : null
              ]}>
                {day.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>Time(s)</Text>
      {times.map((time, index) => (
        <View key={index} style={styles.timeRow}>
            <View style={styles.pickerContainer}>
              {Platform.OS === 'web' ? (
                // Fallback for web until custom web pciker is added natively
                <Text style={styles.webTimeFallback}>{formatTime(time)}</Text>
              ) : (
                <DateTimePicker
                  value={time}
                  mode="time"
                  is24Hour={false}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedTime) => handleTimeChange(event, selectedTime, index)}
                  style={styles.datePicker}
                />
              )}
            </View>
            
            {times.length > 1 && (
              <TouchableOpacity onPress={() => removeTime(index)} style={styles.removeButton}>
                <Text style={styles.removeText}>X</Text>
              </TouchableOpacity>
            )}
        </View>
      ))}

      <TouchableOpacity 
        style={styles.addTimeButton}
        onPress={addAnotherTime}
        activeOpacity={0.7}
      >
        <Text style={styles.addTimeText}>+ Add Another Time</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.saveButton}
        onPress={handleSave}
        activeOpacity={0.8}
      >
        <Text style={styles.saveButtonText}>Save Medicine</Text>
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
    marginBottom: 12,
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
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  dayCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#BDC3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleSelected: {
    backgroundColor: '#3498DB',
    borderColor: '#3498DB',
  },
  dayText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7F8C8D',
  },
  dayTextSelected: {
    color: '#FFFFFF',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  pickerContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#BDC3C7',
    padding: Platform.OS === 'ios' ? 0 : 5,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 60,
  },
  datePicker: {
    width: '100%',
    height: Platform.OS === 'ios' ? 120 : 60,
  },
  webTimeFallback: {
    fontSize: 20,
    color: '#2C3E50',
    paddingVertical: 15,
  },
  removeButton: {
    marginLeft: 15,
    backgroundColor: '#E74C3C',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addTimeButton: {
    backgroundColor: '#E8F8F5',
    borderWidth: 2,
    borderColor: '#1ABC9C',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
  },
  addTimeText: {
    color: '#16A085',
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
});
