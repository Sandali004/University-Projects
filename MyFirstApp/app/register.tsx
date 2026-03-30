import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../services/api';

<<<<<<< HEAD
interface Question {
  id: string;
  type: string;
  question: string;
  options?: string[];
}

const questions: Question[] = [
=======
const questions = [
>>>>>>> IT24103379
  { id: 'name', type: 'text', question: 'Hello! I am here to help you register. What is your full name?' },
  { id: 'phone', type: 'phone', question: 'Nice to meet you! What is your phone number?' },
  { id: 'email', type: 'email', question: 'What is your email address?' },
  { id: 'password', type: 'password', question: 'Please create a strong password.' },
  { id: 'licenseNumber', type: 'text', question: 'What is your driving license number?' },
  { id: 'vehicleType', type: 'choice', question: 'What type of vehicle do you drive?', options: ['Car', 'Van', 'Bus'] },
  { id: 'vehicleNumber', type: 'text', question: 'What is your vehicle registration number?' },
  { id: 'seatCount', type: 'number', question: 'How many passenger seats are in your vehicle?' },
  { id: 'route', type: 'text', question: 'Almost done! What is your primary route? (e.g., Colombo - Kandy)' },
];

export default function RegisterScreen() {
<<<<<<< HEAD
  const [messages, setMessages] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [inputText, setInputText] = useState('');
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const flatListRef = useRef<any>(null);
=======
  const [messages, setMessages] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [inputText, setInputText] = useState('');
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const flatListRef = useRef();
>>>>>>> IT24103379

  useEffect(() => {
    // Start the chat by showing the first question
    setMessages([{ id: Date.now().toString(), sender: 'bot', text: questions[0].question }]);
  }, []);

<<<<<<< HEAD
  const handleSend = async (forcedValue: string | null = null) => {
=======
  const handleSend = async (forcedValue = null) => {
>>>>>>> IT24103379
    const value = forcedValue || inputText.trim();
    if (!value) return;

    const currentQ = questions[currentStep];

    // Basic Validation for seats
    if (currentQ.id === 'seatCount') {
      const seats = parseInt(value, 10);
      const { vehicleType } = formData;
      if (isNaN(seats)) {
        Alert.alert('Invalid', 'Please enter a valid number.');
        return;
      }
      if (vehicleType === 'Car' && (seats < 4 || seats > 6)) {
        Alert.alert('Invalid', 'Car seats must be between 4 and 6.');
        return;
      }
      if (vehicleType === 'Van' && (seats < 8 || seats > 15)) {
        Alert.alert('Invalid', 'Van seats must be between 8 and 15.');
        return;
      }
      if (vehicleType === 'Bus' && (seats < 20 || seats > 50)) {
        Alert.alert('Invalid', 'Bus seats must be between 20 and 50.');
        return;
      }
    }

    // Add user message
    const newMessages = [...messages, { id: Date.now().toString(), sender: 'user', text: value }];
    setMessages(newMessages);
    setInputText('');

    // Save to form data
    const updatedFormData = { ...formData, [currentQ.id]: value };
    setFormData(updatedFormData);

    // Next question or Finalize
    if (currentStep < questions.length - 1) {
      setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: questions[currentStep + 1].question }]);
        setCurrentStep(currentStep + 1);
      }, 600);
    } else {
      setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: 'Thank you! Registering you now...' }]);
        submitRegistration(updatedFormData);
      }, 600);
    }
  };

<<<<<<< HEAD
  const submitRegistration = async (data: any) => {
    setLoading(true);
    try {
      // Map fields to backend expected names
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        plateNumber: data.vehicleNumber,
        role: 'driver'
      };

      await api.post('/driver/register', payload);
      Alert.alert('Success', 'Registration completed successfully!', [
        { text: 'Login', onPress: () => router.replace('/') }
      ]);
    } catch (error: any) {
      console.error("Registration Error:", error.response?.data || error.message);
      
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
        text: `❌ ${errorMessage}${detailMessages.length > 0 ? '\n\n' + detailMessages.map(m => `• ${m}`).join('\n') : ''}\n\nPlease try again by correcting your details.` 
      };
      
      setMessages(prev => [...prev, botErrorMsg]);
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
=======
  const submitRegistration = async (data) => {
    setLoading(true);
    try {
      const response = await api.post('/driver/register', data);
      Alert.alert('Success', 'Registration completed successfully!', [
        { text: 'Login', onPress: () => router.replace('/') }
      ]);
    } catch (error) {
      console.error(error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Registration failed.');
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: 'Registration failed. Let\'s try again.' }]);
>>>>>>> IT24103379
    } finally {
      setLoading(false);
    }
  };

  const currentQ = questions[currentStep];

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Register Driver</Text>
      </View>
      
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.messageBubble, item.sender === 'user' ? styles.userBubble : styles.botBubble]}>
            <Text style={[styles.messageText, item.sender === 'user' && styles.userMessageText]}>{item.text}</Text>
          </View>
        )}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        contentContainerStyle={styles.chatContainer}
      />

      <View style={styles.inputContainer}>
<<<<<<< HEAD
        {currentQ?.type === 'choice' && currentQ.options ? (
          <View style={styles.choicesContainer}>
            {currentQ.options.map((opt: string) => (
=======
        {currentQ?.type === 'choice' ? (
          <View style={styles.choicesContainer}>
            {currentQ.options.map(opt => (
>>>>>>> IT24103379
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
            />
            <TouchableOpacity 
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
              onPress={() => handleSend()}
              disabled={!inputText.trim()}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  chatContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 20,
    marginBottom: 12,
  },
  botBubble: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: '#3B82F6',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#334155',
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  inputContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  textInputRow: {
    flexDirection: 'row',
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 24,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  choicesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  choiceButton: {
    backgroundColor: '#E0F2FE',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  choiceText: {
    color: '#0284C7',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
