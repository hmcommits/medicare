import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import ReminderModal from './src/components/ReminderModal';
import { logAdherence, getMedicines, getAdherenceLogs } from './src/services/storageService';

export default function App() {
  const [reminderVisible, setReminderVisible] = useState(false);
  const [currentMedicine, setCurrentMedicine] = useState(null);
  
  // Store snoozed medicines with their expiration timestamp (5 mins)
  const [snoozedMeds, setSnoozedMeds] = useState({});

  useEffect(() => {
    let interval;

    const checkAlarms = async () => {
      if (reminderVisible) return;

      try {
        const medicines = await getMedicines();
        if (!medicines || medicines.length === 0) return;

        const logs = await getAdherenceLogs(); // Fetch logs to verify completion
        
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentDay = now.getDay(); 

        for (const med of medicines) {
            const daysToSchedule = Array.isArray(med.days) && med.days.length > 0 ? med.days : [0, 1, 2, 3, 4, 5, 6];
            if (!daysToSchedule.includes(currentDay)) continue;
            
            if (!med.times || !Array.isArray(med.times)) continue;

            // Check if this medicine is currently globally snoozed for 5 minutes
            if (snoozedMeds[med.id] && now.getTime() < snoozedMeds[med.id]) {
                continue; // Skip this medicine, it's snoozed
            }

            for (const timeStr of med.times) {
                const medTime = new Date(timeStr);
                
                // If it matches the exact current minute (or we can check within a minute window)
                if (medTime.getHours() === currentHour && medTime.getMinutes() === currentMinute) {
                    
                    // Verify the user hasn't already 'Took' or 'Missed' this medicine in the last hour
                    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
                    const alreadyHandled = logs.some(log => 
                        log.medicineId === med.id && 
                        (log.status === 'Took' || log.status === 'Missed') && 
                        new Date(log.timestamp) > oneHourAgo
                    );

                    if (!alreadyHandled) {
                        setCurrentMedicine(med);
                        setReminderVisible(true);
                        return; // Show 1 modal at a time
                    }
                }
            }
        }
      } catch(e) { 
        console.error('Error checking alarms', e);
      }
    };

    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000;
    
    const timeout = setTimeout(() => {
        checkAlarms();
        interval = setInterval(checkAlarms, 60000);
    }, msUntilNextMinute);
    
    checkAlarms();
    
    return () => {
        clearTimeout(timeout);
        if(interval) clearInterval(interval);
    }
  }, [reminderVisible, snoozedMeds]);

  const handleReminderResponse = async (status) => {
    setReminderVisible(false);
    try {
      if (currentMedicine) {
        await logAdherence(currentMedicine.id, status);
        
        if (status === 'Snoozed') {
          // Add a 5 minute (300000ms) skip window for this specific medicine
          const snoozeExpire = new Date().getTime() + 5 * 60 * 1000;
          setSnoozedMeds(prev => ({
              ...prev,
              [currentMedicine.id]: snoozeExpire
          }));

          // The manual 10 second timeout triggers it again instantly for manual testing (optional, keeping as requested)
          // Removing the setTimeout loop and letting the 5 min skip naturally re-evaluate it on the interval later.
          // The interval loop won't pick it up for 5 mins though!
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
