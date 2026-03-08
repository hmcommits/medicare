import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function Dashboard({ route, navigation }) {
  // Grab role if passed, default to 'patient' (for testing if navigated directly)
  const role = route.params?.role || 'patient'; 
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.roleText}>Logged in as: {role}</Text>

      {role === 'patient' && (
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AddMedicine')}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>+ Add New Medicine</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F7F9FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2C3E50',
  },
  roleText: {
    fontSize: 18,
    color: '#7F8C8D',
    marginBottom: 40,
  },
  addButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    width: '100%',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
