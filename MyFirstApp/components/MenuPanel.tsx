import React, { useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Animated, 
  Dimensions, TouchableWithoutFeedback, Alert, Platform 
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

interface MenuPanelProps {
  isVisible: boolean;
  onClose: () => void;
  role: string | null;
  userName: string;
  theme: 'light' | 'dark';
  onThemeChange: (newTheme: 'light' | 'dark') => void;
}

export default function MenuPanel({ isVisible, onClose, role, userName, theme, onThemeChange }: MenuPanelProps) {
  const slideAnim = useRef(new Animated.Value(width)).current;
  const router = useRouter();

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isVisible ? 0 : width,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible]);

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: async () => {
        await AsyncStorage.multiRemove(['driverToken', 'parentToken', 'attendantToken', 'driverData', 'parentData', 'attendantData']);
        onClose();
        router.replace('/');
      }}
    ]);
  };

  const navigateToProfile = () => {
    onClose();
    router.push('/profile');
  };

  const showAppInfo = () => {
    Alert.alert("App Info", "School Van Tracking System\nVersion 1.0.0\n\nDeveloped for ITP Project 2026.");
  };

  const renderThemeOption = (label: string, value: 'light' | 'dark', icon: any) => {
    const isActive = theme === value;
    return (
      <TouchableOpacity 
        style={[styles.themeOption, isActive && styles.themeOptionActive]} 
        onPress={() => onThemeChange(value)}
      >
        <MaterialCommunityIcons name={icon} size={20} color={isActive ? '#fff' : '#64748B'} />
        <Text style={[styles.themeText, isActive && styles.themeTextActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, !isVisible && { pointerEvents: 'none' }]}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: slideAnim.interpolate({ inputRange: [0, width], outputRange: [0.5, 0] }) }]} />
      </TouchableWithoutFeedback>
      
      <Animated.View style={[styles.panel, { transform: [{ translateX: slideAnim }] }]}>
        {/* Header / Profile Summary */}
        <TouchableOpacity style={styles.profileSection} onPress={navigateToProfile}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="account" size={40} color="#fff" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.myProfileLabel}>My Profile</Text>
            <Text style={styles.userName} numberOfLines={1}>{userName || 'User'}</Text>
            <Text style={styles.roleText}>{role || 'Member'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Theme Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Appearance</Text>
          <View style={styles.themeRow}>
            {renderThemeOption('Light', 'light', 'weather-sunny')}
            {renderThemeOption('Dark', 'dark', 'weather-night')}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.menuItem} onPress={showAppInfo}>
            <Ionicons name="information-circle-outline" size={24} color="#64748B" />
            <Text style={styles.menuItemText}>App Info</Text>
          </TouchableOpacity>

          {role === 'Driver' && (
            <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); router.push('/vehicles'); }}>
              <MaterialCommunityIcons name="bus-school" size={24} color="#64748B" />
              <Text style={styles.menuItemText}>My Vehicles</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#EF4444" />
            <Text style={[styles.menuItemText, { color: '#EF4444' }]}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 IT Project</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  backdrop: {
    flex: 1,
    backgroundColor: '#000',
  },
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: width * 0.75,
    height: height,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginTop: 10,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 15,
  },
  myProfileLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3B82F6',
    textTransform: 'uppercase',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  roleText: {
    fontSize: 14,
    color: '#64748B',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 20,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#94A3B8',
    marginBottom: 15,
    textTransform: 'uppercase',
  },
  themeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  themeOptionActive: {
    backgroundColor: '#1E293B',
    borderColor: '#1E293B',
  },
  themeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  themeTextActive: {
    color: '#fff',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    gap: 15,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
  },
});
