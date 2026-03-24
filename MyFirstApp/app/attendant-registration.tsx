import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../services/api';

// Attendant specific questions
const questions = [
  { id: 'name', type: 'text', text: 'Hello! Let\'s get you registered as an Attendant. What is your full name?' },
  { id: 'username', type: 'text', text: 'Please choose a unique username for logging in.' },
  { id: 'phone', type: 'phone', text: 'What is your phone number?' },
  { id: 'email', type: 'email', text: 'What is your email address?' },
  { id: 'password', type: 'password', text: 'Please enter a secure password.' },
  { id: 'nicNumber', type: 'text', text: 'What is your NIC number?' },
  { id: 'assignedVehicle', type: 'text', text: 'What vehicle are you assigned to? (Vehicle Number)' },
  { id: 'emergencyContact', type: 'phone', text: 'Finally, what is your emergency contact number?' },
];

export default function AttendantRegistration() {
  const [messages, setMessages] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [inputText, setInputText] = useState('');
  const [formData, setFormData] = useState<any>({});
  const [isFinished, setIsFinished] = useState(false);
  const router = useRouter();
  const flatListRef = useRef<any>(null);

  useEffect(() => {
    setMessages([{ id: Date.now().toString(), sender: 'bot', text: questions[0].text }]);
  }, []);

  const handleSend = () => {
    const value = inputText.trim();
    if (!value) return;

    const currentQ = questions[currentStep];

    const newMessages = [...messages, { id: Date.now().toString(), sender: 'user', text: value }];
    setMessages(newMessages);
    setInputText('');

    const updatedFormData = { ...formData, [currentQ.id]: value };
    setFormData(updatedFormData);

    if (currentStep < questions.length - 1) {
      setTimeout(() => {
        setMessages((prev: any[]) => [...prev, { id: Date.now().toString(), sender: 'bot', text: questions[currentStep + 1].text }]);
        setCurrentStep(currentStep + 1);
      }, 500);
    } else {
      setIsFinished(true);
      setTimeout(() => {
        setMessages((prev: any[]) => [...prev, { id: Date.now().toString(), sender: 'bot', text: 'All done! Please submit your registration below.' }]);
      }, 500);
    }
  };

  const handleSubmit = async () => {
    try {
      console.log("Submitting Attendant Registration:", formData);
      
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: 'attendant'
      };

      await api.post('/attendant/register', payload);
      
      Alert.alert('Success', 'Attendant Registration Complete!', [
        { text: 'OK', onPress: () => router.push('/attendant-login') }
      ]);
    } catch (error: any) {
      console.log("Attendant Registration Error:", error.response?.data || error.message);
      
      let errorMessage = "An unexpected error occurred.";
      let detailMessages: string[] = [];

      if (error.response?.data) {
        errorMessage = error.response.data.message || errorMessage;
        if (error.response.data.errors) {
          detailMessages = error.response.data.errors;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      const botErrorMsg = { 
        id: Date.now().toString(), 
        sender: 'bot', 
        text: `❌ ${errorMessage}${detailMessages.length > 0 ? '\n\n' + detailMessages.map(m => `• ${m}`).join('\n') : ''}\n\nPlease check your details and try again.` 
      };
      
      setMessages(prev => [...prev, botErrorMsg]);
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleReset = () => {
    setMessages([{ id: Date.now().toString(), sender: 'bot', text: questions[0].text }]);
    setCurrentStep(0);
    setFormData({});
    setIsFinished(false);
    setInputText('');
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
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Submit Registration</Text>
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
  userBubble: { backgroundColor: '#3B82F6', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 16, color: '#334155' },
  userBubbleText: { color: '#FFFFFF' },
  inputContainer: { padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  textInputRow: { flexDirection: 'row' },
  input: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 24, paddingHorizontal: 20, paddingVertical: 12, fontSize: 16, marginRight: 10 },
  sendButton: { backgroundColor: '#3B82F6', borderRadius: 24, justifyContent: 'center', paddingHorizontal: 20 },
  sendButtonDisabled: { backgroundColor: '#94A3B8' },
  sendButtonText: { color: '#FFFFFF', fontWeight: 'bold' },
  submitButton: { backgroundColor: '#10B981', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  submitButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  resetButton: { marginTop: 10, paddingVertical: 12, alignItems: 'center' },
  resetButtonText: { color: '#64748B', fontSize: 14, textDecorationLine: 'underline' }
});
