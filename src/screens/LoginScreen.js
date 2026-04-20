import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { loginUser } from '../services/storageService';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please enter your email and password');
    setLoading(true);
    try {
      const role = await loginUser(email, password);
      navigation.navigate(role === 'patient' ? 'PatientLink' : 'GuardianLink');
    } catch (e) {
      Alert.alert('Login Failed', e.message);
    }
    setLoading(false);
  };

  const handleNavigateRegister = (role) => {
    navigation.navigate('Register', { role });
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="medical-bag" size={44} color="#00C9A7" />
          </View>
          <Text style={styles.appName}>MediCare</Text>
          <Text style={styles.tagline}>Your personal health companion</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSubtitle}>Sign in to continue</Text>

          {/* Email */}
          <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
            <MaterialCommunityIcons name="email-outline" size={20} color={emailFocused ? '#00C9A7' : '#64748B'} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#64748B"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />
          </View>

          {/* Password */}
          <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
            <MaterialCommunityIcons name="lock-outline" size={20} color={passwordFocused ? '#00C9A7' : '#64748B'} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#64748B"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <MaterialCommunityIcons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#00C9A7" style={{ marginVertical: 20 }} />
          ) : (
            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} activeOpacity={0.85}>
              <Text style={styles.loginBtnText}>Sign In</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>NEW TO MEDICARE?</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Register Buttons */}
        <TouchableOpacity style={styles.registerBtn} onPress={() => handleNavigateRegister('patient')} activeOpacity={0.85}>
          <MaterialCommunityIcons name="account-heart-outline" size={22} color="#00C9A7" />
          <Text style={styles.registerBtnText}>Register as Patient</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.registerBtn, styles.guardianRegBtn]} onPress={() => handleNavigateRegister('guardian')} activeOpacity={0.85}>
          <MaterialCommunityIcons name="shield-account-outline" size={22} color="#818CF8" />
          <Text style={[styles.registerBtnText, { color: '#818CF8' }]}>Register as Guardian</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#00C9A7',
    shadowColor: '#00C9A7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  appName: {
    fontSize: 40,
    fontWeight: '800',
    color: '#F1F5F9',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 28,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 28,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#334155',
    marginBottom: 16,
    paddingHorizontal: 14,
  },
  inputWrapperFocused: {
    borderColor: '#00C9A7',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#F1F5F9',
  },
  eyeBtn: {
    padding: 6,
  },
  loginBtn: {
    flexDirection: 'row',
    backgroundColor: '#00C9A7',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    gap: 8,
  },
  loginBtnText: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1E293B',
  },
  dividerText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '700',
    letterSpacing: 1,
  },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#00C9A7',
    paddingVertical: 16,
    marginBottom: 14,
    gap: 10,
    backgroundColor: '#0F172A',
  },
  guardianRegBtn: {
    borderColor: '#818CF8',
  },
  registerBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00C9A7',
  },
});
