import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { getPatientCodeForCurrentUser } from '../services/storageService';

export default function PatientLinkScreen({ navigation }) {
  const [patientCode, setPatientCode] = useState('');

  useEffect(() => {
    const initializePatient = async () => {
      try {
        const code = await getPatientCodeForCurrentUser();
        if (code) {
          const formattedCode = `${code.slice(0, 3)} ${code.slice(3, 6)}`;
          setPatientCode(formattedCode);
        }
      } catch (error) {
        console.error('Failed to fetch patient code:', error);
      }
    };

    initializePatient();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Pairing Code</Text>
      
      <View style={styles.codeContainer}>
        {patientCode ? (
             <Text style={styles.codeText}>{patientCode}</Text>
        ) : (
            <Text style={styles.codeText}>... ...</Text>
        )}
      </View>
      
      <Text style={styles.instructions}>
        Share this code with your Guardian so they can connect to your profile.
      </Text>

      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('Dashboard', { role: 'patient' })}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Go to My Dashboard</Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 30,
  },
  codeContainer: {
    backgroundColor: '#E8F8F5',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#1ABC9C',
    marginBottom: 20,
  },
  codeText: {
    fontSize: 48,
    fontWeight: 'bold',
    letterSpacing: 5,
    color: '#16A085',
  },
  instructions: {
    fontSize: 18,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 50,
    paddingHorizontal: 20,
    lineHeight: 26,
  },
  button: {
    backgroundColor: '#3498DB',
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
