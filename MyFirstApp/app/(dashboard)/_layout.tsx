import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Animated, Pressable, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs, useRouter, usePathname, Redirect } from 'expo-router';

export default function DashboardLayout() {
  const router = useRouter();
  // Read the role from storage to colour the tab bar correctly
  const [role, setRole] = useState<string | null>('loading');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [showThemeOptions, setShowThemeOptions] = useState(false);
  const [showAppInfo, setShowAppInfo] = useState(false);

  const pathname = usePathname();
  
  useEffect(() => {
    (async () => {
      // Check for theme preference
      const savedTheme = await AsyncStorage.getItem('appTheme');
      if (savedTheme) setTheme(savedTheme as 'light' | 'dark');

      // Check which type of user is logged in
      const driverData    = await AsyncStorage.getItem('driverData');
      const parentData    = await AsyncStorage.getItem('parentData');
      const attendantData = await AsyncStorage.getItem('attendantData');

      if (parentData)    setRole('Parent');
      else if (attendantData) setRole('Attendant');
      else if (driverData)    setRole('Driver');
      else               setRole(null);
    })();
  }, [pathname]);

  // If we've finished checking and have no role, they've logged out or are unauthorized
  if (role === null) {
    return <Redirect href="/" />;
  }

  // If still loading, just show a blank screen or we could add a loader
  if (role === 'loading') {
    return null;
  }

  // Pick accent colour based on role
  const accentColor = role === 'Parent' ? '#10B981' : role === 'Attendant' ? '#8B5CF6' : '#3B82F6';

  const toggleTheme = async (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    await AsyncStorage.setItem('appTheme', newTheme);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#0F172A' : '#F8FAFC' }}>
      <Tabs
        screenOptions={{
          headerShown:           true,
          headerStyle:           { backgroundColor: accentColor },
          headerTintColor:       '#fff',
          tabBarActiveTintColor: accentColor,
          tabBarStyle:           { display: 'none' },
          headerRight: () => (
            <TouchableOpacity onPress={() => setIsSidebarOpen(true)} style={{ marginRight: 15 }}>
              <MaterialCommunityIcons name="menu" size={28} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      >
      {/* Dashboard summary tab */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          ),
        }}
      />

      {/* Live Map tab — visible only for Parents (to set pickup) and Driver/Attendant (for tracking) */}
      <Tabs.Screen
        name="map"
        options={{
          href: (role === 'Parent' || role === 'Driver' || role === 'Attendant') ? undefined : null,
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

      {/* Notifications tab — visible only for Parents */}
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

      {/* Hidden Utility Routes */}
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="children" options={{ href: null }} />
    </Tabs>

    <Modal
      visible={isSidebarOpen}
      transparent
      animationType="none"
      onRequestClose={() => setIsSidebarOpen(false)}
    >
      <Pressable 
        style={styles.modalOverlay} 
        onPress={() => setIsSidebarOpen(false)}
      >
        <Animated.View style={styles.sidebar}>
          <View style={[styles.sidebarHeader, { backgroundColor: accentColor }]}>
            <Text style={styles.sidebarTitle}>Menu</Text>
            <TouchableOpacity onPress={() => setIsSidebarOpen(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.sidebarContent}>
            {/* My Profile Section */}
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => {
                setIsSidebarOpen(false);
                router.push('/(dashboard)/profile');
              }}
            >
              <View style={styles.menuItemLeft}>
                <MaterialCommunityIcons name="account-circle-outline" size={24} color={accentColor} />
                <Text style={[styles.menuItemText, { color: theme === 'dark' ? '#F8FAFC' : '#1E293B' }]}>My Profile</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#64748B" />
            </TouchableOpacity>

            {/* Theme Section */}
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => setShowThemeOptions(!showThemeOptions)}
            >
              <View style={styles.menuItemLeft}>
                <MaterialCommunityIcons name="palette-outline" size={24} color={accentColor} />
                <Text style={[styles.menuItemText, { color: theme === 'dark' ? '#F8FAFC' : '#1E293B' }]}>Theme</Text>
              </View>
              <MaterialCommunityIcons 
                name={showThemeOptions ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#64748B" 
              />
            </TouchableOpacity>

            {showThemeOptions && (
              <View style={styles.subOptions}>
                <TouchableOpacity 
                  style={styles.subOptionItem} 
                  onPress={() => toggleTheme('light')}
                >
                  <Text style={[styles.subOptionText, { color: theme === 'light' ? accentColor : '#64748B' }]}>Light</Text>
                  {theme === 'light' && <MaterialCommunityIcons name="check" size={16} color={accentColor} />}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.subOptionItem} 
                  onPress={() => toggleTheme('dark')}
                >
                  <Text style={[styles.subOptionText, { color: theme === 'dark' ? accentColor : '#64748B' }]}>Dark</Text>
                  {theme === 'dark' && <MaterialCommunityIcons name="check" size={16} color={accentColor} />}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.subOptionItem} 
                  onPress={() => toggleTheme('dark')}
                >
                  <Text style={[styles.subOptionText, { color: '#94A3B8' }]}>Default (Dark)</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* App Info Section */}
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => setShowAppInfo(!showAppInfo)}
            >
              <View style={styles.menuItemLeft}>
                <MaterialCommunityIcons name="information-outline" size={24} color={accentColor} />
                <Text style={[styles.menuItemText, { color: theme === 'dark' ? '#F8FAFC' : '#1E293B' }]}>App Info</Text>
              </View>
              <MaterialCommunityIcons 
                name={showAppInfo ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#64748B" 
              />
            </TouchableOpacity>

            {showAppInfo && (
              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>School Van Tracking</Text>
                <Text style={styles.infoVersion}>Version 1.0.0</Text>
                <Text style={styles.infoDesc}>
                  Real-time safety and tracking for your child's daily commute.
                </Text>
              </View>
            )}

            <View style={styles.divider} />
            
            <TouchableOpacity 
              style={styles.logoutBtn} 
              onPress={async () => {
                await AsyncStorage.clear();
                setIsSidebarOpen(false);
                router.replace('/');
              }}
            >
              <MaterialCommunityIcons name="logout" size={20} color="#EF4444" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </Pressable>
    </Modal>
  </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    flexDirection: 'row',
  },
  sidebar: {
    width: '75%',
    height: '100%',
    backgroundColor: '#fff', // Default sidebar color, will override in component if needed
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  sidebarHeader: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sidebarTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  sidebarContent: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff', // Ideally we should theme this too
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
  },
  subOptions: {
    paddingLeft: 48,
    marginBottom: 10,
  },
  subOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  subOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoBox: {
    backgroundColor: '#F8FAFC',
    padding: 15,
    borderRadius: 12,
    marginTop: 5,
    marginLeft: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  infoVersion: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 5,
  },
  infoDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 20,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
