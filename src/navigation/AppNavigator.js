import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import Dashboard from '../screens/Dashboard';
import PatientLinkScreen from '../screens/PatientLinkScreen';
import GuardianLinkScreen from '../screens/GuardianLinkScreen';
import AddMedicineScreen from '../screens/AddMedicineScreen';
import RegisterScreen from '../screens/RegisterScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen} 
        options={({ route }) => ({ title: `Register as ${route.params?.role === 'patient' ? 'Patient' : 'Guardian'}` })}
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ headerShown: false }} 
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
      />
      <Stack.Screen 
        name="AddMedicine" 
        component={AddMedicineScreen} 
        options={{ title: 'Add Medicine' }}
      />
    </Stack.Navigator>
  );
}
