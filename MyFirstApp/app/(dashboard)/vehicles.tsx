import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, 
  TextInput, Modal, Alert, ActivityIndicator, SafeAreaView, ScrollView
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

export default function VehiclesScreen() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Form State
  const [plateNumber, setPlateNumber] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [maxSeats, setMaxSeats] = useState('');

  useEffect(() => {
    loadUserAndVehicles();
  }, []);

  const loadUserAndVehicles = async () => {
    try {
      const userData = await AsyncStorage.getItem('driverData');
      if (userData) {
        const id = JSON.parse(userData).id;
        setUserId(id);
        fetchVehicles(id);
      }
    } catch (error) {
      Alert.alert("Error", "Could not load driver data.");
    }
  };

  const fetchVehicles = async (id: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/vehicle/driver/${id}`);
      setVehicles(response.data.vehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = async () => {
    if (!plateNumber || !model) {
      Alert.alert("Error", "Plate number and model are required.");
      return;
    }

    setSaving(true);
    try {
      await api.post('/vehicle/create', {
        driverId: userId,
        plateNumber,
        model,
        color,
        maxSeats
      });
      setModalVisible(false);
      resetForm();
      if (userId) fetchVehicles(userId);
      Alert.alert("Success", "Vehicle added successfully!");
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to add vehicle.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVehicle = (vehicleId: string) => {
    Alert.alert(
      "Remove Vehicle",
      "Are you sure you want to remove this vehicle?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive", 
          onPress: async () => {
            try {
              await api.delete(`/vehicle/${vehicleId}`);
              if (userId) fetchVehicles(userId);
            } catch (error) {
              Alert.alert("Error", "Could not delete vehicle.");
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setPlateNumber('');
    setModel('');
    setColor('');
    setMaxSeats('');
  };

  const renderVehicle = ({ item }: { item: any }) => (
    <View style={styles.vehicleCard}>
      <View style={styles.vehicleIcon}>
        <MaterialCommunityIcons name="bus-school" size={30} color="#3B82F6" />
      </View>
      <View style={styles.vehicleInfo}>
        <Text style={styles.plateText}>{item.plate_number}</Text>
        <Text style={styles.modelText}>{item.model} • {item.color || 'No color'}</Text>
        <Text style={styles.seatsText}>{item.max_seats} Seats</Text>
      </View>
      <TouchableOpacity onPress={() => handleDeleteVehicle(item.id)} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={20} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Vehicles</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#3B82F6" />
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id}
          renderItem={renderVehicle}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="car-off" size={60} color="#CBD5E1" />
              <Text style={styles.emptyText}>No vehicles added yet.</Text>
            </View>
          }
        />
      )}

      {/* Add Vehicle Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Vehicle</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.label}>Plate Number *</Text>
              <TextInput 
                style={styles.input} 
                value={plateNumber} 
                onChangeText={setPlateNumber}
                placeholder="e.g. WP ABC-1234"
                autoCapitalize="characters"
              />

              <Text style={styles.label}>Model *</Text>
              <TextInput 
                style={styles.input} 
                value={model} 
                onChangeText={setModel}
                placeholder="e.g. Toyota HiAce"
              />

              <Text style={styles.label}>Color</Text>
              <TextInput 
                style={styles.input} 
                value={color} 
                onChangeText={setColor}
                placeholder="e.g. White"
              />

              <Text style={styles.label}>Max Seats</Text>
              <TextInput 
                style={styles.input} 
                value={maxSeats} 
                onChangeText={setMaxSeats}
                placeholder="e.g. 14"
                keyboardType="numeric"
              />

              <TouchableOpacity 
                style={[styles.saveBtn, saving && styles.btnDisabled]} 
                onPress={handleAddVehicle}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Vehicle</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
  addBtn: { backgroundColor: '#3B82F6', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10, gap: 5 },
  addBtnText: { color: '#fff', fontWeight: 'bold' },
  loader: { marginTop: 50 },
  list: { padding: 20 },
  vehicleCard: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 16, 
    marginBottom: 10, 
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5
  },
  vehicleIcon: { width: 50, height: 50, backgroundColor: '#EFF6FF', borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  vehicleInfo: { flex: 1 },
  plateText: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  modelText: { fontSize: 13, color: '#64748B', marginTop: 2 },
  seatsText: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  deleteBtn: { padding: 10 },
  empty: { marginTop: 100, alignItems: 'center' },
  emptyText: { marginTop: 10, color: '#94A3B8', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  label: { fontSize: 14, fontWeight: '600', color: '#64748B', marginBottom: 8, marginTop: 10 },
  input: { backgroundColor: '#F1F5F9', borderRadius: 12, padding: 15, fontSize: 16 },
  saveBtn: { backgroundColor: '#3B82F6', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 25 },
  btnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
