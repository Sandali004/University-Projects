<<<<<<< HEAD
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  Image, SafeAreaView, StatusBar, KeyboardAvoidingView,
  Platform, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { loginDriver } from '../services/loginService';

const BANNER_IMG = require('../assets/images/bus_banner.png');

export default function LoginScreen() {
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
      const result: any = await loginDriver(identifier, password);
      if (!result.success) {
        Alert.alert('Login Failed', result.message);
        return;
      }
      router.replace({
        pathname: '/(dashboard)/home',
        params: { role: 'Driver', driverId: result.driver?.id },
      });
    } catch (error: any) {
      Alert.alert('Login Error', error.message || 'Error occurred');
    } finally {
=======
// Import necessary modules from React and React Native
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router'; // Used for screen navigation
import AsyncStorage from '@react-native-async-storage/async-storage'; // Safe local storage
import api from '../services/api'; // Our custom Axios API client

// Screen Component: Driver Login
export default function LoginScreen() {
  // State variables: hold the email, password, and loading status
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // Controls the spinning loader
  const router = useRouter(); // Route navigator

  // Event handler for when the login button is pressed
  const handleLogin = async () => {
    // 1. Validation: ensure fields are not empty
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    
    setLoading(true); // Start loading spinner
    
    try {
      // 2. Make an API call to the backend login route properly referencing 'input' matching the email OR username pattern
      const response = await api.post('/driver/login', { input: email, password });
      
      // 3. If login is successful, the server returns a token
      if (response.data.token) {
        // Save the authentication token and driver profile data locally
        await AsyncStorage.setItem('driverToken', response.data.token);
        await AsyncStorage.setItem('driverData', JSON.stringify(response.data.driver));
        
        // 4. Navigate directly to the simple Map screen and pass the role parameter
        router.replace({ pathname: '/map', params: { role: 'Driver' } });
      }
    } catch (error: any) {
      // Handle login failures (e.g., wrong password, wrong email)
      console.log(error.response?.data || error.message);
      
      // If the backend isn't reachable (Network Error or Timeout), auto-approve as a Mock Success for developmental continuity
      if (!error.response || error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
         console.log("Backend offline or timed out. Falling back to MOCK SUCCESS routing.");
         Alert.alert('Mock Success (Server Offline)', 'The Node.js backend timed out, but we are letting you in to test the Map!', [
           { text: 'OK', onPress: () => {
               setLoading(false);
               router.replace({ pathname: '/map', params: { role: 'Driver' } });
             } 
           } 
         ]);
         return; 
      }

      Alert.alert('Login Failed', error.response?.data?.message || 'Something went wrong.');
    } finally {
      // Stop loading spinner regardless of success or failure
>>>>>>> IT24103379
      setLoading(false);
    }
  };

<<<<<<< HEAD
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
          
          {/* Top Banner */}
          <View style={styles.bannerContainer}>
            <Image 
              source={BANNER_IMG} 
              style={styles.bannerImage}
              resizeMode="cover"
            />
            <View style={styles.overlay}>
              <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.headerTextWrapper}>
                <Text style={styles.title}>Driver Login</Text>
                <Text style={styles.subtitle}>Safe routes for every student</Text>
              </View>
            </View>
          </View>

          {/* Login Card */}
          <View style={styles.loginCardWrapper}>
            <View style={styles.loginCard}>
              <Text style={styles.formTitle}>Enter Credentials</Text>
              <Text style={styles.formDesc}>Sign in to access your daily schedule and live tracking dashboard.</Text>
              
              <View style={styles.inputGroup}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
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
                      <Text style={styles.loginBtnText}>SIGN IN</Text>
                      <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </View>
                }
              </TouchableOpacity>

              <TouchableOpacity style={styles.forgotBtn}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Need technical help?</Text>
              <TouchableOpacity>
                <Text style={styles.supportText}>Contact Support</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { flexGrow: 1 },
  
  bannerContainer: { height: 320, position: 'relative' },
  bannerImage: { width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: 30, justifyContent: 'space-between' },
  backBtn: { marginTop: 40, width: 45, height: 45, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  headerTextWrapper: { marginBottom: 40 },
  title: { fontSize: 36, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 },
  subtitle: { fontSize: 16, color: '#F1F5F9', fontWeight: '500', opacity: 0.9, marginTop: 4 },

  loginCardWrapper: { marginTop: -50, paddingHorizontal: 25, flex: 1 },
  loginCard: { backgroundColor: '#FFFFFF', borderRadius: 32, padding: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 12 },
  formTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B', marginBottom: 5 },
  formDesc: { fontSize: 13, color: '#64748B', lineHeight: 20, marginBottom: 25 },

  inputGroup: { gap: 15, marginBottom: 25 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9', paddingHorizontal: 15 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 18, fontSize: 16, color: '#1E293B', fontWeight: '500' },

  loginBtn: { backgroundColor: '#3B82F6', borderRadius: 20, paddingVertical: 18, alignItems: 'center', shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 15, elevation: 8 },
  loginBtnDisabled: { opacity: 0.6 },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loginBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },

  forgotBtn: { marginTop: 20, alignSelf: 'center' },
  forgotText: { color: '#64748B', fontWeight: 'bold', fontSize: 14 },

  footerContainer: { marginTop: 30, paddingBottom: 30, alignItems: 'center', gap: 6 },
  footerText: { color: '#94A3B8', fontSize: 14 },
  supportText: { color: '#3B82F6', fontWeight: 'bold', fontSize: 14 },
=======
  // The visual layout (UI) is returned here
  return (
    <View style={styles.container}>
      {/* Header section with titles */}
      <View style={styles.header}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Log in to manage your vehicle and routes</Text>
      </View>

      {/* Form section containing inputs and buttons */}
      <View style={styles.form}>
        
        {/* Email/Username Input */}
        <TextInput
          style={styles.input}
          placeholder="Enter email or username"
          placeholderTextColor="#94A3B8" // Light gray color
          value={email}
          onChangeText={setEmail}
          keyboardType="default"
          autoCapitalize="none" // Keeps text lowercase natively where applicable
        />
        
        {/* Password Input */}
        <TextInput
          style={styles.input}
          placeholder="Enter password"
          placeholderTextColor="#94A3B8" // Light gray color
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true} // Hides the password characters 
        />
        
        {/* Login Submit Button */}
        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={handleLogin}
          disabled={loading} // Prevent multiple clicks while loading
        >
          {loading ? (
            <ActivityIndicator color="#fff" /> // Show spinner
          ) : (
            <Text style={styles.loginButtonText}>Login</Text> // Show text
          )}
        </TouchableOpacity>

      </View>
    </View>
  );
}

// Styling definitions for the UI using StyleSheet
const styles = StyleSheet.create({
  container: {
    flex: 1, // Takes up the entire screen height
    backgroundColor: '#F8FAFC',
    justifyContent: 'center', // Centers form vertically
    padding: 24,
  },
  header: { marginBottom: 40 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1E293B', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#64748B' },
  form: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2, // Helps display shadow on Android
  },
  input: {
    backgroundColor: '#F1F5F9',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 16,
    color: '#1E293B',
  },
  loginButton: {
    backgroundColor: '#3B82F6', // Blue primary color
    padding: 16,
    borderRadius: 12,
    alignItems: 'center', // Centers the text inside the button
    marginTop: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
>>>>>>> IT24103379
});
