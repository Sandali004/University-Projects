import React, { useState, useEffect, useRef } from 'react';
<<<<<<< HEAD
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
=======
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps'; // UI Components to display maps
import * as Location from 'expo-location'; // Expo hardware API to access raw GPS data
import AsyncStorage from '@react-native-async-storage/async-storage'; // Local database
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';

// Screen Component: Live Map Tracking
export default function MapScreen() {
  // State variables hold dynamic data that updates the UI automatically when changed
  const [location, setLocation] = useState<any>(null); // Holds {latitude, longitude}
  const [errorMsg, setErrorMsg] = useState<any>(null); // Holds GPS permission errors
  const [isTracking, setIsTracking] = useState(false); // Remembers if tracking is active (True/False)
  
  const mapRef = useRef<any>(null); // Reference used to control the mapping window (panning/zooming)
  const locationSubscription = useRef<any>(null); // Acts like an active task token allowing us to kill tracking easily

  // useEffect triggers code immediately when the screen is loaded
  useEffect(() => {
    (async () => {
      // 1. Request foreground location permissions from the user
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return; // Stops running code if permissions fail
      }

      // 2. Fetch the user's initial location one time to center the map
      let initialLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: initialLocation.coords.latitude,
        longitude: initialLocation.coords.longitude,
        latitudeDelta: 0.01, // Determines map zoom (smaller number = zoom in closer)
        longitudeDelta: 0.01, 
      });
    })();

    // Cleanup: Automatically execute `stopTracking()` if the user leaves the screen entirely
    return () => {
      stopTracking();
    };
  }, []);

  // Function to begin live location streaming
  const startTracking = async () => {
    try {
      // Pull driver identity from local device storage
      const dataStr = await AsyncStorage.getItem('driverData');
      if (!dataStr) {
        Alert.alert('Error', 'Could not find driver details. Please login again.');
        return;
      }
      
      const driverData = JSON.parse(dataStr);
      const driverId = driverData.id;

      // Enable the active tracking indicator in UI
      setIsTracking(true); 
      
      // Start listening to the hardware device's GPS loop
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High, // Use High Power GPS
          timeInterval: 5000, // Query GPS hardware every 5 seconds
          distanceInterval: 10, // OR Query if the device has moved 10 meters 
        },
        async (newLoc) => {
          // This block runs automatically every single time a new location arrives!
          
          const { latitude, longitude } = newLoc.coords;
          
          // 1. Update our UI state
          setLocation((prevLoc: any) => ({
            ...prevLoc,
            latitude,
            longitude,
          }));

          // 2. Instantly animate mapping engine to focus on new coordinates
          mapRef.current?.animateToRegion({
            latitude,
            longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          });

          // 3. Silently upload tracking slice point to our MongoDB servers via HTTPS POST
          try {
            await api.post('/location/update', {
              driverId,
              latitude,
              longitude,
            });
            console.log('Location updated to server:', latitude, longitude);
          } catch (error: any) {
            console.error('Failed to send location to server', error.message);
          }
        }
      );
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to start tracking.');
>>>>>>> IT24103379
      setIsTracking(false);
    }
  };

<<<<<<< HEAD
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
=======
  // Function to cease remote tracking loop
  const stopTracking = () => {
    // Check if the system is currently looking at GPS coordinates
    if (locationSubscription.current) {
      // Disconnect GPS loop task
      locationSubscription.current.remove(); 
      locationSubscription.current = null;
    }
    // Shut off tracking UI
    setIsTracking(false); 
  };

  // UI layout
  return (
    <View style={styles.container}>
      
      {/* Dynamic Conditional Rendering: 
          If location has loaded successfully, render the map. 
          If not, render a loading text element. */}
          
      {location ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={location}
          showsUserLocation={false} // Disable default blue dot because we use a custom Marker
        >
          {/* Custom interactive pin demonstrating the physical position */}
          <Marker
            coordinate={{ latitude: location.latitude, longitude: location.longitude }}
            title="My Van"
            description="Live Location"
          >
            <View style={styles.markerContainer}>
              <MaterialCommunityIcons name="van-passenger" size={30} color="#3B82F6" />
            </View>
          </Marker>
        </MapView>
      ) : (
        <View style={styles.loadingContainer}>
          <Text>{errorMsg || 'Loading map...'}</Text>
        </View>
      )}

      {/* Control Box Area: Floating over the map */}
      <View style={styles.controlContainer}>
        
        {/* Connection text and color dot marker */}
        <View style={styles.statusBox}>
          <View style={[styles.statusIndicator, { backgroundColor: isTracking ? '#22C55E' : '#EF4444' }]} />
          <Text style={styles.statusText}>
            {isTracking ? 'Live Tracking Active' : 'Offline'}
          </Text>
        </View>

        {/* The Action Button: Background transitions from Blue (Start) to Red (Stop). Function switches dynamically natively based on `isTracking` prop logic */}
        <TouchableOpacity
          style={[styles.trackButton, { backgroundColor: isTracking ? '#EF4444' : '#3B82F6' }]}
          onPress={isTracking ? stopTracking : startTracking} 
        >
          <Text style={styles.trackButtonText}>
            {isTracking ? 'Stop Tracking' : 'Start Live Tracking'}
          </Text>
        </TouchableOpacity>
      </View>
      
>>>>>>> IT24103379
    </View>
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
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
=======
  container: { flex: 1 },
  map: { flex: 1 }, // Map occupies 100% of the visible container height inherently
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  markerContainer: { backgroundColor: '#fff', borderRadius: 20, padding: 5, borderWidth: 2, borderColor: '#3B82F6' },
  controlContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  statusBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  statusIndicator: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  statusText: { fontSize: 16, fontWeight: 'bold', color: '#334155' },
  trackButton: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  trackButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
>>>>>>> IT24103379
});
