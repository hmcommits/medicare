import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { registerUser } from '../services/storageService';

export default function RegisterScreen({ route, navigation }) {
  const role = route.params?.role || 'patient';
  const isPatient = role === 'patient';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  const accentColor = isPatient ? '#00C9A7' : '#818CF8';
  const bgAccent = isPatient ? '#00C9A71A' : '#818CF81A';

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      return Alert.alert('Error', 'Please fill in all fields');
    }
    // #22 — Basic email format validation
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return Alert.alert('Error', 'Please enter a valid email address');
    }
    if (password !== confirmPassword) {
      return Alert.alert('Error', 'Passwords do not match');
    }
    if (password.length < 6) {
      return Alert.alert('Error', 'Password must be at least 6 characters');
    }
    setLoading(true);
    try {
      await registerUser(email, password, role, name);
      navigation.navigate(isPatient ? 'PatientLink' : 'GuardianLink');
    } catch (e) {
      Alert.alert('Registration Failed', e.message);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Header Icon */}
        <View style={styles.iconSection}>
          <View style={[styles.iconCircle, { backgroundColor: bgAccent, borderColor: accentColor }]}>
            <MaterialCommunityIcons
              name={isPatient ? 'account-heart-outline' : 'shield-account-outline'}
              size={40}
              color={accentColor}
            />
          </View>
          <Text style={styles.title}>Join MediCare</Text>
          <Text style={[styles.roleTag, { color: accentColor, backgroundColor: bgAccent }]}>
            {isPatient ? '  Patient Account  ' : '  Guardian Account  '}
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>

          {/* Name */}
          <Text style={styles.label}>Full Name</Text>
          <View style={[styles.inputWrapper, nameFocused && { borderColor: accentColor }]}>
            <MaterialCommunityIcons name="account-outline" size={20} color={nameFocused ? accentColor : '#64748B'} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Your Name"
              placeholderTextColor="#64748B"
              autoCapitalize="words"
              value={name}
              onChangeText={setName}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
            />
          </View>

          {/* Email */}
          <Text style={styles.label}>Email Address</Text>
          <View style={[styles.inputWrapper, emailFocused && { borderColor: accentColor }]}>
            <MaterialCommunityIcons name="email-outline" size={20} color={emailFocused ? accentColor : '#64748B'} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
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
          <Text style={styles.label}>Password</Text>
          <View style={[styles.inputWrapper, passwordFocused && { borderColor: accentColor }]}>
            <MaterialCommunityIcons name="lock-outline" size={20} color={passwordFocused ? accentColor : '#64748B'} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="At least 6 characters"
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

          {/* Confirm Password */}
          <Text style={styles.label}>Confirm Password</Text>
          <View style={[styles.inputWrapper, confirmFocused && { borderColor: accentColor }]}>
            <MaterialCommunityIcons name="lock-check-outline" size={20} color={confirmFocused ? accentColor : '#64748B'} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Re-enter your password"
              placeholderTextColor="#64748B"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onFocus={() => setConfirmFocused(true)}
              onBlur={() => setConfirmFocused(false)}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
              <MaterialCommunityIcons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={accentColor} style={{ marginVertical: 20 }} />
          ) : (
            <TouchableOpacity style={[styles.registerBtn, { backgroundColor: accentColor }]} onPress={handleRegister} activeOpacity={0.85}>
              <Text style={styles.registerBtnText}>Create Account</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color={isPatient ? '#0F172A' : '#FFF'} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
          <MaterialCommunityIcons name="arrow-left" size={18} color="#64748B" />
          <Text style={styles.backText}>Back to Sign In</Text>
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
  iconSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F1F5F9',
    marginBottom: 12,
  },
  roleTag: {
    fontSize: 13,
    fontWeight: '700',
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 28,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 8,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#334155',
    marginBottom: 20,
    paddingHorizontal: 14,
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
  registerBtn: {
    flexDirection: 'row',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    gap: 8,
  },
  registerBtnText: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  backText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '600',
  },
});
