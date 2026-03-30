import React from 'react';
<<<<<<< HEAD
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
// MapView displays the map, Marker shows a specific point on the map
import MapView, { Marker } from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router'; // Hook to access navigation parameters
import { Ionicons } from '@expo/vector-icons';
=======
import { StyleSheet, View, Text } from 'react-native';
// MapView displays the map, Marker shows a specific point on the map
import MapView, { Marker } from 'react-native-maps';
import { useLocalSearchParams } from 'expo-router'; // Hook to access navigation parameters
>>>>>>> IT24103379

// Screen Component: Simple Map Screen
export default function MapScreen() {
  const { role } = useLocalSearchParams(); // Extract the 'role' passed securely via navigation params
<<<<<<< HEAD
  const router = useRouter(); // Hook to perform navigation
=======
>>>>>>> IT24103379

  // A sample physical location (Colombo, Sri Lanka coordinates)
  // latitudeDelta & longitudeDelta control the zoom level (smaller = closer)
  const sampleLocation = {
    latitude: 6.9271,
    longitude: 79.8612,
    latitudeDelta: 0.05, 
    longitudeDelta: 0.05,
  };

  return (
    <View style={styles.container}>
      {/* Full screen MapView component pulling from Google Maps/Apple Maps */}
      <MapView 
        style={styles.map}
        initialRegion={sampleLocation} // Set the starting coordinates
      >
        {/* Default location marker for the school vehicle */}
        <Marker
          coordinate={{ 
            latitude: sampleLocation.latitude, 
            longitude: sampleLocation.longitude 
          }}
          title="School Vehicle"
          description="Current estimated location"
        />
      </MapView>

      {/* Floating UI Badge indicating current role (Reads from params) */}
      <View style={styles.floatingBadge}>
        <Text style={styles.badgeText}>Logged in as: {role || 'Unknown'}</Text>
      </View>
<<<<<<< HEAD

      {/* Driver Profile Button */}
      <TouchableOpacity 
        style={styles.profileButton}
        onPress={() => router.push('/driver-profile')}
      >
        <Ionicons name="person" size={24} color="#0F172A" />
      </TouchableOpacity>
=======
>>>>>>> IT24103379
    </View>
  );
}

// Styling definitions
const styles = StyleSheet.create({
  container: {
    flex: 1, // Takes up the whole screen safely
  },
  map: {
    width: '100%',
    height: '100%', // Expands the map natively to fill the exact dimensions of the container
  },
  floatingBadge: {
    position: 'absolute', // Float over map
<<<<<<< HEAD
    top: 50,
=======
    top: 40,
>>>>>>> IT24103379
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Slight opacity for modern look
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4, // Android drop shadow
  },
  badgeText: {
    color: '#0F172A', // Very dark slate color
    fontWeight: 'bold',
    fontSize: 16,
  },
<<<<<<< HEAD
  profileButton: {
    position: 'absolute', // Float over map
    top: 50,
    right: 20,
    width: 50,
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5, // Android drop shadow
  },
=======
>>>>>>> IT24103379
});
