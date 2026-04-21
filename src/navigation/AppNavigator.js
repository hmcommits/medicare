import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen         from '../screens/LoginScreen';
import RegisterScreen      from '../screens/RegisterScreen';
import Dashboard           from '../screens/Dashboard';
import PatientLinkScreen   from '../screens/PatientLinkScreen';
import GuardianLinkScreen  from '../screens/GuardianLinkScreen';
import AddMedicineScreen   from '../screens/AddMedicineScreen';
import OnboardingScreen    from '../screens/OnboardingScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState(null); // null = loading

  useEffect(() => {
    AsyncStorage.getItem('@medicare_onboarded').then((val) => {
      setInitialRoute(val ? 'Login' : 'Onboarding');
    });
  }, []);

  // Show a branded splash while we check AsyncStorage
  if (!initialRoute) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#00C9A7" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerStyle: { backgroundColor: '#1E293B' },
        headerTintColor: '#F1F5F9',
        headerTitleStyle: { fontWeight: '700' },
        cardStyle: { backgroundColor: '#0F172A' },
      }}
    >
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={({ route }) => ({
          title: route.params?.role === 'patient' ? 'Register as Patient' : 'Register as Guardian',
        })}
      />
      <Stack.Screen
        name="PatientLink"
        component={PatientLinkScreen}
        options={{ title: 'Patient Code' }}
      />
      <Stack.Screen
        name="GuardianLink"
        component={GuardianLinkScreen}
        options={{ title: 'Connect to Patient' }}
      />
      <Stack.Screen
        name="Dashboard"
        component={Dashboard}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddMedicine"
        component={AddMedicineScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
