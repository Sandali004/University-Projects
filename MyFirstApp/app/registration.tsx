import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Image, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const REG_BANNER = require('../assets/images/registration_bus.png');

export default function RegistrationScreen() {
  const router = useRouter();
  
  const handleDriverRegistration = () => router.push('/driver-registration');
  const handleParentRegistration = () => router.push('/parent-registration');
  const handleAttendantRegistration = () => router.push('/attendant-registration');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Banner with Back Button */}
        <View style={styles.bannerContainer}>
          <Image source={REG_BANNER} style={styles.bannerImage} resizeMode="cover" />
          <View style={styles.overlay}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTitleWrapper}>
              <Text style={styles.mainTitle}>Join Our Community</Text>
              <Text style={styles.mainSubtitle}>Choose your role to get started</Text>
            </View>
          </View>
        </View>

        {/* Selection Cards */}
        <View style={styles.content}>
          <Text style={styles.sectionHeading}>Registration Options</Text>
          
          <TouchableOpacity 
            style={[styles.regCard, { borderLeftColor: '#3B82F6' }]} 
            activeOpacity={0.7}
            onPress={handleDriverRegistration}
          >
            <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="car" size={28} color="#3B82F6" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Register as Driver</Text>
              <Text style={styles.cardDesc}>Sign up to manage your van, route, and kids safely.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.regCard, { borderLeftColor: '#10B981' }]} 
            activeOpacity={0.7}
            onPress={handleParentRegistration}
          >
            <View style={[styles.iconBox, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="people" size={28} color="#10B981" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Register as Parent</Text>
              <Text style={styles.cardDesc}>Add your students to track their live journey daily.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.regCard, { borderLeftColor: '#8B5CF6' }]} 
            activeOpacity={0.7}
            onPress={handleAttendantRegistration}
          >
            <View style={[styles.iconBox, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="shield-checkmark" size={28} color="#8B5CF6" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Register as Attendant</Text>
              <Text style={styles.cardDesc}>Help with on-board student safety and attendance.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>

          {/* Help Card */}
          <View style={styles.helpContainer}>
              <Ionicons name="information-circle" size={20} color="#94A3B8" />
              <Text style={styles.helpText}>Registration takes less than 2 minutes.</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { paddingBottom: 50 },
  
  bannerContainer: { height: 320, position: 'relative' },
  bannerImage: { width: '100%', height: '100%', borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: 30, justifyContent: 'space-between' },
  backBtn: { marginTop: 40, width: 45, height: 45, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  headerTitleWrapper: { marginBottom: 30 },
  mainTitle: { fontSize: 32, fontWeight: '900', color: '#fff' },
  mainSubtitle: { fontSize: 16, color: '#f1f5f9', marginTop: 4, fontWeight: '500' },

  content: { paddingHorizontal: 25, marginTop: 30 },
  sectionHeading: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 20 },

  regCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  iconBox: { width: 55, height: 55, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1, marginLeft: 16, marginRight: 8 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
  cardDesc: { fontSize: 12, color: '#64748B', marginTop: 4, lineHeight: 18 },

  helpContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, opacity: 0.8 },
  helpText: { color: '#94A3B8', fontSize: 13, fontWeight: '500' },
});
