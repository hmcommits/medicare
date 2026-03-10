import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function GuardianLinkScreen({ navigation }) {
  const [code, setCode] = useState('');

  const handleConnect = async () => {
    // Strip spaces for clean storage e.g "523 891" -> "523891"
    const cleanCode = code.replace(/\s/g, '');
    
    if (cleanCode.length === 6) {
      try {
        await AsyncStorage.setItem('@medicare_active_patient_code', cleanCode);
        navigation.navigate('Dashboard', { role: 'guardian' });
      } catch (error) {
        console.error("Failed to save patient code for guardian locally", error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connect to Patient</Text>
      
      <Text style={styles.instructions}>
        Enter the 6-digit code provided by the patient to link to their account.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter 6-digit code"
        placeholderTextColor="#BDC3C7"
        keyboardType="number-pad"
        maxLength={7} // Allowing space like '523 891'
        value={code}
        onChangeText={setCode}
      />

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: code.replace(/\s/g, '').length === 6 ? '#2ECC71' : '#95A5A6' }]}
        onPress={handleConnect}
        activeOpacity={0.8}
        disabled={code.replace(/\s/g, '').length !== 6}
      >
        <Text style={styles.buttonText}>Connect to Patient</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 20,
  },
  instructions: {
    fontSize: 18,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 10,
    lineHeight: 26,
  },
  input: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E0E6ED',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 40,
    color: '#2C3E50',
  },
  button: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
