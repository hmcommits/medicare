import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Share, Alert, ActivityIndicator, Dimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../services/firebaseConfig';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getActivePatientUid, logoutUser, subscribeLogs, subscribeMedicines } from '../services/storageService';
import { cancelAllMedicineNotifications } from '../services/notificationService';
import { computeStreak, BADGE_CONFIG, computeBadges, STREAK_MILESTONES } from '../services/streakService';
import { useLanguage } from '../contexts/LanguageContext';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'hi', label: 'हिंदी',   flag: '🇮🇳' },
  { code: 'mr', label: 'मराठी',   flag: '🏵️' },
];

export default function ProfileScreen({ navigation }) {
  const { t, language, setLanguage } = useLanguage();
  const [loading, setLoading]     = useState(true);
  const [profile, setProfile]     = useState(null); // { email, role, code, guardianCount }
  const [stats, setStats]         = useState({ streak: 0, totalTook: 0, totalMissed: 0, totalMeds: 0, badges: [] });

  useEffect(() => {
    let unsubLogs, unsubMeds;
    (async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const userSnap = await getDoc(doc(db, 'users', user.uid));
        const userData = userSnap.exists() ? userSnap.data() : {};
        setProfile({
          name:          userData.name || '',
          email:         user.email,
          role:          userData.role ?? 'patient',
          code:          userData.code ?? null,
          guardianUids:  userData.guardianUids ?? [],
        });

        // #9 — Fetch stats using the active patient UID, so guardians can see the patient's stats too
        try {
          const pUid = await getActivePatientUid();
          if (pUid) {
            unsubMeds = subscribeMedicines(pUid, (meds) => {
              setStats(prev => ({ ...prev, totalMeds: meds.length }));
            });

            unsubLogs = subscribeLogs(pUid, (logs) => {
              const tookCount   = logs.filter(l => l.status === 'Took').length;
              const missedCount = logs.filter(l => l.status === 'Missed').length;
              const { streak }  = computeStreak(logs, false);
              const badgeIds    = computeBadges(logs, streak);
              setStats(prev => ({
                ...prev,
                streak,
                totalTook:   tookCount,
                totalMissed: missedCount,
                badges:      badgeIds,
              }));
            });
          }
        } catch (e) {
          // Guardian not linked to a patient yet, that's okay, leave stats at 0
        }
      } catch (e) {
        console.error('[Profile] Load error:', e.message);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      if (unsubLogs) unsubLogs();
      if (unsubMeds) unsubMeds();
    };
  }, []);

  const handleShareCode = async () => {
    if (!profile?.code) return;
    try {
      await Share.share({
        message: `🏥 Use this code to link with me on MediCare: ${profile.code}`,
        title: 'My MediCare Patient Code',
      });
    } catch (_) {}
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => {
          await cancelAllMedicineNotifications();
          await logoutUser();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      }
    ]);
  };

  const handleResetOnboarding = async () => {
    Alert.alert('Reset Language', 'This will take you back to the language picker on next launch.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset', onPress: async () => {
          await AsyncStorage.removeItem('@medicare_onboarded');
          Alert.alert('Done', 'Restart the app to see the language picker again.');
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator color="#00C9A7" size="large" />
      </View>
    );
  }

  const displayName = profile?.name || profile?.email || '?';
  const initials = displayName.slice(0, 2).toUpperCase();
  const adherencePct = (stats.totalTook + stats.totalMissed) > 0
    ? Math.round((stats.totalTook / (stats.totalTook + stats.totalMissed)) * 100)
    : 0;
  const nextGoal = STREAK_MILESTONES.find(m => m > stats.streak) ?? null;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#00C9A7" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* ── Avatar + Identity ── */}
        <View style={styles.avatarCard}>
          <LinearGradient colors={['#00C9A7', '#0EA5E9']} style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>

          <Text style={[styles.emailText, { fontSize: 20, marginBottom: 4 }]}>{profile?.name || 'No Name Set'}</Text>
          <Text style={[styles.emailText, { color: '#94A3B8', fontSize: 14 }]}>{profile?.email}</Text>
          <View style={[styles.roleBadge, profile?.role === 'guardian' && styles.roleBadgeGuardian]}>
            <MaterialCommunityIcons name={profile?.role === 'guardian' ? 'shield-account' : 'account-heart'} size={14} color="#0F172A" />
            <Text style={styles.roleText}>{profile?.role === 'guardian' ? 'Guardian' : 'Patient'}</Text>
          </View>
        </View>

        {/* ── Linking Code (patients only) ── */}
        {profile?.role === 'patient' && profile?.code && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="link-variant" size={18} color="#00C9A7" />
              <Text style={styles.sectionTitle}>Your Linking Code</Text>
            </View>
            <Text style={styles.sectionSub}>Share this with your Guardian so they can monitor your medicines.</Text>
            <View style={styles.codeRow}>
              <Text style={styles.codeText}>{profile.code}</Text>
              <TouchableOpacity style={styles.shareBtn} onPress={handleShareCode} activeOpacity={0.8}>
                <MaterialCommunityIcons name="share-variant" size={18} color="#0F172A" />
                <Text style={styles.shareBtnText}>Share</Text>
              </TouchableOpacity>
            </View>
            {profile.guardianUids?.length > 0 && (
              <Text style={styles.linkedNote}>
                🛡️ {profile.guardianUids.length} Guardian{profile.guardianUids.length > 1 ? 's' : ''} linked
              </Text>
            )}
          </View>
        )}

        {/* ── Stats ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="chart-bar" size={18} color="#8B5CF6" />
            <Text style={styles.sectionTitle}>Your Health Stats</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCell}>
              <Text style={styles.statNum}>🔥 {stats.streak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statNum}>{adherencePct}%</Text>
              <Text style={styles.statLabel}>Adherence</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statNum}>{stats.totalTook}</Text>
              <Text style={styles.statLabel}>Doses Taken</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statNum}>{stats.totalMeds}</Text>
              <Text style={styles.statLabel}>Medicines</Text>
            </View>
          </View>

          {nextGoal && (
            <View style={styles.nextGoalRow}>
              <MaterialCommunityIcons name="flag-checkered" size={14} color="#F97316" />
              <Text style={styles.nextGoalText}>
                {nextGoal - stats.streak} more days to next badge ({nextGoal}-day streak)
              </Text>
            </View>
          )}
        </View>

        {/* ── Badges ── */}
        {stats.badges.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="trophy" size={18} color="#F97316" />
              <Text style={styles.sectionTitle}>Badges Earned</Text>
            </View>
            <View style={styles.badgesRow}>
              {stats.badges.map(id => {
                const cfg = BADGE_CONFIG[id];
                if (!cfg) return null;
                return (
                  <View key={id} style={styles.badgeChip}>
                    <Text style={styles.badgeIcon}>{cfg.icon}</Text>
                    <View>
                      <Text style={styles.badgeName}>{cfg.label}</Text>
                      <Text style={styles.badgeDesc}>{cfg.desc}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Language ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="translate" size={18} color="#0EA5E9" />
            <Text style={styles.sectionTitle}>App Language</Text>
          </View>
          <View style={styles.langRow}>
            {LANGUAGES.map(lang => (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langBtn, language === lang.code && styles.langBtnActive]}
                onPress={() => setLanguage(lang.code)}
                activeOpacity={0.8}
              >
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <Text style={[styles.langLabel, language === lang.code && { color: '#0F172A' }]}>{lang.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Account Actions ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="cog-outline" size={18} color="#64748B" />
            <Text style={styles.sectionTitle}>Account</Text>
          </View>

          <TouchableOpacity style={styles.actionRow} onPress={handleResetOnboarding} activeOpacity={0.7}>
            <MaterialCommunityIcons name="translate" size={20} color="#0EA5E9" />
            <Text style={styles.actionText}>Change Language (Re-onboard)</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color="#475569" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.actionRow} onPress={handleLogout} activeOpacity={0.7}>
            <MaterialCommunityIcons name="logout" size={20} color="#F87171" />
            <Text style={[styles.actionText, { color: '#F87171' }]}>Sign Out</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color="#475569" />
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>MediCare · Free forever · Data never sold</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F172A' },
  loadingRoot: { flex: 1, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' },
  container: { padding: 24, paddingTop: 60, paddingBottom: 56 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 28 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#00C9A71A', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#00C9A7' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#F1F5F9' },

  avatarCard: { alignItems: 'center', marginBottom: 28, paddingVertical: 28, backgroundColor: '#1E293B', borderRadius: 24, borderWidth: 1, borderColor: '#334155' },
  avatarCircle: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 14, borderWidth: 3, borderColor: '#0F172A' },
  avatarText: { fontSize: 34, fontWeight: '900', color: '#0F172A' },
  emailText: { fontSize: 16, color: '#F1F5F9', fontWeight: '600', marginBottom: 10 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#00C9A7', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  roleBadgeGuardian: { backgroundColor: '#8B5CF6' },
  roleText: { color: '#0F172A', fontWeight: '800', fontSize: 13 },

  section: { backgroundColor: '#1E293B', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#F1F5F9' },
  sectionSub: { fontSize: 13, color: '#64748B', marginBottom: 14, lineHeight: 18 },

  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0F172A', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#334155' },
  codeText: { fontSize: 32, fontWeight: '900', color: '#00C9A7', letterSpacing: 6 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#00C9A7', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  shareBtnText: { color: '#0F172A', fontWeight: '800', fontSize: 14 },
  linkedNote: { fontSize: 13, color: '#00C9A7', marginTop: 10, fontWeight: '500' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCell: { flex: 1, minWidth: '44%', backgroundColor: '#0F172A', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#334155', alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '900', color: '#F1F5F9', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  nextGoalRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, paddingLeft: 2 },
  nextGoalText: { color: '#F97316', fontSize: 13, fontWeight: '600', flex: 1 },

  badgesRow: { gap: 10 },
  badgeChip: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0F172A', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#334155' },
  badgeIcon: { fontSize: 28 },
  badgeName: { fontSize: 14, fontWeight: '700', color: '#F1F5F9' },
  badgeDesc: { fontSize: 12, color: '#64748B', marginTop: 2 },

  langRow: { flexDirection: 'row', gap: 10 },
  langBtn: { flex: 1, alignItems: 'center', gap: 6, backgroundColor: '#0F172A', borderRadius: 14, paddingVertical: 14, borderWidth: 1.5, borderColor: '#334155' },
  langBtnActive: { backgroundColor: '#00C9A7', borderColor: '#00C9A7' },
  langFlag: { fontSize: 22 },
  langLabel: { fontSize: 12, fontWeight: '700', color: '#94A3B8' },

  divider: { height: 1, backgroundColor: '#334155', marginVertical: 4 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  actionText: { flex: 1, fontSize: 15, color: '#F1F5F9', fontWeight: '500' },

  footer: { color: '#334155', fontSize: 12, textAlign: 'center', marginTop: 16 },
});
