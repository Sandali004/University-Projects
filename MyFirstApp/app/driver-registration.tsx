// ============================================================
// Driver Login Screen
// Authenticates via Backend API
// ============================================================
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, FlatList, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { registerDriver } from '../services/registrationService'; // Direct Supabase registration

// ── Chatbot questions list ──────────────────────────────
// Each object is one step in the registration chat
interface Question {
  id: string;
  type: string;
  text: string;
  options?: string[];
}

const questions: Question[] = [
  { id: 'name', type: 'text', text: 'Hello! Let\'s get you registered as a Driver. What is your full name?' },
  { id: 'phone', type: 'phone', text: 'Great. What is your phone number?' },
  { id: 'email', type: 'email', text: 'What is your email address?' },
  { id: 'password', type: 'password', text: 'Please enter a secure password.' },
  { id: 'licenseNumber', type: 'text', text: 'What is your driving license number?' },
  { id: 'emergencyContact', type: 'phone', text: 'Finally, what is your emergency contact number?' },
];

// ── Main Component ──────────────────────────────────────
export default function DriverRegistration() {
  const [messages, setMessages]     = useState<any[]>([]); // Chat bubble history
  const [currentStep, setCurrentStep] = useState(0);       // Which question we're on
  const [inputText, setInputText]   = useState('');        // Text typed in input box
  const [formData, setFormData]     = useState<any>({});   // All collected answers
  const [isFinished, setIsFinished] = useState(false);     // True = all questions done
  const [isLoading, setIsLoading]   = useState(false);     // True = waiting for server
  const router = useRouter();
  const flatListRef = useRef<any>(null);

  // Show the first question when the screen loads
  useEffect(() => {
    setMessages([{ id: '0', sender: 'bot', text: questions[0].text }]);
  }, []);

  // ── Handle user sending an answer ────────────────────
  const handleSend = (forcedValue: string | null = null) => {
    const value = forcedValue !== null ? forcedValue : inputText.trim();
    if (!value) return;

    const currentQ = questions[currentStep];

    // Add the user's answer to the chat
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: value }]);
    setInputText('');

    // Save the answer to formData
    const updatedFormData = { ...formData, [currentQ.id]: value };
    setFormData(updatedFormData);

    // Move to the next question or finish
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

  // ── Handle Reset ─────────────────────────────────────
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
      console.log("Submitting Driver Registration:", formData);
      
      // Call the registration service — it goes straight to Supabase
      const result = await registerDriver(formData);

      if (!result.success) {
        // Show the exact error in the chat bubble
        console.log('[DriverReg] Registration failed:', result.message);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'bot',
          text: `❌ ${result.message}\n\nPlease fix the above and tap Submit again.`,
        }]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        return;
      }

      // ✅ Success!
      console.log('[DriverReg] Registration success!', result.user?.id);
      Alert.alert('🎉 Registered!', 'Driver registered successfully! You can now log in.', [
        { text: 'Go to Login', onPress: () => router.push('/login') },
      ]);
    } catch (error: any) {
      // Catch any unexpected JS errors
      const msg = error.message || 'An unexpected error occurred. Please try again.';
      console.error('[DriverReg] Unexpected error:', msg);
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
      {/* Chat message list */}
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

      {/* Input section */}
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
        ) : currentQ?.type === 'choice' && currentQ.options ? (
          <View style={styles.choiceContainer}>
            {currentQ.options.map((opt: string) => (
              <TouchableOpacity key={opt} style={styles.choiceButton} onPress={() => handleSend(opt)}>
                <Text style={styles.choiceText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.textInputRow}>
            <TextInput
              style={styles.input}
              placeholder="Type your answer..."
              value={inputText}
              onChangeText={setInputText}
              secureTextEntry={currentQ?.type === 'password'}
              keyboardType={currentQ?.type === 'number' || currentQ?.type === 'phone' ? 'numeric' : currentQ?.type === 'email' ? 'email-address' : 'default'}
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
  userBubble: { backgroundColor: '#3B82F6', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 16, color: '#334155' },
  userBubbleText: { color: '#FFFFFF' },
  inputContainer: { padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  textInputRow: { flexDirection: 'row' },
  input: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 24, paddingHorizontal: 20, paddingVertical: 12, fontSize: 16, marginRight: 10 },
  sendButton: { backgroundColor: '#3B82F6', borderRadius: 24, justifyContent: 'center', paddingHorizontal: 20 },
  sendButtonDisabled: { backgroundColor: '#94A3B8' },
  sendButtonText: { color: '#FFFFFF', fontWeight: 'bold' },
  choiceContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  choiceButton: { backgroundColor: '#E0F2FE', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 24, borderWidth: 1, borderColor: '#BAE6FD' },
  choiceText: { color: '#0284C7', fontWeight: 'bold' },
  submitButton: { backgroundColor: '#10B981', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  submitButtonDisabled: { backgroundColor: '#6EE7B7' },
  submitButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  resetButton: { marginTop: 10, paddingVertical: 12, alignItems: 'center' },
  resetButtonText: { color: '#64748B', fontSize: 14, textDecorationLine: 'underline' },
});
