import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';

// Driver specific questions
const questions = [
  { id: 'name', type: 'text', text: 'Hello! Let\'s get you registered as a Driver. What is your full name?' },
  { id: 'phone', type: 'phone', text: 'Great. What is your phone number?' },
  { id: 'email', type: 'email', text: 'What is your email address?' },
  { id: 'password', type: 'password', text: 'Please enter a secure password.' },
  { id: 'licenseNumber', type: 'text', text: 'What is your driving license number?' },
  { id: 'vehicleType', type: 'choice', text: 'What is your vehicle type?', options: ['Car', 'Van', 'Bus'] },
  { id: 'vehicleNumber', type: 'text', text: 'What is your vehicle number?' },
  { id: 'seatCount', type: 'number', text: 'How many seats are in the vehicle?' },
  { id: 'route', type: 'text', text: 'What is your route? (e.g., Colombo - Kandy)' },
  { id: 'emergencyContact', type: 'phone', text: 'Finally, what is your emergency contact number?' },
];

export default function DriverRegistration() {
  const [messages, setMessages] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [inputText, setInputText] = useState('');
  const [formData, setFormData] = useState<any>({});
  const [isFinished, setIsFinished] = useState(false);
  const router = useRouter();
  const flatListRef = useRef<any>();

  useEffect(() => {
    // Initial greeting
    setMessages([{ id: Date.now().toString(), sender: 'bot', text: questions[0].text }]);
  }, []);

  const handleSend = (forcedValue = null) => {
    const value = forcedValue !== null ? forcedValue : inputText.trim();
    if (!value) return;

    const currentQ = questions[currentStep];

    // Seat validation logic
    if (currentQ.id === 'seatCount') {
      const seats = parseInt(value, 10);
      const vehicleType = formData.vehicleType;
      
      if (isNaN(seats)) {
        Alert.alert('Invalid', 'Please enter a valid number.');
        return;
      }
      if (vehicleType === 'Car' && (seats < 4 || seats > 6)) {
        Alert.alert('Validation Error', 'Car seat count must be between 4 and 6.');
        return;
      }
      if (vehicleType === 'Van' && (seats < 8 || seats > 15)) {
        Alert.alert('Validation Error', 'Van seat count must be between 8 and 15.');
        return;
      }
      if (vehicleType === 'Bus' && (seats < 20 || seats > 50)) {
        Alert.alert('Validation Error', 'Bus seat count must be between 20 and 50.');
        return;
      }
    }

    // Add user message to UI
    const newMessages = [...messages, { id: Date.now().toString(), sender: 'user', text: value }];
    setMessages(newMessages);
    setInputText('');

    // Update state with answer
    const updatedFormData = { ...formData, [currentQ.id]: value };
    setFormData(updatedFormData);

    // Proceed to next question or end
    if (currentStep < questions.length - 1) {
      setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: questions[currentStep + 1].text }]);
        setCurrentStep(currentStep + 1);
      }, 500);
    } else {
      setIsFinished(true);
      setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: 'All done! Please submit your registration below.' }]);
      }, 500);
    }
  };

  const handleSubmit = () => {
    console.log("Submitting Driver Registration:", formData);
    Alert.alert('Success', 'Driver Registration Complete!', [
      { text: 'OK', onPress: () => router.push('/') }
    ]);
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
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit Registration</Text>
          </TouchableOpacity>
        ) : currentQ?.type === 'choice' ? (
          <View style={styles.choiceContainer}>
            {currentQ.options.map(opt => (
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
  submitButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' }
});
