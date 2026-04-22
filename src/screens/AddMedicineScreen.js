import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, Platform, ActivityIndicator
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { saveMedicine } from '../services/storageService';
import { scheduleMedicineNotification } from '../services/notificationService';
import { searchMedicineNames, getMedicineInfo } from '../services/medicineInfoService';
import { useLanguage } from '../contexts/LanguageContext';

const DAYS_OF_WEEK = [
  { label: 'S', value: 0 }, { label: 'M', value: 1 }, { label: 'T', value: 2 },
  { label: 'W', value: 3 }, { label: 'T', value: 4 }, { label: 'F', value: 5 },
  { label: 'S', value: 6 },
];

// Dose types — determines how inventory is tracked
const DOSE_TYPES = [
  { key: 'tablet',  label: 'Tablet / Capsule', icon: 'pill',        unit: 'tablets', doseUnit: 'tablet',  defaultStock: '60',  defaultDose: '1'  },
  { key: 'syrup',   label: 'Syrup / Tonic',    icon: 'bottle-tonic',unit: 'ml',      doseUnit: 'ml',      defaultStock: '200', defaultDose: '10' },
];

export default function AddMedicineScreen({ navigation }) {
  const { t } = useLanguage();

  // Basic fields
  const [name, setName]         = useState('');
  const [dosage, setDosage]     = useState('');
  const [times, setTimes]       = useState([new Date()]);
  const [showPicker, setShowPicker] = useState([false]);
  const [selectedDays, setSelectedDays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [nameFocused, setNameFocused]   = useState(false);
  const [dosageFocused, setDosageFocused] = useState(false);

  // Autofill
  const [suggestions, setSuggestions]   = useState([]);
  const [drugInfo, setDrugInfo]         = useState(null);
  const [fetchingSugg, setFetchingSugg] = useState(false);
  const [fetchingInfo, setFetchingInfo] = useState(false);
  const debounceRef = useRef(null);

  // Inventory
  const [trackInventory, setTrackInventory] = useState(false);
  const [doseType, setDoseType]   = useState('tablet'); // 'tablet' | 'syrup'
  const [stockAmt, setStockAmt]   = useState('');
  const [doseAmt, setDoseAmt]     = useState('1');
  const [leadTime, setLeadTime]   = useState('7');

  const activeDoseType = DOSE_TYPES.find(d => d.key === doseType);

  // ── Autofill debounce ──────────────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!name.trim() || name.length < 2) { setSuggestions([]); return; }
    setFetchingSugg(true);
    debounceRef.current = setTimeout(async () => {
      const results = await searchMedicineNames(name);
      setSuggestions(results);
      setFetchingSugg(false);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [name]);

  const handleSelectSuggestion = async (sg) => {
    setName(sg);
    setSuggestions([]);
    setFetchingInfo(true);
    const info = await getMedicineInfo(sg);
    if (info) setDrugInfo(info);
    // NOTE: We intentionally do NOT auto-fill the Strength/Dosage field.
    // OpenFDA returns clinical sentences, not a usable strength value.
    // The user should enter e.g. "500mg", "1 tablet", "10ml" themselves.
    setFetchingInfo(false);
  };

  // ── Time helpers ───────────────────────────────────────────────────────────
  const handleTimeChange = (event, selectedTime, index) => {
    const next = [...showPicker]; next[index] = false; setShowPicker(next);
    if (selectedTime) { const t = [...times]; t[index] = selectedTime; setTimes(t); }
  };
  const formatTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const addAnotherTime  = () => { setTimes([...times, new Date()]); setShowPicker([...showPicker, false]); };
  const removeTime = (i) => { setTimes(times.filter((_, idx) => idx !== i)); setShowPicker(showPicker.filter((_, idx) => idx !== i)); };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!name.trim() || !dosage.trim()) { Alert.alert('Missing Info', 'Please enter name and dosage.'); return; }
    if (!selectedDays.length) { Alert.alert('Missing Info', 'Select at least one day.'); return; }
    if (!times.length)        { Alert.alert('Missing Info', 'Add at least one time.'); return; }

    const pad = (n) => String(n).padStart(2, '0');
    const timesToSave = times.map(t => `2000-10-10T${pad(t.getHours())}:${pad(t.getMinutes())}:00`);

    const newMedicine = {
      name: name.trim(), dosage: dosage.trim(),
      times: timesToSave, days: selectedDays,
    };

    if (trackInventory) {
      newMedicine.doseType     = doseType;
      newMedicine.quantity     = parseFloat(stockAmt) || 0;
      newMedicine.doseAmount   = parseFloat(doseAmt)  || (doseType === 'tablet' ? 1 : 10);
      newMedicine.doseUnit     = activeDoseType.doseUnit;
      newMedicine.leadTimeDays = parseInt(leadTime, 10) || 7;
    }

    try {
      const saved = await saveMedicine(newMedicine);
      await scheduleMedicineNotification(saved);
      Alert.alert('Saved! ✅', `${name.trim()} added to your schedule.`, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      if (Platform.OS === 'web') navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not save medicine.');
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.pageHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#00C9A7" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Add Medicine</Text>
            <Text style={styles.pageSubtitle}>Set up your schedule</Text>
          </View>
        </View>

        {/* ── Medication Details ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medication Details</Text>

          <Text style={styles.label}>Medicine Name</Text>
          <View style={[styles.inputRow, nameFocused && styles.inputFocused]}>
            <MaterialCommunityIcons name="pill" size={18} color={nameFocused ? '#00C9A7' : '#64748B'} style={{ marginRight: 10 }} />
            <TextInput
              style={styles.input}
              placeholder="Type to search…"
              placeholderTextColor="#475569"
              value={name}
              onChangeText={(v) => { setName(v); if (drugInfo) setDrugInfo(null); }}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
            />
            {fetchingSugg && <ActivityIndicator color="#00C9A7" size="small" />}
          </View>

          {/* Autocomplete dropdown */}
          {nameFocused && suggestions.length > 0 && !drugInfo && (
            <View style={styles.dropdown}>
              {suggestions.map((s, i) => (
                <TouchableOpacity key={i} style={styles.dropdownItem} onPress={() => handleSelectSuggestion(s)}>
                  <MaterialCommunityIcons name="magnify" size={14} color="#64748B" />
                  <Text style={styles.dropdownText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Drug info panel */}
          {fetchingInfo && (
            <View style={styles.infoLoading}>
              <ActivityIndicator color="#8B5CF6" size="small" />
              <Text style={styles.infoLoadingText}>Fetching drug information…</Text>
            </View>
          )}
          {drugInfo && !fetchingInfo && (
            <View style={styles.infoPanel}>
              <View style={styles.infoPanelHeader}>
                <MaterialCommunityIcons name="information-outline" size={16} color="#8B5CF6" />
                <Text style={styles.infoPanelTitle}>Drug Info (OpenFDA)</Text>
                <TouchableOpacity onPress={() => setDrugInfo(null)} style={{ marginLeft: 'auto' }}>
                  <MaterialCommunityIcons name="close" size={16} color="#64748B" />
                </TouchableOpacity>
              </View>
              {drugInfo.usage   && <Text style={styles.infoText}><Text style={styles.infoLabel}>Use: </Text>{drugInfo.usage}</Text>}
              {drugInfo.warning && <Text style={styles.warnText}><Text style={styles.warnLabel}>⚠ Warning: </Text>{drugInfo.warning}</Text>}
            </View>
          )}

          {/* Dosage / strength */}
          <Text style={[styles.label, { marginTop: 14 }]}>Strength / Dosage</Text>
          <View style={[styles.inputRow, dosageFocused && styles.inputFocused]}>
            <MaterialCommunityIcons name="scale-balance" size={18} color={dosageFocused ? '#00C9A7' : '#64748B'} style={{ marginRight: 10 }} />
            <TextInput
              style={styles.input}
              placeholder="e.g., 500mg, 10ml, 1 tablet"
              placeholderTextColor="#475569"
              value={dosage}
              onChangeText={setDosage}
              onFocus={() => setDosageFocused(true)}
              onBlur={() => setDosageFocused(false)}
            />
          </View>
          <Text style={styles.hint}>Describe the strength — used only for display in reminders.</Text>
        </View>

        {/* ── Inventory Tracking ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Inventory Tracking</Text>
              <Text style={styles.sectionSub}>Get low-stock refill reminders</Text>
            </View>
            <TouchableOpacity onPress={() => setTrackInventory(!trackInventory)}>
              <MaterialCommunityIcons
                name={trackInventory ? 'toggle-switch' : 'toggle-switch-off'}
                size={42}
                color={trackInventory ? '#00C9A7' : '#475569'}
              />
            </TouchableOpacity>
          </View>

          {trackInventory && (
            <View style={{ marginTop: 16 }}>
              {/* Type selector */}
              <Text style={styles.label}>Type of Medicine</Text>
              <View style={styles.typeRow}>
                {DOSE_TYPES.map(dt => (
                  <TouchableOpacity
                    key={dt.key}
                    style={[styles.typeBtn, doseType === dt.key && styles.typeBtnActive]}
                    onPress={() => {
                      setDoseType(dt.key);
                      setStockAmt('');
                      setDoseAmt(dt.defaultDose);
                    }}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name={dt.icon}
                      size={22}
                      color={doseType === dt.key ? '#0F172A' : '#94A3B8'}
                    />
                    <Text style={[styles.typeBtnText, doseType === dt.key && { color: '#0F172A' }]}>
                      {dt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Stock + Per dose in one row */}
              <View style={styles.inventoryRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>In stock now</Text>
                  <View style={styles.inputRowSmall}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder={activeDoseType.defaultStock}
                      placeholderTextColor="#475569"
                      value={stockAmt}
                      onChangeText={setStockAmt}
                      keyboardType="numeric"
                    />
                    <Text style={styles.unitBadge}>{activeDoseType.unit}</Text>
                  </View>
                </View>

                <View style={{ width: 12 }} />

                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Per dose</Text>
                  <View style={styles.inputRowSmall}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder={activeDoseType.defaultDose}
                      placeholderTextColor="#475569"
                      value={doseAmt}
                      onChangeText={setDoseAmt}
                      keyboardType="numeric"
                    />
                    <Text style={styles.unitBadge}>{activeDoseType.doseUnit}</Text>
                  </View>
                </View>
              </View>

              {/* Lead time */}
              <Text style={[styles.label, { marginTop: 12 }]}>Remind me when this many days remain</Text>
              <View style={styles.inputRow}>
                <MaterialCommunityIcons name="bell-ring-outline" size={18} color="#00C9A7" style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="7"
                  placeholderTextColor="#475569"
                  value={leadTime}
                  onChangeText={setLeadTime}
                  keyboardType="numeric"
                />
                <Text style={styles.unitBadge}>Days</Text>
              </View>

              {/* Live days-left preview */}
              {stockAmt && doseAmt && times.length > 0 && (
                <View style={styles.supplyPreview}>
                  <MaterialCommunityIcons name="calculator-variant-outline" size={14} color="#00C9A7" />
                  <Text style={styles.supplyPreviewText}>
                    ≈ {Math.floor(parseFloat(stockAmt) / (parseFloat(doseAmt) * times.length))} days of supply at {times.length}x/day
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* ── Repeat Schedule ────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Repeat Schedule</Text>
          <View style={styles.daysRow}>
            {DAYS_OF_WEEK.map(day => {
              const sel = selectedDays.includes(day.value);
              return (
                <TouchableOpacity key={day.value} style={[styles.dayPill, sel && styles.dayPillSel]}
                  onPress={() => setSelectedDays(prev => sel ? prev.filter(d => d !== day.value) : [...prev, day.value].sort())}>
                  <Text style={[styles.dayText, sel && { color: '#0F172A' }]}>{day.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Reminder Times ─────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reminder Times</Text>
          {times.map((time, i) => (
            <View key={i} style={styles.timeRow}>
              <View style={styles.timeCard}>
                <MaterialCommunityIcons name="clock-outline" size={18} color="#00C9A7" />
                <View style={{ flex: 1 }}>
                  {Platform.OS === 'android' && (
                    <TouchableOpacity onPress={() => { const n = [...showPicker]; n[i] = true; setShowPicker(n); }}>
                      <Text style={styles.timeText}>{formatTime(time)}</Text>
                    </TouchableOpacity>
                  )}
                  {(showPicker[i] || Platform.OS === 'ios') && (
                    <DateTimePicker value={time} mode="time" is24Hour={false}
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'} themeVariant="dark"
                      onChange={(e, s) => handleTimeChange(e, s, i)} />
                  )}
                </View>
              </View>
              {times.length > 1 && (
                <TouchableOpacity style={styles.removeBtn} onPress={() => removeTime(i)}>
                  <MaterialCommunityIcons name="close" size={16} color="#F87171" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity style={styles.addTimeBtn} onPress={addAnotherTime}>
            <MaterialCommunityIcons name="plus-circle-outline" size={18} color="#00C9A7" />
            <Text style={styles.addTimeText}>Add Another Time</Text>
          </TouchableOpacity>
        </View>

        {/* ── Save ──────────────────────────────────────────────────────────── */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <MaterialCommunityIcons name="content-save-outline" size={20} color="#0F172A" />
          <Text style={styles.saveBtnText}>Save Medicine</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F172A' },
  container: { padding: 24, paddingTop: 60, paddingBottom: 56 },

  pageHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 28 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#00C9A71A', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#00C9A7' },
  pageTitle: { fontSize: 28, fontWeight: '800', color: '#F1F5F9' },
  pageSubtitle: { fontSize: 14, color: '#94A3B8', marginTop: 2 },

  section: { backgroundColor: '#1E293B', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#334155' },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#F1F5F9', marginBottom: 4 },
  sectionSub: { fontSize: 13, color: '#64748B' },
  label: { fontSize: 13, fontWeight: '600', color: '#94A3B8', marginBottom: 8, marginTop: 4 },
  hint: { fontSize: 12, color: '#475569', marginTop: 6, marginLeft: 4 },

  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', borderRadius: 14, borderWidth: 1.5, borderColor: '#334155', height: 54, paddingHorizontal: 14 },
  inputRowSmall: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', borderRadius: 14, borderWidth: 1.5, borderColor: '#334155', height: 50, paddingHorizontal: 14 },
  inputFocused: { borderColor: '#00C9A7' },
  input: { flex: 1, color: '#F1F5F9', fontSize: 15, fontWeight: '500' },
  unitBadge: { color: '#94A3B8', fontSize: 13, fontWeight: '700', backgroundColor: '#0F172A', paddingLeft: 6 },

  dropdown: { backgroundColor: '#0F172A', borderRadius: 12, borderWidth: 1, borderColor: '#334155', marginTop: 6, overflow: 'hidden' },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  dropdownText: { color: '#E2E8F0', fontSize: 14, flex: 1 },

  infoLoading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, paddingLeft: 4 },
  infoLoadingText: { color: '#8B5CF6', fontSize: 13 },
  infoPanel: { backgroundColor: '#8B5CF615', borderRadius: 12, padding: 14, marginTop: 10, borderWidth: 1, borderColor: '#8B5CF630' },
  infoPanelHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  infoPanelTitle: { color: '#8B5CF6', fontSize: 13, fontWeight: '700' },
  infoText: { color: '#CBD5E1', fontSize: 13, lineHeight: 19, marginBottom: 6 },
  infoLabel: { fontWeight: '700', color: '#A78BFA' },
  warnText: { color: '#FCA5A5', fontSize: 12, lineHeight: 18 },
  warnLabel: { fontWeight: '700', color: '#F87171' },

  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0F172A', borderRadius: 14, borderWidth: 1.5, borderColor: '#334155', paddingVertical: 14 },
  typeBtnActive: { backgroundColor: '#00C9A7', borderColor: '#00C9A7' },
  typeBtnText: { fontSize: 13, fontWeight: '700', color: '#94A3B8' },

  inventoryRow: { flexDirection: 'row' },
  supplyPreview: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingLeft: 4 },
  supplyPreviewText: { color: '#00C9A7', fontSize: 12, fontWeight: '600' },

  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  dayPill: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#334155' },
  dayPillSel: { backgroundColor: '#00C9A7', borderColor: '#00C9A7' },
  dayText: { fontSize: 13, fontWeight: '700', color: '#64748B' },

  timeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  timeCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0F172A', borderRadius: 14, height: 54, paddingHorizontal: 14, borderWidth: 1, borderColor: '#334155' },
  timeText: { fontSize: 17, color: '#F1F5F9', fontWeight: '600' },
  removeBtn: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center' },
  addTimeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, backgroundColor: '#00C9A71A', borderRadius: 14, borderWidth: 1.5, borderColor: '#00C9A7' },
  addTimeText: { color: '#00C9A7', fontSize: 15, fontWeight: '700' },

  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#00C9A7', paddingVertical: 18, borderRadius: 18, gap: 8, shadowColor: '#00C9A7', shadowOpacity: 0.5, shadowRadius: 18, elevation: 8 },
  saveBtnText: { color: '#0F172A', fontSize: 17, fontWeight: '800' },
});
