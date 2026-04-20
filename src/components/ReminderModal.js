import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ReminderModal({ visible, medicine, onResponse }) {
  if (!medicine) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => onResponse('Snoozed')}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>

          {/* Pill Top Bar */}
          <View style={styles.sheetHandle} />

          {/* Icon */}
          <View style={styles.iconRing}>
            <MaterialCommunityIcons name="alarm" size={36} color="#00C9A7" />
          </View>

          <Text style={styles.headerText}>Time for your medicine!</Text>
          <Text style={styles.medicineName}>{medicine.name}</Text>
          <View style={styles.dosagePill}>
            <MaterialCommunityIcons name="pill" size={15} color="#00C9A7" />
            <Text style={styles.dosageText}>{medicine.dosage}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            {/* Missed */}
            <TouchableOpacity
              style={styles.btnMissed}
              onPress={() => onResponse('Missed')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="close" size={20} color="#F87171" />
              <Text style={styles.btnMissedText}>Missed</Text>
            </TouchableOpacity>

            {/* Took – Prominent center */}
            <TouchableOpacity
              style={styles.btnTook}
              onPress={() => onResponse('Took')}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="check" size={26} color="#0F172A" />
              <Text style={styles.btnTookText}>Took it!</Text>
            </TouchableOpacity>

            {/* Snooze */}
            <TouchableOpacity
              style={styles.btnSnooze}
              onPress={() => onResponse('Snoozed')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="alarm-snooze" size={20} color="#818CF8" />
              <Text style={styles.btnSnoozeText}>Snooze</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.snoozeNote}>Snooze reminds you again in 5 minutes</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  sheet: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingBottom: 40,
    paddingHorizontal: 28,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#475569',
    marginBottom: 24,
  },
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#00C9A71A',
    borderWidth: 1.5,
    borderColor: '#00C9A7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#00C9A7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 10,
  },
  headerText: {
    fontSize: 15,
    color: '#94A3B8',
    marginBottom: 6,
    fontWeight: '600',
  },
  medicineName: {
    fontSize: 34,
    fontWeight: '800',
    color: '#F1F5F9',
    marginBottom: 12,
    textAlign: 'center',
  },
  dosagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00C9A71A',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  dosageText: {
    fontSize: 14,
    color: '#00C9A7',
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    marginBottom: 16,
  },
  btnMissed: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F871711A',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F87171',
    paddingVertical: 16,
    gap: 4,
  },
  btnMissedText: {
    color: '#F87171',
    fontWeight: '700',
    fontSize: 14,
  },
  btnTook: {
    flex: 1.4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00C9A7',
    borderRadius: 20,
    paddingVertical: 22,
    gap: 4,
    shadowColor: '#00C9A7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  btnTookText: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 16,
  },
  btnSnooze: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#818CF81A',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#818CF8',
    paddingVertical: 16,
    gap: 4,
  },
  btnSnoozeText: {
    color: '#818CF8',
    fontWeight: '700',
    fontSize: 14,
  },
  snoozeNote: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
  },
});
