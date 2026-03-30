import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../services/supabase';
import api from '../../services/api';

export default function MapScreen() {
  const router = useRouter();
  const { role: paramRole, driverId: paramDriverId } = useLocalSearchParams();

  // Shared state
  const [role, setRole] = useState<string | null>(paramRole as string || null);
  const [mapRegion, setMapRegion]   = useState<any>(null);
  const [vanLocation, setVanLocation] = useState<any>(null);
  const [statusText, setStatusText] = useState('Initializing...');
  const [isTracking, setIsTracking] = useState(false);
  const [loading, setLoading]       = useState(true);

  // Refs for persistent data
  const mapRef               = useRef<any>(null);
  const locationSubscription = useRef<any>(null);
  const refreshInterval      = useRef<any>(null);
  const driverIdRef          = useRef<string | null>(null);
  const trackingSystemIdRef  = useRef<string | null>(null); // The specific van ID the parent is tracking

  // DRIVER LOGIC 
  const saveLocationToSupabase = async (latitude: number, longitude: number) => {
    const driverId = driverIdRef.current;
    if (!driverId) return;

    try {
      // Update only the specific driver's van row
      const { error } = await supabase
        .from('transportation_systems')
        .update({
          current_lat: latitude,
          current_lng: longitude,
          updated_at: new Date().toISOString()
        })
        .eq('driver_id', driverId);

      if (error) console.error('[DriverMap] Save error:', error.message);
      else console.log('[DriverMap] Location sync success ✓');
    } catch (err) {
      console.error('[DriverMap] Sync failed:', err);
    }
  };

  const startTracking = async () => {
    try {
      const driverId = driverIdRef.current;
      const { data: sysData, error: sysError } = await supabase
        .from('transportation_systems')
        .select('id')
        .eq('driver_id', driverId)
        .single();

      if (sysError || !sysData) {
         Alert.alert('System Not Found', 'Please set up your Vehicle in the Dashboard first.');
         return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'GPS access is required for tracking.');
        return;
      }

      setIsTracking(true);
      setStatusText('You are LIVE');

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000,
          distanceInterval: 10,
        },
        async (newLocation) => {
          const { latitude, longitude } = newLocation.coords;
          setVanLocation({ latitude, longitude });
          await saveLocationToSupabase(latitude, longitude);
        }
      );
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', 'Failed to start tracking.');
      setIsTracking(false);
    }
  };

  const stopTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    setIsTracking(false);
    setStatusText('Tracking Stopped');
  };

  // PARENT LOGIC 
  
  // Find which van is assigned to this parent
  const findAssignedSystem = async () => {
    try {
      const parentData = await AsyncStorage.getItem('parentData');
      if (!parentData) return null;
      const parentId = JSON.parse(parentData).id;

      // Logic: Parent -> Student -> System
      const { data, error } = await supabase
        .from('students')
        .select('system_id')
        .eq('parent_id', parentId)
        .limit(1)
        .single();

      if (error || !data?.system_id) {
        console.warn('[ParentMap] No assigned system found for parent');
        return null;
      }
      return data.system_id;
    } catch (err) {
      return null;
    }
  };

  const fetchDriverLocation = async () => {
    const systemId = trackingSystemIdRef.current;
    if (!systemId) {
      setStatusText('No assigned van found.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('transportation_systems')
        .select('current_lat, current_lng, updated_at, name')
        .eq('id', systemId)
        .single();

      if (error || !data) {
        setStatusText('Tracking unavailable');
        return;
      }

      // Check if location is "stale" (driver hasn't updated in 1 minute)
      const lastUpdate = new Date(data.updated_at).getTime();
      const now = new Date().getTime();
      const diffSeconds = (now - lastUpdate) / 1000;

      if (!data.current_lat || diffSeconds > 60) {
        setStatusText('Driver has not started live location yet');
        setVanLocation(null);
        return;
      }

      const lat = parseFloat(data.current_lat);
      const lng = parseFloat(data.current_lng);

      setVanLocation({ latitude: lat, longitude: lng });
      setMapRegion((prev: any) => prev || {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      setStatusText(`Driver ${data.name || ''} is LIVE ✓`);
      setLoading(false);

      // Smoothly move map to van
      mapRef.current?.animateToRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    } catch (err) {
      setStatusText('Refresh failed');
    }
  };

  //  INITIALIZATION 
  useEffect(() => {
    const init = async () => {
      let currentRole = role;
      if (!currentRole) {
        const p = await AsyncStorage.getItem('parentData');
        const d = await AsyncStorage.getItem('driverData');
        currentRole = p ? 'Parent' : 'Driver';
        setRole(currentRole);
      }

      if (currentRole === 'Driver') {
        let dId = paramDriverId as string;
        if (!dId) {
          const stored = await AsyncStorage.getItem('driverData');
          if (stored) dId = JSON.parse(stored).id;
        }
        driverIdRef.current = dId;
        setLoading(false);
        
        // SAFE INITIALIZATION 
        try {
          // Request permission FIRST
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
             setStatusText('Permission Denied');
             Alert.alert('Permission Required', 'Enable location to track your van.');
             return;
          }
          
          // Only call GPS if granted
          const pos = await Location.getCurrentPositionAsync({});
          setMapRegion({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01
          });
        } catch (err) {
          console.warn('[DriverMap] GPS init failed:', err);
        }
      } else {
        // Parent Mode
        const sysId = await findAssignedSystem();
        if (sysId) {
          trackingSystemIdRef.current = sysId;
          await fetchDriverLocation();
          refreshInterval.current = setInterval(fetchDriverLocation, 10000); // 10s poll
        } else {
          setStatusText('Please add a child in the Dashboard to track their van.');
        }
        setLoading(false);
      }
    };

    init();
    return () => {
      if (locationSubscription.current) locationSubscription.current.remove();
      if (refreshInterval.current) clearInterval(refreshInterval.current);
    };
  }, []);

  const isDriver = role === 'Driver';

  return (
    <View style={styles.container}>
      {mapRegion ? (
        <MapView ref={mapRef} style={styles.map} initialRegion={mapRegion}>
          {vanLocation && (
            <Marker coordinate={vanLocation}>
              <View style={[styles.markerContainer, { borderColor: isDriver ? '#3B82F6' : '#10B981' }]}>
                <MaterialCommunityIcons name="van-passenger" size={30} color={isDriver ? '#3B82F6' : '#10B981'} />
              </View>
            </Marker>
          )}
        </MapView>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Connecting to Satellite...</Text>
        </View>
      )}

      {/* Control Overlay */}
      <View style={styles.controlBox}>
        <View style={styles.statusHeader}>
          <View style={[styles.dot, { backgroundColor: vanLocation ? '#22C55E' : '#F59E0B' }]} />
          <Text style={styles.statusTitle}>{statusText}</Text>
        </View>

        {isDriver && (
          <View style={styles.coordinatesCard}>
            {vanLocation ? (
              <View style={styles.coordsRow}>
                <View style={styles.coordItem}>
                  <Text style={styles.coordLabel}>LATITUDE</Text>
                  <Text style={styles.coordValue}>{vanLocation.latitude.toFixed(4)}°</Text>
                </View>
                <View style={styles.vDivider} />
                <View style={styles.coordItem}>
                  <Text style={styles.coordLabel}>LONGITUDE</Text>
                  <Text style={styles.coordValue}>{vanLocation.longitude.toFixed(4)}°</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.noCoordsText}>Location not available</Text>
            )}
          </View>
        )}

        {isDriver && (
          <TouchableOpacity 
            style={[styles.btn, { backgroundColor: isTracking ? '#EF4444' : '#3B82F6' }]} 
            onPress={isTracking ? stopTracking : startTracking}
          >
            <Text style={styles.btnText}>{isTracking ? 'Stop Live Location' : 'Start Live Location'}</Text>
          </TouchableOpacity>
        )}

        {!isDriver && !vanLocation && (
          <View style={styles.noLocationBox}>
            <Ionicons name="time" size={20} color="#64748B" />
            <Text style={styles.noLocationText}>Waiting for Driver GPS pulse...</Text>
          </View>
        )}
      </View>

      <View style={[styles.badge, { backgroundColor: isDriver ? '#3B82F6' : '#10B981' }]}>
        <Text style={styles.badgeText}>{isDriver ? 'DRIVER VIEW' : 'TRACKING MODE'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  map: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 15, color: '#64748B', fontWeight: 'bold' },
  markerContainer: { backgroundColor: '#fff', padding: 8, borderRadius: 25, borderWidth: 3, elevation: 5 },
  controlBox: { position: 'absolute', bottom: 40, left: 20, right: 20, backgroundColor: '#fff', borderRadius: 24, padding: 20, shadowOpacity: 0.1, elevation: 10 },
  statusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  statusTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  btn: { paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  coordinatesCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  coordsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  coordItem: { alignItems: 'center' },
  coordLabel: { fontSize: 9, fontWeight: '800', color: '#94A3B8', marginBottom: 2 },
  coordValue: { fontSize: 15, fontWeight: '900', color: '#334155' },
  vDivider: { width: 1, height: 20, backgroundColor: '#E2E8F0' },
  noCoordsText: { textAlign: 'center', color: '#94A3B8', fontSize: 13, fontWeight: '600' },
  noLocationBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 10 },
  noLocationText: { color: '#64748B', fontSize: 13 },
  badge: { position: 'absolute', top: 60, left: 20, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 100 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '900' }
});
