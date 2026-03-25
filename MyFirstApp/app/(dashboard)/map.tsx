import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../services/supabase'; // Direct Supabase connection
import api from '../../services/api';

export default function MapScreen() {
  const router = useRouter();

  const { role: paramRole, driverId: paramDriverId } = useLocalSearchParams();

  // ── Shared state ──────────────────────────────────────────────
  const [role, setRole] = useState<string | null>(paramRole as string || null);
  const [mapRegion, setMapRegion]   = useState<any>(null); // The map's visible region
  const [vanLocation, setVanLocation] = useState<any>(null); // Current lat/lng of the van
  const [statusText, setStatusText] = useState('Loading...');
  const [isTracking, setIsTracking] = useState(false); // Driver only
  const [loading, setLoading]       = useState(true);

  // Refs that survive re-renders without causing them
  const mapRef               = useRef<any>(null);
  const locationSubscription = useRef<any>(null); // GPS watcher (driver only)
  const refreshInterval      = useRef<any>(null); // Auto-refresh timer (parent only)
  const driverIdRef          = useRef<string | null>(null); // The driver's user ID

  // DRIVER LOGIC
  
  // saveLocationToSupabase
  // Called every time the GPS gives a new coordinate.
  // Updates the position in the 'transportation_systems' table.
  const saveLocationToSupabase = async (latitude: number, longitude: number) => {
    const driverId = driverIdRef.current;
    if (!driverId) {
      console.warn('[DriverMap] No driver ID available');
      return;
    }

    // Build the payload with all required fields
    // Using 'Driver Location' as name since it's NOT NULL in transportation_systems
    const payload = {
      name: 'Driver Location',  // Required field (NOT NULL in schema)
      current_lat: latitude,
      current_lng: longitude,
      updated_at: new Date().toISOString(),
    };

    console.log(`[DriverMap] Saving to table: transportation_systems`);
    console.log(`[DriverMap] Driver ID: ${driverId}`);
    console.log(`[DriverMap] Location: lat=${latitude}, lng=${longitude}`);
    console.log(`[DriverMap] Payload:`, JSON.stringify(payload));

    try {
      // Using .update() with specific driver_id match
      // This only modifies the location columns specified
      const { error, data } = await supabase
        .from('transportation_systems')
        .update(payload)
        .eq('driver_id', driverId)
        .select();

      if (error) {
        console.error('[DriverMap] Supabase error code:', error.code);
        console.error('[DriverMap] Supabase error message:', error.message);
        console.error('[DriverMap] Supabase error details:', error);
        setStatusText('Sync error: Database issue');
      } else if (data && data.length > 0) {
        console.log('[DriverMap] Location sync success ✓', data[0].updated_at);
      } else {
        console.warn('[DriverMap] Update returned no data');
      }
    } catch (err: any) {
      console.error('[DriverMap] Exception during save:', err);
      setStatusText('Sync error: Connection failed');
    }
  };

  // startTracking
  const startTracking = async () => {
    try {
      // 1. Ensure a row exists for this driver in transportation_systems
      const driverId = driverIdRef.current;
      const { data: sysData, error: sysError } = await supabase
        .from('transportation_systems')
        .select('id, name')
        .eq('driver_id', driverId)
        .single();

      if (sysError || !sysData) {
         console.log('[DriverMap] System check fail:', sysError?.message);
         Alert.alert('System Required', 'Please create your transportation system under the Dashboard first.');
         return;
      }

      // 2. Start GPS
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to start tracking.');
        return;
      }

      setIsTracking(true);
      setStatusText('Live Tracking Active');

      // Notify parents via backend
      try {
        const stored = await AsyncStorage.getItem('driverData');
        const driverName = stored ? JSON.parse(stored).name : 'The driver';
        await api.post(`/system/${sysData.id}/tracking/start`, { driverName });
      } catch (err) { console.log('Failed to send start notification'); }

      // GPS Watcher
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy:         Location.Accuracy.High,
          timeInterval:     10000,                  // 10 seconds check
          distanceInterval: 10,
        },
        async (newLocation) => {
          const { latitude, longitude } = newLocation.coords;
          setVanLocation({ latitude, longitude });
          
          mapRef.current?.animateToRegion({
            latitude,
            longitude,
            latitudeDelta:  0.005,
            longitudeDelta: 0.005,
          });

          await saveLocationToSupabase(latitude, longitude);
        }
      );
    } catch (e: any) {
      console.error('[DriverMap] Error starting tracking:', e.message);
      setIsTracking(false);
    }
  };

  // stopTracking
  const stopTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    setIsTracking(false);
    setStatusText('Tracking Stopped');

    (async () => {
      try {
        const dId = driverIdRef.current;
        if (dId) {
          const { data: sysData } = await supabase.from('transportation_systems').select('id').eq('driver_id', dId).single();
          if (sysData) {
            await api.post(`/system/${sysData.id}/tracking/stop`);
          }
        }
      } catch (err) { console.log('Failed to send stop notification'); }
    })();
  };

  // initDriver
  const initDriver = async () => {
    setLoading(false);
    let driverId = paramDriverId as string | null;
    if (!driverId) {
      const stored = await AsyncStorage.getItem('driverData');
      if (stored) driverId = JSON.parse(stored).id;
    }
    if (!driverId) {
      router.replace('/login');
      return;
    }
    driverIdRef.current = driverId;
    console.log('[DriverMap] Driver active:', driverId);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = pos.coords;
        setVanLocation({ latitude, longitude });
        setMapRegion({ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
      }
    } catch (_) {}
  };

  // PARENT LOGIC
  
  // fetchDriverLocation
  const fetchDriverLocation = async () => {
    console.log('[ParentMap] Refreshing location from table: transportation_systems');

    try {
      const { data, error } = await supabase
        .from('transportation_systems')
        .select('current_lat, current_lng, updated_at, name, driver_id')
        .not('current_lat', 'is', null) 
        .order('updated_at', { ascending: false }) 
        .limit(1)
        .single();

      if (error) {
        console.error('[ParentMap] Query error code:', error.code);
        console.error('[ParentMap] Query error message:', error.message);
        setStatusText('No drivers active at this time');
        return;
      }

      if (!data) {
        console.warn('[ParentMap] No active driver data returned');
        setStatusText('No drivers active at this time');
        return;
      }

      console.log('[ParentMap] Retrieved data:', data);
      console.log('[ParentMap] Last update:', data.updated_at);

      const lat = parseFloat(data.current_lat);
      const lng = parseFloat(data.current_lng);

      console.log(`[ParentMap] Van location: lat=${lat}, lng=${lng}`);

      setVanLocation({ latitude: lat, longitude: lng });
      setMapRegion(prev => prev || {
        latitude:      lat,
        longitude:     lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      
      setStatusText(`${data.name || 'Van'} is live ✓`);
      setLoading(false);

      mapRef.current?.animateToRegion({
        latitude:      lat,
        longitude:     lng,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    } catch (err: any) {
      console.error('[ParentMap] Exception fetching location:', err);
      setStatusText('Error fetching location');
    }
  };

  // initParent
  const initParent = async () => {
    setStatusText('Locating school vehicle...');
    await fetchDriverLocation();
    refreshInterval.current = setInterval(() => {
      fetchDriverLocation();
    }, 10000); 
  };

  // LIFECYCLE
  useEffect(() => {
    const checkRoleAndInit = async () => {
      let currentRole = role as string;
      if (!currentRole) {
        const parentData = await AsyncStorage.getItem('parentData');
        const driverData = await AsyncStorage.getItem('driverData');
        currentRole = parentData ? 'Parent' : 'Driver';
        setRole(currentRole);
      }
      if (currentRole === 'Driver') {
        initDriver();
      } else if (currentRole === 'Parent') {
        setLoading(false);
        initParent();
      }
    };
    checkRoleAndInit();
    return () => {
      if (locationSubscription.current) locationSubscription.current.remove();
      if (refreshInterval.current) clearInterval(refreshInterval.current);
    };
  }, []);


  // UI
  const isDriver = role === 'Driver';
  const isParent = role === 'Parent';

  return (
    <View style={styles.container}>

      {mapRegion ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={mapRegion}
        >
          {vanLocation && (
            <Marker
              coordinate={vanLocation}
              title={isDriver ? 'My Position' : 'School Van'}
              description={isDriver ? 'Synchronizing live' : "Tracking driver location"}
            >
              <View style={[styles.markerContainer, { borderColor: isDriver ? '#3B82F6' : '#F59E0B' }]}>
                <MaterialCommunityIcons
                  name="van-passenger"
                  size={32}
                  color={isDriver ? '#3B82F6' : '#F59E0B'}
                />
              </View>
            </Marker>
          )}
        </MapView>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>
            {isParent ? 'Synchronizing with Driver GPS...' : 'Loading location services...'}
          </Text>
        </View>
      )}

      {/* Control Card */}
      <View style={styles.controlContainer}>
        <View style={styles.statusRow}>
          <View style={[
            styles.statusDot,
            { backgroundColor: isDriver
                ? (isTracking ? '#22C55E' : '#EF4444')
                : (vanLocation ? '#22C55E' : '#F59E0B')
            }
          ]} />
          <Text style={styles.statusText}>
            {isDriver
              ? (isTracking ? '🟢 Sending GPS (10s pulse)' : '🔴 Location Stopped')
              : (vanLocation ? `🟢 ${statusText}` : `🟡 ${statusText}`)
            }
          </Text>
        </View>

        {isDriver && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: isTracking ? '#EF4444' : '#3B82F6' }]}
            onPress={isTracking ? stopTracking : startTracking}
          >
            <Text style={styles.actionButtonText}>
              {isTracking ? '⏹ Stop Live Location' : '▶ Start Live Location'}
            </Text>
          </TouchableOpacity>
        )}

        {isParent && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#10B981' }]}
            onPress={fetchDriverLocation}
          >
            <Text style={styles.actionButtonText}>🔄 Force GPS Refresh</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.roleBadge, { backgroundColor: isDriver ? '#3B82F6' : '#10B981' }]}>
        <Text style={styles.roleBadgeText}>
          {isDriver ? '🚐 DRIVE MODE' : '👨‍👩‍👧 PARENT MODE'}
        </Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1 },
  map:             { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { fontSize: 16, color: '#64748B', marginTop: 15, fontWeight: '600' },
  markerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 8,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
  },
  controlContainer: {
    position:        'absolute',
    bottom:          40,
    left:            20,
    right:           20,
    backgroundColor: '#FFFFFF',
    borderRadius:    20,
    padding:         20,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 6 },
    shadowOpacity:   0.15,
    shadowRadius:    12,
    elevation:       8,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  statusText: { fontSize: 15, fontWeight: 'bold', color: '#1E293B' },
  actionButton: { paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  actionButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  roleBadge: {
    position:     'absolute',
    top:          60,
    left:         20,
    paddingHorizontal: 15,
    paddingVertical:    8,
    borderRadius: 18,
  },
  roleBadgeText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },
});
