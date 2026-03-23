import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';

export default function MapScreen() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const mapRef = useRef(null);
  const locationSubscription = useRef(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let initialLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: initialLocation.coords.latitude,
        longitude: initialLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();

    return () => {
      stopTracking();
    };
  }, []);

  const startTracking = async () => {
    try {
      const dataStr = await AsyncStorage.getItem('driverData');
      if (!dataStr) {
        Alert.alert('Error', 'Could not find driver details. Please login again.');
        return;
      }
      const driverData = JSON.parse(dataStr);
      const driverId = driverData.id;

      setIsTracking(true);
      
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, 
          distanceInterval: 10,
        },
        async (newLoc) => {
          const { latitude, longitude } = newLoc.coords;
          
          setLocation((prevLoc) => ({
            ...prevLoc,
            latitude,
            longitude,
          }));

          // Center map on new location
          mapRef.current?.animateToRegion({
            latitude,
            longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          });

          // Send to API
          try {
            await api.post('/location/update', {
              driverId,
              latitude,
              longitude,
            });
            console.log('Location updated to server:', latitude, longitude);
          } catch (error) {
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

  const stopTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    setIsTracking(false);
  };

  return (
    <View style={styles.container}>
      {location ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={location}
          showsUserLocation={false}
        >
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

      <View style={styles.controlContainer}>
        <View style={styles.statusBox}>
          <View style={[styles.statusIndicator, { backgroundColor: isTracking ? '#22C55E' : '#EF4444' }]} />
          <Text style={styles.statusText}>
            {isTracking ? 'Live Tracking Active' : 'Offline'}
          </Text>
        </View>

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
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 5,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
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
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
  },
  trackButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  trackButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
