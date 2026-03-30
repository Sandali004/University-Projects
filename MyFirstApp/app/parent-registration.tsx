// Parent Registration - Chatbot Screen
// Collects parent/child info step-by-step and saves via Backend API

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, FlatList, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { registerParent } from '../services/registrationService';

interface Question {
  id: string;
  type: string;
  text: string;
}

// All parent registration questions
const questions: Question[] = [
  { id: 'name',             type: 'text',     text: "Hello! Let's get you registered as a Parent. What is your full name?" },
  { id: 'username',         type: 'text',     text: 'Choose a username (e.g. mary_parent).' },
  { id: 'phone',            type: 'phone',    text: 'What is your phone number?' },
  { id: 'email',            type: 'email',    text: 'What is your email address?' },
  { id: 'password',         type: 'password', text: 'Please enter a secure password (min 6 characters).' },
  { id: 'childName',        type: 'text',     text: "What is your child's full name?" },
  { id: 'childGrade',       type: 'text',     text: "What is your child's grade or class? (e.g. Grade 5)" },
  { id: 'pickupLocation',   type: 'text',     text: 'What is the pickup location for your child?' },
  { id: 'dropLocation',     type: 'text',     text: 'What is the drop-off location?' },
  { id: 'emergencyContact', type: 'phone',    text: 'Finally, what is your emergency contact number?' },
];

export default function ParentRegistration() {
  const [messages, setMessages]       = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [inputText, setInputText]     = useState('');
  const [formData, setFormData]       = useState<any>({});
  const [isFinished, setIsFinished]   = useState(false);
  const [isLoading, setIsLoading]     = useState(false);
  const router = useRouter();
  const flatListRef = useRef<any>(null);

  useEffect(() => {
    setMessages([{ id: '0', sender: 'bot', text: questions[0].text }]);
  }, []);

  const handleSend = (forcedValue: string | null = null) => {
    const value = forcedValue !== null ? forcedValue : inputText.trim();
    if (!value) return;

    const currentQ = questions[currentStep];
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: value }]);
    setInputText('');

    const updatedFormData = { ...formData, [currentQ.id]: value };
    setFormData(updatedFormData);

    if (currentStep < questions.length - 1) {
      setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: questions[currentStep + 1].text }]);
        setCurrentStep(currentStep + 1);
      }, 450);
    } else {
      setIsFinished(true);
      setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: '✅ All done! Please review and submit your registration below.' }]);
      }, 450);
    }
  };

  const handleReset = () => {
    setMessages([{ id: '0', sender: 'bot', text: questions[0].text }]);
    setCurrentStep(0);
    setFormData({});
    setIsFinished(false);
    setInputText('');
  };

  // ── Handle Submit — sends directly to Supabase (no backend needed!) ──
  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      console.log('[ParentReg] Calling registerParent service...');

      const result = await registerParent(formData);

      if (!result.success) {
        console.log('[ParentReg] Registration failed:', result.message);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'bot',
          text: `❌ ${result.message}\n\nPlease fix the above and tap Submit again.`,
        }]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        return;
      }

      console.log('[ParentReg] Registration success!', result.user?.id);
      Alert.alert('🎉 Registered!', 'Parent registered successfully! You can now log in.', [
        { text: 'Go to Login', onPress: () => router.push('/parent-login') },
      ]);
    } catch (error: any) {
      const msg = error.message || 'An unexpected error occurred. Please try again.';
      console.error('[ParentReg] Unexpected error:', msg);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'bot',
        text: `❌ Error: ${msg}\n\nPlease try submitting again.`,
      }]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } finally {
      setIsLoading(false);
    }
  };

  const currentQ = questions[currentStep];

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.sender === 'user' ? styles.userBubble : styles.botBubble]}>
            <Text style={[styles.bubbleText, item.sender === 'user' && styles.userBubbleText]}>{item.text}</Text>
          </View>
        )}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        contentContainerStyle={styles.chatContainer}
      />

      <View style={styles.inputContainer}>
        {isFinished ? (
          <View>
            <TouchableOpacity style={[styles.submitButton, isLoading && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={isLoading}>
              <Text style={styles.submitButtonText}>{isLoading ? 'Submitting...' : 'Submit Registration'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>Start Over / Fix Details</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.textInputRow}>
            <TextInput
              style={styles.input}
              placeholder="Type your answer..."
              value={inputText}
              onChangeText={setInputText}
              secureTextEntry={currentQ?.type === 'password'}
              keyboardType={currentQ?.type === 'phone' ? 'numeric' : currentQ?.type === 'email' ? 'email-address' : 'default'}
              autoCapitalize={currentQ?.type === 'email' || currentQ?.type === 'password' ? 'none' : 'words'}
              onSubmitEditing={() => handleSend()}
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={() => handleSend()}
              disabled={!inputText.trim()}
            >
              <Text style={styles.sendButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  chatContainer: { padding: 16, paddingBottom: 24 },
  bubble: { maxWidth: '80%', padding: 14, borderRadius: 20, marginBottom: 12 },
  botBubble: { backgroundColor: '#FFFFFF', alignSelf: 'flex-start', borderBottomLeftRadius: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  userBubble: { backgroundColor: '#10B981', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 16, color: '#334155' },
  userBubbleText: { color: '#FFFFFF' },
  inputContainer: { padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  textInputRow: { flexDirection: 'row' },
  input: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 24, paddingHorizontal: 20, paddingVertical: 12, fontSize: 16, marginRight: 10 },
  sendButton: { backgroundColor: '#10B981', borderRadius: 24, justifyContent: 'center', paddingHorizontal: 20 },
  sendButtonDisabled: { backgroundColor: '#94A3B8' },
  sendButtonText: { color: '#FFFFFF', fontWeight: 'bold' },
  submitButton: { backgroundColor: '#10B981', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  submitButtonDisabled: { backgroundColor: '#6EE7B7' },
  submitButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  resetButton: { marginTop: 10, paddingVertical: 12, alignItems: 'center' },
  resetButtonText: { color: '#64748B', fontSize: 14, textDecorationLine: 'underline' },
});
