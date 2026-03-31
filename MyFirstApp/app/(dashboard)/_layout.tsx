import { Stack, Redirect } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MenuPanel from '../../components/MenuPanel';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardLayout() {
  const [role, setRole] = useState<string | null>('loading');
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [userName, setUserName] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  
  useEffect(() => {
    (async () => {
      const savedTheme = await AsyncStorage.getItem('appTheme');
      if (savedTheme) setTheme(savedTheme as 'light' | 'dark');
      else setTheme('dark');

      const driverData    = await AsyncStorage.getItem('driverData');
      const parentData    = await AsyncStorage.getItem('parentData');
      const attendantData = await AsyncStorage.getItem('attendantData');

      if (parentData)    { setRole('Parent'); setUserName(JSON.parse(parentData).name); }
      else if (attendantData) { setRole('Attendant'); setUserName(JSON.parse(attendantData).name); }
      else if (driverData)    { setRole('Driver'); setUserName(JSON.parse(driverData).name); }
      else               setRole(null);
    })();
  }, []);

  const toggleTheme = async (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    await AsyncStorage.setItem('appTheme', newTheme);
  };

  if (role === null) return <Redirect href="/" />;
  if (role === 'loading') return null;

  const accentColor = role === 'Parent' ? '#10B981' : role === 'Attendant' ? '#8B5CF6' : '#3B82F6';

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: accentColor },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => setIsMenuVisible(true)} 
              style={{ marginRight: 15, padding: 5 }}
            >
              <Ionicons name="menu" size={28} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      >
        <Stack.Screen name="home" options={{ title: 'Dashboard' }} />
        <Stack.Screen name="system" options={{ title: 'System Details' }} />
        <Stack.Screen name="map" options={{ title: 'Live Tracking' }} />
        <Stack.Screen name="notifications" options={{ title: 'Notices' }} />
      </Stack>

      <MenuPanel 
        isVisible={isMenuVisible} 
        onClose={() => setIsMenuVisible(false)} 
        role={role}
        userName={userName}
        theme={theme}
        onThemeChange={toggleTheme}
      />
    </>
  );
}
