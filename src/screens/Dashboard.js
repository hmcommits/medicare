import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getMedicines, logAdherence } from '../services/storageService';
import ReminderModal from '../components/ReminderModal';

export default function Dashboard({ route, navigation }) {
  const role = route.params?.role || 'patient'; 
  const [medicines, setMedicines] = useState([]);
  
  // Reminder Modal State
  const [reminderVisible, setReminderVisible] = useState(false);
  const [currentReminderMedicine, setCurrentReminderMedicine] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchMedicines = async () => {
        try {
          const fetchedMedicines = await getMedicines();
          if (isActive) {
            setMedicines(fetchedMedicines);
          }
        } catch (error) {
          console.error('Failed to load medicines', error);
        }
      };

      fetchMedicines();

      return () => {
        isActive = false;
      };
    }, [])
  );
  
  const renderMedicineItem = ({ item }) => {
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
      <View style={styles.card}>
        <Text style={styles.medicineName}>{item.name}</Text>
        <Text style={styles.medicineDetail}>Dosage: {item.dosage}</Text>
        <Text style={styles.medicineDetail}>Times: {formattedTimes}</Text>
        <Text style={styles.medicineDetail}>Days: {formattedDays}</Text>
      </View>
    );
  };

  const testReminder = () => {
    if (medicines.length === 0) {
      Alert.alert('No Medicines', 'Please add a medicine first to test the reminder.');
      return;
    }
    // Randomly pick the first medicine for testing
    setCurrentReminderMedicine(medicines[0]);
    setReminderVisible(true);
  };

  const handleReminderResponse = async (status) => {
    try {
      if (currentReminderMedicine) {
        await logAdherence(currentReminderMedicine.id, status);
        console.log(`Logged ${status} for ${currentReminderMedicine.name}`);
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
      <Text style={styles.roleText}>Logged in as: {role}</Text>

      <View style={styles.listContainer}>
        {medicines.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No medicines added yet.{'\n'}Tap the + button to start.
            </Text>
          </View>
        ) : (
          <FlatList
            data={medicines}
            keyExtractor={(item) => item.id}
            renderItem={renderMedicineItem}
            contentContainerStyle={styles.flatListContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {role === 'patient' && (
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={styles.testButton}
            onPress={testReminder}
            activeOpacity={0.8}
          >
            <Text style={styles.testButtonText}>Test Reminder</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('AddMedicine')}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>+ Add New Medicine</Text>
          </TouchableOpacity>
        </View>
      )}

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
  roleText: {
    fontSize: 18,
    color: '#7F8C8D',
    marginBottom: 20,
    textAlign: 'center',
  },
  listContainer: {
    flex: 1,
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
  medicineName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
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
  testButton: {
    backgroundColor: '#F39C12', // Orange for testing
    paddingVertical: 18,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
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
