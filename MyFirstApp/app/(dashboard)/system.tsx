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
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isStudentModalVisible, setIsStudentModalVisible] = useState(false);
  const [studentActivities, setStudentActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

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

  const handleLinkChildren = async (pRole?: string, pId?: string) => {
    if (selectedChildren.length === 0) return;
    try {
      setLoading(true);
      for (const childId of selectedChildren) {
        await api.put(`/students/${childId}`, { systemId, role: pRole || role, userId: pId || userId });
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

  const handleRemoveParent = async (targetParentId: string) => {
    const isSelf = targetParentId === userId;
    Alert.alert(
      isSelf ? "Leave System" : "Remove Parent",
      `Are you sure you want to ${isSelf ? 'leave' : 'remove this parent from'} the system?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: isSelf ? "Leave" : "Remove", 
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await api.delete(`/system/${systemId}/parents/${targetParentId}?role=${role}&userId=${userId}`);
              Alert.alert('Success', isSelf ? 'You have left the system' : 'Parent removed');
              if (isSelf) router.replace('/home' as any);
              else fetchSystemParents(systemId as string);
            } catch (error) {
              Alert.alert('Error', 'Could not complete the action');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
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
    if (isAttendant && !system.attendant?.has_control) {
      Alert.alert('Access Denied', 'You do not have full control of the system. Please ask the driver.');
      return;
    }
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

  const handleStudentClick = async (student: any) => {
    setSelectedStudent(student);
    setIsStudentModalVisible(true);
    fetchStudentActivities(student.id);
  };

  const fetchStudentActivities = async (studentId: string) => {
    try {
      setLoadingActivities(true);
      const response = await api.get(`/attendance/${studentId}`, {
        params: { userId, role }
      });
      setStudentActivities(response.data.activities || []);
    } catch (error) {
      console.log('Error fetching activities');
      setStudentActivities([]); // Clear on error
    } finally {
      setLoadingActivities(false);
    }
  };

  const markAttendance = async (studentId: string, type: 'pickup' | 'dropoff') => {
    if (isAttendant && !system.attendant?.has_control) {
      Alert.alert('Access Denied', 'You do not have full control of the system. Please ask the driver.');
      return;
    }
    try {
      setLoading(true);
      await api.post('/attendance/mark', { studentId, type, systemId });
      Alert.alert('Success', `Student marked as ${type === 'pickup' ? 'Picked Up' : 'Dropped Off'}`);
      fetchStudentActivities(studentId);
    } catch (error) {
      Alert.alert('Error', 'Could not mark attendance');
    } finally {
      setLoading(false);
    }
  };

  const removeStudentFromSystem = async (studentId: string) => {
    Alert.alert(
      "Remove Student",
      "Are you sure you want to remove this student from the system?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await api.put(`/students/${studentId}`, { systemId: null, role, userId });
              Alert.alert('Success', 'Student removed from system');
              setIsStudentModalVisible(false);
              fetchSystemStudents(systemId as string);
            } catch (error) {
              Alert.alert('Error', 'Could not remove student');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const parentsWithoutStudents = parents.filter(p => 
    !students.some(s => s.parent_id === p.parent_id)
  );

  const handleToggleControl = async () => {
    if (!system.attendant) return;
    try {
      const newControlStatus = !system.attendant.has_control;
      setLoading(true);
      await api.put(`/system/attendant/${system.attendant.id}/control`, { hasControl: newControlStatus });
      await fetchSystemDetails();
      Alert.alert('Success', `Full Control ${newControlStatus ? 'Granted' : 'Revoked'}`);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Could not update control status');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActivityAccess = async () => {
    if (!system.attendant) return;
    try {
      const newAccessStatus = !system.attendant.can_view_activities;
      setLoading(true);
      await api.put(`/system/attendant/${system.attendant.id}/activities-access`, { canViewActivities: newAccessStatus });
      await fetchSystemDetails();
      Alert.alert('Success', `Activity Access ${newAccessStatus ? 'Granted' : 'Revoked'}`);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Could not update activity access');
    } finally {
      setLoading(false);
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

          {/* MANAGE ROUTE MAP (Driver Only) */}
          {isDriver && (
            <TouchableOpacity 
              style={[styles.manageRouteBtn, { backgroundColor: accentColor + '10', borderColor: accentColor }]}
              onPress={() => router.push({ pathname: '/route-picker', params: { systemId: system.id } })}
            >
              <MaterialCommunityIcons name="map-marker-path" size={20} color={accentColor} />
              <Text style={[styles.manageRouteBtnText, { color: accentColor }]}>
                {system.start_lat ? 'Edit Route Map' : 'Setup Route Map'}
              </Text>
            </TouchableOpacity>
          )}

          {isDriver && (
            <View style={styles.joinCodeBox}>
              <Text style={styles.joinCodeLabel}>Join Code for Parents:</Text>
              <Text style={[styles.joinCodeText, { color: accentColor }]}>{system.join_code}</Text>
            </View>
          )}

          {/* DRIVER & VEHICLE DETAILS (For Parents/Attendants) */}
          {(isParent || isAttendant) && (
            <View style={styles.detailsList}>
              <View style={styles.detailRow}>
                <Ionicons name="person" size={18} color={accentColor} />
                <View style={styles.detailTextCol}>
                  <Text style={styles.detailLabel}>Driver</Text>
                  <Text style={[styles.detailValue, { color: theme === 'dark' ? '#fff' : '#1E293B' }]}>{system.driver?.name || 'N/A'}</Text>
                  {system.driver?.phone && <Text style={styles.detailSubValue}>{system.driver.phone}</Text>}
                </View>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="bus" size={18} color={accentColor} />
                <View style={styles.detailTextCol}>
                  <Text style={styles.detailLabel}>Vehicle</Text>
                  <Text style={[styles.detailValue, { color: theme === 'dark' ? '#fff' : '#1E293B' }]}>
                    {system.vehicle?.plate_number || system.plate_number}
                  </Text>
                  <Text style={styles.detailSubValue}>
                    {system.vehicle?.model || system.vehicle_type} 
                    {system.vehicle?.color ? ` • ${system.vehicle.color}` : ''}
                  </Text>
                </View>
              </View>

              {system.attendant && (
                <View style={[styles.detailRow, { marginTop: 15 }]}>
                  <Ionicons name="id-card" size={18} color={accentColor} />
                  <View style={styles.detailTextCol}>
                    <Text style={styles.detailLabel}>Attendant</Text>
                    <Text style={[styles.detailValue, { color: theme === 'dark' ? '#fff' : '#1E293B' }]}>{system.attendant.name}</Text>
                    <Text style={styles.detailSubValue}>{system.attendant.email}</Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
        
        {/* ATTENDANT MANAGEMENT (Driver Only) */}
        {isDriver && system.attendant && (
          <View style={[styles.card, { backgroundColor: theme === 'dark' ? '#1E293B' : '#fff' }]}>
            <View style={styles.cardHeaderSmall}>
              <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#fff' : '#1E293B', marginBottom: 0 }]}>Attendant Status</Text>
              <View style={[styles.presenceBadge, { backgroundColor: system.attendant.is_present ? '#DCFCE7' : '#FEE2E2' }]}>
                <Text style={[styles.presenceText, { color: system.attendant.is_present ? '#166534' : '#991B1B' }]}>
                  {system.attendant.is_present ? 'PRESENT' : 'NOT PRESENT'}
                </Text>
              </View>
            </View>
            <View style={styles.attendantInfoRow}>
              <View style={styles.attendantMain}>
                <Text style={[styles.attendantNameLabel, { color: theme === 'dark' ? '#fff' : '#1E293B' }]}>{system.attendant.name}</Text>
                <Text style={styles.attendantEmailLabel}>{system.attendant.email}</Text>
              </View>
              <View style={styles.controlToggleContainer}>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>Full Control</Text>
                  <TouchableOpacity 
                    onPress={handleToggleControl}
                    disabled={!system.attendant.is_present}
                    style={[
                      styles.toggleSwitch, 
                      { backgroundColor: system.attendant.has_control ? '#3B82F6' : '#94A3B8' },
                      !system.attendant.is_present && { opacity: 0.5 }
                    ]}
                  >
                    <View style={[styles.toggleThumb, { marginLeft: system.attendant.has_control ? 22 : 2 }]} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.toggleRow, { marginTop: 10 }]}>
                  <Text style={styles.toggleLabel}>View Activities</Text>
                  <TouchableOpacity 
                    onPress={handleToggleActivityAccess}
                    style={[
                      styles.toggleSwitch, 
                      { backgroundColor: system.attendant.can_view_activities ? '#8B5CF6' : '#94A3B8' }
                    ]}
                  >
                    <View style={[styles.toggleThumb, { marginLeft: system.attendant.can_view_activities ? 22 : 2 }]} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            {!system.attendant.is_present && (
              <Text style={styles.presenceWarning}>Control can only be granted when attendant is present.</Text>
            )}
          </View>
        )}

        {/* ATTENDANT STATUS (Attendant Only) */}
        {isAttendant && (
          <View style={[styles.card, { backgroundColor: theme === 'dark' ? '#1E293B' : '#fff' }]}>
            <View style={styles.statusHeader}>
              <MaterialCommunityIcons 
                name={system.attendant?.has_control ? "shield-check" : "shield-alert"} 
                size={24} 
                color={system.attendant?.has_control ? "#3B82F6" : "#F59E0B"} 
              />
              <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#fff' : '#1E293B', marginBottom: 0, marginLeft: 10 }]}>
                System Access
              </Text>
            </View>
            <View style={[styles.controlStatusBox, { backgroundColor: system.attendant?.has_control ? '#EFF6FF' : '#FFFBEB' }]}>
              <Text style={[styles.controlStatusText, { color: system.attendant?.has_control ? '#1E40AF' : '#92400E' }]}>
                {system.attendant?.has_control 
                  ? "FULL CONTROL: You can mark attendance and send alerts." 
                  : "READ-ONLY: Please wait for the driver to grant control."}
              </Text>
            </View>
            <View style={[styles.controlStatusBox, { backgroundColor: system.attendant?.can_view_activities ? '#F5F3FF' : '#F9FAFB', marginTop: 8 }]}>
              <Text style={[styles.controlStatusText, { color: system.attendant?.can_view_activities ? '#5B21B6' : '#4B5563' }]}>
                {system.attendant?.can_view_activities 
                  ? "ACTIVITY ACCESS: You can view student activity history." 
                  : "NO ACTIVITY ACCESS: You cannot see student activity history."}
              </Text>
            </View>
          </View>
        )}

        {/* QUICK ALERTS (Driver/Attendant Only) */}
        {(isDriver || isAttendant) && (
          <View style={[styles.card, { backgroundColor: theme === 'dark' ? '#1E293B' : '#fff' }]}>
            <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#fff' : '#1E293B' }]}>Quick Alerts</Text>
            <View style={[styles.alertGrid, isAttendant && !system.attendant?.has_control && { opacity: 0.5 }]}>
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
                {system.start_lat && (
                  <Marker 
                    coordinate={{ latitude: parseFloat(system.start_lat), longitude: parseFloat(system.start_lng) }}
                    title="Start: {system.start_location_name}"
                    pinColor="#3B82F6"
                  />
                )}
                {system.end_lat && (
                  <Marker 
                    coordinate={{ latitude: parseFloat(system.end_lat), longitude: parseFloat(system.end_lng) }}
                    title="End: {system.end_location_name}"
                    pinColor="#EF4444"
                  />
                )}
              </MapView>
            </View>
          </View>
        )}

        {/* ROUTE INFO CARD (Visible if set) */}
        {system.start_lat && (
          <View style={[styles.card, { backgroundColor: theme === 'dark' ? '#1E293B' : '#fff' }]}>
            <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#fff' : '#1E293B' }]}>Route Points</Text>
            <View style={styles.routeSummary}>
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, { backgroundColor: '#3B82F6' }]} />
                <View>
                  <Text style={styles.routePointLabel}>START</Text>
                  <Text style={[styles.routePointValue, { color: theme === 'dark' ? '#fff' : '#1E293B' }]}>{system.start_location_name}</Text>
                </View>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, { backgroundColor: '#EF4444' }]} />
                <View>
                  <Text style={styles.routePointLabel}>END</Text>
                  <Text style={[styles.routePointValue, { color: theme === 'dark' ? '#fff' : '#1E293B' }]}>{system.end_location_name}</Text>
                </View>
              </View>
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
            <TouchableOpacity 
              key={s.id} 
              style={[styles.studentCard, { backgroundColor: theme === 'dark' ? '#1E293B' : '#fff' }]}
              onPress={() => handleStudentClick(s)}
            >
              <View style={styles.studentInfo}>
                <Text style={[styles.studentName, { color: theme === 'dark' ? '#fff' : '#1E293B' }]}>{s.name}</Text>
                <Text style={styles.studentSub}>{s.school} • Grade {s.grade}</Text>
                <Text style={styles.studentLoc}>P: {s.pickup_location || 'N/A'}</Text>
                <Text style={styles.studentLoc}>D: {s.dropoff_location || 'N/A'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#64748B" />
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No students registered in this system.</Text>
        )}

        {/* PARENTS WITHOUT STUDENTS (Driver/Attendant Only) */}
        {(isDriver || isAttendant) && parentsWithoutStudents.length > 0 && (
          <View style={{ marginTop: 25 }}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#fff' : '#1E293B' }]}>Parents Pending Students</Text>
              <View style={styles.countBadge}><Text style={styles.countText}>{parentsWithoutStudents.length}</Text></View>
            </View>
            {parentsWithoutStudents.map(p => (
              <View key={p.parent_id} style={[styles.parentCard, { backgroundColor: theme === 'dark' ? '#1E293B' : '#fff' }]}>
                <MaterialCommunityIcons name="account-alert" size={24} color="#F59E0B" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.parentName, { color: theme === 'dark' ? '#fff' : '#1E293B' }]}>{p.users?.name}</Text>
                  <Text style={styles.parentEmail}>{p.users?.email}</Text>
                </View>
                <TouchableOpacity 
                   style={styles.removeParentBtnSmall} 
                   onPress={() => handleRemoveParent(p.parent_id)}
                >
                  <Ionicons name="person-remove" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* LEAVE SYSTEM (Parent Only) */}
        {isParent && (
          <TouchableOpacity 
            style={[styles.leaveBtn, { borderColor: '#EF4444' }]} 
            onPress={() => handleRemoveParent(userId)}
          >
            <Ionicons name="exit-outline" size={20} color="#EF4444" />
            <Text style={styles.leaveBtnText}>Leave This System</Text>
          </TouchableOpacity>
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

      {/* STUDENT DETAILS MODAL */}
      <Modal visible={isStudentModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.studentModalContent, { backgroundColor: theme === 'dark' ? '#1E293B' : '#fff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme === 'dark' ? '#fff' : '#1E293B' }]}>Student Details</Text>
              <TouchableOpacity onPress={() => setIsStudentModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color={theme === 'dark' ? '#fff' : '#1E293B'} />
              </TouchableOpacity>
            </View>

            {selectedStudent && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                  <View style={[styles.profileAvatar, { backgroundColor: accentColor }]}>
                    <Text style={styles.avatarText}>{selectedStudent.name.charAt(0)}</Text>
                  </View>
                  <Text style={[styles.detailName, { color: theme === 'dark' ? '#fff' : '#1E293B' }]}>{selectedStudent.name}</Text>
                  <Text style={styles.detailSub}>{selectedStudent.school} • Grade {selectedStudent.grade}</Text>
                </View>

                {/* Parent Info (For Driver/Attendant) */}
                {(isDriver || isAttendant) && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Parent Information</Text>
                    <View style={styles.detailCard}>
                      <Ionicons name="person-circle-outline" size={20} color={accentColor} />
                      <Text style={[styles.detailValue, { color: theme === 'dark' ? '#fff' : '#1E293B' }]}>
                        {selectedStudent.parent_name || 'Not Available'}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Attendance Actions (For Driver/Attendant) */}
                {(isDriver || isAttendant) && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Mark Today's Attendance</Text>
                    <View style={[styles.actionGrid, isAttendant && !system.attendant?.has_control && { opacity: 0.5 }]}>
                      <TouchableOpacity 
                        style={[styles.actionBtnSmall, { backgroundColor: '#10B98120', borderColor: '#10B981' }]} 
                        onPress={() => markAttendance(selectedStudent.id, 'pickup')}
                      >
                        <MaterialCommunityIcons name="bus-side" size={20} color="#10B981" />
                        <Text style={[styles.actionBtnText, { color: '#10B981' }]}>Mark Pickup</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionBtnSmall, { backgroundColor: '#EF444420', borderColor: '#EF4444' }]} 
                        onPress={() => markAttendance(selectedStudent.id, 'dropoff')}
                      >
                        <MaterialCommunityIcons name="bus-stop" size={20} color="#EF4444" />
                        <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Mark Dropoff</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Activity History (Last 7 Days) */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Activity History (Last 7 Days)</Text>
                  {isAttendant && !system.attendant?.can_view_activities ? (
                    <View style={styles.lockedSection}>
                      <Ionicons name="lock-closed" size={24} color="#94A3B8" />
                      <Text style={styles.lockedText}>Access restricted by driver.</Text>
                    </View>
                  ) : loadingActivities ? (
                    <ActivityIndicator size="small" color={accentColor} />
                  ) : studentActivities.length > 0 ? (
                    studentActivities.map((act, idx) => (
                      <View key={idx} style={styles.activityRow}>
                        <View style={styles.activityDot} />
                        <View style={styles.activityInfo}>
                          <Text style={[styles.activityDate, { color: theme === 'dark' ? '#CBD5E1' : '#475569' }]}>
                            {new Date(act.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                          </Text>
                          <View style={styles.activityBadges}>
                            {act.pickup && <View style={[styles.statusBadge, { backgroundColor: '#10B98120' }]}><Text style={{ color: '#059669', fontSize: 10, fontWeight: 'bold' }}>PICKED UP</Text></View>}
                            {act.drop_off && <View style={[styles.statusBadge, { backgroundColor: '#3B82F620' }]}><Text style={{ color: '#2563EB', fontSize: 10, fontWeight: 'bold' }}>DROPPED OFF</Text></View>}
                          </View>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyTextSmall}>No activities recorded recently.</Text>
                  )}
                </View>

                {/* Dangerous Action */}
                <TouchableOpacity 
                  style={styles.removeBtn} 
                  onPress={() => removeStudentFromSystem(selectedStudent.id)}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  <Text style={styles.removeBtnText}>Remove Student from System</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

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
                onPress={() => handleLinkChildren(role as string, userId)}
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
  detailSubValue: { fontSize: 12, color: '#64748B' },
  detailsList: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(148, 163, 184, 0.1)' },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  detailTextCol: { flex: 1 },
  detailLabel: { fontSize: 10, fontWeight: 'bold', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 2 },
  detailValue: { fontSize: 14, fontWeight: 'bold' },
  detailCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderRadius: 16, backgroundColor: 'rgba(148, 163, 184, 0.1)' },
  lockedSection: { alignItems: 'center', padding: 20, gap: 8 },
  lockedText: { color: '#94A3B8', fontSize: 13, fontStyle: 'italic' },
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
  emptySelection: { padding: 40, alignItems: 'center' },
  // New Styles
  studentModalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, height: '90%', marginTop: 'auto' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalCloseBtn: { padding: 5 },
  profileHeader: { alignItems: 'center', marginBottom: 25 },
  profileAvatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  detailName: { fontSize: 22, fontWeight: 'bold' },
  detailSub: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
  detailSection: { marginBottom: 25 },
  detailLabelLarge: { fontSize: 13, fontWeight: 'bold', color: '#94A3B8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  detailValueLarge: { fontSize: 16, fontWeight: '600' },
  actionGrid: { flexDirection: 'row', gap: 12 },
  actionBtnSmall: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 15, borderRadius: 16, borderWidth: 1 },
  actionBtnText: { fontSize: 13, fontWeight: 'bold' },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 15 },
  activityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6', marginTop: 6 },
  activityInfo: { flex: 1, marginLeft: 15 },
  activityDate: { fontSize: 13, fontWeight: '600' },
  activityBadges: { flexDirection: 'row', gap: 6, marginTop: 4 },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  removeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, padding: 15, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  removeBtnText: { color: '#EF4444', fontWeight: 'bold' },
  emptyTextSmall: { fontSize: 13, color: '#94A3B8', fontStyle: 'italic' },
  parentCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 20, marginBottom: 10, elevation: 1 },
  parentName: { fontSize: 15, fontWeight: 'bold' },
  parentEmail: { fontSize: 12, color: '#94A3B8' },
  pendingBadge: { fontSize: 10, fontWeight: '900', color: '#F59E0B', backgroundColor: '#F59E0B20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  // New Attendant Management Styles
  cardHeaderSmall: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  presenceBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  presenceText: { fontSize: 10, fontWeight: 'bold' },
  attendantInfoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(148, 163, 184, 0.1)' },
  attendantMain: { flex: 1 },
  attendantNameLabel: { fontSize: 16, fontWeight: 'bold' },
  attendantEmailLabel: { fontSize: 12, color: '#94A3B8' },
  controlToggleContainer: { alignItems: 'flex-end', justifyContent: 'center' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggleLabel: { fontSize: 10, fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' },
  toggleSwitch: { width: 44, height: 24, borderRadius: 12, padding: 2, justifyContent: 'center' },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  presenceWarning: { fontSize: 11, color: '#EF4444', marginTop: 12, fontStyle: 'italic' },
  statusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  controlStatusBox: { padding: 15, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  controlStatusText: { fontSize: 13, fontWeight: '600', lineHeight: 18, textAlign: 'center' },
  removeParentBtnSmall: { padding: 10 },
  leaveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 15, borderRadius: 20, borderWidth: 1, marginTop: 20 },
  leaveBtnText: { fontWeight: 'bold', fontSize: 14, color: '#EF4444' },
  // New Styles
  manageRouteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, marginTop: 15 },
  manageRouteBtnText: { fontWeight: 'bold', fontSize: 13 },
  routeSummary: { marginLeft: 10 },
  routePoint: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  routeDot: { width: 10, height: 10, borderRadius: 5 },
  routePointLabel: { fontSize: 10, color: '#94A3B8', fontWeight: 'bold' },
  routePointValue: { fontSize: 14, fontWeight: 'bold' },
  routeLine: { width: 2, height: 20, backgroundColor: '#E2E8F0', marginLeft: 4, marginVertical: 4 }
});
