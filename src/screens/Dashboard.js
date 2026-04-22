import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, ScrollView, Platform, Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-chart-kit';
import ConfettiCannon from 'react-native-confetti-cannon';

import {
  getActivePatientUid, subscribeMedicines, subscribeLogs,
  getWeeklyAdherenceData, deleteMedicine, logoutUser,
  getStreakFreeze, consumeStreakFreeze, saveAchievement,
  getAchievements, refillMedicine, getGuardianPushTokens
} from '../services/storageService';
import { 
  cancelMedicineNotifications, cancelAllMedicineNotifications, 
  notifyGuardiansOfMilestone 
} from '../services/notificationService';
import { computeStreak, computeBadges, BADGE_CONFIG, STREAK_MILESTONES } from '../services/streakService';
import { useLanguage } from '../contexts/LanguageContext';
import StreakBanner from '../components/StreakBanner';
import { speak, stopSpeaking, buildTodaysMedicineScript } from '../services/voiceService';

const { width } = Dimensions.get('window');

export default function Dashboard({ route, navigation }) {
  const role = route.params?.role || 'patient';
  const { t, language } = useLanguage();
  
  const [medicines, setMedicines] = useState([]);
  const [logs, setLogs] = useState([]);
  const [weeklyAdherence, setWeeklyAdherence] = useState(Array(7).fill(0));
  const [isEditMode, setIsEditMode] = useState(false);

  // Gamification states
  const [streakData, setStreakData] = useState({ streak: 0, freezeUsed: false, milestoneReached: null });
  const [unlockedBadges, setUnlockedBadges] = useState([]);
  const [freezeContext, setFreezeContext] = useState({ count: 1, resetMonth: '' });
  const confettiRef = useRef(null);

  // Fetch gamification base data
  const loadGamificationContext = async () => {
    const freezeInfo = await getStreakFreeze();
    setFreezeContext(freezeInfo);
  };

  // Real-time Firestore listeners
  useFocusEffect(
    useCallback(() => {
      let unsubMeds = null;
      let unsubLogs = null;
      let isActive = true;

      const setup = async () => {
        try {
          const pUid = await getActivePatientUid();
          if (!isActive) return;
          
          await loadGamificationContext();

          unsubMeds = subscribeMedicines(pUid, (fetchedMeds) => {
            if (isActive) setMedicines(fetchedMeds);
          });

          unsubLogs = subscribeLogs(pUid, async (fetchedLogs) => {
            if (!isActive) return;
            setLogs(fetchedLogs);
            setWeeklyAdherence(getWeeklyAdherenceData(fetchedLogs));
            
            // Recalculate gamification on new logs for display (both roles)
            const freezeInfo = await getStreakFreeze();
            const { streak, freezeUsed, milestoneReached } = computeStreak(fetchedLogs, freezeInfo.count > 0);
            
            setStreakData({ streak, freezeUsed, milestoneReached });
            
            // Badges
            const bdgIds = computeBadges(fetchedLogs, streak);
            setUnlockedBadges(bdgIds);
            
            // Only the patient should trigger database mutations and notifications
            if (role === 'patient') {
              if (freezeUsed && freezeInfo.count > 0) {
                await consumeStreakFreeze();
              }

              if (bdgIds.length > 0) {
                bdgIds.forEach(id => saveAchievement(id));
              }
              
              // Notify guardians if milestone hit today
              if (milestoneReached) {
                const today = new Date().toDateString();
                const cacheKey = `@milestone_${milestoneReached}_${today}`;
                const alreadySent = await AsyncStorage.getItem(cacheKey);
                
                if (!alreadySent) {
                  // Trigger local confetti celebration
                  if (confettiRef.current) confettiRef.current.start();

                  const tokens = await getGuardianPushTokens();
                  if (tokens.length > 0) {
                    await notifyGuardiansOfMilestone(tokens, milestoneReached, t);
                    await AsyncStorage.setItem(cacheKey, 'true');
                  }
                }
              }
            }
          });
        } catch (error) {
          console.error('[Dashboard] Setup error:', error);
        }
      };

      setup();

      return () => {
        isActive = false;
        if (unsubMeds) unsubMeds();
        if (unsubLogs) unsubLogs();
      };
    }, [role])
  );

  const handleLogout = () => {
    Alert.alert(t('logout'), t('logoutConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('logout'),
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelAllMedicineNotifications();
            await logoutUser();
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          } catch (e) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  const handleDeleteMedicine = (item) => {
    Alert.alert(
      t('deleteMedicine'),
      `Remove "${item.name}" from your schedule?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelMedicineNotifications(item.id);
              await deleteMedicine(item.id);
            } catch (e) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  };
  
  const handleRefill = async (item) => {
    Alert.alert(
      t('refillConfirmTitle'),
      t('refillConfirmBody', item.name),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: 'Refill 30 💊',
          onPress: async () => {
            try {
              await refillMedicine(item.id, 30);
            } catch (e) {
              Alert.alert('Error', e.message);
            }
          }
        }
      ]
    );
  };

  const handleVoiceAssistant = async () => {
    // First, read out the pending medicines
    const script = buildTodaysMedicineScript(medicines, logs, t);
    await speak(script, language);
  };

  // ── Computed stats
  const totalMeds = medicines.length;
  const todayStr = new Date().toDateString();
  const todayLogs = logs.filter(l => new Date(l.timestamp).toDateString() === todayStr);
  const tookToday = todayLogs.filter(l => l.status === 'Took').length;
  const adherenceToday = todayLogs.length > 0 ? Math.round((tookToday / todayLogs.length) * 100) : 0;

  // ── Medicine card renderer
  const renderMedicineCard = (item) => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const isDone = logs.some(log =>
      log.medicineId === item.id &&
      log.status === 'Took' &&
      new Date(log.timestamp) > oneHourAgo
    );

    let formattedTimes = 'Not set';
    if (item.times && Array.isArray(item.times)) {
      formattedTimes = item.times.map(isoString => {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }).join('  ·  ');
    }

    let formattedDays = 'Everyday';
    if (item.days && Array.isArray(item.days)) {
      const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      formattedDays = item.days.length === 7 ? 'Every day' : item.days.map(d => DAYS[d]).join(', ');
    }

    const canDelete = role === 'patient' || (role === 'guardian' && isEditMode);
    
    // Inventory refill logic
    let needsRefill = false;
    let daysLeft = 999;
    if (item.quantity !== undefined && item.pillsPerDose) {
      const timesPerDay = item.times?.length || 1;
      const pd = parseInt(item.pillsPerDose, 10);
      const q = parseInt(item.quantity, 10);
      daysLeft = Math.floor(q / (pd * timesPerDay));
      needsRefill = daysLeft <= (parseInt(item.leadTimeDays, 10) || 7);
    }

    return (
      <View key={item.id}>
        <View style={[styles.medCard, isDone && styles.medCardDone, needsRefill && styles.medCardWarning]}>
          <View style={styles.medCardLeft}>
            <View style={[styles.medDot, isDone && styles.medDotDone, needsRefill && !isDone && { backgroundColor: '#F87171' }]} />
            <View style={styles.medInfo}>
              <Text style={[styles.medName, isDone && { color: '#64748B' }]}>{item.name}</Text>
              <View style={styles.medMeta}>
                <MaterialCommunityIcons name="pill" size={13} color="#64748B" />
                <Text style={styles.medMetaText}>{item.dosage}</Text>
                <Text style={styles.metaDivider}>·</Text>
                <MaterialCommunityIcons name="clock-outline" size={13} color="#64748B" />
                <Text style={styles.medMetaText}>{formattedTimes}</Text>
              </View>
              <View style={styles.medMeta}>
                <MaterialCommunityIcons name="calendar-week" size={13} color="#64748B" />
                <Text style={styles.medMetaText}>{formattedDays}</Text>
              </View>
              
              {/* Inventory Alert Chip */}
              {needsRefill && !isDone && (
                <View style={styles.refillAlert}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={12} color="#F87171" />
                  <Text style={styles.refillAlertText}>{daysLeft} {t('daysSupplyLeft')}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.medCardRight}>
            {isDone && (
              <View style={styles.doneBadge}>
                <MaterialCommunityIcons name="check" size={14} color="#0F172A" />
                <Text style={styles.doneText}>Done</Text>
              </View>
            )}
            
            {!isDone && needsRefill && (
              <TouchableOpacity style={styles.refillBtn} onPress={() => handleRefill(item)}>
                <MaterialCommunityIcons name="pill" size={14} color="#0F172A" />
                <Text style={styles.refillBtnText}>Refill</Text>
              </TouchableOpacity>
            )}

            {canDelete && (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDeleteMedicine(item)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={18} color="#F87171" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const getLineChartData = () => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i); return d.toDateString();
    }).reverse();

    const labels = last7Days.map(dateStr => ['S', 'M', 'T', 'W', 'T', 'F', 'S'][new Date(dateStr).getDay()]);

    return {
      labels,
      datasets: [
        { data: weeklyAdherence.map(v => v || 0), color: (opacity = 1) => `rgba(0, 201, 167, ${opacity})`, strokeWidth: 3 },
        { data: [100], withDots: false, color: () => 'rgba(0,0,0,0)', strokeWidth: 0 },
      ],
    };
  };

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        
        {/* Milestone Confetti Celebration */}
        {streakData.milestoneReached && (
          <ConfettiCannon
            ref={confettiRef}
            count={100}
            origin={{ x: width / 2, y: -20 }}
            autoStart={false}
            fadeOut={true}
          />
        )}

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerGreeting}>
              {role === 'guardian' ? 'Guardian View' : t('greeting')}
            </Text>
            <Text style={styles.headerTitle}>{t('dashboardTitle')}</Text>
          </View>

          <View style={styles.headerActions}>
            {role === 'patient' && (
              <TouchableOpacity 
                style={styles.voiceBtn} 
                onPress={handleVoiceAssistant}
              >
                <MaterialCommunityIcons name="volume-high" size={22} color="#F1F5F9" />
              </TouchableOpacity>
            )}
            {role === 'guardian' && (
              <TouchableOpacity
                style={[styles.editToggle, isEditMode && styles.editToggleActive]}
                onPress={() => setIsEditMode(!isEditMode)}
              >
                <MaterialCommunityIcons name={isEditMode ? 'check' : 'pencil-outline'} size={18} color={isEditMode ? '#0F172A' : '#00C9A7'} />
                <Text style={[styles.editToggleText, isEditMode && { color: '#0F172A' }]}>{isEditMode ? 'Done' : 'Edit'}</Text>
              </TouchableOpacity>
            )}
            {/* Profile icon */}
            <TouchableOpacity 
              style={styles.profileBtn} 
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="account-circle-outline" size={26} color="#F1F5F9" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
              <MaterialCommunityIcons name="logout" size={20} color="#F87171" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Gamification Banner - Visible to both patient and guardian */}
        <StreakBanner 
          streak={streakData.streak} 
          freezeUsed={streakData.freezeUsed} 
          badges={unlockedBadges.map(id => BADGE_CONFIG[id])} 
          milestoneReached={streakData.milestoneReached}
        />

        {/* Adherence Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('adherenceChart') || '7-Day Adherence'}</Text>
          <View style={{ marginTop: 16, alignItems: 'center' }}>
            <LineChart
              data={getLineChartData()}
              width={width - 88}
              height={180}
              withInnerLines={false}
              withOuterLines={false}
              chartConfig={{
                backgroundColor: '#1E293B',
                backgroundGradientFrom: '#1E293B',
                backgroundGradientTo: '#1E293B',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 201, 167, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
                propsForDots: { r: '4', strokeWidth: '2', stroke: '#0F172A' },
              }}
              bezier
              style={{ borderRadius: 16 }}
            />
          </View>
        </View>

        {/* Scheduled Medicines */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('scheduledMedicines')}</Text>
            {medicines.length > 0 && (
              <View style={styles.countBadge}><Text style={styles.countBadgeText}>{medicines.length}</Text></View>
            )}
          </View>

          {medicines.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="emoticon-happy-outline" size={52} color="#334155" />
              <Text style={styles.emptyStateTitle}>All clear!</Text>
              <Text style={styles.emptyStateSubtitle}>No medicines scheduled yet.{'\n'}Add your first one below.</Text>
            </View>
          ) : (
            medicines.map(item => renderMedicineCard(item))
          )}
        </View>

        {(role === 'patient' || (role === 'guardian' && isEditMode)) && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddMedicine')}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="plus" size={22} color="#0F172A" />
            <Text style={styles.addButtonText}>{t('addMedicine')}</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F172A' },
  container: { padding: 24, paddingTop: 60, paddingBottom: 48 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  headerGreeting: { fontSize: 16, color: '#94A3B8', fontWeight: '500', marginBottom: 4 },
  headerTitle: { fontSize: 32, fontWeight: '800', color: '#F1F5F9', letterSpacing: -0.5 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  voiceBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1E293B', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#334155' },
  voiceBtnActive: { borderColor: '#00C9A7', backgroundColor: '#00C9A733' },
  profileBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1E293B', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#334155' },
  logoutBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F871711A', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F87171' },
  editToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#00C9A71A', paddingHorizontal: 16, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#00C9A7' },
  editToggleActive: { backgroundColor: '#00C9A7' },
  editToggleText: { color: '#00C9A7', fontWeight: '700', fontSize: 13 },
  
  section: { backgroundColor: '#1E293B', borderRadius: 24, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#334155' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#F1F5F9' },
  countBadge: { backgroundColor: '#0F172A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  countBadgeText: { color: '#00C9A7', fontWeight: '800', fontSize: 12 },
  
  medCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0F172A', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  medCardDone: { opacity: 0.6, backgroundColor: '#0F172A', borderColor: '#1E293B' },
  medCardWarning: { borderColor: '#F8717155', backgroundColor: '#F871710A' },
  medCardLeft: { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
  medDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#00C9A7', marginTop: 6, marginRight: 12 },
  medDotDone: { backgroundColor: '#475569' },
  medInfo: { flex: 1 },
  medName: { fontSize: 18, fontWeight: '700', color: '#F8FAFC', marginBottom: 4 },
  medMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  medMetaText: { fontSize: 13, color: '#94A3B8', marginLeft: 6, fontWeight: '500' },
  metaDivider: { marginHorizontal: 8, color: '#475569', fontSize: 16, fontWeight: '700' },
  
  refillAlert: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  refillAlertText: { color: '#F87171', fontSize: 12, fontWeight: '600' },
  refillBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F87171', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginRight: 8 },
  refillBtnText: { color: '#0F172A', fontSize: 11, fontWeight: '800' },

  medCardRight: { flexDirection: 'row', alignItems: 'center' },
  doneBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#00C9A7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 8 },
  doneText: { color: '#0F172A', fontSize: 11, fontWeight: '800', marginLeft: 4 },
  deleteBtn: { padding: 8, backgroundColor: '#F871711A', borderRadius: 12, borderWidth: 1, borderColor: '#F87171' },
  
  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyStateTitle: { fontSize: 18, color: '#cbd5e1', fontWeight: '700', marginTop: 12 },
  emptyStateSubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 6, lineHeight: 20 },
  
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#00C9A7', paddingVertical: 20, borderRadius: 20, gap: 8, shadowColor: '#00C9A7', shadowOpacity: 0.4, shadowRadius: 18, elevation: 8 },
  addButtonText: { color: '#0F172A', fontSize: 18, fontWeight: '800' },
});
