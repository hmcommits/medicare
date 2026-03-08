import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';

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
        <View style={styles.modalView}>
          <Text style={styles.headerText}>Time to take your medicine!</Text>
          <Text style={styles.medicineName}>{medicine.name}</Text>
          <Text style={styles.dosageText}>Dosage: {medicine.dosage}</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.missedButton]}
              onPress={() => onResponse('Missed')}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Missed</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.tookButton]}
              onPress={() => onResponse('Took')}
              activeOpacity={0.9}
            >
              <Text style={[styles.buttonText, styles.tookButtonText]}>Took</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.snoozedButton]}
              onPress={() => onResponse('Snoozed')}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Snoozed</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)', 
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
  },
  headerText: {
    fontSize: 22,
    color: '#34495E',
    marginBottom: 10,
    fontWeight: '600',
  },
  medicineName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
    textAlign: 'center',
  },
  dosageText: {
    fontSize: 20,
    color: '#7F8C8D',
    marginBottom: 30,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'flex-end', // Align bottoms so the middle button can pop up
  },
  button: {
    borderRadius: 15,
    paddingVertical: 15,
    elevation: 2,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
  },
  missedButton: {
    backgroundColor: '#E74C3C', // Red
    height: 60,
  },
  tookButton: {
    backgroundColor: '#2ECC71', // Green
    height: 80, // Taller and more prominent
    marginHorizontal: 10,
  },
  tookButtonText: {
    fontSize: 22, // Larger text
  },
  snoozedButton: {
    backgroundColor: '#3498DB', // Blue
    height: 60,
  },
});
