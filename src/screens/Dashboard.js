import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, ScrollView, Platform, Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getMedicines, logAdherence, getAdherenceLogs, getWeeklyAdherenceData } from '../services/storageService';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

export default function Dashboard({ route, navigation }) {
  const role = route.params?.role || 'patient';
  const [medicines, setMedicines] = useState([]);
  const [logs, setLogs] = useState([]);
  const [weeklyAdherence, setWeeklyAdherence] = useState(Array(7).fill(0));
  const [isEditMode, setIsEditMode] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      let interval;

      const fetchData = async () => {
        try {
          const fetchedMedicines = await getMedicines();
          const fetchedLogs = await getAdherenceLogs();
          const fetchedWeeklyData = await getWeeklyAdherenceData();

          if (isActive) {
            setMedicines(fetchedMedicines);
            setLogs(fetchedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
            setWeeklyAdherence(fetchedWeeklyData);
          }
        } catch (error) {
          console.error('Failed to load dashboard data', error);
        }
      };

      fetchData();
      interval = setInterval(fetchData, 10000);

      return () => {
        isActive = false;
        clearInterval(interval);
      };
    }, [])
  );

  // Computed stats
  const totalMeds = medicines.length;
  const todayStr = new Date().toDateString();
  const todayLogs = logs.filter(l => new Date(l.timestamp).toDateString() === todayStr);
  const tookToday = todayLogs.filter(l => l.status === 'Took').length;
  const adherenceToday = todayLogs.length > 0 ? Math.round((tookToday / todayLogs.length) * 100) : 0;

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
    } else if (item.time) {
      formattedTimes = String(item.time);
    }

    let formattedDays = 'Everyday';
    if (item.days && Array.isArray(item.days)) {
      const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      formattedDays = item.days.length === 7 ? 'Every day' : item.days.map(d => DAYS[d]).join(', ');
    }

    return (
      <View key={item.id} style={[styles.medCard, isDone && styles.medCardDone]}>
        <View style={styles.medCardLeft}>
          <View style={[styles.medDot, isDone && styles.medDotDone]} />
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
          </View>
        </View>
        {isDone && (
          <View style={styles.doneBadge}>
            <MaterialCommunityIcons name="check" size={14} color="#0F172A" />
            <Text style={styles.doneText}>Done</Text>
          </View>
        )}
      </View>
    );
  };

  const getLineChartData = () => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toDateString();
    }).reverse();

    const labels = last7Days.map(dateStr => {
      const d = new Date(dateStr);
      return ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()];
    });

    return {
      labels,
      datasets: [
        {
          data: weeklyAdherence.map(v => v || 0),
          color: (opacity = 1) => `rgba(0, 201, 167, ${opacity})`,
          strokeWidth: 3
        },
        {
          data: [100],
          withDots: false,
          color: () => 'rgba(0,0,0,0)',
          strokeWidth: 0
        }
      ],
    };
  };

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerGreeting}>
              {role === 'guardian' ? 'Guardian View' : 'Good day!'}
            </Text>
            <Text style={styles.headerTitle}>Dashboard</Text>
          </View>
          {role === 'guardian' && (
            <TouchableOpacity
              style={[styles.editToggle, isEditMode && styles.editToggleActive]}
              onPress={() => setIsEditMode(!isEditMode)}
            >
              <MaterialCommunityIcons
                name={isEditMode ? 'check' : 'pencil-outline'}
                size={18}
                color={isEditMode ? '#0F172A' : '#00C9A7'}
              />
              <Text style={[styles.editToggleText, isEditMode && { color: '#0F172A' }]}>
                {isEditMode ? 'Done' : 'Edit'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Row */}
        {role === 'patient' && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{totalMeds}</Text>
              <Text style={styles.statLabel}>Medicines</Text>
            </View>
            <View style={[styles.statCard, styles.statCardAccent]}>
              <Text style={[styles.statNum, { color: '#0F172A' }]}>{adherenceToday}%</Text>
              <Text style={[styles.statLabel, { color: '#0F172A99' }]}>Today</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{tookToday}</Text>
              <Text style={styles.statLabel}>Took Today</Text>
            </View>
          </View>
        )}

        {/* Guardian: 7-Day Chart */}
        {role === 'guardian' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7-Day Adherence</Text>
            {logs.length > 0 ? (
              <View>
                <LineChart
                  data={getLineChartData()}
                  width={width - 64}
                  height={180}
                  yAxisSuffix="%"
                  fromZero={true}
                  chartConfig={{
                    backgroundColor: 'transparent',
                    backgroundGradientFrom: '#1E293B',
                    backgroundGradientTo: '#1E293B',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(0, 201, 167, ${opacity})`,
                    labelColor: () => '#64748B',
                    propsForDots: { r: '4', strokeWidth: '2', stroke: '#00C9A7' },
                    propsForBackgroundLines: { stroke: '#334155', strokeDasharray: '4' },
                  }}
                  bezier
                  style={styles.chart}
                  withShadow={false}
                />
                <View style={styles.legendRow}>
                  {[{ color: '#00C9A7', label: 'Took' }, { color: '#F87171', label: 'Missed' }, { color: '#818CF8', label: 'Snoozed' }].map(l => (
                    <View key={l.label} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                      <Text style={styles.legendText}>{l.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.emptyChart}>
                <MaterialCommunityIcons name="chart-line" size={40} color="#334155" />
                <Text style={styles.emptyText}>No data yet</Text>
              </View>
            )}
          </View>
        )}

        {/* Guardian: Recent Activity */}
        {role === 'guardian' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {logs.slice(0, 5).length === 0 ? (
              <Text style={styles.emptyText}>No recent activity.</Text>
            ) : (
              logs.slice(0, 5).map((log, index) => {
                const med = medicines.find(m => m.id === log.medicineId);
                const medName = med ? med.name : 'Unknown';
                const timeStr = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const config = {
                  Took: { icon: 'check-circle', color: '#00C9A7' },
                  Missed: { icon: 'close-circle', color: '#F87171' },
                  Snoozed: { icon: 'alarm-snooze', color: '#818CF8' },
                }[log.status] || { icon: 'help-circle', color: '#64748B' };

                return (
                  <View key={log.id} style={styles.activityRow}>
                    <View style={[styles.activityIcon, { backgroundColor: config.color + '22' }]}>
                      <MaterialCommunityIcons name={config.icon} size={18} color={config.color} />
                    </View>
                    <View style={styles.activityInfo}>
                      <Text style={[styles.activityStatus, { color: config.color }]}>{log.status}</Text>
                      <Text style={styles.activityMed}>{medName} at {timeStr}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Medicines Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Scheduled Medicines</Text>
            {medicines.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{medicines.length}</Text>
              </View>
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

        {/* Add Button */}
        {(role === 'patient' || (role === 'guardian' && isEditMode)) && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddMedicine')}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="plus" size={22} color="#0F172A" />
            <Text style={styles.addButtonText}>Add New Medicine</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    padding: 24,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: Platform.OS === 'android' ? 10 : 0,
  },
  headerGreeting: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F1F5F9',
  },
  editToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#00C9A7',
  },
  editToggleActive: {
    backgroundColor: '#00C9A7',
    borderColor: '#00C9A7',
  },
  editToggleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00C9A7',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statCardAccent: {
    backgroundColor: '#00C9A7',
    borderColor: '#00C9A7',
  },
  statNum: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F1F5F9',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  countBadge: {
    backgroundColor: '#00C9A71A',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 14,
  },
  countBadgeText: {
    color: '#00C9A7',
    fontWeight: '700',
    fontSize: 13,
  },
  chart: {
    borderRadius: 12,
    marginLeft: -12,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyChart: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#0F172A',
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityInfo: {
    flex: 1,
  },
  activityStatus: {
    fontSize: 14,
    fontWeight: '700',
  },
  activityMed: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 1,
  },
  medCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  medCardDone: {
    borderColor: '#00C9A730',
    opacity: 0.75,
  },
  medCardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  medDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00C9A7',
    marginTop: 6,
  },
  medDotDone: {
    backgroundColor: '#334155',
  },
  medInfo: {
    flex: 1,
  },
  medName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  medMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  medMetaText: {
    fontSize: 13,
    color: '#64748B',
  },
  metaDivider: {
    color: '#334155',
    fontWeight: '700',
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#00C9A7',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginLeft: 8,
  },
  doneText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#475569',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  addButton: {
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
  addButtonText: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
  },
});
