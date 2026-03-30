import React, { useState } from 'react';
<<<<<<< HEAD
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  Image, SafeAreaView, StatusBar, KeyboardAvoidingView,
  Platform, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { loginAttendant } from '../services/loginService';

const BANNER_IMG = require('../assets/images/bus_banner.png');

export default function AttendantLoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]     = useState('');
  const [loading, setLoading]       = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      Alert.alert('Missing Details', 'Please enter your email/username and password.');
      return;
    }

    setLoading(true);
    try {
      const result: any = await loginAttendant(identifier, password);
      if (!result.success) {
        Alert.alert('Login Failed', result.message);
        return;
      }
      router.replace({
        pathname: '/(dashboard)/home' as any,
        params: { role: 'Attendant', attendantId: result.attendant?.id },
      });
    } catch (error: any) {
      Alert.alert('Login Error', error.message || 'Error occurred');
=======
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import api from '../services/api';

export default function AttendantLoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); 
  const router = useRouter(); 

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert('Error', 'Please enter your login details.');
      return;
    }
    
    setLoading(true); 
    
    try {
      const response = await api.post('/attendant/login', { input: identifier, password });
      
      if (response.data.token) {
        await AsyncStorage.setItem('attendantToken', response.data.token);
        await AsyncStorage.setItem('attendantData', JSON.stringify(response.data.attendant));
        
        router.replace({ pathname: '/map', params: { role: 'Attendant' } });
      }
    } catch (error: any) {
      console.log(error.response?.data || error.message);

      // If the backend isn't reachable (Network Error or Timeout), auto-approve as a Mock Success for developmental continuity
      if (!error.response || error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
         console.log("Backend offline or timed out. Falling back to MOCK SUCCESS routing.");
         Alert.alert('Mock Success (Server Offline)', 'The Node.js backend timed out, but we are letting you in to test the Map!', [
           { text: 'OK', onPress: () => {
               setLoading(false);
               router.replace({ pathname: '/map', params: { role: 'Attendant' } });
             } 
           } 
         ]);
         return; 
      }

      Alert.alert('Login Failed', error.response?.data?.message || 'Invalid email/username or password');
>>>>>>> IT24103379
    } finally {
      setLoading(false);
    }
  };

  return (
<<<<<<< HEAD
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
          
          <View style={styles.bannerContainer}>
            <Image source={BANNER_IMG} style={styles.bannerImage} resizeMode="cover" />
            <View style={styles.overlay}>
              <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.headerTextWrapper}>
                <Text style={styles.title}>Attendant Login</Text>
                <Text style={styles.subtitle}>Welcome back! Ensuring student safety.</Text>
              </View>
            </View>
          </View>

          <View style={styles.loginCardWrapper}>
            <View style={styles.loginCard}>
              <Text style={styles.formTitle}>Attendant Portal</Text>
              <Text style={styles.formDesc}>Sign in to manage student attendance and safety logs.</Text>
              
              <View style={styles.inputGroup}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="shield-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email or Username"
                    placeholderTextColor="#94A3B8"
                    value={identifier}
                    onChangeText={setIdentifier}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <View style={styles.btnContent}>
                      <Text style={styles.loginBtnText}>PORTAL SIGN IN</Text>
                      <Ionicons name="chevron-forward" size={18} color="#fff" />
                    </View>
                }
              </TouchableOpacity>

              <TouchableOpacity style={styles.forgotBtn} onPress={() => Alert.alert('Help', 'Contact your supervisor for password retrieval.')}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
=======
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Attendant Portal</Text>
        <Text style={styles.subtitle}>Log in to manage student attendance</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Enter email or username"
          placeholderTextColor="#94A3B8" 
          value={identifier}
          onChangeText={setIdentifier}
          keyboardType="default"
          autoCapitalize="none" 
        />
        <TextInput
          style={styles.input}
          placeholder="Enter password"
          placeholderTextColor="#94A3B8" 
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true} 
        />
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Login</Text>}
        </TouchableOpacity>
      </View>
    </View>
>>>>>>> IT24103379
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { flexGrow: 1 },
  bannerContainer: { height: 320, position: 'relative' },
  bannerImage: { width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(76, 29, 149, 0.45)', padding: 30, justifyContent: 'space-between' },
  backBtn: { marginTop: 40, width: 45, height: 45, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  headerTextWrapper: { marginBottom: 40 },
  title: { fontSize: 36, fontWeight: '900', color: '#FFFFFF' },
  subtitle: { fontSize: 16, color: '#F1F5F9', fontWeight: '500', opacity: 0.9, marginTop: 4 },
  loginCardWrapper: { marginTop: -50, paddingHorizontal: 25, flex: 1 },
  loginCard: { backgroundColor: '#FFFFFF', borderRadius: 32, padding: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 12 },
  formTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B', marginBottom: 5 },
  formDesc: { fontSize: 13, color: '#64748B', lineHeight: 20, marginBottom: 25 },
  inputGroup: { gap: 15, marginBottom: 25 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9', paddingHorizontal: 15 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 18, fontSize: 16, color: '#1E293B', fontWeight: '500' },
  loginBtn: { backgroundColor: '#8B5CF6', borderRadius: 20, paddingVertical: 18, alignItems: 'center', shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 15, elevation: 8 },
  loginBtnDisabled: { opacity: 0.6 },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loginBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  forgotBtn: { marginTop: 20, alignSelf: 'center' },
  forgotText: { color: '#64748B', fontWeight: 'bold', fontSize: 14 },
=======
  container: { flex: 1, backgroundColor: '#F8FAFC', justifyContent: 'center', padding: 24, },
  header: { marginBottom: 40 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1E293B', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#64748B' },
  form: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, },
  input: { backgroundColor: '#F1F5F9', padding: 16, borderRadius: 12, fontSize: 16, marginBottom: 16, color: '#1E293B', },
  loginButton: { backgroundColor: '#3B82F6', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8, },
  loginButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', },
>>>>>>> IT24103379
});
