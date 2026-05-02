import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Image, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const HERO_IMAGE = require('../assets/images/van_hero.png');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Banner Section */}
        <View style={styles.bannerContainer}>
          <Image 
            source={HERO_IMAGE} 
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.bannerOverlay}>
            <View style={styles.logoBadge}>
              <Ionicons name="bus" size={24} color="#3B82F6" />
            </View>
          </View>
        </View>

        {/* Header Section */}
        <View style={styles.headerContainer}>
          <Text style={styles.welcomeText}>WELCOME TO</Text>
          <Text style={styles.titleText}>School Van Tracking</Text>
          <Text style={styles.subtitleText}>Safe, reliable transport tracking for your children's daily journey.</Text>
        </View>

        {/* Role Selection Section */}
        <View style={styles.roleSelectionContainer}>
          <Text style={styles.selectionPrompt}>Who are you?</Text>
          
          <View style={styles.roleGrid}>
            <TouchableOpacity 
              style={styles.roleCard}
              onPress={() => router.push('/login')}
            >
              <View style={[styles.roleIconBox, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="car-sport" size={28} color="#2563EB" />
              </View>
              <Text style={styles.roleCardTitle}>Driver</Text>
              <Text style={styles.roleCardSub}>Manage trip</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.roleCard}
              onPress={() => router.push('/parent-login')}
            >
              <View style={[styles.roleIconBox, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="people" size={28} color="#16A34A" />
              </View>
              <Text style={styles.roleCardTitle}>Parent</Text>
              <Text style={styles.roleCardSub}>Track kids</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.attendantFullCard}
            onPress={() => router.push('/attendant-login')}
          >
            <View style={[styles.roleIconBox, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="shield-checkmark" size={24} color="#9333EA" />
            </View>
            <View style={styles.attendantTextContainer}>
              <Text style={styles.roleCardTitle}>Attendant</Text>
              <Text style={styles.roleCardSub}>Onboard safety assistant</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        {/* Registration */}
        <View style={styles.footer}>
          <Text style={styles.footerLabel}>New to the system?</Text>
          <TouchableOpacity 
            style={styles.registrationBtn}
            onPress={() => router.push('/registration')}
          >
            <Text style={styles.registrationText}>Register Now</Text>
            <Ionicons name="arrow-forward" size={18} color="#3B82F6" />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { paddingBottom: 40 },
  
  bannerContainer: { width: '100%', height: 300, position: 'relative' },
  heroImage: { width: '100%', height: '100%', borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  bannerOverlay: { position: 'absolute', top: 20, left: 20 },
  logoBadge: { backgroundColor: '#fff', padding: 12, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },

  headerContainer: { paddingHorizontal: 30, paddingVertical: 25 },
  welcomeText: { color: '#3B82F6', fontWeight: '900', fontSize: 13, letterSpacing: 2, marginBottom: 5 },
  titleText: { fontSize: 32, fontWeight: '900', color: '#1E293B', lineHeight: 38 },
  subtitleText: { fontSize: 15, color: '#64748B', marginTop: 12, lineHeight: 22 },

  roleSelectionContainer: { paddingHorizontal: 25, marginTop: 10 },
  selectionPrompt: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 20 },
  roleGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  
  roleCard: {
    width: (width - 65) / 2,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  roleIconBox: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  roleCardTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  roleCardSub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },

  attendantFullCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginTop: 5,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  attendantTextContainer: { flex: 1, marginLeft: 15 },

  footer: { marginTop: 35, alignItems: 'center', gap: 10 },
  footerLabel: { color: '#94A3B8', fontSize: 14 },
  registrationBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 15 },
  registrationText: { color: '#3B82F6', fontWeight: '800', fontSize: 16 },
});

