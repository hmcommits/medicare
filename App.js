import 'react-native-gesture-handler';
import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import AppNavigator from './src/navigation/AppNavigator';
import ReminderModal from './src/components/ReminderModal';
import {
  requestNotificationPermissions,
  scheduleSnoozedReminder,
} from './src/services/notificationService';
import { logAdherence, savePushToken } from './src/services/storageService';
import { LanguageProvider } from './src/contexts/LanguageContext';
import Constants from 'expo-constants';

export default function App() {
  const [reminderVisible, setReminderVisible] = useState(false);
  const [currentMedicine, setCurrentMedicine] = useState(null);

  const navigationRef = useRef(null);

  useEffect(() => {
    async function setupNotifications() {
      // 1. Request OS notification permissions
      const hasPerm = await requestNotificationPermissions();
      
      // 2. Register for Expo Push Token (for guardian high-fives)
      if (hasPerm) {
        try {
          const projectId = Constants.expoConfig.extra.eas.projectId;
          const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
          if (tokenData?.data) {
            await savePushToken(tokenData.data);
          }
        } catch (err) {
          console.warn('[App] Failed to get Expo Push Token:', err.message);
        }
      }
    }
    setupNotifications();

    // Foreground notification listener
    const foregroundSub = Notifications.addNotificationReceivedListener(notification => {
      // If it's a milestone prompt or high-five, don't show the reminder modal
      const data = notification.request.content.data;
      if (data?.type === 'high_five' || data?.type === 'milestone_prompt' || data?.type === 'refill') {
        return; // Let OS show the banner natively (though we told Expo not to show banners, wait we'll need to adjust handleNotification for this if we want them to show in foreground)
      }

      if (data?.medicineId) {
        setCurrentMedicine({
          id: data.medicineId,
          name: data.medicineName ?? 'Medicine',
          dosage: data.dosage ?? '',
          scheduledTime: data.scheduledTime ?? null,
        });
        setReminderVisible(true);
      }
    });

    // Background tap handler
    const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      if (data?.type === 'milestone_prompt') {
        // Simple alert on tap for now or handle inside Dashboard
        return;
      }
      
      if (data?.medicineId) {
        setCurrentMedicine({
          id: data.medicineId,
          name: data.medicineName ?? 'Medicine',
          dosage: data.dosage ?? '',
          scheduledTime: data.scheduledTime ?? null,
        });
        setReminderVisible(true);
      }
    });

    return () => {
      foregroundSub.remove();
      responseSub.remove();
    };
  }, []);

  const handleReminderResponse = async (status) => {
    setReminderVisible(false);
    const med = currentMedicine;
    setCurrentMedicine(null);

    if (!med) return;

    try {
      await logAdherence(med.id, status, med.scheduledTime);

      if (status === 'Snoozed') {
        await scheduleSnoozedReminder(med);
      }
    } catch (error) {
      console.error('[App] Failed to log adherence:', error);
    }
  };

  return (
    <LanguageProvider>
      <NavigationContainer ref={navigationRef}>
        <AppNavigator />
      </NavigationContainer>
      <ReminderModal
        visible={reminderVisible}
        medicine={currentMedicine}
        onResponse={handleReminderResponse}
      />
    </LanguageProvider>
  );
}
