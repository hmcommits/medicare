import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { saveMedicine } from '../services/storageService';

const DAYS_OF_WEEK = [
  { label: 'S', fullLabel: 'Sun', value: 0 },
  { label: 'M', fullLabel: 'Mon', value: 1 },
  { label: 'T', fullLabel: 'Tue', value: 2 },
  { label: 'W', fullLabel: 'Wed', value: 3 },
  { label: 'T', fullLabel: 'Thu', value: 4 },
  { label: 'F', fullLabel: 'Fri', value: 5 },
  { label: 'S', fullLabel: 'Sat', value: 6 },
];

export default function AddMedicineScreen({ navigation }) {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [times, setTimes] = useState([new Date()]);
  const [showPicker, setShowPicker] = useState([false]);
  const [selectedDays, setSelectedDays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [nameFocused, setNameFocused] = useState(false);
  const [dosageFocused, setDosageFocused] = useState(false);

  const handleTimeChange = (event, selectedTime, index) => {
    const newShowPicker = [...showPicker];
    newShowPicker[index] = false;
    setShowPicker(newShowPicker);
    if (selectedTime) {
      const newTimes = [...times];
      newTimes[index] = selectedTime;
      setTimes(newTimes);
    }
  };

  const addAnotherTime = () => {
    setTimes([...times, new Date()]);
    setShowPicker([...showPicker, false]);
  };

  const removeTime = (indexToRemove) => {
    setTimes(times.filter((_, index) => index !== indexToRemove));
    setShowPicker(showPicker.filter((_, index) => index !== indexToRemove));
  };

  const toggleDay = (dayValue) => {
    setSelectedDays(prev =>
      prev.includes(dayValue)
        ? prev.filter(d => d !== dayValue)
        : [...prev, dayValue].sort()
    );
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const adjustWebTime = (index, hoursToAdd, minutesToAdd) => {
    const newTimes = [...times];
    const newDate = new Date(newTimes[index]);
    newDate.setHours(newDate.getHours() + hoursToAdd);
    newDate.setMinutes(newDate.getMinutes() + minutesToAdd);
    newTimes[index] = newDate;
    setTimes(newTimes);
  };

  const handleSave = async () => {
    if (!name.trim() || !dosage.trim()) {
      Alert.alert('Missing Info', 'Please enter the medicine name and dosage.');
      return;
    }
    if (selectedDays.length === 0) {
      Alert.alert('Missing Info', 'Please select at least one day.');
      return;
    }
    if (times.length === 0) {
      Alert.alert('Missing Info', 'Please add at least one time.');
      return;
    }

    const pad = (n) => n.toString().padStart(2, '0');
    const timesToSave = times.map(t => `2000-10-10T${pad(t.getHours())}:${pad(t.getMinutes())}:00`);

    const newMedicine = {
      name: name.trim(),
      dosage: dosage.trim(),
      times: timesToSave,
      days: selectedDays
    };

    try {
      await saveMedicine(newMedicine);
      Alert.alert('Success!', `${name.trim()} has been added to your schedule.`, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      if (Platform.OS === 'web') navigation.goBack();
    } catch (error) {
      Alert.alert('Save Error', error.message || 'Failed to save medicine.');
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.pageHeader}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="pill" size={30} color="#00C9A7" />
          </View>
          <Text style={styles.pageTitle}>Add Medicine</Text>
          <Text style={styles.pageSubtitle}>Set up your medication schedule</Text>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medication Details</Text>

          <Text style={styles.label}>Medicine Name</Text>
          <View style={[styles.inputWrapper, nameFocused && styles.inputFocused]}>
            <MaterialCommunityIcons name="pill" size={20} color={nameFocused ? '#00C9A7' : '#64748B'} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g., Aspirin, Metformin"
              placeholderTextColor="#475569"
              value={name}
              onChangeText={setName}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
            />
          </View>

          <Text style={styles.label}>Dosage</Text>
          <View style={[styles.inputWrapper, dosageFocused && styles.inputFocused]}>
            <MaterialCommunityIcons name="scale" size={20} color={dosageFocused ? '#00C9A7' : '#64748B'} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g., 1 tablet, 500mg"
              placeholderTextColor="#475569"
              value={dosage}
              onChangeText={setDosage}
              onFocus={() => setDosageFocused(true)}
              onBlur={() => setDosageFocused(false)}
            />
          </View>
        </View>

        {/* Repeat Days */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Repeat Schedule</Text>
          <View style={styles.daysRow}>
            {DAYS_OF_WEEK.map((day) => {
              const selected = selectedDays.includes(day.value);
              return (
                <TouchableOpacity
                  key={day.value}
                  style={[styles.dayPill, selected && styles.dayPillSelected]}
                  onPress={() => toggleDay(day.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dayText, selected && styles.dayTextSelected]}>{day.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Times */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reminder Times</Text>

          {times.map((time, index) => (
            <View key={index} style={styles.timeRow}>
              <View style={styles.timeCard}>
                <MaterialCommunityIcons name="clock-outline" size={20} color="#00C9A7" />
                {Platform.OS === 'web' ? (
                  <View style={styles.webTimeRow}>
                    <TouchableOpacity onPress={() => adjustWebTime(index, -1, 0)} style={styles.adjBtn}>
                      <Text style={styles.adjBtnText}>-1h</Text>
                    </TouchableOpacity>
                    <Text style={styles.timeDisplay}>{formatTime(time)}</Text>
                    <TouchableOpacity onPress={() => adjustWebTime(index, 1, 0)} style={styles.adjBtn}>
                      <Text style={styles.adjBtnText}>+1h</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => adjustWebTime(index, 0, 15)} style={[styles.adjBtn, { marginLeft: 8 }]}>
                      <Text style={styles.adjBtnText}>+15m</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ flex: 1 }}>
                    {Platform.OS === 'android' ? (
                      <TouchableOpacity onPress={() => {
                        const newShow = [...showPicker];
                        newShow[index] = true;
                        setShowPicker(newShow);
                      }}>
                        <Text style={styles.timeDisplay}>{formatTime(time)}</Text>
                      </TouchableOpacity>
                    ) : null}
                    {(showPicker[index] || Platform.OS === 'ios') && (
                      <DateTimePicker
                        value={time}
                        mode="time"
                        is24Hour={false}
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, selected) => handleTimeChange(event, selected, index)}
                        themeVariant="dark"
                      />
                    )}
                  </View>
                )}
              </View>

              {times.length > 1 && (
                <TouchableOpacity onPress={() => removeTime(index)} style={styles.removeBtn}>
                  <MaterialCommunityIcons name="close" size={18} color="#F87171" />
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity style={styles.addTimeBtn} onPress={addAnotherTime} activeOpacity={0.7}>
            <MaterialCommunityIcons name="plus-circle-outline" size={20} color="#00C9A7" />
            <Text style={styles.addTimeText}>Add Another Time</Text>
          </TouchableOpacity>
        </View>

        {/* Save */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <MaterialCommunityIcons name="content-save-outline" size={22} color="#0F172A" />
          <Text style={styles.saveBtnText}>Save Medicine</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    padding: 24,
    paddingBottom: 48,
  },
  pageHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#00C9A71A',
    borderWidth: 1.5,
    borderColor: '#00C9A7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  section: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#334155',
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  inputFocused: {
    borderColor: '#00C9A7',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#F1F5F9',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayPill: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillSelected: {
    backgroundColor: '#00C9A7',
    borderColor: '#00C9A7',
  },
  dayText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
  },
  dayTextSelected: {
    color: '#0F172A',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  timeCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
  },
  timeDisplay: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  webTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
    gap: 8,
  },
  adjBtn: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  adjBtnText: {
    color: '#00C9A7',
    fontWeight: '700',
    fontSize: 13,
  },
  removeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F871711A',
    borderWidth: 1.5,
    borderColor: '#F87171',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#00C9A7',
    borderStyle: 'dashed',
  },
  addTimeText: {
    color: '#00C9A7',
    fontWeight: '700',
    fontSize: 15,
  },
  saveBtn: {
    flexDirection: 'row',
    backgroundColor: '#00C9A7',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
    shadowColor: '#00C9A7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  saveBtnText: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
  },
});
