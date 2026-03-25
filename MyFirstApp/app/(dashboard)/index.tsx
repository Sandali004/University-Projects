import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, FlatList, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';

export default function DashboardScreen() {
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<'Driver' | 'Parent' | 'Attendant'>('Driver');
  const router = useRouter();

  // Parent specific state
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [studentForm, setStudentForm] = useState({ name: '', school: '', grade: '', pickupLocation: '', dropoffLocation: '' });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const driverDataStr = await AsyncStorage.getItem('driverData');
      const parentDataStr = await AsyncStorage.getItem('parentData');
      const attendantDataStr = await AsyncStorage.getItem('attendantData');

      if (driverDataStr) {
        const data = JSON.parse(driverDataStr);
        setRole('Driver');
        setUserName(data.name);
        setUserId(data.id);
      } else if (parentDataStr) {
        const data = JSON.parse(parentDataStr);
        setRole('Parent');
        setUserName(data.name);
        setUserId(data.id);
        fetchStudents(data.id);
      } else if (attendantDataStr) {
        const data = JSON.parse(attendantDataStr);
        setRole('Attendant');
        setUserName(data.name);
        setUserId(data.id);
      }
    } catch (error) {
      console.log('Failed to load user data');
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('driverToken');
      await AsyncStorage.removeItem('driverData');
      await AsyncStorage.removeItem('parentToken');
      await AsyncStorage.removeItem('parentData');
      await AsyncStorage.removeItem('attendantToken');
      await AsyncStorage.removeItem('attendantData');
      router.replace('/');
    } catch (error) {
      console.log('Error during logout:', error);
      router.replace('/');
    }
  };

  // --- DRIVER FUNCTIONS ---
  const sendAlert = async (type: string, message: string) => {
    try {
      await api.post('/driver/alert', { driverId: userId, alertType: type, message });
      Alert.alert('Alert Sent', `Successfully sent ${type} alert to parents.`);
    } catch (error) {
      Alert.alert('Error', 'Could not send alert');
    }
  };

  // --- PARENT FUNCTIONS ---
  const fetchStudents = async (parentId: string) => {
    setLoadingStudents(true);
    try {
      const response = await api.get(`/students/parent/${parentId}`);
      setStudents(response.data.students || []);
    } catch (error) {
      Alert.alert('Error', 'Could not load students');
    } finally {
      setLoadingStudents(false);
    }
  };

  const saveStudent = async () => {
    if (!studentForm.name || !studentForm.school) {
      Alert.alert('Error', 'Name and School are required.');
      return;
    }
    
    try {
      if (editingStudent) {
        await api.put(`/students/${editingStudent.id}`, studentForm);
        Alert.alert('Success', 'Student updated successfully');
      } else {
        await api.post('/students', { ...studentForm, parentId: userId });
        Alert.alert('Success', 'Student added successfully');
      }
      setIsModalVisible(false);
      setEditingStudent(null);
      setStudentForm({ name: '', school: '', grade: '', pickupLocation: '', dropoffLocation: '' });
      fetchStudents(userId);
    } catch (error) {
      Alert.alert('Error', 'Failed to save student info');
    }
  };

  const confirmDeleteStudent = (id: string, name: string) => {
    Alert.alert('Delete Student', `Are you sure you want to remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/students/${id}`);
            fetchStudents(userId);
          } catch (error) {
            Alert.alert('Error', 'Failed to delete student');
          }
      }}
    ]);
  };

  const openStudentModal = (student: any = null) => {
    if (student) {
      setEditingStudent(student);
      setStudentForm({
        name: student.name || '',
        school: student.school || '',
        grade: student.grade || '',
        pickupLocation: student.pickup_location || '',
        dropoffLocation: student.dropoff_location || ''
      });
    } else {
      setEditingStudent(null);
      setStudentForm({ name: '', school: '', grade: '', pickupLocation: '', dropoffLocation: '' });
    }
    setIsModalVisible(true);
  };

  const renderStudentCard = ({ item }: { item: any }) => (
    <View style={styles.studentCard}>
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{item.name}</Text>
        <Text style={styles.studentDetails}>{item.school} | Grade: {item.grade || 'N/A'}</Text>
        <View style={styles.locationRow}>
          <MaterialCommunityIcons name="map-marker-radius" size={14} color="#64748B" />
          <Text style={styles.locationText}>Pickup: {item.pickup_location || 'Not set'}</Text>
        </View>
        <View style={styles.locationRow}>
          <MaterialCommunityIcons name="map-marker-check" size={14} color="#64748B" />
          <Text style={styles.locationText}>Dropoff: {item.dropoff_location || 'Not set'}</Text>
        </View>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.iconButton} onPress={() => openStudentModal(item)}>
          <MaterialCommunityIcons name="pencil" size={20} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => confirmDeleteStudent(item.id, item.name)}>
          <MaterialCommunityIcons name="delete" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {userName || role}!</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* --- DRIVER / ATTENDANT DASHBOARD --- */}
      {(role === 'Driver' || role === 'Attendant') && (
        <View>
          <Text style={styles.sectionTitle}>Quick Alerts</Text>
          <View style={styles.alertContainer}>
            <TouchableOpacity style={[styles.alertCard, { backgroundColor: '#FEF3C7' }]} onPress={() => sendAlert('Delay', 'Vehicle is delayed by 15 minutes.')}>
              <MaterialCommunityIcons name="clock-alert" size={32} color="#D97706" />
              <Text style={[styles.alertTitle, { color: '#D97706' }]}>Delayed</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.alertCard, { backgroundColor: '#FEE2E2' }]} onPress={() => sendAlert('Emergency', 'Vehicle breakdown or emergency.')}>
              <MaterialCommunityIcons name="alert" size={32} color="#DC2626" />
              <Text style={[styles.alertTitle, { color: '#DC2626' }]}>Emergency</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.alertCard, { backgroundColor: '#E0E7FF' }]} onPress={() => sendAlert('Route Change', 'Vehicle had to detour.')}>
              <MaterialCommunityIcons name="map-marker-path" size={32} color="#4F46E5" />
              <Text style={[styles.alertTitle, { color: '#4F46E5' }]}>Route Change</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Tracking is active!</Text>
            <Text style={styles.infoText}>Go to the "Live Map" tab to start or stop sharing your live location.</Text>
          </View>
        </View>
      )}

      {/* --- PARENT DASHBOARD --- */}
      {role === 'Parent' && (
        <View style={{ flex: 1 }}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>My Students</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => openStudentModal()}>
              <MaterialCommunityIcons name="plus" size={16} color="#fff" />
              <Text style={styles.addButtonText}>Add Student</Text>
            </TouchableOpacity>
          </View>

          {loadingStudents ? (
            <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 20 }} />
          ) : students.length > 0 ? (
            <FlatList
              data={students}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderStudentCard}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="account-school" size={48} color="#CBD5E1" />
              <Text style={styles.emptyStateText}>No students added yet.</Text>
            </View>
          )}

          {/* ADD/EDIT STUDENT MODAL */}
          <Modal visible={isModalVisible} animationType="slide" transparent={true}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{editingStudent ? 'Edit Student' : 'Add New Student'}</Text>
                
                <TextInput style={styles.input} placeholder="Full Name" value={studentForm.name} onChangeText={(t) => setStudentForm({...studentForm, name: t})} />
                <TextInput style={styles.input} placeholder="School Name" value={studentForm.school} onChangeText={(t) => setStudentForm({...studentForm, school: t})} />
                <View style={styles.row}>
                  <TextInput style={[styles.input, { flex: 1, marginRight: 10 }]} placeholder="Grade/Class" value={studentForm.grade} onChangeText={(t) => setStudentForm({...studentForm, grade: t})} />
                </View>
                <TextInput style={styles.input} placeholder="Pickup Location (e.g. Home)" value={studentForm.pickupLocation} onChangeText={(t) => setStudentForm({...studentForm, pickupLocation: t})} />
                <TextInput style={styles.input} placeholder="Dropoff Location (e.g. School)" value={studentForm.dropoffLocation} onChangeText={(t) => setStudentForm({...studentForm, dropoffLocation: t})} />

                <View style={styles.modalActions}>
                  <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setIsModalVisible(false)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={saveStudent}>
                    <Text style={styles.saveBtnText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, backgroundColor: '#fff', padding: 20, borderRadius: 12, elevation: 2 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#1E293B' },
  logoutButton: { backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  logoutText: { color: '#64748B', fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#334155', marginBottom: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  
  // Driver Styles
  alertContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  alertCard: { width: '31%', aspectRatio: 1, borderRadius: 16, justifyContent: 'center', alignItems: 'center', padding: 8 },
  alertTitle: { marginTop: 8, fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  infoCard: { backgroundColor: '#EFF6FF', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#BFDBFE' },
  infoTitle: { fontSize: 18, fontWeight: 'bold', color: '#1D4ED8', marginBottom: 8 },
  infoText: { color: '#3B82F6', lineHeight: 22 },
  
  // Parent / Student Styles
  addButton: { flexDirection: 'row', backgroundColor: '#3B82F6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  addButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 4 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyStateText: { color: '#94A3B8', marginTop: 10, fontSize: 16 },
  studentCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1 },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  studentDetails: { fontSize: 14, color: '#64748B', marginBottom: 8 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  locationText: { fontSize: 12, color: '#64748B', marginLeft: 4 },
  actionButtons: { flexDirection: 'row' },
  iconButton: { padding: 8, marginLeft: 4, backgroundColor: '#F1F5F9', borderRadius: 8 },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', width: '100%', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginBottom: 16 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', padding: 14, borderRadius: 10, marginBottom: 12, fontSize: 16 },
  row: { flexDirection: 'row' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  modalBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, marginLeft: 10 },
  cancelBtn: { backgroundColor: '#F1F5F9' },
  cancelBtnText: { color: '#64748B', fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#3B82F6' },
  saveBtnText: { color: '#fff', fontWeight: 'bold' }
});
