import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Dimensions, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getMedicines, logAdherence, getAdherenceLogs } from '../services/storageService';
import ReminderModal from '../components/ReminderModal';
import { StackedBarChart } from 'react-native-chart-kit';

export default function Dashboard({ route, navigation }) {
  const role = route.params?.role || 'patient'; 
  const [medicines, setMedicines] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Reminder Modal State
  const [reminderVisible, setReminderVisible] = useState(false);
  const [currentReminderMedicine, setCurrentReminderMedicine] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      let interval; // Set up a quick real-time poll for adherence badges

      const fetchData = async () => {
        try {
          const fetchedMedicines = await getMedicines();
          const fetchedLogs = await getAdherenceLogs();
          
          if (isActive) {
            setMedicines(fetchedMedicines);
            setLogs(fetchedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
          }
        } catch (error) {
          console.error('Failed to load dashboard data', error);
        }
      };

      fetchData();
      interval = setInterval(fetchData, 10000); // 10 second data sync while focused

      return () => {
        isActive = false;
        clearInterval(interval);
      };
    }, [])
  );
  
  const renderMedicineItem = ({ item }) => {
    // Check adherence logs for completion within last hour
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const isDone = logs.some(log => 
      log.medicineId === item.id && 
      log.status === 'Took' && 
      new Date(log.timestamp) > oneHourAgo
    );

    // Format times safely (handling legacy data without arrays)
    let formattedTimes = '';
    if (item.times && Array.isArray(item.times)) {
      formattedTimes = item.times.map(isoString => {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }).join(', ');
    } else if (item.time) {
      formattedTimes = String(item.time); // Legacy fallback
    } else {
      formattedTimes = 'Not set';
    }
    
    // Map day indices back to labels safely
    let formattedDays = '';
    if (item.days && Array.isArray(item.days)) {
      const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      formattedDays = item.days.map(d => DAYS[d]).join(', ');
    } else {
      formattedDays = 'Everyday'; // Legacy fallback
    }

    return (
      <View style={[styles.card, isDone && { opacity: 0.6 }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.medicineName}>{item.name}</Text>
          {isDone && (
            <View style={styles.doneBadge}>
              <Text style={styles.doneText}>Done</Text>
            </View>
          )}
        </View>
        <Text style={styles.medicineDetail}>Dosage: {item.dosage}</Text>
        <Text style={styles.medicineDetail}>Times: {formattedTimes}</Text>
        <Text style={styles.medicineDetail}>Days: {formattedDays}</Text>
      </View>
    );
  };

  const renderRecentActivity = () => {
    // Show last 5 logs
    const recentLogs = logs.slice(0, 5);
    if (recentLogs.length === 0) return <Text style={styles.noLogsText}>No recent activity.</Text>;

    return recentLogs.map((log, index) => {
      const medicine = medicines.find(m => m.id === log.medicineId);
      const medicineName = medicine ? medicine.name : "Unknown Medicine";
      const timeString = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      let icon = "❓";
      let color = "#7f8c8d";
      if (log.status === 'Took') { icon = "✅"; color = "#2ecc71"; }
      if (log.status === 'Missed') { icon = "❌"; color = "#e74c3c"; }
      if (log.status === 'Snoozed') { icon = "💤"; color = "#3498db"; }

      return (
        <View key={log.id} style={styles.logItem}>
          <Text style={styles.logIcon}>{icon}</Text>
          <View style={styles.logTextContainer}>
            <Text style={[styles.logStatusUser, { color }]}>{log.status}</Text>
            <Text style={styles.logMedicineDesc}>{medicineName} at {timeString}</Text>
          </View>
        </View>
      );
    });
  };

  const getChartData = () => {
    // Last 7 days counting Took vs Missed
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toDateString();
    }).reverse();

    const dataTook = Array(7).fill(0);
    const dataMissed = Array(7).fill(0);

    logs.forEach(log => {
      const logDate = new Date(log.timestamp).toDateString();
      const dayIndex = last7Days.indexOf(logDate);
      if (dayIndex !== -1) {
        if (log.status === 'Took') dataTook[dayIndex]++;
        if (log.status === 'Missed') dataMissed[dayIndex]++;
      }
    });

    const labels = last7Days.map(dateStr => {
      const d = new Date(dateStr);
      return ['S','M','T','W','T','F','S'][d.getDay()];
    });

    // Format for StackedBarChart: array of arrays where each sub-array corresponds to [Took, Missed] for a specific day
    const stackedData = last7Days.map((_, index) => {
      return [dataTook[index], dataMissed[index]];
    });

    return {
      labels,
      legend: ["Took", "Missed"],
      data: stackedData,
      barColors: ["#2ECC71", "#E74C3C"]
    };
  };

  // Testing function removed as requested

  const handleReminderResponse = async (status) => {
    try {
      if (currentReminderMedicine) {
        await logAdherence(currentReminderMedicine.id, status);
        console.log(`Logged ${status} for ${currentReminderMedicine.name}`);
        
        // Refresh logs immediately so the Done badge updates if "Took" is clicked
        const fetchedLogs = await getAdherenceLogs();
        setLogs(fetchedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));

        if (status === 'Snoozed') {
          const snoozedMedicine = currentReminderMedicine;
          setTimeout(() => {
            setCurrentReminderMedicine(snoozedMedicine);
            setReminderVisible(true);
          }, 10000); // 10 seconds
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to log adherence.');
    } finally {
      setReminderVisible(false);
      setCurrentReminderMedicine(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <View style={styles.roleHeader}>
        <Text style={styles.roleText}>Logged in as: {role}</Text>
        {role === 'guardian' && (
          <TouchableOpacity 
            style={[styles.editModeToggle, isEditMode ? styles.editModeActive : null]}
            onPress={() => setIsEditMode(!isEditMode)}
          >
            <Text style={[styles.editModeText, isEditMode ? styles.editModeTextActive : null]}>
              {isEditMode ? "Done Editing" : "Edit Mode"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        
        {role === 'guardian' && (
          <View style={styles.guardianSection}>
            <Text style={styles.sectionTitle}>7-Day Adherence</Text>
            <View style={styles.chartContainer}>
              {logs.length > 0 ? (
                <StackedBarChart
                  data={getChartData()}
                  width={Dimensions.get("window").width - 50}
                  height={220}
                  decimalPlaces={0}
                  chartConfig={{
                    backgroundColor: "#ffffff",
                    backgroundGradientFrom: "#ffffff",
                    backgroundGradientTo: "#ffffff",
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
                  }}
                  hideLegend={false}
                  style={styles.chart}
                />
              ) : (
                <Text style={styles.noLogsText}>Not enough data to graph.</Text>
              )}
            </View>

            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <View style={styles.activityContainer}>
              {renderRecentActivity()}
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Scheduled Medicines</Text>
        <View style={styles.listContainer}>
          {medicines.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No medicines added yet.{'\n'}Tap the + button to start.
              </Text>
            </View>
          ) : (
            medicines.map(item => (
              <View key={item.id}>
                {renderMedicineItem({item})}
              </View>
            ))
          )}
        </View>

        {(role === 'patient' || (role === 'guardian' && isEditMode)) && (
          <View style={styles.actionContainer}>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => navigation.navigate('AddMedicine')}
              activeOpacity={0.8}
            >
              <Text style={styles.addButtonText}>+ Add New Medicine</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      <ReminderModal
        visible={reminderVisible}
        medicine={currentReminderMedicine}
        onResponse={handleReminderResponse}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F7F9FC',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#2C3E50',
    textAlign: 'center',
    marginTop: 20,
  },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  roleText: {
    fontSize: 18,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  editModeToggle: {
    marginLeft: 15,
    backgroundColor: '#ECF0F1',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#BDC3C7',
  },
  editModeActive: {
    backgroundColor: '#E74C3C',
    borderColor: '#C0392B',
  },
  editModeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7F8C8D',
  },
  editModeTextActive: {
    color: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#34495E',
    marginTop: 15,
    marginBottom: 15,
  },
  guardianSection: {
    marginBottom: 20,
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
    marginBottom: 15,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noLogsText: {
    fontSize: 16,
    color: '#7F8C8D',
    fontStyle: 'italic',
    padding: 20,
    textAlign: 'center',
  },
  activityContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  logIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  logTextContainer: {
    flex: 1,
  },
  logStatusUser: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  logMedicineDesc: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 2,
  },
  listContainer: {
    width: '100%',
    marginBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 22,
    color: '#95A5A6',
    textAlign: 'center',
    lineHeight: 34,
  },
  flatListContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
    borderLeftWidth: 8,
    borderLeftColor: '#3498DB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  medicineName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2C3E50',
    flex: 1,
  },
  doneBadge: {
    backgroundColor: '#2ECC71',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginLeft: 10,
  },
  doneText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  medicineDetail: {
    fontSize: 20,
    color: '#34495E',
    marginBottom: 8,
  },
  actionContainer: {
    width: '100%',
    paddingTop: 10,
  },
  addButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 20,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
});
