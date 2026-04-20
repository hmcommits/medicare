import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { loginUser } from '../services/storageService';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Missing email and password');
    setLoading(true);
    try {
      const role = await loginUser(email, password);
      navigation.navigate(role === 'patient' ? 'PatientLink' : 'GuardianLink');
    } catch(e) {
      Alert.alert('Login Failed', e.message);
    }
    setLoading(false);
  }

  const handleNavigateRegister = (role) => {
    navigation.navigate('Register', { role });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>MediCare</Text>
      <Text style={styles.subtitle}>Welcome back</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="Email" 
        placeholderTextColor="#BDC3C7"
        autoCapitalize="none" 
        keyboardType="email-address"
        value={email} onChangeText={setEmail} 
      />
      <TextInput 
        style={styles.input} 
        placeholder="Password" 
        placeholderTextColor="#BDC3C7"
        secureTextEntry 
        value={password} onChangeText={setPassword} 
      />
      
      {loading ? <ActivityIndicator size="large" color="#3498DB" style={{marginTop: 20}} /> : (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} activeOpacity={0.8}>
            <Text style={styles.btnText}>Login</Text>
          </TouchableOpacity>
          
          <Text style={styles.orText}>OR CREATE NEW ACCOUNT</Text>
          
          <TouchableOpacity style={[styles.loginBtn, styles.patientBtn]} onPress={() => handleNavigateRegister('patient')} activeOpacity={0.8}>
            <Text style={styles.btnText}>Register as Patient</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.loginBtn, styles.guardianBtn]} onPress={() => handleNavigateRegister('guardian')} activeOpacity={0.8}>
            <Text style={styles.btnText}>Register as Guardian</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#7F8C8D',
    marginBottom: 40,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E0E6ED',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    fontSize: 18,
    marginBottom: 20,
    color: '#2C3E50',
  },
  buttonContainer: {
    marginTop: 10,
  },
  loginBtn: {
    backgroundColor: '#3498DB',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  patientBtn: {
    backgroundColor: '#2ECC71',
  },
  guardianBtn: {
    backgroundColor: '#9B59B6',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  orText: {
    textAlign: 'center',
    color: '#95A5A6',
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 10,
    letterSpacing: 1,
  }
});
