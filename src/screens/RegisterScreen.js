import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { registerUser } from '../services/storageService';

export default function RegisterScreen({ route, navigation }) {
  const role = route.params?.role || 'patient';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      return Alert.alert('Error', 'Please fill all fields');
    }
    if (password !== confirmPassword) {
      return Alert.alert('Error', 'Passwords do not match');
    }
    
    setLoading(true);
    try {
      await registerUser(email, password, role);
      navigation.navigate(role === 'patient' ? 'PatientLink' : 'GuardianLink');
    } catch(e) {
      Alert.alert('Registration Failed', e.message);
    }
    finally {
      if (this) setLoading(false);
    }
  }

  const roleDisplay = role === 'patient' ? 'Patient' : 'Guardian';

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Join MediCare</Text>
      <Text style={styles.subtitle}>Register as a {roleDisplay}</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="Email" 
        placeholderTextColor="#BDC3C7"
        autoCapitalize="none" 
        keyboardType="email-address"
        value={email} 
        onChangeText={setEmail} 
      />
      
      <View style={styles.passwordContainer}>
        <TextInput 
          style={styles.passwordInput} 
          placeholder="Password" 
          placeholderTextColor="#BDC3C7"
          secureTextEntry={!showPassword} 
          value={password} 
          onChangeText={setPassword} 
        />
        <TouchableOpacity 
          style={styles.eyeIcon} 
          onPress={() => setShowPassword(!showPassword)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name={showPassword ? "eye-off" : "eye"} 
            size={24} 
            color="#7F8C8D" 
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.passwordContainer}>
        <TextInput 
          style={styles.passwordInput} 
          placeholder="Confirm Password" 
          placeholderTextColor="#BDC3C7"
          secureTextEntry={!showConfirmPassword} 
          value={confirmPassword} 
          onChangeText={setConfirmPassword} 
        />
        <TouchableOpacity 
          style={styles.eyeIcon} 
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name={showConfirmPassword ? "eye-off" : "eye"} 
            size={24} 
            color="#7F8C8D" 
          />
        </TouchableOpacity>
      </View>
      
      {loading ? <ActivityIndicator size="large" color="#3498DB" style={{marginTop: 20}} /> : (
        <TouchableOpacity 
          style={[styles.registerBtn, { backgroundColor: role === 'patient' ? '#2ECC71' : '#9B59B6' } ]} 
          onPress={handleRegister} 
          activeOpacity={0.8}
        >
          <Text style={styles.btnText}>Register Account</Text>
        </TouchableOpacity>
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
    fontSize: 36,
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E0E6ED',
    borderRadius: 12,
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 20,
    fontSize: 18,
    color: '#2C3E50',
  },
  eyeIcon: {
    padding: 15,
  },
  registerBtn: {
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  }
});
