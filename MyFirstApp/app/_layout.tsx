import { Stack } from 'expo-router';
import React from 'react';

/**
 * Root Layout for the application.
 * Expo Router automatically uses a Stack Navigator under the hood.
 * Here we configure the Stack Navigaton options.
 */
export default function RootLayout() {
  return (
    <Stack>
      {/* Home Screen (Welcome Screen) */}
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false, // Hide header on home screen for a cleaner look
          title: 'Home' 
        }} 
      />
      
      {/* Driver Login Screen */}
      <Stack.Screen 
        name="login" 
        options={{ 
          title: 'Driver Login',
          headerStyle: { backgroundColor: '#F8FAFC' },
          headerShadowVisible: false,
        }} 
      />

      {/* Parent Login Screen */}
      <Stack.Screen 
        name="parent-login" 
        options={{ 
          title: 'Parent Login',
          headerStyle: { backgroundColor: '#F8FAFC' },
          headerShadowVisible: false,
        }} 
      />

      {/* Attendant Login Screen */}
      <Stack.Screen 
        name="attendant-login" 
        options={{ 
          title: 'Attendant Login',
          headerStyle: { backgroundColor: '#F8FAFC' },
          headerShadowVisible: false,
        }} 
      />
      
      {/* Simple Map Screen */}
      <Stack.Screen 
        name="map" 
        options={{ 
          title: 'Vehicle Tracker',
          headerStyle: { backgroundColor: '#3B82F6' }, // Blue header for Map
          headerTintColor: '#fff',
        }} 
      />
      
      {/* Registration Selection Screen */}
      <Stack.Screen 
        name="registration" 
        options={{ 
          title: 'Registration', // Title shown in header
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: '#F8FAFC' },
          headerShadowVisible: false, // Clean transition without shadow
        }} 
      />
      
      {/* Driver Registration Chatbot */}
      <Stack.Screen 
        name="driver-registration" 
        options={{ 
          title: 'Driver Setup',
          headerStyle: { backgroundColor: '#F8FAFC' },
          headerShadowVisible: false,
        }} 
      />
      
      {/* Parent Registration Chatbot */}
      <Stack.Screen 
        name="parent-registration" 
        options={{ 
          title: 'Parent Setup',
          headerStyle: { backgroundColor: '#F8FAFC' },
          headerShadowVisible: false,
        }} 
      />

      {/* Attendant Registration Chatbot */}
      <Stack.Screen 
        name="attendant-registration" 
        options={{ 
          title: 'Attendant Setup',
          headerStyle: { backgroundColor: '#F8FAFC' },
          headerShadowVisible: false,
        }} 
      />
      
      {/* Dashboard Screens Layout */}
      <Stack.Screen 
        name="(dashboard)" 
        options={{ 
          headerShown: false,
          gestureEnabled: false
        }} 
      />
    </Stack>
  );
}
