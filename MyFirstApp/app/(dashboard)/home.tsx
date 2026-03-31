import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Alert, Modal, 
  TextInput, ActivityIndicator, Image, ScrollView,
  SafeAreaView, StatusBar, RefreshControl, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

const BANNER_IMAGE = require('../../assets/images/bus_banner.png');
const PARENT_HERO = require('../../assets/images/parent_hero.png');

export default function DashboardHomeScreen() {
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<'Driver' | 'Parent' | 'Attendant' | 'loading'>('loading');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [systems, setSystems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // Modals
  const [isJoinModalVisible, setIsJoinModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [systemForm, setSystemForm] = useState({ name: '', plateNumber: '', vehicleType: 'Van', maxSeats: '15' });

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('appTheme');
      if (savedTheme) setTheme(savedTheme as 'light' | 'dark');
      else setTheme('dark');

      const driverDataStr = await AsyncStorage.getItem('driverData');
      const parentDataStr = await AsyncStorage.getItem('parentData');
      const attendantDataStr = await AsyncStorage.getItem('attendantData');

      let currentRole: any = 'Parent';
      let currentId = '';
      let currentName = '';

      if (driverDataStr) {
        const data = JSON.parse(driverDataStr);
        currentRole = 'Driver';
        currentId = data.id;
        currentName = data.name;
      } else if (parentDataStr) {
        const data = JSON.parse(parentDataStr);
        currentRole = 'Parent';
        currentId = data.id;
        currentName = data.name;
      } else if (attendantDataStr) {
        const data = JSON.parse(attendantDataStr);
        currentRole = 'Attendant';
        currentId = data.id;
        currentName = data.name;
      }

      setRole(currentRole);
      setUserId(currentId);
      setUserName(currentName);
      if (currentId) {
        fetchSystems(currentRole, currentId);
      } else {
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
    }
  };

  const fetchSystems = async (userRole: string, id: string) => {
    if (!id || userRole === 'loading') return;
    setLoading(true);
    try {
      let endpoint = '';
      if (userRole === 'Driver') endpoint = `/system/driver/${id}`;
      else if (userRole === 'Parent') endpoint = `/system/parent/${id}`;
      else if (userRole === 'Attendant') endpoint = `/system/attendant/${id}`;

      if (!endpoint) {
        setLoading(false);
        return;
      }

      const response = await api.get(endpoint);
      setSystems(response.data.systems || []);
    } catch (error) {
      console.log('Error fetching systems');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    if (role !== 'loading') {
      setRefreshing(true);
      fetchSystems(role, userId);
    }
  };

  const handleJoinSystem = async () => {
    if (!joinCode) return;
    try {
      const endpoint = role === 'Parent' ? '/system/join' : '/system/join-attendant';
      const payload = role === 'Parent' ? { parentId: userId, joinCode } : { attendantId: userId, joinCode };
      
      await api.post(endpoint, payload);
      Alert.alert('Success', 'Successfully joined the system!');
      setIsJoinModalVisible(false);
      setJoinCode('');
      fetchSystems(role, userId);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Could not join system');
    }
  };

  const handleCreateSystem = async () => {
    if (!systemForm.name || !systemForm.plateNumber) {
      Alert.alert('Error', 'Name and Plate Number are required');
      return;
    }
    try {
      await api.post('/system/create', { ...systemForm, driverId: userId });
      Alert.alert('Success', 'System created successfully!');
      setIsCreateModalVisible(false);
      setSystemForm({ name: '', plateNumber: '', vehicleType: 'Van', maxSeats: '15' });
      fetchSystems(role, userId);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Could not create system');
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: async () => {
        await AsyncStorage.multiRemove(['driverToken', 'parentToken', 'attendantToken', 'driverData', 'parentData', 'attendantData']);
        router.replace('/');
      }}
    ]);
  };

  const renderSystemItem = (item: any) => {
    const accentColor = role === 'Parent' ? '#10B981' : role === 'Attendant' ? '#8B5CF6' : '#3B82F6';
    return (
      <TouchableOpacity 
        key={item.id}
        style={[styles.systemCard, { backgroundColor: theme === 'dark' ? '#1E293B' : '#fff' }]}
        onPress={() => router.push({ pathname: '/system', params: { systemId: String(item.id) } } as any)}
      >
        <View style={[styles.systemIcon, { backgroundColor: accentColor + '20' }]}>
          <MaterialCommunityIcons name="bus-school" size={30} color={accentColor} />
        </View>
        <View style={styles.systemInfo}>
          <Text style={[styles.systemName, { color: theme === 'dark' ? '#fff' : '#1E293B' }]}>{item.name}</Text>
          <Text style={styles.systemSubtext}>{item.plate_number} • {item.routes?.name || 'No Route'}</Text>
          {item.driver && <Text style={styles.systemDriver}>Driver: {item.driver.name}</Text>}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#64748B" />
      </TouchableOpacity>
    );
  };

  if (role === 'loading') {
    return (
      <View style={[styles.container, { justifyContent: 'center', backgroundColor: theme === 'dark' ? '#0F172A' : '#f8fafc' }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const isParent = role === 'Parent';
  const isDriver = role === 'Driver';
  const isAttendant = role === 'Attendant';
  const isDark = theme === 'dark';
  const accentColor = isParent ? '#10B981' : isAttendant ? '#8B5CF6' : '#3B82F6';
  const bgColor = isDark ? '#0F172A' : '#F8FAFC';
  const cardColor = isDark ? '#1E293B' : '#FFFFFF';
  const textColor = isDark ? '#F1F5F9' : '#1E293B';
  const subTextColor = isDark ? '#94A3B8' : '#64748B';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={bgColor} />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Section */}
        <View style={styles.banner}>
          <Image source={isParent ? PARENT_HERO : BANNER_IMAGE} style={styles.bannerImg} resizeMode="cover" />
          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerTitle}>{role.toUpperCase()} PORTAL</Text>
            <Text style={styles.bannerText}>School Van Tracking System</Text>
          </View>
        </View>

        {/* Floating Greeting Card */}
        <View style={styles.topCardWrapper}>
          <View style={[styles.headerCard, { backgroundColor: cardColor }]}>
            <View style={styles.headerInfo}>
              <Text style={[styles.welcomeText, { color: subTextColor }]}>Hello,</Text>
              <Text style={[styles.userNameText, { color: textColor }]}>{userName || 'User'}</Text>
              <View style={[styles.roleLabel, { backgroundColor: isParent ? '#E1EFFE' : '#EBF5FF' }]}>
                <Ionicons name={isParent ? "people" : "bus"} size={14} color="#1D4ED8" />
                <Text style={styles.roleLabelText}>{role}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.headerLogoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Grid */}
        <View style={styles.grid}>
          {isParent && (
            <>
              <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/children' as any)}>
                <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
                  <MaterialCommunityIcons name="account-group" size={28} color="#10B981" />
                </View>
                <Text style={[styles.gridLabel, { color: isDark ? '#CBD5E1' : '#475569' }]}>My Children</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.gridItem} onPress={() => setIsJoinModalVisible(true)}>
                <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}>
                  <MaterialCommunityIcons name="plus-circle" size={28} color="#3B82F6" />
                </View>
                <Text style={[styles.gridLabel, { color: isDark ? '#CBD5E1' : '#475569' }]}>Join System</Text>
              </TouchableOpacity>



              <TouchableOpacity style={styles.gridItem} onPress={() => Alert.alert('Pickup Status', 'Live updates available in specific system views.')}>
                <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                  <MaterialCommunityIcons name="map-marker-check" size={28} color="#F59E0B" />
                </View>
                <Text style={[styles.gridLabel, { color: isDark ? '#CBD5E1' : '#475569' }]}>Status</Text>
              </TouchableOpacity>
            </>
          )}

          {isDriver && (
            <TouchableOpacity style={[styles.gridItem, { width: '48%' }]} onPress={() => setIsCreateModalVisible(true)}>
              <View style={[styles.iconBox, { backgroundColor: '#DBEAFE', width: 60, height: 60 }]}>
                <MaterialCommunityIcons name="plus-thick" size={32} color="#3B82F6" />
              </View>
              <Text style={[styles.gridLabel, { color: isDark ? '#CBD5E1' : '#475569', fontSize: 16 }]}>Create System</Text>
            </TouchableOpacity>
          )}

          {isAttendant && (
            <TouchableOpacity style={[styles.gridItem, { width: '48%' }]} onPress={() => setIsJoinModalVisible(true)}>
              <View style={[styles.iconBox, { backgroundColor: '#F3E8FF', width: 60, height: 60 }]}>
                <MaterialCommunityIcons name="van-passenger" size={32} color="#8B5CF6" />
              </View>
              <Text style={[styles.gridLabel, { color: isDark ? '#CBD5E1' : '#475569', fontSize: 16 }]}>Join System</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Systems List */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            {isDriver ? 'Managed Systems' : 'Joined Systems'}
          </Text>
          {loading ? (
            <ActivityIndicator size="small" color={accentColor} style={{ marginTop: 20 }} />
          ) : systems.length > 0 ? (
            systems.map(item => renderSystemItem(item))
          ) : (
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons name="bus-alert" size={48} color="#94A3B8" />
              <Text style={styles.emptyText}>No systems found.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Join Modal */}
      <Modal visible={isJoinModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Join Transportation System</Text>
            <Text style={styles.modalSub}>Enter the 6-character join code provided by your driver.</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: isDark ? '#334155' : '#F8FAFC', color: textColor }]}
              placeholder="Join Code"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
              value={joinCode}
              onChangeText={setJoinCode}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsJoinModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: accentColor }]} onPress={handleJoinSystem}>
                <Text style={styles.actionText}>Join System</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Modal */}
      <Modal visible={isCreateModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Create New System</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: isDark ? '#334155' : '#F8FAFC', color: textColor }]}
              placeholder="System Name"
              placeholderTextColor="#94A3B8"
              value={systemForm.name}
              onChangeText={t => setSystemForm({...systemForm, name: t})}
            />
            <TextInput 
              style={[styles.input, { backgroundColor: isDark ? '#334155' : '#F8FAFC', color: textColor }]}
              placeholder="Plate Number"
              placeholderTextColor="#94A3B8"
              value={systemForm.plateNumber}
              onChangeText={t => setSystemForm({...systemForm, plateNumber: t})}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsCreateModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: accentColor }]} onPress={handleCreateSystem}>
                <Text style={styles.actionText}>Create Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  banner: { height: 200, position: 'relative' },
  bannerImg: { width: '100%', height: '100%' },
  bannerOverlay: { position: 'absolute', bottom: 20, left: 20 },
  bannerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  bannerText: { color: '#fff', fontSize: 14, opacity: 0.8 },
  topCardWrapper: { paddingHorizontal: 20, marginTop: -30, zIndex: 10 },
  headerCard: { borderRadius: 20, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  headerInfo: { flex: 1 },
  welcomeText: { fontSize: 14, fontWeight: '600' },
  userNameText: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  roleLabel: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, gap: 6 },
  roleLabelText: { fontSize: 12, fontWeight: 'bold', color: '#1D4ED8', textTransform: 'uppercase' },
  headerLogoutBtn: { width: 45, height: 45, borderRadius: 15, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 15, gap: 10, justifyContent: 'center', marginTop: 10 },
  gridItem: { width: '46%', aspectRatio: 1.1, backgroundColor: '#fff', borderRadius: 24, alignItems: 'center', justifyContent: 'center', gap: 8, elevation: 1, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10 },
  iconBox: { width: 55, height: 55, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  gridLabel: { fontSize: 14, fontWeight: '700' },
  section: { padding: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  systemCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 20, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  systemIcon: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  systemInfo: { flex: 1, marginLeft: 15 },
  systemName: { fontSize: 16, fontWeight: 'bold' },
  systemSubtext: { fontSize: 12, color: '#94A3B8' },
  systemDriver: { fontSize: 11, color: '#64748B', marginTop: 2 },
  emptyBox: { alignItems: 'center', marginTop: 40, opacity: 0.5 },
  emptyText: { marginTop: 10, color: '#64748B' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { padding: 25, borderRadius: 30 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  modalSub: { fontSize: 14, color: '#64748B', marginBottom: 20 },
  input: { height: 55, borderRadius: 15, paddingHorizontal: 20, marginBottom: 15, fontSize: 16 },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 10 },
  cancelBtn: { flex: 1, height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9' },
  cancelText: { color: '#64748B', fontWeight: 'bold' },
  actionBtn: { flex: 2, height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  actionText: { color: '#fff', fontWeight: 'bold' }
});
