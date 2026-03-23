import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router'; // Import the navigation hook

export default function WelcomeScreen() {
  const router = useRouter(); // Initialize router for navigation
  
  // Placeholder functions as requested
  const handleDriverPress = () => {
    console.log("Driver pressed");
  };

  const handleParentPress = () => {
    console.log("Parent pressed");
  };

  const handleAttendantPress = () => {
    console.log("Attendant pressed");
  };

  const handleRegistrationPress = () => {
    console.log("Registration Here pressed");
    // Trigger navigation to the new registration screen
    router.push('/registration');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.container}>
        
        {/* Header / Title Area */}
        <View style={styles.headerContainer}>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.titleText}>School Live Van</Text>
          <Text style={styles.titleText}>Tracking System</Text>
          <Text style={styles.subtitleText}>Please select your role to continue</Text>
        </View>

        {/* Main Role Buttons (Grouped with equal spacing) */}
        <View style={styles.roleButtonGroup}>
          <TouchableOpacity 
            style={styles.primaryButton} 
            activeOpacity={0.8}
            onPress={handleDriverPress}
          >
            <Text style={styles.buttonText}>Driver</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.primaryButton} 
            activeOpacity={0.8}
            onPress={handleParentPress}
          >
            <Text style={styles.buttonText}>Parent</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.primaryButton} 
            activeOpacity={0.8}
            onPress={handleAttendantPress}
          >
            <Text style={styles.buttonText}>Attendant</Text>
          </TouchableOpacity>
        </View>

        {/* Registration Button (Visually separated and lower) */}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Soft, modern background color
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  headerContainer: {
    alignItems: 'center',
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
    color: '#0F172A', // Dark contrasting color
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 36,
  },
  subtitleText: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 16,
  },
  roleButtonGroup: {
    gap: 16, // Creates equal spacing between the 3 buttons
  },
  primaryButton: {
    backgroundColor: '#3B82F6', // Beautiful primary blue
    paddingVertical: 18,
    borderRadius: 16, // Good rounded corners
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
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
    backgroundColor: 'transparent',
    borderWidth: 2, // Outline style button
    borderColor: '#3B82F6',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#3B82F6',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
