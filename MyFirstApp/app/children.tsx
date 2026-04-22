import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Alert, Modal, 
  TextInput, ActivityIndicator, FlatList, SafeAreaView, StatusBar, ScrollView 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import api from '../services/api';

export default function MyChildrenScreen() {
  const router = useRouter();
  const [parentId, setParentId] = useState('');
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingChild, setEditingChild] = useState<any>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const [form, setForm] = useState({
    name: '',
    school: '',
    grade: '',
    pickupLocation: '',
    dropoffLocation: ''
  });

  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, [])
  );

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const savedTheme = await AsyncStorage.getItem('appTheme');
      if (savedTheme) setTheme(savedTheme as 'light' | 'dark');

      const parentDataStr = await AsyncStorage.getItem('parentData');
      if (parentDataStr) {
        const data = JSON.parse(parentDataStr);
        setParentId(data.id);
        fetchChildren(data.id);
      } else {
        router.replace('/');
      }
    } catch (error) {
      console.log('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const fetchChildren = async (pId: string) => {
    try {
      const response = await api.get(`/students/parent/${pId}`);
      setChildren(response.data.students || []);
    } catch (error) {
      console.log('Error fetching children');
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.school) {
      Alert.alert('Error', 'Name and School are required');
      return;
    }

    try {
      if (editingChild) {
        await api.put(`/students/${editingChild.id}`, form);
        Alert.alert('Success', 'Child profile updated');
      } else {
        await api.post('/students', { ...form, parentId });
        Alert.alert('Success', 'Child registered successfully');
      }
      setIsModalVisible(false);
      resetForm();
      fetchChildren(parentId);
    } catch (error) {
      Alert.alert('Error', 'Could not save child data');
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Child', `Are you sure you want to remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/students/${id}`);
          fetchChildren(parentId);
        } catch (error) {
          Alert.alert('Error', 'Could not delete child');
        }
      }}
    ]);
  };

  const resetForm = () => {
    setForm({ name: '', school: '', grade: '', pickupLocation: '', dropoffLocation: '' });
    setEditingChild(null);
  };

  const openEditModal = (child: any) => {
    setEditingChild(child);
    setForm({
      name: child.name,
      school: child.school,
      grade: child.grade || '',
      pickupLocation: child.pickup_location || '',
      dropoffLocation: child.dropoff_location || ''
    });
    setIsModalVisible(true);
  };

  const isDark = theme === 'dark';
  const bgColor = isDark ? '#0F172A' : '#FFFFFF';
  const cardColor = isDark ? '#1E293B' : '#FFFFFF';
  const textColor = isDark ? '#F1F5F9' : '#000000';
  const subTextColor = isDark ? '#94A3B8' : '#64748B';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>My Children</Text>
        <TouchableOpacity 
          onPress={() => { resetForm(); setIsModalVisible(true); }}
          style={[styles.addBtn, { backgroundColor: '#10B981' }]}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {children.length > 0 ? (
            children.map(child => (
              <View key={child.id} style={[styles.childCard, { backgroundColor: cardColor }]}>
                <View style={styles.childHeader}>
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={30} color="#10B981" />
                  </View>
                  <View style={styles.childMeta}>
                    <Text style={[styles.childName, { color: textColor }]}>{child.name}</Text>
                    <Text style={styles.childSub}>{child.school} • Grade {child.grade || 'N/A'}</Text>
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity onPress={() => openEditModal(child)} style={styles.actionIcon}>
                      <Ionicons name="create-outline" size={22} color="#3B82F6" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(child.id, child.name)} style={styles.actionIcon}>
                      <Ionicons name="trash-outline" size={22} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.locationInfo}>
                  <View style={styles.locRow}>
                    <Ionicons name="home-outline" size={14} color="#94A3B8" />
                    <Text style={styles.locText}>Pickup: {child.pickup_location || 'Not set'}</Text>
                  </View>
                  <View style={styles.locRow}>
                    <Ionicons name="school-outline" size={14} color="#94A3B8" />
                    <Text style={styles.locText}>Dropoff: {child.dropoff_location || 'Not set'}</Text>
                  </View>
                  <View style={[styles.locRow, { marginTop: 5 }]}>
                    <Ionicons name="cash-outline" size={14} color="#94A3B8" />
                    <Text style={[styles.locText, { fontWeight: 'bold' }]}>Payment: </Text>
                    <View style={[
                      styles.paymentBadge, 
                      { backgroundColor: (child.payment_status === 'Paid') ? '#DCFCE7' : '#FEE2E2' }
                    ]}>
                      <Text style={[
                        styles.paymentBadgeText, 
                        { color: (child.payment_status === 'Paid') ? '#166534' : '#991B1B' }
                      ]}>
                        {(child.payment_status || 'Pending').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="account-search-outline" size={80} color="#CBD5E1" />
              <Text style={styles.emptyText}>No children registered yet.</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Add/Edit Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={[styles.modalContent, { backgroundColor: cardColor }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>
              {editingChild ? 'Edit Child info' : 'Add New Child'}
            </Text>
            
            <Text style={styles.label}>Full Name</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: isDark ? '#334155' : '#FFFFFF', color: textColor }]}
              value={form.name}
              onChangeText={t => setForm({...form, name: t})}
              placeholder="Enter child's name"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.label}>School</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: isDark ? '#334155' : '#FFFFFF', color: textColor }]}
              value={form.school}
              onChangeText={t => setForm({...form, school: t})}
              placeholder="School name"
              placeholderTextColor="#94A3B8"
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Grade</Text>
                <TextInput 
                  style={[styles.input, { backgroundColor: isDark ? '#334155' : '#FFFFFF', color: textColor }]}
                  value={form.grade}
                  onChangeText={t => setForm({...form, grade: t})}
                  placeholder="e.g. 5"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <Text style={styles.label}>Pickup Location (optional)</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: isDark ? '#334155' : '#FFFFFF', color: textColor }]}
              value={form.pickupLocation}
              onChangeText={t => setForm({...form, pickupLocation: t})}
              placeholder="Home address or landmarks"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.label}>Dropoff Location (optional)</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: isDark ? '#334155' : '#FFFFFF', color: textColor }]}
              value={form.dropoffLocation}
              onChangeText={t => setForm({...form, dropoffLocation: t})}
              placeholder="After school dropoff point"
              placeholderTextColor="#94A3B8"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: '#F1F5F9' }]} 
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={{ color: '#64748B', fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: '#10B981' }]} 
                onPress={handleSubmit}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{editingChild ? 'Update' : 'Register'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  addBtn: { width: 45, height: 45, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 20 },
  childCard: { borderRadius: 24, padding: 20, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  childHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 55, height: 55, borderRadius: 18, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center' },
  childMeta: { flex: 1, marginLeft: 15 },
  childName: { fontSize: 18, fontWeight: 'bold' },
  childSub: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 5 },
  actionIcon: { padding: 8 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 15 },
  locationInfo: { gap: 8 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locText: { fontSize: 13, color: '#64748B' },
  paymentBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginLeft: 2 },
  paymentBadgeText: { fontSize: 10, fontWeight: 'bold' },
  empty: { alignItems: 'center', marginTop: 100, opacity: 0.5 },
  emptyText: { marginTop: 15, fontSize: 16, color: '#94A3B8' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '90%' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#64748B', marginBottom: 8, marginTop: 10 },
  input: { height: 55, borderRadius: 15, paddingHorizontal: 20, marginBottom: 5, fontSize: 16 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 25, marginBottom: 40 },
  modalBtn: { flex: 1, height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center' }
});
