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
      // 2. Make an API call to the backend login route
      const response = await api.post('/driver/login', { email, password });
      
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
      setLoading(false);
    }
  };

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
          placeholder="Enter email"
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
});
