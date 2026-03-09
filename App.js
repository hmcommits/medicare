import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import ReminderModal from './src/components/ReminderModal';
import { logAdherence, getMedicines } from './src/services/storageService';

export default function App() {
  const [reminderVisible, setReminderVisible] = useState(false);
  const [currentMedicine, setCurrentMedicine] = useState(null);

  useEffect(() => {
    let interval;

    const checkAlarms = async () => {
      // Don't pop up a new modal if one is already visible
      if (reminderVisible) return;

      try {
        const medicines = await getMedicines();
        if (!medicines || medicines.length === 0) return;

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentDay = now.getDay(); // 0 is Sunday

        for (const med of medicines) {
            const daysToSchedule = Array.isArray(med.days) && med.days.length > 0 ? med.days : [0, 1, 2, 3, 4, 5, 6];
            if (!daysToSchedule.includes(currentDay)) continue;
            
            if (!med.times || !Array.isArray(med.times)) continue;

            for (const timeStr of med.times) {
                const medTime = new Date(timeStr);
                if (medTime.getHours() === currentHour && medTime.getMinutes() === currentMinute) {
                    // Match found!
                    setCurrentMedicine(med);
                    setReminderVisible(true);
                    return; // Stop checking after first match to show only 1 modal at a time
                }
            }
        }
      } catch(e) { 
        console.error('Error checking alarms', e);
      }
    };

    // Calculate time until next exact minute to align the interval perfectly
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000;
    
    // Check exactly on the minute roll-over, then every 60 seconds
    const timeout = setTimeout(() => {
        checkAlarms();
        interval = setInterval(checkAlarms, 60000);
    }, msUntilNextMinute);
    
    // Also perform an immediate check on mount
    checkAlarms();
    
    return () => {
        clearTimeout(timeout);
        if(interval) clearInterval(interval);
    }
  }, [reminderVisible]);

  const handleReminderResponse = async (status) => {
    setReminderVisible(false);
    try {
      if (currentMedicine) {
        await logAdherence(currentMedicine.id, status);
        
        if (status === 'Snoozed') {
          // Re-trigger the modal after 10 seconds for snoozing
          const snoozedMedicine = currentMedicine;
          setTimeout(() => {
            setCurrentMedicine(snoozedMedicine);
            setReminderVisible(true);
          }, 10000);
        } else {
          setCurrentMedicine(null);
        }
      }
    } catch (error) {
      console.error('Failed to log adherence from app-level reminder', error);
    }
  };

  return (
    <>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
      <ReminderModal 
        visible={reminderVisible} 
        medicine={currentMedicine} 
        onResponse={handleReminderResponse} 
      />
    </>
  );
}
