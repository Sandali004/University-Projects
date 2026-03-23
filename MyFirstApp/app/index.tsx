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
    console.log("Parent pressed");
    // Placeholder: Connect to a Parent Login screen in the future
  };

  const handleAttendantPress = () => {
    console.log("Attendant pressed");
    // Placeholder: Connect to an Attendant Login screen in the future
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
    </SafeAreaView>
  );
}

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
});
