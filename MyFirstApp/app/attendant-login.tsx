import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import api from '../services/api';

export default function AttendantLoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); 
  const router = useRouter(); 

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert('Error', 'Please enter your login details.');
      return;
    }
    
    setLoading(true); 
    
    try {
      const response = await api.post('/attendant/login', { input: identifier, password });
      
      if (response.data.token) {
        await AsyncStorage.setItem('attendantToken', response.data.token);
        await AsyncStorage.setItem('attendantData', JSON.stringify(response.data.attendant));
        
        router.replace({ pathname: '/map', params: { role: 'Attendant' } });
      }
    } catch (error: any) {
      console.log(error.response?.data || error.message);

      // If the backend isn't reachable (Network Error or Timeout), auto-approve as a Mock Success for developmental continuity
      if (!error.response || error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
         console.log("Backend offline or timed out. Falling back to MOCK SUCCESS routing.");
         Alert.alert('Mock Success (Server Offline)', 'The Node.js backend timed out, but we are letting you in to test the Map!', [
           { text: 'OK', onPress: () => {
               setLoading(false);
               router.replace({ pathname: '/map', params: { role: 'Attendant' } });
             } 
           } 
         ]);
         return; 
      }

      Alert.alert('Login Failed', error.response?.data?.message || 'Invalid email/username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Attendant Portal</Text>
        <Text style={styles.subtitle}>Log in to manage student attendance</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Enter email or username"
          placeholderTextColor="#94A3B8" 
          value={identifier}
          onChangeText={setIdentifier}
          keyboardType="default"
          autoCapitalize="none" 
        />
        <TextInput
          style={styles.input}
          placeholder="Enter password"
          placeholderTextColor="#94A3B8" 
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true} 
        />
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Login</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', justifyContent: 'center', padding: 24, },
  header: { marginBottom: 40 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1E293B', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#64748B' },
  form: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, },
  input: { backgroundColor: '#F1F5F9', padding: 16, borderRadius: 12, fontSize: 16, marginBottom: 16, color: '#1E293B', },
  loginButton: { backgroundColor: '#3B82F6', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8, },
  loginButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', },
});
