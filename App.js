import 'react-native-gesture-handler';
import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import ReminderModal from './src/components/ReminderModal';
import Constants from 'expo-constants';
import {
  requestNotificationPermissions,
  scheduleSnoozedReminder,
  IS_EXPO_GO,
} from './src/services/notificationService';
import { 
  logAdherence, 
  savePushToken, 
  deleteAdherenceLog, 
  decrementInventory, 
  incrementInventory 
} from './src/services/storageService';
import { LanguageProvider } from './src/contexts/LanguageContext';
import Toast from 'react-native-toast-message';

// Lazy-load expo-notifications — same pattern as notificationService.js.
// Static imports are always evaluated; require() respects the runtime guard.
const Notifications = IS_EXPO_GO ? null : require('expo-notifications');

export default function App() {
  const [reminderVisible, setReminderVisible] = useState(false);
  const [currentMedicine, setCurrentMedicine] = useState(null);

  const navigationRef = useRef(null);

  useEffect(() => {
    async function setupNotifications() {
      // 1. Request OS notification permissions
      const hasPerm = await requestNotificationPermissions();
      
      // 2. Register for Expo Push Token (for guardian high-fives)
      // ⚠️ Remote push tokens are NOT supported in Expo Go (SDK 53+).
      // This block is skipped automatically in Expo Go and only runs in
      // a real development build or production APK.
      const isExpoGo = Constants.appOwnership === 'expo';
      if (hasPerm && !isExpoGo) {
        try {
          const projectId = Constants.expoConfig?.extra?.eas?.projectId;
          if (projectId) {
            const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
            if (tokenData?.data) {
              await savePushToken(tokenData.data);
            }
          }
        } catch (err) {
          console.warn('[App] Failed to get Expo Push Token:', err.message);
        }
      } else if (isExpoGo) {
        console.log('[App] Expo Go — push tokens skipped. Use a dev build for full push support.');
      }
    }
    setupNotifications();

    // Set up listeners only when Notifications module is available (not Expo Go)
    if (!Notifications) {
      return () => {}; // nothing to clean up in Expo Go
    }

    // Foreground notification listener (shows in-app ReminderModal)
    const foregroundSub = Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data;
      if (data?.type === 'high_five' || data?.type === 'milestone_prompt' || data?.type === 'refill') return;
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

    // Background / killed-app tap handler
    const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.type === 'milestone_prompt') return;
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
      const result = await logAdherence(med.id, status, med.scheduledTime);
      
      if (status === 'Took') {
        await decrementInventory(med.id, med.pillsPerDose || 1);
      }

      if (status === 'Snoozed') {
        await scheduleSnoozedReminder(med);
        Toast.show({ type: 'info', text1: 'Snoozed for 5 minutes' });
      } else if (result && result.docId && !result.isDuplicate) {
        // Show Undo toast for 5 seconds
        Toast.show({
          type: 'success',
          text1: `Marked as ${status}`,
          text2: 'Tap here to Undo',
          visibilityTime: 5000,
          onPress: async () => {
            Toast.hide();
            await deleteAdherenceLog(result.docId);
            if (status === 'Took') {
              await incrementInventory(med.id, med.pillsPerDose || 1);
            }
            Toast.show({ type: 'info', text1: 'Action Undone' });
          }
        });
      }
    } catch (error) {
      console.error('[App] Failed to log adherence:', error);
      Toast.show({ type: 'error', text1: 'Error logging adherence' });
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
      <Toast />
    </LanguageProvider>
  );
}
