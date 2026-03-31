import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, SafeAreaView, StatusBar, Dimensions
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../services/supabase';
import api from '../../services/api';

const { width } = Dimensions.get('window');

/**
 * Live Map Version: 1.3.0 (FORCED REFRESH - Pickup selection enabled)
 */
export default function MapScreen() {
  const router = useRouter();
  const { systemId } = useLocalSearchParams();
  
  // -- State variables --
  const [role, setRole] = useState<'Driver' | 'Parent' | 'Attendant' | null>(null);
  const [userId, setUserId] = useState('');
  const [system, setSystem] = useState<any>(null);
  const [vanLocation, setVanLocation] = useState<any>(null);
  const [isTracking, setIsTracking] = useState(false); 
  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState('Initializing Map...');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Pickup Location State
  const [parentPickups, setParentPickups] = useState<any[]>([]); // For Drivers/Attendants
  const [myPickup, setMyPickup] = useState<any>(null); // For Parents
  const [tempPickup, setTempPickup] = useState<any>(null); // Selection point
  const [isSettingLocation, setIsSettingLocation] = useState(false);
  const [savingPickup, setSavingPickup] = useState(false);

  // Refs
  const mapRef = useRef<MapView>(null);
  const locationSubscription = useRef<any>(null);
  const pollInterval = useRef<any>(null);

  useEffect(() => {
    loadInitialData();
    return () => {
      stopDriverTracking();
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [systemId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      console.log('[Mapv1.3] Initializing... SystemId:', systemId);

      const driverData = await AsyncStorage.getItem('driverData');
      const parentData = await AsyncStorage.getItem('parentData');
      const attendantData = await AsyncStorage.getItem('attendantData');

      let currentRole: any = 'Parent';
      let currentId = '';

      if (driverData) {
        currentRole = 'Driver';
        currentId = JSON.parse(driverData).id;
      } else if (parentData) {
        currentRole = 'Parent';
        currentId = JSON.parse(parentData).id;
      } else if (attendantData) {
        currentRole = 'Attendant';
        currentId = JSON.parse(attendantData).id;
      }

      setRole(currentRole);
      setUserId(currentId);

      const response = await api.get(`/system/${systemId}`);
      setSystem(response.data.system);

      if (currentRole === 'Driver' || currentRole === 'Attendant') {
        fetchParentPickups();
        if (currentRole === 'Driver') {
          setStatusText('Ready to Start Tracking');
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const pos = await Location.getCurrentPositionAsync({});
            centerMap(pos.coords.latitude, pos.coords.longitude);
          }
        } else {
          setStatusText('Tracking Van Location...');
          startPolling();
        }
      } else {
        // Parent Mode
        await fetchMyPickup(currentId);
        setStatusText('Tracking Van Location...');
        startPolling();
      }
    } catch (error) {
      Alert.alert('Error', 'Could not load tracking data');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const fetchParentPickups = async () => {
    try {
      const response = await api.get(`/system/${systemId}/parents`);
      const list = response.data.parents || [];
      setParentPickups(list.filter((p: any) => p.pickup_lat && p.pickup_lng));
    } catch (err) {}
  };

  const fetchMyPickup = async (pId: string) => {
    try {
      const response = await api.get(`/system/${systemId}/parents`);
      const parents = response.data.parents || [];
      const me = parents.find((p: any) => p.parent_id === pId);
      if (me?.pickup_lat) {
        setMyPickup({ 
          latitude: parseFloat(me.pickup_lat), 
          longitude: parseFloat(me.pickup_lng) 
        });
      }
    } catch (err) {}
  };

  const savePickupLocation = async () => {
    if (!tempPickup) return;
    setSavingPickup(true);
    try {
      await api.put(`/system/${systemId}/parent/${userId}/pickup`, {
        lat: tempPickup.latitude,
        lng: tempPickup.longitude
      });
      setMyPickup(tempPickup);
      setTempPickup(null);
      setIsSettingLocation(false);
      Alert.alert('Success', 'Pickup location updated successfully.');
      fetchParentPickups(); // Refresh for everyone
    } catch (error) {
      Alert.alert('Error', 'Failed to save pickup location');
    } finally {
      setSavingPickup(false);
    }
  };

  const onMapLongPress = (e: any) => {
    if (role === 'Parent' && isSettingLocation) {
      setTempPickup(e.nativeEvent.coordinate);
    }
  };

  const centerMap = (lat: number, lng: number) => {
    mapRef.current?.animateToRegion({
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.015,
      longitudeDelta: 0.015
    });
  };

  const startDriverTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      setIsTracking(true);
      setStatusText('BROADCASTING LIVE');
      try {
        await api.post(`/system/${systemId}/tracking/start`, { 
          driverName: system?.driver?.name || "The driver" 
        });
      } catch (err) {}
      locationSubscription.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 10000, distanceInterval: 10 },
        async (newLoc) => {
          const { latitude, longitude } = newLoc.coords;
          setVanLocation({ latitude, longitude });
          centerMap(latitude, longitude);
          await supabase.from('transportation_systems').update({ current_lat: latitude, current_lng: longitude, updated_at: new Date().toISOString() }).eq('id', systemId);
        }
      );
    } catch (error) { setIsTracking(false); }
  };

  const stopDriverTracking = async () => {
    if (locationSubscription.current) locationSubscription.current.remove();
    setIsTracking(false);
    setStatusText('Tracking Stopped');
    try { await api.post(`/system/${systemId}/tracking/stop`); } catch (err) {}
  };

  const startPolling = () => {
    if (pollInterval.current) clearInterval(pollInterval.current);
    fetchVanLocation();
    pollInterval.current = setInterval(fetchVanLocation, 10000);
  };

  const fetchVanLocation = async () => {
    try {
      const { data, error } = await supabase.from('transportation_systems').select('current_lat, current_lng, updated_at').eq('id', systemId).single();
      if (data?.current_lat) {
        const lat = parseFloat(data.current_lat);
        const lng = parseFloat(data.current_lng);
        const lastUpdate = new Date(data.updated_at).getTime();
        const stale = (Date.now() - lastUpdate) > 60000;
        if (!stale) {
          setStatusText('Van is LIVE');
          setVanLocation({ latitude: lat, longitude: lng });
        } else {
          setStatusText('Van Offline');
        }
      }
    } catch (err) {}
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: '#0F172A' }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const isDriver = role === 'Driver';
  const isParent = role === 'Parent';
  const accentColor = isDriver ? '#3B82F6' : '#10B981';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <MapView
        ref={mapRef as any}
        style={styles.map}
        initialRegion={{
          latitude: 6.9271,
          longitude: 79.8612,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1
        }}
        onLongPress={onMapLongPress}
      >
        {vanLocation && (
          <Marker coordinate={vanLocation} title="School Van" zIndex={100}>
            <View style={[styles.vanMarker, { borderColor: isDriver ? '#3B82F6' : '#8B5CF6' }]}>
              <MaterialCommunityIcons name="bus-school" size={26} color={isDriver ? '#3B82F6' : '#8B5CF6'} />
            </View>
          </Marker>
        )}

        {/* Parent's Pickup Pin */}
        {(myPickup || tempPickup) && isParent && (
          <Marker coordinate={tempPickup || myPickup} zIndex={50}>
            <View style={[styles.pickupMarker, { borderColor: '#10B981' }]}>
              <MaterialCommunityIcons name="map-marker-account" size={20} color="#10B981" />
            </View>
          </Marker>
        )}

        {/* Driver/Attendant View Markers */}
        {!isParent && parentPickups.map((p: any) => (
          <Marker 
            key={p.parent_id} 
            coordinate={{ latitude: parseFloat(p.pickup_lat), longitude: parseFloat(p.pickup_lng) }}
          >
            <View style={[styles.pickupMarker, { borderColor: '#F59E0B' }]}>
              <MaterialCommunityIcons name="account-child" size={20} color="#F59E0B" />
            </View>
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{p.users?.name || 'Parent'}</Text>
                <Text style={styles.calloutSub}>{p.users?.email}</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Dynamic Overlay */}
      <View style={styles.headerArea}>
        <SafeAreaView>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>{system?.name || 'Live View'}</Text>
              <Text style={styles.headerSub}>{statusText}</Text>
            </View>
            {/* Version Badge to confirm updates */}
            <View style={styles.versionBadge}><Text style={styles.versionText}>v1.3</Text></View>
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.footerArea}>
        {isDriver ? (
          <TouchableOpacity 
            style={[styles.mainBtn, { backgroundColor: isTracking ? '#EF4444' : '#3B82F6' }]} 
            onPress={isTracking ? stopDriverTracking : startDriverTracking}
          >
            <MaterialCommunityIcons name={isTracking ? "stop-circle" : "play-circle"} size={32} color="#fff" />
            <Text style={styles.mainBtnText}>{isTracking ? 'Stop Broadcasting' : 'Start Broadcasting'}</Text>
          </TouchableOpacity>
        ) : isParent ? (
          <View style={{ width: '100%' }}>
            {isSettingLocation ? (
              <View style={styles.selectionCard}>
                <Text style={styles.selectionPrompt}>Long-press on map to place your pickup pin.</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity style={[styles.flexBtn, { backgroundColor: '#475569' }]} onPress={() => { setIsSettingLocation(false); setTempPickup(null); }}>
                    <Text style={styles.btnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.flexBtn, { backgroundColor: '#10B981', opacity: tempPickup ? 1 : 0.5 }]} disabled={!tempPickup || savingPickup} onPress={savePickupLocation}>
                    {savingPickup ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.btnText}>Save Pin</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={[styles.mainBtn, { backgroundColor: '#10B981' }]} onPress={() => setIsSettingLocation(true)}>
                <MaterialCommunityIcons name="map-marker-radius" size={28} color="#fff" />
                <Text style={styles.mainBtnText}>{myPickup ? 'Change My Pickup Spot' : 'Set My Pickup Spot'}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.infoCard}>
            <MaterialCommunityIcons name="broadcast" size={24} color="#8B5CF6" />
            <Text style={styles.infoCardText}>Viewing van's live status</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  map: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerArea: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  headerRow: { margin: 15, padding: 15, backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: 24, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  headerInfo: { flex: 1 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  headerSub: { color: '#94A3B8', fontSize: 12 },
  versionBadge: { backgroundColor: '#3B82F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  versionText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  footerArea: { position: 'absolute', bottom: 40, left: 20, right: 20 },
  mainBtn: { height: 75, borderRadius: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 15, elevation: 10, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10 },
  mainBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  vanMarker: { backgroundColor: '#fff', padding: 8, borderRadius: 25, borderWidth: 3, elevation: 10 },
  pickupMarker: { backgroundColor: '#fff', padding: 6, borderRadius: 15, borderWidth: 2, elevation: 5 },
  selectionCard: { backgroundColor: 'rgba(15, 23, 42, 0.95)', padding: 20, borderRadius: 30 },
  selectionPrompt: { color: '#fff', textAlign: 'center', marginBottom: 20, fontWeight: '600' },
  flexBtn: { flex: 1, height: 55, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  infoCard: { backgroundColor: '#fff', padding: 25, borderRadius: 30, flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoCardText: { fontWeight: 'bold', color: '#1E293B' },
  callout: { padding: 10, minWidth: 150 },
  calloutTitle: { fontWeight: 'bold', fontSize: 14 },
  calloutSub: { fontSize: 12, color: '#64748B' }
});
