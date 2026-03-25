// ============================================================
// map.tsx — Smart Map Screen (Driver + Parent)
//
// HOW IT WORKS:
//   This single screen shows different behaviour depending on
//   who is logged in (passed as the 'role' URL param):
//
//   role = 'Driver':
//     - Requests GPS permission
//     - Tracks the phone's real-time location
//     - Every 5 seconds, saves lat/lng to the 'transportation_systems' table in
//       Supabase (matched by driver_id)
//     - Shows a blue van marker on the map showing the driver's
//       own live position
//
//   role = 'Parent':
//     - Does NOT use GPS or request any permissions
//     - Fetches the driver's current lat/lng from the 'transportation_systems'
//       table in Supabase
//     - Refreshes that location every 5 seconds automatically
//     - Shows a yellow school-bus marker at the driver's position
//
// SUPABASE TABLES USED:
//   transportation_systems — columns: driver_id, current_lat, current_lng
//   users — used to find which driver a parent is linked to
//           (for simplicity, this version fetches the LATEST
//            active driver from the transportation_systems table)
// ============================================================

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

  // ════════════════════════════════════════════════════════════
  // DRIVER LOGIC
  // ════════════════════════════════════════════════════════════

  // saveLocationToSupabase
  // Called every time the GPS gives a new coordinate.
  // UPSERT (insert or update) the position in the 'transportation_systems' table.
  const saveLocationToSupabase = async (latitude: number, longitude: number) => {
    const driverId = driverIdRef.current;
    if (!driverId) return;

    console.log(`[DriverMap] Saving location to Supabase: ${latitude}, ${longitude}`);

    // 'upsert' means: if a row with this driver_id already exists → update it
    //                 if it does NOT exist yet → insert a new row
    const { error } = await supabase
      .from('transportation_systems')
      .upsert(
        {
          driver_id:   driverId,
          current_lat: latitude,
          current_lng: longitude,
        },
        { onConflict: 'driver_id' } // match rows by driver_id for the update
      );

    if (error) {
      console.error('[DriverMap] Failed to save location:', error.message);
    } else {
      console.log('[DriverMap] Location saved ✓');
    }
  };

  // startTracking
  // Begins the GPS stream and saves each position to Supabase.
  const startTracking = async () => {
    try {
      // Ask for GPS permission first
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
        const sysId = paramDriverId || (stored ? JSON.parse(stored).id : null); 
        // Note: systemId should ideally be the real UUID of the system, not driverId.
        // But for now, our backend routes use systemId. Let's fetch it if needed or assume it's linked.
        // Actually, let's just use the current system fetch logic if we have it.
        if (sysId) {
           // We need the system UUID. Let's get it from driverId.
           const { data: sysData } = await supabase.from('transportation_systems').select('id').eq('driver_id', sysId).single();
           if (sysData) {
             await api.post(`/system/${sysData.id}/tracking/start`, { driverName });
           }
        }
      } catch (err) { console.log('Failed to send start notification'); }

      // Start listening for GPS updates
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy:         Location.Accuracy.High, // High-accuracy GPS
          timeInterval:     5000,                   // Update every 5 seconds
          distanceInterval: 5,                      // Or if moved 5 meters
        },
        async (newLocation) => {
          const { latitude, longitude } = newLocation.coords;

          // Update the local map and marker
          setVanLocation({ latitude, longitude });
          setMapRegion({
            latitude,
            longitude,
            latitudeDelta:  0.005,
            longitudeDelta: 0.005,
          });

          // Smoothly pan the map to the new position
          mapRef.current?.animateToRegion({
            latitude,
            longitude,
            latitudeDelta:  0.005,
            longitudeDelta: 0.005,
          });

          // Save to Supabase so parents can see it
          await saveLocationToSupabase(latitude, longitude);
        }
      );
    } catch (e: any) {
      console.error('[DriverMap] Error starting tracking:', e.message);
      Alert.alert('Error', 'Failed to start tracking. Please try again.');
      setIsTracking(false);
    }
  };

  // stopTracking
  // Stops the GPS watcher and clears the tracking state.
  const stopTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    setIsTracking(false);
    setStatusText('Tracking Stopped');

    // Notify parents via backend
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('driverData');
        const dId = paramDriverId || (stored ? JSON.parse(stored).id : null);
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
  // Called once when the screen loads in Driver mode.
  const initDriver = async () => {
    setLoading(false);

    // Get the driver's user ID — first try the URL param, then AsyncStorage
    let driverId = paramDriverId as string | null;
    if (!driverId) {
      const stored = await AsyncStorage.getItem('driverData');
      if (stored) driverId = JSON.parse(stored).id;
    }

    if (!driverId) {
      Alert.alert('Error', 'Could not find your driver profile. Please log in again.');
      router.replace('/login');
      return;
    }

    // Store in ref so the GPS callback can use it without stale closure issues
    driverIdRef.current = driverId;
    console.log('[DriverMap] Driver ID:', driverId);

    // Get one initial location to centre the map before starting the watcher
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = pos.coords;
        setVanLocation({ latitude, longitude });
        setMapRegion({ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
      }
    } catch (_) { /* first-time location optional, tracking will start anyway */ }

    // Let the driver click "Start Tracking" manually
  };

  // ════════════════════════════════════════════════════════════
  // PARENT LOGIC
  // ════════════════════════════════════════════════════════════

  // fetchDriverLocation
  // Reads the latest (most recently updated) driver position from 'transportation_systems'.
  const fetchDriverLocation = async () => {
    console.log('[ParentMap] Fetching driver location from Supabase...');

    // Get the most recently updated van record
    // (You can filter by a specific driver if you store the driver link in parents table)
    const { data, error } = await supabase
      .from('transportation_systems')
      .select('current_lat, current_lng, driver_id')
      .not('current_lat', 'is', null)   // Only rows that actually have a location
      .not('current_lng', 'is', null)
      .order('updated_at', { ascending: false }) // Most recently updated first
      .limit(1)                                   // We only need one van for now
      .single();

    if (error || !data) {
      console.log('[ParentMap] No van location available yet:', error?.message);
      setStatusText('No driver is active right now');
      return;
    }

    const lat = parseFloat(data.current_lat);
    const lng = parseFloat(data.current_lng);

    console.log(`[ParentMap] Got location: ${lat}, ${lng}`);

    setVanLocation({ latitude: lat, longitude: lng });
    setMapRegion({
      latitude:      lat,
      longitude:     lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
    setStatusText('Driver location found ✓');
    setLoading(false);

    // Pan the map to the driver's position
    mapRef.current?.animateToRegion({
      latitude:      lat,
      longitude:     lng,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    });
  };

  // initParent
  // Called once when the screen loads in Parent mode.
  const initParent = async () => {
    setStatusText('Loading driver location...');

    // Fetch immediately
    await fetchDriverLocation();

    // Then refresh every 5 seconds automatically
    refreshInterval.current = setInterval(() => {
      fetchDriverLocation();
    }, 5000);
  };

  // ════════════════════════════════════════════════════════════
  // LIFECYCLE — runs once when the screen mounts
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    const checkRoleAndInit = async () => {
      let currentRole = role as string;
      
      // If role not passed in params, figure it out from storage
      if (!currentRole) {
        const parentData = await AsyncStorage.getItem('parentData');
        const driverData = await AsyncStorage.getItem('driverData');
        
        if (parentData) {
          currentRole = 'Parent';
        } else if (driverData) {
          currentRole = 'Driver';
        } else {
          currentRole = 'Driver'; // Fallback
        }
        setRole(currentRole);
      }

      if (currentRole === 'Driver') {
        initDriver();
      } else if (currentRole === 'Parent') {
        setLoading(false); // Show map shell while fetching
        initParent();
      }
    };

    checkRoleAndInit();

    // CLEANUP — runs when the user leaves this screen
    return () => {
      // Stop GPS watcher
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
      // Stop auto-refresh timer
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
        refreshInterval.current = null;
      }
    };
  }, []);

  // ════════════════════════════════════════════════════════════
  // UI
  // ════════════════════════════════════════════════════════════
  const isDriver = role === 'Driver';
  const isParent = role === 'Parent';

  return (
    <View style={styles.container}>

      {/* MAP — show once we have a region to display */}
      {mapRegion ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={mapRegion}
          showsUserLocation={false}
        >
          {/* Van marker — shown only when we have a position */}
          {vanLocation && (
            <Marker
              coordinate={vanLocation}
              title={isDriver ? 'My Van' : 'School Van'}
              description={isDriver ? 'Your live location' : "Driver's live location"}
            >
              <View style={[styles.markerContainer, { borderColor: isDriver ? '#3B82F6' : '#F59E0B' }]}>
                <MaterialCommunityIcons
                  name="van-passenger"
                  size={30}
                  color={isDriver ? '#3B82F6' : '#F59E0B'}
                />
              </View>
            </Marker>
          )}
        </MapView>
      ) : (
        // Loading placeholder
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>
            {isParent ? 'Looking for driver location...' : 'Loading map...'}
          </Text>
        </View>
      )}

      {/* BOTTOM CONTROL CARD — floating over the map */}
      <View style={styles.controlContainer}>

        {/* Status row with coloured dot */}
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
              ? (isTracking ? '🟢 Live Tracking Active' : '🔴 Tracking Stopped')
              : (vanLocation ? `🟢 ${statusText}` : `🟡 ${statusText}`)
            }
          </Text>
        </View>

        {/* Show current coordinates */}
        {vanLocation && (
          <Text style={styles.coordsText}>
            📍 {vanLocation.latitude.toFixed(6)}, {vanLocation.longitude.toFixed(6)}
          </Text>
        )}

        {/* DRIVER: Start / Stop Tracking button */}
        {isDriver && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: isTracking ? '#EF4444' : '#3B82F6' }]}
            onPress={isTracking ? stopTracking : startTracking}
          >
            <Text style={styles.actionButtonText}>
              {isTracking ? '⏹ Stop Tracking' : '▶ Start Tracking'}
            </Text>
          </TouchableOpacity>
        )}

        {/* PARENT: Manual Refresh button */}
        {isParent && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#10B981' }]}
            onPress={fetchDriverLocation}
          >
            <Text style={styles.actionButtonText}>🔄 Refresh Location</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ROLE BADGE — top left corner */}
      <View style={[styles.roleBadge, { backgroundColor: isDriver ? '#3B82F6' : '#10B981' }]}>
        <Text style={styles.roleBadgeText}>
          {isDriver ? '🚐 Driver View' : '👨‍👩‍👧 Parent View'}
        </Text>
      </View>

    </View>
  );
}

