<<<<<<< HEAD
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
=======
// Import React and standard React Native components
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router'; // Import the navigation hook from Expo Router

// Screen Component: Home/Welcome Screen
export default function WelcomeScreen() {
  const router = useRouter(); // Initialize router to handle screen navigation
  
  // Event Handlers for button presses
  
  const handleDriverPress = () => {
    // Navigate straight to the driver login screen
    router.push('/login'); 
  };

  const handleParentPress = () => {
    // Navigate straight to the parent login screen
    router.push('/parent-login'); 
  };

  const handleAttendantPress = () => {
    // Navigate straight to the attendant login screen
    router.push('/attendant-login');
  };

  const handleRegistrationPress = () => {
    // Navigate to the Registration menu selection screen
    router.push('/registration');
  };

  return (
    // SafeAreaView ensures content isn't hidden behind phone notches (like iPhone dynamic island)
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.container}>
        
        {/* Header Section: Welcome formatting */}
        <View style={styles.headerContainer}>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.titleText}>School Live Van</Text>
          <Text style={styles.titleText}>Tracking System</Text>
          <Text style={styles.subtitleText}>Please select your role to continue</Text>
        </View>

        {/* Main Role Buttons: Grouped vertically using gap spacing */}
        <View style={styles.roleButtonGroup}>
          
          {/* Driver Button */}
          <TouchableOpacity 
            style={styles.primaryButton} 
            activeOpacity={0.8} // Dims slightly when pressed
            onPress={handleDriverPress}
          >
            <Text style={styles.buttonText}>Driver</Text>
          </TouchableOpacity>

          {/* Parent Button */}
          <TouchableOpacity 
            style={styles.primaryButton} 
            activeOpacity={0.8}
            onPress={handleParentPress}
          >
            <Text style={styles.buttonText}>Parent</Text>
          </TouchableOpacity>

          {/* Attendant Button */}
          <TouchableOpacity 
            style={styles.primaryButton} 
            activeOpacity={0.8}
            onPress={handleAttendantPress}
          >
            <Text style={styles.buttonText}>Attendant</Text>
          </TouchableOpacity>
        </View>

        {/* Registration Button: Visually separated with an outline and placed lower via margins */}
        <View style={styles.registrationContainer}>
          <TouchableOpacity 
            style={styles.secondaryButton} 
            activeOpacity={0.8}
            onPress={handleRegistrationPress}
          >
            <Text style={styles.secondaryButtonText}>Registration Here</Text>
          </TouchableOpacity>
        </View>

      </View>
>>>>>>> IT24103379
    </SafeAreaView>
  );
}

<<<<<<< HEAD
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
=======
// Styling Object
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Soft, modern background color
  },
  container: {
    flex: 1,
    justifyContent: 'center', // Centers everything vertically in the screen
    paddingHorizontal: 24, // Keeps content from touching the screen edges
  },
  headerContainer: {
    alignItems: 'center', // Centers text natively
    marginBottom: 50,
  },
  welcomeText: {
    fontSize: 18,
    color: '#64748B', // Slate gray for subtitle
    fontWeight: '500',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  titleText: {
    fontSize: 28,
    color: '#0F172A', // Dark contrasting color for visibility
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 36, // Line height improves readability for wrapped text
  },
  subtitleText: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 16,
  },
  roleButtonGroup: {
    gap: 16, // Creates equal spacing between the 3 buttons easily
  },
  primaryButton: {
    backgroundColor: '#3B82F6', // Beautiful primary blue
    paddingVertical: 18,
    borderRadius: 16, // Good rounded corners
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, // Subtle drop shadow
    shadowRadius: 8,
    elevation: 4, // Drop shadow for Android
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  registrationContainer: {
    marginTop: 40, // Small extra gap so it looks slightly separated and lower
  },
  secondaryButton: {
    backgroundColor: 'transparent', // No fill color
    borderWidth: 2, // Outline style button
    borderColor: '#3B82F6', // Same blue as regular buttons
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#3B82F6',
    fontSize: 18,
    fontWeight: 'bold',
  },
>>>>>>> IT24103379
});
