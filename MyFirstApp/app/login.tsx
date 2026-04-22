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
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <KeyboardAvoidingView 
        behavior="padding"
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 80}
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
});
