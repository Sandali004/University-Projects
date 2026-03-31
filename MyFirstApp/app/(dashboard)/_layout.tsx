import { Tabs, usePathname, useRouter, Redirect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MenuPanel from '../../components/MenuPanel';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardLayout() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>('loading');
  const pathname = usePathname();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [userName, setUserName] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  
  useEffect(() => {
    (async () => {
      // Check for theme preference
      const savedTheme = await AsyncStorage.getItem('appTheme');
      if (savedTheme) setTheme(savedTheme as 'light' | 'dark');
      else setTheme('dark');

      // Check which type of user is logged in
      const driverData    = await AsyncStorage.getItem('driverData');
      const parentData    = await AsyncStorage.getItem('parentData');
      const attendantData = await AsyncStorage.getItem('attendantData');

      if (parentData)    { setRole('Parent'); setUserName(JSON.parse(parentData).name); }
      else if (attendantData) { setRole('Attendant'); setUserName(JSON.parse(attendantData).name); }
      else if (driverData)    { setRole('Driver'); setUserName(JSON.parse(driverData).name); }
      else               setRole(null);
    })();
  }, [pathname]);

  const toggleTheme = async (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    await AsyncStorage.setItem('appTheme', newTheme);
  };

  if (role === null) {
    return <Redirect href="/" />;
  }

  if (role === 'loading') {
    return null;
  }

  const accentColor = role === 'Parent' ? '#10B981' : role === 'Attendant' ? '#8B5CF6' : '#3B82F6';

  return (
    <>
    <Tabs
      screenOptions={{
        headerShown:           true,
        headerStyle:           { backgroundColor: accentColor },
        headerTintColor:       '#fff',
        tabBarActiveTintColor: accentColor,
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
      <Tabs.Screen
        name="home"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="map"
        options={{
          href: null,
          title: 'Live Map',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="map-marker-radius"
              size={size}
              color={color}
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="system"
        options={{
          title: 'System',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bus-school" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          href: role === 'Parent' ? undefined : null,
          title: 'Notifications',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bell-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>

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
