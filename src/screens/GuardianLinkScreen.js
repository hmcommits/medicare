import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { linkGuardianToPatient } from '../services/storageService';

export default function GuardianLinkScreen({ navigation }) {
  const [code, setCode] = useState('');
  const [focused, setFocused] = useState(false);

  const handleConnect = async () => {
    const cleanCode = code.replace(/\s/g, '');
    if (cleanCode.length === 6) {
      try {
        const success = await linkGuardianToPatient(cleanCode);
        if (success) {
          navigation.navigate('Dashboard', { role: 'guardian' });
        } else {
          Alert.alert("Link Failed", "Could not find a patient with that code. Please double check the number.");
        }
      } catch (error) {
        Alert.alert("Link Failed", error.message);
      }
    }
  };

  const cleanLength = code.replace(/\s/g, '').length;
  const isReady = cleanLength === 6;

  return (
    <View style={styles.container}>

      <View style={styles.topSection}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="link-variant" size={44} color="#818CF8" />
        </View>
        <Text style={styles.title}>Connect to Patient</Text>
        <Text style={styles.subtitle}>Enter the 6-digit code provided by your patient to link accounts</Text>
      </View>

      {/* Input Card */}
      <View style={styles.card}>
        <Text style={styles.label}>PATIENT CODE</Text>
        <View style={[styles.inputWrapper, focused && styles.inputFocused]}>
          <MaterialCommunityIcons name="pound" size={22} color={focused ? '#818CF8' : '#475569'} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="_ _ _   _ _ _"
            placeholderTextColor="#334155"
            keyboardType="number-pad"
            maxLength={7}
            value={code}
            onChangeText={setCode}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          {isReady && (
            <MaterialCommunityIcons name="check-circle" size={22} color="#00C9A7" />
          )}
        </View>

        <View style={styles.progressRow}>
          {Array(6).fill(0).map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i < cleanLength ? styles.progressDotFilled : null
              ]}
            />
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.connectBtn, !isReady && styles.connectBtnDisabled]}
        onPress={handleConnect}
        activeOpacity={0.85}
        disabled={!isReady}
      >
        <Text style={[styles.connectText, !isReady && { color: '#475569' }]}>Connect to Patient</Text>
        <MaterialCommunityIcons name="arrow-right" size={20} color={isReady ? '#FFF' : '#475569'} />
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 24,
    justifyContent: 'center',
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 36,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#818CF81A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#818CF8',
    marginBottom: 16,
    shadowColor: '#818CF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F1F5F9',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
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
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 2,
    marginBottom: 14,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#334155',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  inputFocused: {
    borderColor: '#818CF8',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 18,
    fontSize: 28,
    fontWeight: '700',
    color: '#F1F5F9',
    letterSpacing: 6,
    textAlign: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#334155',
  },
  progressDotFilled: {
    backgroundColor: '#818CF8',
  },
  connectBtn: {
    flexDirection: 'row',
    backgroundColor: '#818CF8',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#818CF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  connectBtnDisabled: {
    backgroundColor: '#1E293B',
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1,
    borderColor: '#334155',
  },
  connectText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
