import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, 
  ActivityIndicator, FlatList, Modal, SafeAreaView, StatusBar, Image 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import { supabase } from '../../services/supabase';
import api from '../../services/api';

export default function SystemScreen() {
  const { systemId } = useLocalSearchParams();
  const router = useRouter();
  const [role, setRole] = useState<'Driver' | 'Parent' | 'Attendant' | null>(null);
  const [userId, setUserId] = useState('');
  const [system, setSystem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [parents, setParents] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [allMyChildren, setAllMyChildren] = useState<any[]>([]);
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [isAddChildModalVisible, setIsAddChildModalVisible] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Tracking state (for Parent)
  const [vanLocation, setVanLocation] = useState<any>(null);
  const mapRef = useRef<any>(null);
  const refreshInterval = useRef<any>(null);

  useFocusEffect(
    useCallback(() => {
      loadInitialData();
      return () => {
        if (refreshInterval.current) clearInterval(refreshInterval.current);
      };
    }, [systemId])
  );

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const savedTheme = await AsyncStorage.getItem('appTheme');
      if (savedTheme) setTheme(savedTheme as 'light' | 'dark');

      const driverDataStr = await AsyncStorage.getItem('driverData');
      const parentDataStr = await AsyncStorage.getItem('parentData');
      const attendantDataStr = await AsyncStorage.getItem('attendantData');

      let currentId = '';
      let currentRole: any = 'Parent';

      if (driverDataStr) {
        currentRole = 'Driver';
        currentId = JSON.parse(driverDataStr).id;
      } else if (parentDataStr) {
        currentRole = 'Parent';
        currentId = JSON.parse(parentDataStr).id;
      } else if (attendantDataStr) {
        currentRole = 'Attendant';
        currentId = JSON.parse(attendantDataStr).id;
      }

      setRole(currentRole);
      setUserId(currentId);
      await fetchSystemDetails();
    } catch (error) {
      console.log('Error loading initial data', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemDetails = async () => {
    try {
      const response = await api.get(`/system/${systemId}`);
      const data = response.data.system;
      setSystem(data);

      if (data) {
        fetchSystemStudents(data.id);
        if (role === 'Driver') fetchSystemParents(data.id);
        
        // Setup tracking for parents
        if (role === 'Parent' && data.driver_id) {
          startTracking(data.driver_id);
        }
      }
    } catch (error) {
      console.log('Error fetching system details:', error);
    }
  };

  const fetchSystemStudents = async (id: string) => {
    try {
      const response = await api.get(`/students/system/${id}`);
      setStudents(response.data.students || []);
    } catch (error) {
      console.log('Error fetching students');
    }
  };

  const fetchSystemParents = async (id: string) => {
    try {
      const response = await api.get(`/system/${id}/parents`);
      setParents(response.data.parents || []);
    } catch (error) {
      console.log('Error fetching parents');
    }
  };

  const fetchAllMyChildren = async (pId: string) => {
    try {
      const response = await api.get(`/students/parent/${pId}`);
      setAllMyChildren(response.data.students || []);
    } catch (error) {
      console.log('Error fetching my children');
    }
  };

  const handleLinkChildren = async () => {
    if (selectedChildren.length === 0) return;
    try {
      setLoading(true);
      for (const childId of selectedChildren) {
        await api.put(`/students/${childId}`, { systemId });
      }
      Alert.alert('Success', 'Children successfully added to the system!');
      setIsAddChildModalVisible(false);
      setSelectedChildren([]);
      fetchSystemStudents(systemId as string);
    } catch (error) {
      Alert.alert('Error', 'Could not link children to system');
    } finally {
      setLoading(false);
    }
  };

  const toggleChildSelection = (id: string) => {
    setSelectedChildren(prev => 
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const startTracking = (driverId: string) => {
    if (refreshInterval.current) clearInterval(refreshInterval.current);
    fetchDriverLocation(driverId);
    refreshInterval.current = setInterval(() => fetchDriverLocation(driverId), 10000);
  };

  const fetchDriverLocation = async (driverId: string) => {
    try {
      const { data, error } = await supabase
        .from('transportation_systems')
        .select('current_lat, current_lng')
        .eq('driver_id', driverId)
        .single();

      if (!error && data?.current_lat && data?.current_lng) {
        const lat = parseFloat(data.current_lat);
        const lng = parseFloat(data.current_lng);
        setVanLocation({ latitude: lat, longitude: lng });
        mapRef.current?.animateToRegion({ 
          latitude: lat, 
          longitude: lng, 
          latitudeDelta: 0.005, 
          longitudeDelta: 0.005 
        });
      }
    } catch (err) {
      console.log('Error fetching location');
    }
  };

  const sendAlert = async (type: string, message: string) => {
    try {
      await api.post(`/driver/alert`, { 
        driverId: userId, 
        systemId: system.id, 
        alertType: type, 
        message 
      });
      Alert.alert('Alert Sent', `Notification for "${type}" sent to parents.`);
    } catch (error) {
      Alert.alert('Error', 'Could not send alert');
    }
  };

  const togglePresence = async () => {
    try {
      const newStatus = !system.attendant?.is_present;
      await api.put(`/system/attendant/${userId}/presence`, { isPresent: newStatus });
      setSystem({ ...system, attendant: { ...system.attendant, is_present: newStatus } });
      Alert.alert('Success', `Status updated to ${newStatus ? 'PRESENT' : 'NOT PRESENT'}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update presence');
    }
  };

  if (loading || !system) {
    return (
      <View style={[styles.centered, { backgroundColor: theme === 'dark' ? '#0F172A' : '#F8FAFC' }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const isDriver = role === 'Driver';
  const isParent = role === 'Parent';
  const isAttendant = role === 'Attendant';
  const accentColor = isParent ? '#10B981' : isAttendant ? '#8B5CF6' : '#3B82F6';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme === 'dark' ? '#0F172A' : '#F8FAFC' }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme === 'dark' ? '#fff' : '#1E293B'} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: theme === 'dark' ? '#fff' : '#1E293B' }]}>{system.name}</Text>
          <Text style={styles.headerSub}>{system.plate_number}</Text>
        </View>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* System Info Card */}
        <View style={[styles.card, { backgroundColor: theme === 'dark' ? '#1E293B' : '#fff' }]}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="bus-side" size={20} color={accentColor} />
            <Text style={[styles.infoText, { color: theme === 'dark' ? '#CBD5E1' : '#475569' }]}>
              {system.vehicle_type} • {system.max_seats} Seats
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker-path" size={20} color={accentColor} />
            <Text style={[styles.infoText, { color: theme === 'dark' ? '#CBD5E1' : '#475569' }]}>
              Route: {system.routes?.name || 'Standard Route'}
            </Text>
          </View>
          {isDriver && (
            <View style={styles.joinCodeBox}>
              <Text style={styles.joinCodeLabel}>Join Code for Parents:</Text>
              <Text style={[styles.joinCodeText, { color: accentColor }]}>{system.join_code}</Text>
            </View>
          )}
        </View>

        {/* QUICK ALERTS (Driver/Attendant Only) */}
        {(isDriver || isAttendant) && (
          <View style={[styles.card, { backgroundColor: theme === 'dark' ? '#1E293B' : '#fff' }]}>
            <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#fff' : '#1E293B' }]}>Quick Alerts</Text>
            <View style={styles.alertGrid}>
              <TouchableOpacity style={[styles.alertBtn, { backgroundColor: '#FFF7ED' }]} onPress={() => sendAlert('Delay', 'System is delayed.')}>
                <Ionicons name="time" size={24} color="#C2410C" />
                <Text style={styles.alertBtnText}>Delay</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.alertBtn, { backgroundColor: '#FEF2F2' }]} onPress={() => sendAlert('Emergency', 'Emergency / Breakdown.')}>
                <Ionicons name="warning" size={24} color="#B91C1C" />
                <Text style={styles.alertBtnText}>Alert</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.alertBtn, { backgroundColor: '#F0FDFA' }]} onPress={() => sendAlert('Boarded', 'All students boarded.')}>
                <Ionicons name="checkmark-circle" size={24} color="#0D9488" />
                <Text style={styles.alertBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ATTENDANT STATUS (Driver Only Sees, Attendant Toggles) */}
        {isAttendant && (
          <TouchableOpacity 
            style={[styles.presenceBtn, { backgroundColor: system.attendant?.is_present ? '#10B981' : '#EF4444' }]} 
            onPress={togglePresence}
          >
            <Ionicons name={system.attendant?.is_present ? "checkmark-done" : "close"} size={22} color="#fff" />
            <Text style={styles.presenceBtnText}>
              Status: {system.attendant?.is_present ? 'PRESENT ON VEHICLE' : 'NOT PRESENT'}
            </Text>
          </TouchableOpacity>
        )}

        {/* TRACKING SECTION (Parent Only) */}
        {isParent && (
          <View style={[styles.card, { backgroundColor: theme === 'dark' ? '#1E293B' : '#fff', padding: 0, overflow: 'hidden' }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#fff' : '#1E293B' }]}>Live Location</Text>
              <View style={styles.liveBadge}>
                <View style={[styles.liveDot, { backgroundColor: vanLocation ? '#10B981' : '#94A3B8' }]} />
                <Text style={styles.liveText}>{vanLocation ? 'LIVE' : 'OFFLINE'}</Text>
              </View>
            </View>
            <View style={styles.mapWrap}>
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={{
                  latitude: 6.9271,
                  longitude: 79.8612,
                  latitudeDelta: 0.1,
                  longitudeDelta: 0.1
                }}
              >
                {vanLocation && (
                  <Marker coordinate={vanLocation}>
                    <View style={styles.marker}>
                      <MaterialCommunityIcons name="bus-school" size={22} color="#fff" />
                    </View>
                  </Marker>
                )}
              </MapView>
            </View>
          </View>
        )}

        {/* STUDENTS LIST */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#fff' : '#1E293B' }]}>
            Students {isParent && ' (My Children)'}
          </Text>
          <View style={styles.countBadge}><Text style={styles.countText}>{students.length}</Text></View>
          {isParent && (
            <TouchableOpacity 
              style={[styles.addInlineBtn, { borderColor: accentColor }]}
              onPress={() => { fetchAllMyChildren(userId); setIsAddChildModalVisible(true); }}
            >
              <Ionicons name="add-circle" size={20} color={accentColor} />
              <Text style={[styles.addInlineText, { color: accentColor }]}>Add Child</Text>
            </TouchableOpacity>
          )}
        </View>

        {students.length > 0 ? (
          students.map(s => (
            <View key={s.id} style={[styles.studentCard, { backgroundColor: theme === 'dark' ? '#1E293B' : '#fff' }]}>
              <View style={styles.studentInfo}>
                <Text style={[styles.studentName, { color: theme === 'dark' ? '#fff' : '#1E293B' }]}>{s.name}</Text>
                <Text style={styles.studentSub}>{s.school} • Grade {s.grade}</Text>
                <Text style={styles.studentLoc}>P: {s.pickup_location || 'N/A'}</Text>
                <Text style={styles.studentLoc}>D: {s.dropoff_location || 'N/A'}</Text>
              </View>
              {isDriver && (
                <TouchableOpacity onPress={() => Alert.alert('History', 'Student tracking history feature coming soon.')}>
                  <Ionicons name="time-outline" size={22} color="#64748B" />
                </TouchableOpacity>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No students registered in this system.</Text>
        )}

        {/* Tracking Action (Driver Only) */}
        {isDriver && (
          <TouchableOpacity 
            style={[styles.mainActionBtn, { backgroundColor: accentColor }]}
            onPress={() => router.push({ pathname: '/map', params: { systemId: system.id } })}
          >
            <Ionicons name="navigate" size={24} color="#fff" />
            <Text style={styles.mainActionBtnText}>Enter Tracking Mode</Text>
          </TouchableOpacity>
        )}

      </ScrollView>

      {/* MULTI-CHILD SELECTION MODAL */}
      <Modal visible={isAddChildModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme === 'dark' ? '#1E293B' : '#fff' }]}>
            <Text style={[styles.modalTitle, { color: theme === 'dark' ? '#fff' : '#1E293B' }]}>Select Children to Add</Text>
            <Text style={styles.modalSub}>Link your registered children to this system.</Text>
            
            <View style={styles.selectionList}>
              {allMyChildren.length > 0 ? (
                allMyChildren.map(child => {
                  const isSelected = selectedChildren.includes(child.id);
                  const isAlreadyInSystem = child.system_id === systemId;
                  
                  return (
                    <TouchableOpacity 
                      key={child.id} 
                      style={[styles.selectionItem, isSelected && styles.selectionItemSelected]}
                      onPress={() => !isAlreadyInSystem && toggleChildSelection(child.id)}
                      disabled={isAlreadyInSystem}
                    >
                      <View style={styles.selectionCheck}>
                        <Ionicons 
                          name={isAlreadyInSystem ? "checkmark-circle" : (isSelected ? "checkbox" : "square-outline")} 
                          size={24} 
                          color={isAlreadyInSystem ? "#94A3B8" : (isSelected ? accentColor : "#64748B")} 
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.selectionName, { color: theme === 'dark' ? '#fff' : '#1E293B' }]}>{child.name}</Text>
                        <Text style={styles.selectionSub}>
                          {isAlreadyInSystem ? "Already in this system" : (child.system_id ? "Currently in another system" : "Not linked to any system")}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.emptySelection}>
                  <Text style={styles.emptyText}>No children found. Go to "My Children" to register them first.</Text>
                </View>
              )}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsAddChildModalVisible(false)}>
                <Text style={styles.cancelLink}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: accentColor, opacity: selectedChildren.length > 0 ? 1 : 0.5 }]} 
                disabled={selectedChildren.length === 0}
                onPress={handleLinkChildren}
              >
                <Text style={styles.btnTextLong}>Add {selectedChildren.length} Child(ren)</Text>
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: 50,
    paddingBottom: 15
  },
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  headerSub: { fontSize: 12, color: '#94A3B8' },
  headerPlaceholder: { width: 40 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  scroll: { padding: 20, paddingBottom: 60 },
  card: { borderRadius: 24, padding: 20, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  infoText: { fontSize: 15, fontWeight: '600' },
  joinCodeBox: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F1F5F9', alignItems: 'center' },
  joinCodeLabel: { fontSize: 12, color: '#94A3B8', marginBottom: 4 },
  joinCodeText: { fontSize: 24, fontWeight: '900', letterSpacing: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 15 },
  alertGrid: { flexDirection: 'row', gap: 10 },
  alertBtn: { flex: 1, height: 80, borderRadius: 20, justifyContent: 'center', alignItems: 'center', gap: 4 },
  alertBtnText: { fontSize: 11, fontWeight: 'bold', color: '#1E293B' },
  presenceBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18, borderRadius: 20, marginBottom: 15 },
  presenceBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  mapWrap: { height: 250, width: '100%' },
  map: { flex: 1 },
  marker: { backgroundColor: '#10B981', padding: 8, borderRadius: 20, borderWidth: 2, borderColor: '#fff' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveText: { fontSize: 10, fontWeight: 'bold', color: '#64748B' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, marginBottom: 15 },
  countBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  countText: { fontSize: 12, fontWeight: 'bold', color: '#64748B' },
  studentCard: { padding: 20, borderRadius: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 10, elevation: 1 },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 16, fontWeight: 'bold' },
  studentSub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  studentLoc: { fontSize: 11, color: '#64748B', marginTop: 1 },
  emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: 10, fontStyle: 'italic' },
  mainActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, height: 60, borderRadius: 20, marginTop: 20 },
  mainActionBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  addInlineBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginLeft: 'auto' },
  addInlineText: { fontSize: 13, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  modalSub: { color: '#94A3B8', fontSize: 13, marginBottom: 20, marginTop: 4 },
  selectionList: { marginBottom: 20 },
  selectionItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 16, marginBottom: 8, borderWidth: 1, borderColor: 'transparent' },
  selectionItemSelected: { backgroundColor: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)' },
  selectionCheck: { marginRight: 15 },
  selectionName: { fontSize: 16, fontWeight: 'bold' },
  selectionSub: { fontSize: 12, color: '#94A3B8' },
  modalButtons: { flexDirection: 'row', gap: 15, marginTop: 10, marginBottom: 30 },
  cancelBtn: { flex: 1, height: 55, justifyContent: 'center', alignItems: 'center' },
  cancelLink: { color: '#64748B', fontWeight: 'bold' },
  actionBtn: { flex: 2, height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  btnTextLong: { color: '#fff', fontWeight: 'bold' },
  emptySelection: { padding: 40, alignItems: 'center' }
});
