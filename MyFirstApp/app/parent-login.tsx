// ============================================================
// Parent Login Screen
// Authenticates directly against Supabase 'parents' table
// No backend server required — works on any internet connection
// ============================================================
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { loginParent } from '../services/loginService';

export default function ParentLoginScreen() {
  const [identifier, setIdentifier] = useState(''); // email OR username
  const [password, setPassword]     = useState('');
  const [loading, setLoading]       = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      Alert.alert('Missing Details', 'Please enter your email/username and password.');
      return;
    }

    setLoading(true);
    try {
      console.log('[ParentLogin] Attempting login for:', identifier.trim());

      const result = await loginParent(identifier, password);

      if (!result.success) {
        console.log('[ParentLogin] Failed:', result.message);
        Alert.alert('Login Failed', result.message);
        return;
      }

      console.log('[ParentLogin] Success! Parent:', result.parent?.name);
      router.replace({
        pathname: '/(dashboard)/map',
        params: { role: 'Parent', parentId: result.parent?.id },
      });
    } catch (error: any) {
      const msg = error.message || 'An unexpected error occurred. Please try again.';
      console.error('[ParentLogin] Unexpected error:', msg);
      Alert.alert('Login Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Parent Portal</Text>
        <Text style={styles.subtitle}>Log in to track your child's vehicle</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Email or Username</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email or username"
          placeholderTextColor="#94A3B8"
          value={identifier}
          onChangeText={setIdentifier}
          keyboardType="default"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          placeholderTextColor="#94A3B8"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true}
        />

        <TouchableOpacity
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.loginButtonText}>Login</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:           { flex: 1, backgroundColor: '#F8FAFC', justifyContent: 'center', padding: 24 },
  header:              { marginBottom: 40 },
  title:               { fontSize: 32, fontWeight: 'bold', color: '#1E293B', marginBottom: 8 },
  subtitle:            { fontSize: 16, color: '#64748B' },
  form:                { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  label:               { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 6 },
  input:               { backgroundColor: '#F1F5F9', padding: 16, borderRadius: 12, fontSize: 16, marginBottom: 16, color: '#1E293B' },
  loginButton:         { backgroundColor: '#10B981', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  loginButtonDisabled: { backgroundColor: '#6EE7B7' },
  loginButtonText:     { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});
