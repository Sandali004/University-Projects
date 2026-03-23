import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';

export default function DashboardScreen() {
  const [driverName, setDriverName] = useState('');
  const [driverId, setDriverId] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadDriverData();
  }, []);

  const loadDriverData = async () => {
    try {
      const dataStr = await AsyncStorage.getItem('driverData');
      if (dataStr) {
        const data = JSON.parse(dataStr);
        setDriverName(data.name);
        setDriverId(data.id);
      }
    } catch (error) {
      console.log('Failed to load driver data');
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('driverToken');
    await AsyncStorage.removeItem('driverData');
    router.replace('/');
  };

  const sendAlert = async (type, message) => {
    try {
      await api.post('/driver/alert', { driverId, alertType: type, message });
      Alert.alert('Alert Sent', `Successfully sent ${type} alert to parents.`);
    } catch (error) {
      Alert.alert('Error', 'Could not send alert');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {driverName || 'Driver'}!</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Quick Alerts</Text>
      
      <View style={styles.alertContainer}>
        <TouchableOpacity 
          style={[styles.alertCard, { backgroundColor: '#FEF3C7' }]}
          onPress={() => sendAlert('Delay', 'Vehicle is delayed by 15 minutes.')}
        >
          <MaterialCommunityIcons name="clock-alert" size={32} color="#D97706" />
          <Text style={[styles.alertTitle, { color: '#D97706' }]}>Delayed</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.alertCard, { backgroundColor: '#FEE2E2' }]}
          onPress={() => sendAlert('Emergency', 'Vehicle breakdown or emergency.')}
        >
          <MaterialCommunityIcons name="alert" size={32} color="#DC2626" />
          <Text style={[styles.alertTitle, { color: '#DC2626' }]}>Emergency</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.alertCard, { backgroundColor: '#E0E7FF' }]}
          onPress={() => sendAlert('Route Change', 'Vehicle had to detour.')}
        >
          <MaterialCommunityIcons name="map-marker-path" size={32} color="#4F46E5" />
          <Text style={[styles.alertTitle, { color: '#4F46E5' }]}>Route Change</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Tracking is active!</Text>
        <Text style={styles.infoText}>Go to the "Live Map" tab to start or stop sharing your live location with parents.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  logoutButton: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logoutText: {
    color: '#64748B',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 16,
  },
  alertContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  alertCard: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  alertTitle: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#EFF6FF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D4ED8',
    marginBottom: 8,
  },
  infoText: {
    color: '#3B82F6',
    lineHeight: 22,
  }
});
