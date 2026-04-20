import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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

      {/* Top Section */}
      <View style={styles.topSection}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="qrcode-scan" size={44} color="#00C9A7" />
        </View>
        <Text style={styles.title}>Your Pairing Code</Text>
        <Text style={styles.subtitle}>Share this with your Guardian to link accounts</Text>
      </View>

      {/* Code Card */}
      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>YOUR UNIQUE CODE</Text>
        {patientCode ? (
          <Text style={styles.codeText}>{patientCode}</Text>
        ) : (
          <View style={styles.loadingDots}>
            <Text style={styles.codeText}>••• •••</Text>
          </View>
        )}
        <View style={styles.codeDivider} />
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="shield-check-outline" size={16} color="#00C9A7" />
          <Text style={styles.infoText}>Secured by Firebase</Text>
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructionCard}>
        <View style={styles.instructionRow}>
          <View style={styles.stepBadge}><Text style={styles.stepNum}>1</Text></View>
          <Text style={styles.instructionText}>Share this 6-digit code with your Guardian</Text>
        </View>
        <View style={styles.instructionRow}>
          <View style={styles.stepBadge}><Text style={styles.stepNum}>2</Text></View>
          <Text style={styles.instructionText}>Guardian enters it in the "Connect to Patient" screen</Text>
        </View>
        <View style={styles.instructionRow}>
          <View style={styles.stepBadge}><Text style={styles.stepNum}>3</Text></View>
          <Text style={styles.instructionText}>You are now linked. Guardian can view your adherence!</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Dashboard', { role: 'patient' })}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>Go to Dashboard</Text>
        <MaterialCommunityIcons name="arrow-right" size={20} color="#0F172A" />
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
    marginBottom: 32,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#00C9A71A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#00C9A7',
    marginBottom: 16,
    shadowColor: '#00C9A7',
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
  },
  codeCard: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#00C9A7',
    shadowColor: '#00C9A7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 2,
    marginBottom: 16,
  },
  codeText: {
    fontSize: 52,
    fontWeight: '800',
    color: '#00C9A7',
    letterSpacing: 8,
  },
  codeDivider: {
    height: 1,
    width: '100%',
    backgroundColor: '#334155',
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  instructionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 16,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#00C9A71A',
    borderWidth: 1,
    borderColor: '#00C9A7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {
    color: '#00C9A7',
    fontWeight: '700',
    fontSize: 13,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#00C9A7',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#00C9A7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
  },
});
