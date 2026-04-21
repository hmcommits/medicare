import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Platform, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { saveMedicine } from '../services/storageService';
import { scheduleMedicineNotification } from '../services/notificationService';
import { searchMedicineNames, getMedicineInfo } from '../services/medicineInfoService';
import { useLanguage } from '../contexts/LanguageContext';

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
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [times, setTimes] = useState([new Date()]);
  const [showPicker, setShowPicker] = useState([false]);
  const [selectedDays, setSelectedDays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [nameFocused, setNameFocused] = useState(false);
  const [dosageFocused, setDosageFocused] = useState(false);

  // Auto-fill states
  const [suggestions, setSuggestions] = useState([]);
  const [drugInfo, setDrugInfo] = useState(null);
  const [fetchingSuggestions, setFetchingSuggestions] = useState(false);
  const [fetchingInfo, setFetchingInfo] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Inventory states
  const [enableInventory, setEnableInventory] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [pillsPerDose, setPillsPerDose] = useState('1');
  const [leadTime, setLeadTime] = useState(t('defaultLeadTime'));

  // Handle auto-complete debounce
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!name.trim() || name.length < 2) {
      setSuggestions([]);
      return;
    }
    setFetchingSuggestions(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchMedicineNames(name);
      setSuggestions(results);
      setFetchingSuggestions(false);
    }, 400);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [name]);

  const handleSelectSuggestion = async (suggestion) => {
    setName(suggestion);
    setSuggestions([]);
    
    // Fetch drug info automatically
    setFetchingInfo(true);
    const info = await getMedicineInfo(suggestion);
    if (info) {
      setDrugInfo(info);
      // Auto-fill dosage if empty
      if (!dosage && info.dosage) {
        setDosage(info.dosage.split('.')[0] || info.dosage);
      }
    }
    setFetchingInfo(false);
  };

  const clearInfo = () => {
    setDrugInfo(null);
  };

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

  const handleSave = async () => {
    if (!name.trim() || !dosage.trim()) {
      Alert.alert(t('missingInfo'), t('missingInfo'));
      return;
    }
    if (selectedDays.length === 0) {
      Alert.alert(t('missingInfo'), 'Please select at least one day.');
      return;
    }
    if (times.length === 0) {
      Alert.alert(t('missingInfo'), 'Please add at least one time.');
      return;
    }

    const pad = (n) => n.toString().padStart(2, '0');
    const timesToSave = times.map(t => `2000-10-10T${pad(t.getHours())}:${pad(t.getMinutes())}:00`);

    const newMedicine = {
      name: name.trim(),
      dosage: dosage.trim(),
      times: timesToSave,
      days: selectedDays,
    };

    if (enableInventory && quantity && pillsPerDose) {
      newMedicine.quantity = parseInt(quantity, 10) || 0;
      newMedicine.pillsPerDose = parseInt(pillsPerDose, 10) || 1;
      newMedicine.leadTimeDays = parseInt(leadTime, 10) || 7;
    }

    try {
      const savedMedicine = await saveMedicine(newMedicine);
      await scheduleMedicineNotification(savedMedicine);
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
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#00C9A7" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="pill" size={30} color="#00C9A7" />
            </View>
            <Text style={styles.pageTitle}>{t('addMedicine')}</Text>
            <Text style={styles.pageSubtitle}>{t('setUpSchedule')}</Text>
          </View>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('medicationDetails')}</Text>

          <Text style={styles.label}>{t('medicineName')}</Text>
          <View style={[styles.inputWrapper, nameFocused && styles.inputFocused]}>
            <MaterialCommunityIcons name="pill" size={20} color={nameFocused ? '#00C9A7' : '#64748B'} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('searchMedicineName')}
              placeholderTextColor="#475569"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (drugInfo) clearInfo();
              }}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
            />
            {fetchingSuggestions && <ActivityIndicator color="#00C9A7" size="small" style={{ marginRight: 10 }} />}
          </View>

          {/* Autocomplete Dropdown */}
          {nameFocused && suggestions.length > 0 && !drugInfo && (
            <View style={styles.suggestionsCard}>
              {suggestions.map((sg, i) => (
                <TouchableOpacity key={i} style={styles.suggestionItem} onPress={() => handleSelectSuggestion(sg)}>
                  <MaterialCommunityIcons name="magnify" size={16} color="#64748B" />
                  <Text style={styles.suggestionText}>{sg}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Drug Info Panel */}
          {fetchingInfo && (
            <View style={styles.infoLoadingWrapper}>
              <ActivityIndicator color="#8B5CF6" size="small" />
              <Text style={styles.infoLoadingText}>{t('fetchingInfo')}</Text>
            </View>
          )}

          {drugInfo && !fetchingInfo && (
            <View style={styles.infoPanel}>
              <View style={styles.infoPanelHeader}>
                <MaterialCommunityIcons name="information-outline" size={18} color="#8B5CF6" />
                <Text style={styles.infoPanelTitle}>{t('medicineInfo')}</Text>
              </View>
              {drugInfo.usage && (
                <Text style={styles.infoBlock}><Text style={styles.infoLabel}>{t('usage')}: </Text>{drugInfo.usage}</Text>
              )}
              {drugInfo.warning && (
                <Text style={styles.warningBlock}><Text style={styles.warningLabel}>{t('warnings')}: </Text>{drugInfo.warning}</Text>
              )}
            </View>
          )}

          <Text style={[styles.label, { marginTop: 16 }]}>{t('dosage')}</Text>
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

        {/* Inventory Tracking (Optional) */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>{t('inventoryOptional')}</Text>
              <Text style={styles.sectionSubtitle}>{t('inventoryHint')}</Text>
            </View>
            <TouchableOpacity onPress={() => setEnableInventory(!enableInventory)} style={styles.toggleBtn}>
              <MaterialCommunityIcons name={enableInventory ? "toggle-switch" : "toggle-switch-off"} size={40} color={enableInventory ? "#00C9A7" : "#475569"} />
            </TouchableOpacity>
          </View>

          {enableInventory && (
            <View style={styles.inventoryArea}>
              <View style={styles.inventoryRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>{t('pillsInStock')}</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput style={styles.input} placeholder="e.g., 60" placeholderTextColor="#475569" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
                  </View>
                </View>
                <View style={{ width: 16 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>{t('pillsPerDose')}</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput style={styles.input} placeholder="e.g., 1" placeholderTextColor="#475569" value={pillsPerDose} onChangeText={setPillsPerDose} keyboardType="numeric" />
                  </View>
                </View>
              </View>
              <Text style={[styles.label, { marginTop: 16 }]}>{t('refillLeadTime')}</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="bell-ring-outline" size={20} color="#00C9A7" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="e.g., 7" placeholderTextColor="#475569" value={leadTime} onChangeText={setLeadTime} keyboardType="numeric" />
                <Text style={styles.inputSuffix}>Days</Text>
              </View>
            </View>
          )}
        </View>

        {/* Repeat Days */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('repeatSchedule')}</Text>
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
          <Text style={styles.sectionTitle}>{t('reminderTimes')}</Text>

          {times.map((time, index) => (
            <View key={index} style={styles.timeRow}>
              <View style={styles.timeCard}>
                <MaterialCommunityIcons name="clock-outline" size={20} color="#00C9A7" />
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
            <Text style={styles.addTimeText}>{t('addAnotherTime')}</Text>
          </TouchableOpacity>
        </View>

        {/* Save */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <MaterialCommunityIcons name="content-save-outline" size={22} color="#0F172A" />
          <Text style={styles.saveBtnText}>{t('saveMedicine')}</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F172A' },
  container: { padding: 24, paddingTop: 60, paddingBottom: 48 },
  pageHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 32 },
  backBtn: { marginRight: 16, marginTop: 4, width: 40, height: 40, borderRadius: 20, backgroundColor: '#00C9A71A', alignItems: 'center', justifyContent: 'center' },
  iconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#00C9A71A', borderWidth: 1.5, borderColor: '#00C9A7', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  pageTitle: { fontSize: 32, fontWeight: '800', color: '#F1F5F9', letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 16, color: '#94A3B8', marginTop: 4 },
  section: { backgroundColor: '#1E293B', borderRadius: 24, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#334155' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#F1F5F9', marginBottom: 6 },
  sectionSubtitle: { fontSize: 13, color: '#94A3B8' },
  label: { fontSize: 14, fontWeight: '600', color: '#94A3B8', marginBottom: 8, marginLeft: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', borderRadius: 16, borderWidth: 1.5, borderColor: '#334155', height: 60, paddingHorizontal: 16 },
  inputFocused: { borderColor: '#00C9A7', backgroundColor: '#00C9A70A' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#F1F5F9', fontSize: 16, fontWeight: '500' },
  inputSuffix: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  
  suggestionsCard: { backgroundColor: '#0F172A', borderRadius: 12, borderWidth: 1, borderColor: '#334155', marginTop: 8, padding: 8, zIndex: 10 },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  suggestionText: { color: '#E2E8F0', fontSize: 15, marginLeft: 10 },
  
  infoLoadingWrapper: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingLeft: 8 },
  infoLoadingText: { color: '#8B5CF6', fontSize: 13, fontWeight: '600' },
  infoPanel: { backgroundColor: '#8B5CF615', borderRadius: 12, padding: 16, marginTop: 12, borderWidth: 1, borderColor: '#8B5CF630' },
  infoPanelHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  infoPanelTitle: { color: '#8B5CF6', fontSize: 14, fontWeight: '700' },
  infoBlock: { color: '#E2E8F0', fontSize: 13, lineHeight: 20, marginBottom: 8 },
  infoLabel: { fontWeight: '700', color: '#A78BFA' },
  warningBlock: { color: '#F87171', fontSize: 13, lineHeight: 20 },
  warningLabel: { fontWeight: '700', color: '#FCA5A5' },

  inventoryArea: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 16 },
  inventoryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  dayPill: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#334155' },
  dayPillSelected: { backgroundColor: '#00C9A7', borderColor: '#00C9A7' },
  dayText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  dayTextSelected: { color: '#0F172A' },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  timeCard: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', borderRadius: 16, height: 60, paddingHorizontal: 16, borderWidth: 1, borderColor: '#334155', gap: 12 },
  timeDisplay: { fontSize: 18, color: '#F1F5F9', fontWeight: '600' },
  removeBtn: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  addTimeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, backgroundColor: '#00C9A71A', borderRadius: 16, borderWidth: 1.5, borderColor: '#00C9A7' },
  addTimeText: { color: '#00C9A7', fontSize: 16, fontWeight: '700' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#00C9A7', paddingVertical: 20, borderRadius: 20, gap: 8, shadowColor: '#00C9A7', shadowOpacity: 0.4, shadowRadius: 18, elevation: 8, shadowOffset: { width: 0, height: 6 } },
  saveBtnText: { color: '#0F172A', fontSize: 18, fontWeight: '800' },
});
