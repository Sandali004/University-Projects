import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, ActivityIndicator, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { supabase } from '../../services/supabase';
import api from '../../services/api';

export default function SystemScreen() {
  const [role, setRole] = useState<'Driver' | 'Parent' | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [system, setSystem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Create System Form State (Driver)
  const [name, setName] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('Van');
  const [maxSeats, setMaxSeats] = useState('');
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Join System State (Parent)
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  // Parents List (Driver)
  const [parents, setParents] = useState<any[]>([]);

  // Parent Map Tracking State
  const [vanLocation, setVanLocation] = useState<any>(null);
  const [mapRegion, setMapRegion] = useState<any>(null);
  const mapRef = useRef<any>(null);
  const refreshInterval = useRef<any>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (role === 'Parent' && system?.driver_id) {
      fetchDriverLocation(system.driver_id);
      refreshInterval.current = setInterval(() => {
        fetchDriverLocation(system.driver_id);
      }, 5000);
    }
    return () => {
      if (refreshInterval.current) clearInterval(refreshInterval.current);
    };
  }, [role, system]);

  const fetchDriverLocation = async (driverId: string) => {
    const { data, error } = await supabase
      .from('vans')
      .select('current_lat, current_lng')
      .eq('driver_id', driverId)
      .single();

    if (!error && data?.current_lat && data?.current_lng) {
      const lat = parseFloat(data.current_lat);
      const lng = parseFloat(data.current_lng);
      setVanLocation({ latitude: lat, longitude: lng });
      setMapRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 });
      mapRef.current?.animateToRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.005, longitudeDelta: 0.005 });
    }
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const driverDataStr = await AsyncStorage.getItem('driverData');
      const parentDataStr = await AsyncStorage.getItem('parentData');

      if (driverDataStr) {
        const data = JSON.parse(driverDataStr);
        setRole('Driver');
        setUserData(data);
        await fetchDriverSystem(data.id);
        await fetchRoutes();
      } else if (parentDataStr) {
        const data = JSON.parse(parentDataStr);
        setRole('Parent');
        setUserData(data);
        await fetchParentSystem(data.id);
      }
    } catch (error) {
      console.log('Error loading initial data', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await api.get('/system/routes');
      setRoutes(response.data.routes || []);
    } catch (error) {
      console.log('Error fetching routes');
    }
  };

  const fetchDriverSystem = async (driverId: string) => {
    try {
      const response = await api.get(`/system/driver/${driverId}`);
      if (response.data.system) {
        setSystem(response.data.system);
        fetchSystemParents(response.data.system.id);
      }
    } catch (error) {
      console.log('Error fetching driver system');
    }
  };

  const fetchSystemParents = async (systemId: string) => {
    try {
      const response = await api.get(`/system/${systemId}/parents`);
      setParents(response.data.parents || []);
    } catch (error) {
      console.log('Error fetching system parents');
    }
  };

  const fetchParentSystem = async (parentId: string) => {
    try {
      const response = await api.get(`/system/parent/${parentId}`);
      setSystem(response.data.system);
    } catch (error) {
      console.log('Error fetching parent system');
    }
  };

  const handleCreateSystem = async () => {
    if (!name || !plateNumber || !maxSeats || !selectedRoute) {
      Alert.alert('Error', 'Please fill all fields.');
      return;
    }

    try {
      setIsCreating(true);
      const payload = {
        driverId: userData.id,
        name,
        plateNumber,
        vehicleType,
        maxSeats,
        routeId: selectedRoute.id
      };
      const response = await api.post('/system/create', payload);
      setSystem(response.data.system);
      Alert.alert('Success', 'Transportation system created!');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Could not create system');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinSystem = async () => {
    if (!joinCode) return;
    try {
      setIsJoining(true);
      const response = await api.post('/system/join', { parentId: userData.id, joinCode });
      Alert.alert('Success', 'Joined system successfully!');
      fetchParentSystem(userData.id);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Invalid join code');
    } finally {
      setIsJoining(false);
    }
  };

  const handleRemoveParent = async (parentId: string) => {
    Alert.alert('Remove Parent', 'Are you sure you want to remove this parent from the system?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/system/${system.id}/parents/${parentId}`);
          setParents(prev => prev.filter(p => p.parent_id !== parentId));
        } catch (error) {
          Alert.alert('Error', 'Could not remove parent');
        }
      }}
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  // --- DRIVER VIEWS ---
  if (role === 'Driver') {
    if (system) {
      return (
        <ScrollView style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{system.name}</Text>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="bus" size={20} color="#64748B" />
              <Text style={styles.infoLabel}>{system.vehicle_type} - {system.plate_number}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="map-marker" size={20} color="#64748B" />
              <Text style={styles.infoLabel}>Route: {system.routes?.name || 'Assigned Route'}</Text>
            </View>
            <View style={styles.codeContainer}>
              <Text style={styles.codeTitle}>Parent Join Code:</Text>
              <Text style={styles.codeText}>{system.join_code}</Text>
              <Text style={styles.codeSub}>Share this code with parents to add them.</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Parents in System</Text>
          {parents.length > 0 ? (
            parents.map((item) => (
              <View key={item.parent_id} style={styles.parentItem}>
                <View>
                  <Text style={styles.parentName}>{item.users.name}</Text>
                  <Text style={styles.parentEmail}>{item.users.email}</Text>
                </View>
                <TouchableOpacity onPress={() => handleRemoveParent(item.parent_id)}>
                  <MaterialCommunityIcons name="account-remove" size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No parents have joined yet.</Text>
          )}
        </ScrollView>
      );
    }

    return (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.title}>Create Transportation System</Text>
        <Text style={styles.subtitle}>Set up your system so parents can join and track you.</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>System Name (e.g., Morning Express)</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="System Name" />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Vehicle Plate Number</Text>
          <TextInput style={styles.input} value={plateNumber} onChangeText={setPlateNumber} placeholder="WP-ABC-1234" />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Vehicle Type</Text>
          <View style={styles.row}>
            {['Van', 'Bus', 'Car'].map(type => (
              <TouchableOpacity 
                key={type} 
                style={[styles.typeButton, vehicleType === type && styles.typeButtonActive]}
                onPress={() => setVehicleType(type)}
              >
                <Text style={[styles.typeButtonText, vehicleType === type && styles.typeButtonTextActive]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Number of Seats</Text>
          <TextInput style={styles.input} value={maxSeats} onChangeText={setMaxSeats} placeholder="e.g., 14" keyboardType="numeric" />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Select Route</Text>
          <View style={styles.routeList}>
            {routes.map(route => (
              <TouchableOpacity 
                key={route.id} 
                style={[styles.routeButton, selectedRoute?.id === route.id && styles.routeButtonActive]}
                onPress={() => setSelectedRoute(route)}
              >
                <Text style={[styles.routeText, selectedRoute?.id === route.id && styles.routeTextActive]}>{route.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleCreateSystem} disabled={isCreating}>
          {isCreating ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Create System</Text>}
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // --- PARENT VIEWS ---
  if (role === 'Parent') {
    if (system) {
      return (
        <ScrollView style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>My Transportation System</Text>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="bus" size={20} color="#3B82F6" />
              <Text style={styles.infoLabel}>System: {system.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="account-tie" size={20} color="#64748B" />
              <Text style={styles.infoLabel}>Vehicle: {system.vehicle_type} ({system.plate_number})</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="map-marker" size={20} color="#64748B" />
              <Text style={styles.infoLabel}>Route: {system.routes?.name || 'Main Route'}</Text>
            </View>
          </View>
          
          <Text style={styles.sectionTitle}>Live Tracking</Text>
          <View style={styles.mapContainer}>
            {mapRegion ? (
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={mapRegion}
                showsUserLocation={false}
              >
                {vanLocation && (
                  <Marker coordinate={vanLocation} title="School Van" description="Live location">
                    <View style={styles.markerContainer}>
                      <MaterialCommunityIcons name="van-passenger" size={24} color="#F59E0B" />
                    </View>
                  </Marker>
                )}
              </MapView>
            ) : (
              <View style={styles.mapPlaceholder}>
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text style={styles.mapPlaceholderText}>Waiting for driver location...</Text>
              </View>
            )}
          </View>
        </ScrollView>
      );
    }

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Join a System</Text>
        <Text style={styles.subtitle}>Enter the 6-character code provided by your driver.</Text>
        <TextInput 
          style={[styles.input, styles.codeInput]} 
          value={joinCode} 
          onChangeText={setJoinCode} 
          placeholder="ABCDEF"
          autoCapitalize="characters"
          maxLength={6}
        />
        <TouchableOpacity style={styles.submitButton} onPress={handleJoinSystem} disabled={isJoining}>
          {isJoining ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Join System</Text>}
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1E293B', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#64748B', marginBottom: 24 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, marginBottom: 20 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoLabel: { marginLeft: 10, fontSize: 16, color: '#475569' },
  codeContainer: { marginTop: 16, padding: 16, backgroundColor: '#EFF6FF', borderRadius: 12, alignItems: 'center' },
  codeTitle: { fontSize: 14, color: '#1D4ED8', fontWeight: 'bold' },
  codeText: { fontSize: 32, fontWeight: 'black', color: '#1D4ED8', letterSpacing: 4, marginVertical: 8 },
  codeSub: { fontSize: 12, color: '#3B82F6' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#334155', marginTop: 10, marginBottom: 16 },
  parentItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 10 },
  parentName: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  parentEmail: { fontSize: 14, color: '#64748B' },
  emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: 20 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#475569', marginBottom: 8 },
  input: { backgroundColor: '#fff', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', fontSize: 16 },
  codeInput: { textAlign: 'center', fontSize: 24, fontWeight: 'bold', letterSpacing: 5 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  typeButton: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', marginHorizontal: 4 },
  typeButtonActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  typeButtonText: { color: '#64748B', fontWeight: 'bold' },
  typeButtonTextActive: { color: '#fff' },
  routeList: { flexDirection: 'row', flexWrap: 'wrap' },
  routeButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', marginRight: 10, marginBottom: 10 },
  routeButtonActive: { backgroundColor: '#DBEAFE', borderColor: '#3B82F6' },
  routeText: { color: '#64748B' },
  routeTextActive: { color: '#1D4ED8', fontWeight: 'bold' },
  submitButton: { backgroundColor: '#3B82F6', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  infoCard: { backgroundColor: '#F0F9FF', padding: 16, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#0EA5E9' },
  infoText: { color: '#0369A1', lineHeight: 20 },
  mapContainer: { height: 300, width: '100%', borderRadius: 16, overflow: 'hidden', backgroundColor: '#E2E8F0', marginTop: 8, marginBottom: 40 },
  map: { flex: 1 },
  mapPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mapPlaceholderText: { color: '#64748B', marginTop: 8 },
  markerContainer: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 4, borderWidth: 2, borderColor: '#F59E0B', elevation: 2 }
});
