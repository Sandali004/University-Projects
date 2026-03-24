import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function DriverProfileScreen() {
  const router = useRouter();

  // Sample driver data
  const driverDetails = {
    name: 'John Doe',
    phone: '+1 234 567 8900',
    email: 'johndoe@example.com',
    license: 'DL-987654321',
    vehicleType: 'Toyota HiAce (Van)',
    vehicleNumber: 'WP NC-1234',
    route: 'Colombo 7 -> Nugegoda',
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Driver Profile</Text>
        <View style={{ width: 40 }} /> {/* Spacer for centering title */}
      </View>

      {/* Profile Avatar Section */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatarBackground}>
          <Ionicons name="person" size={60} color="#334155" />
        </View>
        <Text style={styles.driverName}>{driverDetails.name}</Text>
        <Text style={styles.driverRole}>School Van Driver</Text>
      </View>

      {/* Details Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Personal Information</Text>
        
        <View style={styles.detailRow}>
          <Ionicons name="call" size={20} color="#64748B" style={styles.icon} />
          <View style={styles.detailTextContainer}>
            <Text style={styles.detailLabel}>Phone Number</Text>
            <Text style={styles.detailValue}>{driverDetails.phone}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="mail" size={20} color="#64748B" style={styles.icon} />
          <View style={styles.detailTextContainer}>
            <Text style={styles.detailLabel}>Email</Text>
            <Text style={styles.detailValue}>{driverDetails.email}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="card" size={20} color="#64748B" style={styles.icon} />
          <View style={styles.detailTextContainer}>
            <Text style={styles.detailLabel}>License Number</Text>
            <Text style={styles.detailValue}>{driverDetails.license}</Text>
          </View>
        </View>
      </View>

      {/* Vehicle Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Vehicle Information</Text>

        <View style={styles.detailRow}>
          <Ionicons name="bus" size={20} color="#64748B" style={styles.icon} />
          <View style={styles.detailTextContainer}>
            <Text style={styles.detailLabel}>Vehicle Type</Text>
            <Text style={styles.detailValue}>{driverDetails.vehicleType}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="car-sport" size={20} color="#64748B" style={styles.icon} />
          <View style={styles.detailTextContainer}>
            <Text style={styles.detailLabel}>Vehicle Number</Text>
            <Text style={styles.detailValue}>{driverDetails.vehicleNumber}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="map" size={20} color="#64748B" style={styles.icon} />
          <View style={styles.detailTextContainer}>
            <Text style={styles.detailLabel}>Route</Text>
            <Text style={styles.detailValue}>{driverDetails.route}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Light grayish-blue background
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60, // Safe padding for status bar if needed
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  driverName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 5,
  },
  driverRole: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  icon: {
    width: 30,
    textAlign: 'center',
    marginRight: 15,
  },
  detailTextContainer: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  detailLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
});
