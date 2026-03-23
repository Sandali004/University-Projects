import React, { useState, useEffect, useRef } from 'react';
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
      setIsTracking(false);
    }
  };

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
      
    </View>
  );
}

const styles = StyleSheet.create({
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
});
