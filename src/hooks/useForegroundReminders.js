import { useEffect, useRef, useState } from 'react';
import { getActivePatientUid, subscribeMedicines } from '../services/storageService';

/**
 * A custom hook to simulate local notifications while the app is in the foreground.
 * This is especially useful for Expo Go users where `expo-notifications` is disabled.
 * 
 * @param {Function} onReminderTrigger - Callback when a medicine is due.
 */
export function useForegroundReminders(onReminderTrigger) {
  const [medicines, setMedicines] = useState([]);
  const triggeredRef = useRef(new Set());
  const unsubRef = useRef(null);

  // Subscribe to medicines
  useEffect(() => {
    let isActive = true;
    
    const init = async () => {
      const uid = await getActivePatientUid();
      if (!uid || !isActive) return;

      unsubRef.current = subscribeMedicines(uid, (fetched) => {
        if (isActive) setMedicines(fetched);
      });
    };

    init();

    return () => {
      isActive = false;
      if (unsubRef.current) unsubRef.current();
    };
  }, []);

  // Poll every 10 seconds to check if any medicine is due
  useEffect(() => {
    if (medicines.length === 0) return;

    const intervalId = setInterval(() => {
      const now = new Date();
      const currentDay = now.getDay(); // 0-6 (Sun-Sat)
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const todayStr = now.toDateString();

      for (const med of medicines) {
        // Check if the medicine is scheduled for today
        if (!med.days || !med.days.includes(currentDay)) continue;
        if (!med.times || !med.times.length) continue;

        for (const timeISO of med.times) {
          const tDate = new Date(timeISO);
          if (tDate.getHours() === currentHour && tDate.getMinutes() === currentMinute) {
            // It is time! Check if we already triggered this exact slot today
            const triggerKey = `${med.id}_${todayStr}_${currentHour}_${currentMinute}`;
            
            if (!triggeredRef.current.has(triggerKey)) {
              triggeredRef.current.add(triggerKey);
              
              onReminderTrigger({
                id: med.id,
                name: med.name || 'Medicine',
                dosage: med.dosage || '',
                scheduledTime: timeISO,
              });
            }
          }
        }
      }
    }, 10000); // Check every 10s

    return () => clearInterval(intervalId);
  }, [medicines, onReminderTrigger]);
}
