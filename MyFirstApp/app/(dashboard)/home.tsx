import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Alert, Modal, 
  TextInput, FlatList, ActivityIndicator, Image, ScrollView,
  SafeAreaView, Platform, StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

// Banner Images
const BANNER_IMAGE = require('../../assets/images/bus_banner.png');
const PARENT_HERO = require('../../assets/images/parent_hero.png');
const DRiver_CARD_IMG = require('../../assets/images/driver_card.png');
const PARENT_CARD_IMG = require('../../assets/images/parent_card.png');

export default function DashboardHomeScreen() {
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<'Driver' | 'Parent' | 'Attendant'>('Driver');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const router = useRouter();

  // Parent specific state
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [studentForm, setStudentForm] = useState({ name: '', school: '', grade: '', pickupLocation: '', dropoffLocation: '', joinCode: '' });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('appTheme');
      if (savedTheme) setTheme(savedTheme as 'light' | 'dark');
      else setTheme('dark'); // Default to dark as requested

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
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Logout', 
        style: 'destructive', 
        onPress: async () => {
          try {
            console.log('Starting logout process...');
            const keys = ['driverToken', 'driverData', 'parentToken', 'parentData', 'attendantToken', 'attendantData'];
            await AsyncStorage.multiRemove(keys);
            
            // Navigate to root index explicitly
            // Now that this file is 'home.tsx', there is no ambiguity with '/' pointing to the dashboard
            console.log('Navigating to welcome screen...');
            router.replace('/' as any);
          } catch (error) {
            console.error('Logout error:', error);
            router.replace('/' as any);
          }
        }
      }
    ]);
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
      setStudentForm({ name: '', school: '', grade: '', pickupLocation: '', dropoffLocation: '', joinCode: '' });
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
        dropoffLocation: student.dropoff_location || '',
        joinCode: student.join_code || '' 
      });
    } else {
      setEditingStudent(null);
      setStudentForm({ name: '', school: '', grade: '', pickupLocation: '', dropoffLocation: '', joinCode: '' });
    }
    setIsModalVisible(true);
  };

  const renderStudentCard = ({ item }: { item: any }) => (
    <View key={item.id} style={styles.studentCard}>
      <View style={styles.studentInfo}>
        <View style={styles.studentHeader}>
          <Ionicons name="person-circle" size={40} color="#3B82F6" />
          <View style={styles.studentNameContainer}>
            <Text style={styles.studentNameText}>{item.name}</Text>
            <Text style={styles.studentSchoolText}>{item.school} | Grade: {item.grade || 'N/A'}</Text>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.locationContainer}>
          <View style={styles.locationItem}>
            <View style={styles.locationIcon}>
              <Ionicons name="home" size={14} color="#3B82F6" />
            </View>
            <Text style={styles.locationLabel}>Pickup: <Text style={styles.locationVal}>{item.pickup_location || 'Not set'}</Text></Text>
          </View>
          <View style={styles.locationItem}>
            <View style={[styles.locationIcon, { backgroundColor: '#BBF7D0' }]}>
              <Ionicons name="school" size={14} color="#15803D" />
            </View>
            <Text style={styles.locationLabel}>Dropoff: <Text style={styles.locationVal}>{item.dropoff_location || 'Not set'}</Text></Text>
          </View>
        </View>
      </View>
      <View style={styles.studentActions}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => openStudentModal(item)}>
          <Ionicons name="create" size={20} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconBtn, { marginTop: 10 }]} onPress={() => confirmDeleteStudent(item.id, item.name)}>
          <Ionicons name="trash" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const isParent = role === 'Parent';
  const isDark = theme === 'dark';
  const bgColor = isDark ? '#0F172A' : '#F8FAFC';
  const cardColor = isDark ? '#1E293B' : '#FFFFFF';
  const textColor = isDark ? '#F1F5F9' : '#1E293B';
  const subTextColor = isDark ? '#94A3B8' : '#64748B';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={bgColor} />
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* Responsive Banner Section */}
        <View style={styles.bannerWrapper}>
          <Image 
            source={isParent ? PARENT_HERO : BANNER_IMAGE} 
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerAppName}>{isParent ? 'PARENT PORTAL' : 'SCHOOL VAN'}</Text>
            <Text style={styles.bannerTagline}>{isParent ? 'Track your child’s school vehicle easily and safely' : 'Reliable Tracking System'}</Text>
          </View>
        </View>

        {/* Floating Greeting Card */}
        <View style={styles.topCardWrapper}>
          <View style={[styles.headerCard, { backgroundColor: cardColor }]}>
            <View style={styles.headerInfo}>
              <Text style={[styles.welcomeText, { color: subTextColor }]}>Hello,</Text>
              <Text style={[styles.userNameText, { color: textColor }]}>{userName || 'Parent'}</Text>
              <View style={[styles.roleLabel, { backgroundColor: isParent ? '#E1EFFE' : '#EBF5FF' }]}>
                <Ionicons name={isParent ? "people" : "bus"} size={14} color="#1D4ED8" />
                <Text style={styles.roleLabelText}>{role}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.headerLogoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- Main Content Area --- */}
        <View style={styles.content}>
          
          {/* DRIVER / ATTENDANT SPECIFIC */}
          {(role === 'Driver' || role === 'Attendant') && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.mainTitle}>Vehicle Dashboard</Text>
                <Text style={styles.subTitle}>Manage your trip & alerts</Text>
              </View>
              <View style={styles.modernCard}>
                <Image source={DRiver_CARD_IMG} style={styles.cardIllustration} resizeMode="contain" />
                <View style={styles.cardBody}>
                  <Text style={styles.cardHeadline}>Quick Alerts</Text>
                  <Text style={styles.cardCaption}>Tap any alert to instantly notify parents.</Text>
                  <View style={styles.gridAlerts}>
                    <TouchableOpacity style={[styles.bigAlertBtn, { backgroundColor: '#FFF7ED' }]} onPress={() => sendAlert('Delay', 'Vehicle is delayed.')}>
                      <Ionicons name="time" size={28} color="#C2410C" />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.bigAlertBtn, { backgroundColor: '#FEF2F2' }]} onPress={() => sendAlert('Breakdown', 'Breakdown emergency.')}>
                      <Ionicons name="warning" size={28} color="#B91C1C" />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.bigAlertBtn, { backgroundColor: '#F0FDFA' }]} onPress={() => sendAlert('Boarded', 'All boarded safely.')}>
                      <Ionicons name="checkmark-circle" size={28} color="#0D9488" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.primaryActionBtn} onPress={() => router.push('/map')}>
                <Ionicons name="map" size={20} color="#fff" />
                <Text style={styles.primaryBtnText}>Open Live Map</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* PARENT DASHBOARD SPECIFIC */}
          {isParent && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.mainTitle}>Parent Dashboard</Text>
                <Text style={styles.subTitle}>Real-time family transportation tracking</Text>
              </View>

              {/* Action Grid for Parents */}
              <View style={styles.actionGrid}>
                <TouchableOpacity style={styles.smallActionCard} onPress={() => router.push('/map')}>
                  <View style={[styles.actionIconCircle, { backgroundColor: '#DBEAFE' }]}>
                    <Ionicons name="location" size={24} color="#2563EB" />
                  </View>
                  <Text style={styles.actionLabel}>View Map</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.smallActionCard} onPress={() => Alert.alert('Status', 'All students are currently in transit or at school.')}>
                  <View style={[styles.actionIconCircle, { backgroundColor: '#DCFCE7' }]}>
                    <Ionicons name="checkmark-done-circle" size={24} color="#16A34A" />
                  </View>
                  <Text style={styles.actionLabel}>Pickup Status</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.smallActionCard} onPress={() => router.push('/notifications')}>
                  <View style={[styles.actionIconCircle, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="notifications" size={24} color="#DC2626" />
                  </View>
                  <Text style={styles.actionLabel}>Notices</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.parentHeaderRow}>
                <View>
                  <Text style={styles.mainTitle}>My Students</Text>
                  <Text style={styles.subTitle}>{students.length} registered children</Text>
                </View>
                <TouchableOpacity style={styles.addStudentFloatBtn} onPress={() => openStudentModal()}>
                  <Ionicons name="add" size={28} color="#fff" />
                </TouchableOpacity>
              </View>

              {loadingStudents ? (
                <View style={styles.loaderContainer}><ActivityIndicator size="large" color="#3B82F6" /></View>
              ) : students.length > 0 ? (
                <View style={styles.studentListWrapper}>
                  {students.map((student) => renderStudentCard({ item: student }))}
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Image source={PARENT_CARD_IMG} style={styles.emptyImg} resizeMode="contain" />
                  <Text style={styles.emptyHeadline}>No Students Added</Text>
                  <Text style={styles.emptyDescription}>Enter your child's information to begin live van tracking.</Text>
                  <TouchableOpacity style={styles.emptyAddBtn} onPress={() => openStudentModal()}>
                    <Text style={styles.emptyAddBtnText}>+ Add Student Now</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

        </View>
      </ScrollView>

      {/* MODAL */}
      <Modal visible={isModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeading}>{editingStudent ? 'Edit Student' : 'New Registration'}</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}><Ionicons name="close" size={24} color="#64748B" /></TouchableOpacity>
            </View>
            <TextInput style={styles.formInput} placeholder="Student Full Name" value={studentForm.name} onChangeText={(t) => setStudentForm({...studentForm, name: t})} />
            <TextInput style={styles.formInput} placeholder="School Name" value={studentForm.school} onChangeText={(t) => setStudentForm({...studentForm, school: t})} />
            <TextInput style={styles.formInput} placeholder="Grade" value={studentForm.grade} onChangeText={(t) => setStudentForm({...studentForm, grade: t})} />
            <TextInput style={styles.formInput} placeholder="Pickup Address" value={studentForm.pickupLocation} onChangeText={(t) => setStudentForm({...studentForm, pickupLocation: t})} />
            <TextInput style={styles.formInput} placeholder="School Drop-off Point" value={studentForm.dropoffLocation} onChangeText={(t) => setStudentForm({...studentForm, dropoffLocation: t})} />
            
            <View style={styles.joinCodeInputWrapper}>
              <Ionicons name="key" size={18} color="#3B82F6" style={{ marginRight: 10 }} />
              <TextInput 
                style={styles.joinCodeInput} 
                placeholder="Van Join Code (from driver)" 
                value={studentForm.joinCode} 
                onChangeText={(t) => setStudentForm({...studentForm, joinCode: t})} 
              />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={saveStudent}><Text style={styles.submitBtnText}>Save Student Info</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  content: { paddingHorizontal: 20, paddingBottom: 100 },
  
  // Banner
  bannerWrapper: { height: 220, position: 'relative' },
  bannerImage: { width: '100%', height: '100%' },
  bannerOverlay: { position: 'absolute', bottom: 30, left: 20, right: 20 },
  bannerAppName: { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: 2, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 8 },
  bannerTagline: { color: '#fff', fontSize: 13, fontWeight: '600', opacity: 0.95, marginTop: 2 },

  // Header Card
  topCardWrapper: { marginTop: -40, paddingHorizontal: 20, marginBottom: 25 },
  headerCard: { backgroundColor: '#fff', borderRadius: 24, padding: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 15, elevation: 12 },
  headerInfo: { flex: 1 },
  welcomeText: { color: '#94A3B8', fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
  userNameText: { color: '#1E293B', fontSize: 24, fontWeight: '900', marginBottom: 6 },
  roleLabel: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100, gap: 6 },
  roleLabelText: { fontSize: 11, color: '#1D4ED8', fontWeight: '800', textTransform: 'uppercase' },
  headerLogoutBtn: { padding: 12, backgroundColor: '#F8FAFC', borderRadius: 14, zIndex: 100, elevation: 20 },

  // Grid Actions
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 30 },
  smallActionCard: { width: '31%', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 15, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  actionIconCircle: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 9, fontWeight: '800', color: '#64748B', textAlign: 'center' },

  // Section Headers
  sectionHeader: { marginBottom: 20 },
  mainTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
  subTitle: { fontSize: 14, color: '#94A3B8', marginTop: 2 },

  // Cards
  modernCard: { backgroundColor: '#fff', borderRadius: 24, marginBottom: 25, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 5, overflow: 'hidden' },
  cardIllustration: { width: '100%', height: 150, backgroundColor: '#F0F9FF' },
  cardBody: { padding: 20 },
  cardHeadline: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  cardCaption: { fontSize: 13, color: '#64748B', marginBottom: 20 },
  gridAlerts: { flexDirection: 'row', justifyContent: 'space-between' },
  bigAlertBtn: { width: '31%', aspectRatio: 1, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  primaryActionBtn: { backgroundColor: '#3B82F6', borderRadius: 20, paddingVertical: 18, flexDirection: 'row', justifyContent: 'center', gap: 10 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Parent Student List
  parentHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  addStudentFloatBtn: { backgroundColor: '#3B82F6', width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', shadowColor: '#3B82F6', shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  studentListWrapper: { gap: 16 },
  studentCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, flexDirection: 'row', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 4 },
  studentInfo: { flex: 1 },
  studentHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 },
  studentNameContainer: { flex: 1 },
  studentNameText: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  studentSchoolText: { fontSize: 12, color: '#64748B' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 15 },
  locationContainer: { gap: 8 },
  locationItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  locationIcon: { padding: 6, backgroundColor: '#DBEAFE', borderRadius: 8 },
  locationLabel: { fontSize: 12, color: '#94A3B8' },
  locationVal: { color: '#444', fontWeight: '700' },
  studentActions: { justifyContent: 'center', paddingLeft: 10 },
  iconBtn: { padding: 12, backgroundColor: '#F8FAFC', borderRadius: 15 },
  emptyContainer: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 30, padding: 40 },
  emptyImg: { width: 180, height: 140, marginBottom: 20 },
  emptyHeadline: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
  emptyDescription: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginTop: 10 },
  emptyAddBtn: { marginTop: 25, backgroundColor: '#3B82F6', paddingHorizontal: 25, paddingVertical: 14, borderRadius: 100 },
  emptyAddBtnText: { color: '#fff', fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.75)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#fff', borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 30, paddingBottom: 50 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalHeading: { fontSize: 24, fontWeight: '900', color: '#1E293B' },
  formInput: { backgroundColor: '#F8FAFC', borderRadius: 18, padding: 18, fontSize: 16, marginBottom: 15, borderWidth: 1, borderColor: '#F1F5F9' },
  submitBtn: { backgroundColor: '#3B82F6', borderRadius: 20, paddingVertical: 18, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  joinCodeInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 18,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE'
  },
  joinCodeInput: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '600'
  },
  loaderContainer: { marginTop: 40, alignItems: 'center' }
});
