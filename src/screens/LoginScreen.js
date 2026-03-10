import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Welcome to MediCare</Text>
      
      <Text style={styles.subtitle}>Please select your role</Text>

      <TouchableOpacity 
        style={[styles.button, styles.patientButton]}
        onPress={async () => {
          await AsyncStorage.setItem('@medicare_user_role', 'patient');
          navigation.navigate('PatientLink');
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Patient</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.guardianButton]}
        onPress={async () => {
          await AsyncStorage.setItem('@medicare_user_role', 'guardian');
          navigation.navigate('GuardianLink');
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Guardian</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC', // Light background
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#7F8C8D',
    marginBottom: 40,
  },
  button: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  patientButton: {
    backgroundColor: '#3498DB', // Blue for patient
  },
  guardianButton: {
    backgroundColor: '#2ECC71', // Green for guardian
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
