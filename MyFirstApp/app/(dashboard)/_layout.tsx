// ============================================================
// Dashboard Layout
// Uses tabs navigation. The map tab handles both Driver and
// Parent views based on the role stored in AsyncStorage.
// ============================================================
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DashboardLayout() {
  // Read the role from storage to colour the tab bar correctly
  const [role, setRole] = useState<string>('Driver');

  useEffect(() => {
    (async () => {
      // Check which type of user is logged in
      const driverData    = await AsyncStorage.getItem('driverData');
      const parentData    = await AsyncStorage.getItem('parentData');
      const attendantData = await AsyncStorage.getItem('attendantData');

      if (parentData)    setRole('Parent');
      else if (attendantData) setRole('Attendant');
      else               setRole('Driver');
    })();
  }, []);

  // Pick accent colour based on role
  const accentColor = role === 'Parent' ? '#10B981' : role === 'Attendant' ? '#8B5CF6' : '#3B82F6';

  return (
    <Tabs
      screenOptions={{
        headerShown:           true,
        headerStyle:           { backgroundColor: accentColor },
        headerTintColor:       '#fff',
        tabBarActiveTintColor: accentColor,
      }}
    >
      {/* Dashboard summary tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          ),
        }}
      />

      {/* Live Map tab — shows Driver or Parent view automatically */}
      <Tabs.Screen
        name="map"
        options={{
          title: role === 'Parent' ? 'Van Location' : 'Live Map',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name={role === 'Parent' ? 'map-marker-check' : 'map-marker-radius'}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
