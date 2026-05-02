import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Alert, 
  ActivityIndicator, SafeAreaView, StatusBar, TextInput, ScrollView, Dimensions
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

/**
 * Route Picker Screen
 * Allows drivers to manually select Start and End locations on a map.
 * Fetches the road path (Polyline) using the OSRM API.
 */
export default function RoutePickerScreen() {
  const router = useRouter();
  const { systemId } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<'start' | 'end' | 'confirm'>('start');
  
  const [startPoint, setStartPoint] = useState<any>(null);
  const [endPoint, setEndPoint] = useState<any>(null);
  const [waypoints, setWaypoints] = useState<any[]>([]);
  const [routePath, setRoutePath] = useState<any[]>([]);
  const [startName, setStartName] = useState('');
  const [endName, setEndName] = useState('');
  const [routeName, setRouteName] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  
  const mapRef = useRef<MapView>(null);

  // Initialize with current system info if exists
  useEffect(() => {
    fetchCurrentRoute();
    requestLocationPermissions();
  }, [systemId]);

  const requestLocationPermissions = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permissions are required to use the map features.');
    }
  };

  const fetchCurrentRoute = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/system/${systemId}`);
      const s = response.data.system;
      if (s.start_lat && s.start_lng) {
        const start = { latitude: parseFloat(s.start_lat), longitude: parseFloat(s.start_lng) };
        const end = { latitude: parseFloat(s.end_lat), longitude: parseFloat(s.end_lng) };
        setStartPoint(start);
        setEndPoint(end);
        setStartName(s.start_location_name || '');
        setEndName(s.end_location_name || '');
        // If they have coordinates but no path, fetch it
        fetchRoute(start, end);
      }
    } catch (err) {
      console.log('Error fetching current route:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * fetchRoute: Calls OSRM to get the road path. Handles intermediate waypoints.
   */
  const fetchRoute = async (start: any, end: any, extraPoints: any[] = []) => {
    try {
      // Build coordinates string: start;w1;w2;...;end
      const pts = [
        `${start.longitude},${start.latitude}`,
        ...extraPoints.map(p => `${p.longitude},${p.latitude}`),
        `${end.longitude},${end.latitude}`
      ].join(';');

      const url = `https://router.project-osrm.org/route/v1/driving/${pts}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const coordinates = data.routes[0].geometry.coordinates.map((coord: any) => ({
          latitude: coord[1],
          longitude: coord[0],
        }));
        setRoutePath(coordinates);
        
        // Zoom map to fit the route
        setTimeout(() => {
          mapRef.current?.fitToCoordinates([start, end], {
            edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
            animated: true,
          });
        }, 500);
      }
    } catch (error) {
      console.error("Routing Error:", error);
      Alert.alert("Error", "Could not calculate the road route.");
    }
  };

  const handleMapPress = (e: any) => {
    const coord = e.nativeEvent.coordinate;
    if (isRefining && startPoint && endPoint) {
      const newWaypoints = [...waypoints, coord];
      setWaypoints(newWaypoints);
      fetchRoute(startPoint, endPoint, newWaypoints);
      return;
    }

    if (step === 'start') {
      setStartPoint(coord);
      setStartName(`Location (${coord.latitude.toFixed(4)}, ${coord.longitude.toFixed(4)})`);
    } else if (step === 'end') {
      setEndPoint(coord);
      setEndName(`Location (${coord.latitude.toFixed(4)}, ${coord.longitude.toFixed(4)})`);
      fetchRoute(startPoint, coord, waypoints);
      setStep('confirm');
    }
  };

  /**
   * handleSearchLocation: Geocodes the text input address and updates the map/marker.
   */
  const handleSearchLocation = async (type: 'start' | 'end') => {
    const address = type === 'start' ? startName : endName;
    if (!address || address.includes('Location (')) {
      Alert.alert("Invalid Search", "Please enter a location name to search.");
      return;
    }

    setLoading(true);
    try {
      const results = await Location.geocodeAsync(address);
      if (results.length > 0) {
        const { latitude, longitude } = results[0];
        const coord = { latitude, longitude };
        
        if (type === 'start') {
          setStartPoint(coord);
        } else {
          setEndPoint(coord);
          if (startPoint) {
            fetchRoute(startPoint, coord, waypoints);
            setStep('confirm');
          }
        }

        // Animate map to found location
        mapRef.current?.animateToRegion({
          ...coord,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01
        }, 1000);
      } else {
        Alert.alert("Not Found", `Could not find location: "${address}"`);
      }
    } catch (err) {
      console.error("Geocoding error:", err);
      Alert.alert("Error", "Geocoding service failed.");
    } finally {
      setLoading(false);
    }
  };

  const saveRoute = async () => {
    if (!startPoint || !endPoint) return;
    setSaving(true);
    try {
      // Standardize polyline for storage if needed, but here we just pass basic info
      await api.put(`/system/${systemId}/route-map`, {
        startLat: startPoint.latitude,
        startLng: startPoint.longitude,
        startName: startName || "Start Point",
        endLat: endPoint.latitude,
        endLng: endPoint.longitude,
        endName: endName || "End Point",
        routeName: routeName || `${startName} to ${endName}`,
        routePolyline: JSON.stringify(routePath)
      });
      Alert.alert("Success", "Route and map details saved successfully!");
      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to save route map.");
    } finally {
      setSaving(false);
    }
  };

  const resetSelection = () => {
    setStartPoint(null);
    setEndPoint(null);
    setWaypoints([]);
    setRoutePath([]);
    setIsRefining(false);
    setStep('start');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header Area */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Route Selection</Text>
        <TouchableOpacity onPress={resetSelection}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: 6.9271,
            longitude: 79.8612,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1
          }}
          onPress={handleMapPress}
        >
          {startPoint && (
            <Marker coordinate={startPoint} title="Start" pinColor="#3B82F6" />
          )}
          {endPoint && (
            <Marker coordinate={endPoint} title="End" pinColor="#EF4444" />
          )}
          {waypoints.map((wp, idx) => (
            <Marker key={`wp-${idx}`} coordinate={wp} pinColor="#64748B" />
          ))}
          {routePath.length > 0 && (
            <Polyline
              coordinates={routePath}
              strokeWidth={4}
              strokeColor="#3B82F6"
            />
          )}
        </MapView>

        {/* Dynamic Instruction Overlay */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionText}>
            {isRefining ? "Tap on map to add road waypoints." :
             step === 'start' ? "Tap on the map to set the START point." :
             step === 'end' ? "Tap on the map to set the END point." :
             "Confirm your route or refine it."}
          </Text>
          {step === 'confirm' && (
             <TouchableOpacity 
               style={[styles.nextBtn, { backgroundColor: isRefining ? '#10B981' : '#3B82F6' }]} 
               onPress={() => setIsRefining(!isRefining)}
             >
               <Text style={styles.nextBtnText}>{isRefining ? "Done Refining" : "Refine Road (Optional)"}</Text>
             </TouchableOpacity>
          )}
          {step === 'start' && startPoint && (
             <TouchableOpacity style={styles.nextBtn} onPress={() => setStep('end')}>
               <Text style={styles.nextBtnText}>Next: Set End Point</Text>
             </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Details/Save Panel */}
      <View style={styles.bottomPanel}>
        <View style={styles.locationSummary}>
          <View style={styles.summaryRow}>
             <View style={[styles.dot, { backgroundColor: '#3B82F6' }]} />
             <TextInput 
               style={styles.locationInput} 
               placeholder="Start Point Name"
               value={startName}
               onChangeText={setStartName}
               onSubmitEditing={() => handleSearchLocation('start')}
             />
             <TouchableOpacity onPress={() => handleSearchLocation('start')}>
               <Ionicons name="search" size={20} color="#3B82F6" />
             </TouchableOpacity>
          </View>
          <View style={styles.summaryRow}>
             <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
             <TextInput 
               style={styles.locationInput} 
               placeholder="End Point Name"
               value={endName}
               onChangeText={setEndName}
               onSubmitEditing={() => handleSearchLocation('end')}
             />
             <TouchableOpacity onPress={() => handleSearchLocation('end')}>
               <Ionicons name="search" size={20} color="#EF4444" />
             </TouchableOpacity>
          </View>
          
          <View style={[styles.summaryRow, { marginTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 }]}>
             <MaterialCommunityIcons name="map-marker-path" size={20} color="#64748B" style={{ marginRight: 12 }} />
             <TextInput 
               style={styles.locationInput} 
               placeholder="Route Display Name (e.g. Morning Pickup)"
               value={routeName}
               onChangeText={setRouteName}
             />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, (!startPoint || !endPoint) && styles.saveBtnDisabled]} 
          disabled={!startPoint || !endPoint || saving}
          onPress={saveRoute}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save System Route</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 16, 
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  backBtn: { padding: 4 },
  resetText: { color: '#3B82F6', fontWeight: 'bold' },
  mapContainer: { flex: 1, position: 'relative' },
  map: { flex: 1 },
  instructionCard: { 
    position: 'absolute', 
    top: 20, 
    left: 20, 
    right: 20, 
    backgroundColor: 'rgba(30, 41, 59, 0.9)', 
    padding: 16, 
    borderRadius: 16,
    alignItems: 'center'
  },
  instructionText: { color: '#fff', fontWeight: '600', textAlign: 'center' },
  nextBtn: { marginTop: 12, backgroundColor: '#3B82F6', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  nextBtnText: { color: '#fff', fontWeight: 'bold' },
  bottomPanel: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  locationSummary: { marginBottom: 20 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  locationInput: { flex: 1, height: 40, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', fontSize: 14, color: '#1E293B' },
  saveBtn: { backgroundColor: '#3B82F6', padding: 18, borderRadius: 12, alignItems: 'center' },
  saveBtnDisabled: { backgroundColor: '#94A3B8' },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
