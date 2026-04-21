import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, StatusBar, Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../contexts/LanguageContext';

const { width, height } = Dimensions.get('window');

const LANGUAGES = [
  {
    code: 'en',
    nativeName: 'English',
    subtitle: 'App & Voice in English',
    symbol: '🇺🇸',
    gradient: ['#0EA5E9', '#0284C7'],
  },
  {
    code: 'hi',
    nativeName: 'हिंदी',
    subtitle: 'Hindi — Hinglish supported',
    symbol: '🇮🇳',
    gradient: ['#F97316', '#EA580C'],
  },
  {
    code: 'mr',
    nativeName: 'मराठी',
    subtitle: 'Marathi — Marathlish supported',
    symbol: '🏵️',
    gradient: ['#8B5CF6', '#7C3AED'],
  },
];

export default function OnboardingScreen({ navigation }) {
  const { t, setLanguage } = useLanguage();
  const [selected, setSelected] = useState('en');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);
    await setLanguage(selected);
    await AsyncStorage.setItem('@medicare_onboarded', 'true');
    setLoading(false);
    navigation.replace('Login');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Background gradient blobs */}
      <View style={styles.blobTop} />
      <View style={styles.blobBottom} />

      {/* Logo area */}
      <View style={styles.logoSection}>
        <View style={styles.logoIcon}>
          <Text style={styles.logoEmoji}>💊</Text>
        </View>
        <Text style={styles.appName}>MediCare</Text>
        <Text style={styles.tagline}>Your health, always on time.</Text>
      </View>

      {/* Language picker card */}
      <View style={styles.card}>
        <Text style={styles.selectTitle}>{t('selectLanguage')}</Text>
        <Text style={styles.selectSubtitle}>{t('languageSubtitle')}</Text>

        <View style={styles.langList}>
          {LANGUAGES.map((lang) => {
            const isSelected = selected === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langCard, isSelected && styles.langCardSelected]}
                onPress={() => setSelected(lang.code)}
                activeOpacity={0.8}
              >
                {isSelected && (
                  <LinearGradient
                    colors={lang.gradient}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                )}
                <Text style={styles.langSymbol}>{lang.symbol}</Text>
                <View style={styles.langTextGroup}>
                  <Text style={[styles.langNative, isSelected && styles.textWhite]}>
                    {lang.nativeName}
                  </Text>
                  <Text style={[styles.langSub, isSelected && styles.textWhiteLight]}>
                    {lang.subtitle}
                  </Text>
                </View>
                {isSelected && (
                  <View style={styles.checkCircle}>
                    <Text style={styles.checkMark}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.continueBtn, loading && { opacity: 0.7 }]}
          onPress={handleContinue}
          disabled={loading}
          activeOpacity={0.85}
        >
          <View style={styles.continueBtnInner}>
            <Text style={styles.continueBtnText}>
              {loading ? '…' : t('continue')} {!loading && '→'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>MediCare · Free forever · No data sold</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  blobTop: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#00C9A715',
  },
  blobBottom: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#818CF815',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#00C9A7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#00C9A7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  logoEmoji: { fontSize: 40 },
  appName: {
    fontSize: 38,
    fontWeight: '900',
    color: '#F1F5F9',
    letterSpacing: -1,
  },
  tagline: { fontSize: 14, color: '#64748B', marginTop: 4, fontWeight: '500' },

  card: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  selectTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F1F5F9',
    marginBottom: 8,
    textAlign: 'center',
  },
  selectSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },

  langList: { gap: 12, marginBottom: 28 },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#334155',
    overflow: 'hidden',
    gap: 14,
  },
  langCardSelected: { borderColor: 'transparent' },
  langSymbol: { fontSize: 30 },
  langTextGroup: { flex: 1 },
  langNative: { fontSize: 18, fontWeight: '700', color: '#F1F5F9' },
  langSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  textWhite: { color: '#FFFFFF' },
  textWhiteLight: { color: 'rgba(255,255,255,0.75)' },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { color: '#FFF', fontWeight: '800', fontSize: 14 },

  continueBtn: { borderRadius: 16, overflow: 'hidden' },
  continueBtnInner: {
    backgroundColor: '#00C9A7',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  continueBtnText: { color: '#0F172A', fontSize: 18, fontWeight: '800' },

  footer: { color: '#334155', fontSize: 12, marginTop: 24, textAlign: 'center' },
});
