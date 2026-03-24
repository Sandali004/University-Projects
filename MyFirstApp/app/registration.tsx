import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';

export default function RegistrationScreen() {
  const router = useRouter();
  
  const handleDriverRegistration = () => {
    router.push('/driver-registration');
  };

  const handleParentRegistration = () => {
    router.push('/parent-registration');
  };

  const handleAttendantRegistration = () => {
    router.push('/attendant-registration');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* The container centers everything on the screen */}
      <View style={styles.container}>
        
        {/* Title Area */}
        <View style={styles.headerContainer}>
          <Text style={styles.titleText}>Register As</Text>
          <Text style={styles.subtitleText}>Choose your user type to create an account</Text>
        </View>

        {/* 3 Buttons in the center */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            style={styles.primaryButton} 
            activeOpacity={0.8}
            onPress={handleDriverRegistration}
          >
            <Text style={styles.buttonText}>Driver</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.primaryButton} 
            activeOpacity={0.8}
            onPress={handleParentRegistration}
          >
            <Text style={styles.buttonText}>Parent</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.primaryButton} 
            activeOpacity={0.8}
            onPress={handleAttendantRegistration}
          >
            <Text style={styles.buttonText}>Attendant</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Soft modern background color
  },
  container: {
    flex: 1,
    justifyContent: 'center', // Centers vertically
    paddingHorizontal: 24, // Centers horizontally with padding
  },
  headerContainer: {
    alignItems: 'center', // Centers text natively
    marginBottom: 48,
  },
  titleText: {
    fontSize: 28,
    color: '#0F172A', // Dark attractive slate
    fontWeight: 'bold',
  },
  subtitleText: {
    fontSize: 16,
    color: '#64748B', // Soft gray
    marginTop: 8,
    textAlign: 'center',
  },
  buttonGroup: {
    gap: 16, // Equal spacing between buttons
  },
  primaryButton: {
    backgroundColor: '#3B82F6', // Modern blue color
    paddingVertical: 18, // Good comfortable padding
    borderRadius: 16, // Beautiful rounded corners
    alignItems: 'center', // Centers text horizontally
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, // Drop shadow for depth
    shadowRadius: 8,
    elevation: 4, // Android drop shadow
  },
  buttonText: {
    color: '#FFFFFF', // White text
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
