import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, 
  ScrollView, Alert, ActivityIndicator, SafeAreaView, StatusBar 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [role, setRole] = useState('');
  const [userId, setUserId] = useState('');
  const [profile, setProfile] = useState<any>({});
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const driverData = await AsyncStorage.getItem('driverData');
      const parentData = await AsyncStorage.getItem('parentData');
      const attendantData = await AsyncStorage.getItem('attendantData');

      let id = '';
      let userRole = '';
      if (driverData) { id = JSON.parse(driverData).id; userRole = 'Driver'; }
      else if (parentData) { id = JSON.parse(parentData).id; userRole = 'Parent'; }
      else if (attendantData) { id = JSON.parse(attendantData).id; userRole = 'Attendant'; }

      setUserId(id);
      setRole(userRole);
      
      if (id) {
        const response = await api.get(`/profile/get?userId=${id}`);
        setProfile(response.data.profile);
        setFormData(response.data.profile);
      }
    } catch (error) {
      Alert.alert("Error", "Could not load profile data.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const payload = {
        userId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || '',
        licenseNumber: formData.license_number || '',
        emergencyContact: formData.emergency_contact || ''
      };
      
      const response = await api.put('/profile/update', payload);
      
      setProfile(response.data.profile);
      setEditMode(false);
      Alert.alert("Success", "Profile updated successfully!");
      
      // Update local storage name if it changed
      const storageKey = role.toLowerCase() + 'Data';
      const storageData = await AsyncStorage.getItem(storageKey);
      if (storageData) {
        const parsed = JSON.parse(storageData);
        parsed.name = response.data.profile.name;
        await AsyncStorage.setItem(storageKey, JSON.stringify(parsed));
      }
    } catch (error: any) {
      console.error("[handleUpdate] Error:", error.response?.data || error.message);
      Alert.alert("Error", error.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Account",
      "Are you absolutely sure? This will permanently delete your account and all associated data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete Everything", style: "destructive", onPress: confirmDelete }
      ]
    );
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/profile/delete/${userId}`);
      await AsyncStorage.multiRemove(['driverToken', 'parentToken', 'attendantToken', 'driverData', 'parentData', 'attendantData']);
      Alert.alert("Deleted", "Your account has been deleted.");
      router.replace('/');
    } catch (error) {
      Alert.alert("Error", "Could not delete account.");
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const accentColor = role === 'Parent' ? '#10B981' : role === 'Attendant' ? '#8B5CF6' : '#3B82F6';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={() => setEditMode(!editMode)}>
          <Text style={[styles.editBtn, { color: accentColor }]}>{editMode ? 'Cancel' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: accentColor }]}>
            <Text style={styles.avatarInitial}>{profile.name?.[0]}</Text>
          </View>
          <Text style={styles.userName}>{profile.name}</Text>
          <View style={[styles.roleBadge, { backgroundColor: accentColor + '20' }]}>
            <Text style={[styles.roleText, { color: accentColor }]}>{role}</Text>
          </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput 
            style={[styles.input, !editMode && styles.inputDisabled]}
            value={formData.name}
            onChangeText={(t) => setFormData({...formData, name: t})}
            editable={editMode}
            placeholder="Your Name"
          />

          <Text style={styles.label}>Email Address</Text>
          <TextInput 
            style={[styles.input, !editMode && styles.inputDisabled]}
            value={formData.email}
            onChangeText={(t) => setFormData({...formData, email: t})}
            editable={editMode}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="Email"
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput 
            style={[styles.input, !editMode && styles.inputDisabled]}
            value={formData.phone}
            onChangeText={(t) => setFormData({...formData, phone: t})}
            editable={editMode}
            keyboardType="phone-pad"
            placeholder="Phone Number"
          />

          {role === 'Driver' && (
            <>
              <Text style={styles.label}>License Number</Text>
              <TextInput 
                style={[styles.input, !editMode && styles.inputDisabled]}
                value={formData.license_number}
                onChangeText={(t) => setFormData({...formData, license_number: t})}
                editable={editMode}
                placeholder="License No"
              />
            </>
          )}

          {editMode && (
            <TouchableOpacity 
              style={[styles.saveBtn, { backgroundColor: accentColor }]} 
              onPress={handleUpdate}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
            <Text style={styles.deleteBtnText}>Delete My Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  backBtn: { flexDirection: 'row', alignItems: 'center', width: 100 },
  backBtnText: { marginLeft: 5, fontSize: 14, color: '#64748B', fontWeight: '600' },
  editBtn: { fontWeight: 'bold', width: 60, textAlign: 'right' },
  scroll: { paddingBottom: 40 },
  avatarContainer: { alignItems: 'center', paddingVertical: 30, backgroundColor: '#fff' },
  avatar: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  avatarInitial: { fontSize: 40, fontWeight: 'bold', color: '#fff' },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#1E293B' },
  roleBadge: { marginTop: 8, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  roleText: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  form: { padding: 20, marginTop: 10 },
  label: { fontSize: 14, fontWeight: '600', color: '#64748B', marginBottom: 8, marginLeft: 4 },
  input: { 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    borderRadius: 12, 
    padding: 15, 
    fontSize: 16, 
    color: '#1E293B',
    marginBottom: 20
  },
  inputDisabled: { backgroundColor: '#F1F5F9', color: '#64748B' },
  saveBtn: { padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  dangerZone: { marginTop: 40, padding: 20, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  dangerTitle: { fontSize: 16, fontWeight: 'bold', color: '#EF4444', marginBottom: 15 },
  deleteBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10, 
    padding: 15, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#EF4444' 
  },
  deleteBtnText: { color: '#EF4444', fontWeight: 'bold' }
});