// ════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container:       { flex: 1 },
  map:             { flex: 1 },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    gap: 16,
  },
  loadingText: { fontSize: 16, color: '#64748B', marginTop: 12 },

  markerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 6,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  controlContainer: {
    position:        'absolute',
    bottom:          30,
    left:            16,
    right:           16,
    backgroundColor: '#FFFFFF',
    borderRadius:    20,
    padding:         20,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 6 },
    shadowOpacity:   0.12,
    shadowRadius:    12,
    elevation:       8,
  },

  statusRow: {
    flexDirection:  'row',
    alignItems:     'center',
    marginBottom:   12,
  },
  statusDot: {
    width:        12,
    height:       12,
    borderRadius: 6,
    marginRight:  10,
  },
  statusText: {
    fontSize:   15,
    fontWeight: '600',
    color:      '#1E293B',
    flex:       1,
    flexWrap:   'wrap',
  },
  coordsText: {
    fontSize:     12,
    color:        '#64748B',
    marginBottom: 14,
    fontFamily:   'monospace',
  },

  actionButton: {
    paddingVertical: 14,
    borderRadius:    12,
    alignItems:      'center',
  },
  actionButtonText: {
    color:      '#FFFFFF',
    fontSize:   16,
    fontWeight: 'bold',
  },

  roleBadge: {
    position:     'absolute',
    top:          50,
    left:         16,
    paddingHorizontal: 14,
    paddingVertical:    7,
    borderRadius: 20,
    shadowColor:  '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation:    4,
  },
  roleBadgeText: {
    color:      '#FFFFFF',
    fontWeight: 'bold',
    fontSize:   13,
  },
});
