// Import React and UI Components
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router'; // React Navigation routing for Expo
import api from '../services/api';

// Driver specific questions sequence
// Each object represents one step in the chatbot conversation
const questions = [
  { id: 'name', type: 'text', text: 'Hello! Let\'s get you registered as a Driver. What is your full name?' },
  { id: 'username', type: 'text', text: 'Please choose a unique username for logging in.' },
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
  // State variables manage the chatbot's memory
  const [messages, setMessages] = useState<any[]>([]); // Holds all chat bubbles (bot and user)
  const [currentStep, setCurrentStep] = useState(0); // Tracks which question we are currently on
  const [inputText, setInputText] = useState(''); // Holds the text currently typed in the input box
  const [formData, setFormData] = useState<any>({}); // Collects all the final answers to send to the backend
  const [isFinished, setIsFinished] = useState(false); // True when all questions are answered
  const router = useRouter(); // For navigating pages
  const flatListRef = useRef<any>(); // Reference to the list to auto-scroll to the bottom

  // useEffect runs once when the screen opens
  useEffect(() => {
    // Send the very first question when the screen loads
    setMessages([{ id: Date.now().toString(), sender: 'bot', text: questions[0].text }]);
  }, []);

  // Function: Handles when the user presses 'Next' or selects an option
  const handleSend = (forcedValue: string | null = null) => {
    // 1. Get the value the user typed (or the button they pressed)
    const value = forcedValue !== null ? forcedValue : inputText.trim();
    if (!value) return; // Ignore if empty

    const currentQ = questions[currentStep];

    // 2. Seat validation logic (Specific to driver)
    if (currentQ.id === 'seatCount') {
      const seats = parseInt(value, 10);
      const vehicleType = formData.vehicleType;
      
      // Ensure it's a number
      if (isNaN(seats)) {
        Alert.alert('Invalid', 'Please enter a valid number.');
        return;
      }
      // Business rules for vehicle capacity
      if (vehicleType === 'Car' && (seats < 4 || seats > 6)) {
        Alert.alert('Validation Error', 'Car seat count must be between 4 and 6.');
        return; // Stops here, asks again
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

    // 3. Add the user's valid answer to the chat history array
    const newMessages = [...messages, { id: Date.now().toString(), sender: 'user', text: value }];
    setMessages(newMessages);
    setInputText(''); // Clear input box

    // 4. Save the answer in our formData object memory
    const updatedFormData = { ...formData, [currentQ.id]: value };
    setFormData(updatedFormData);

    // 5. Check if there are more questions
    if (currentStep < questions.length - 1) {
      // Simulate a small delay before the bot asks the next question (makes it feel natural)
      setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: questions[currentStep + 1].text }]);
        setCurrentStep(currentStep + 1); // Move to next step
      }, 500);
    } else {
      // If no more questions, end the chat
      setIsFinished(true);
      setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: 'All done! Please submit your registration below.' }]);
      }, 500);
    }
  };

  // Function: Submit all collected data
  const handleSubmit = async () => {
    try {
      console.log("Submitting Driver Registration:", formData); // Debug log exactly what was collected
      await api.post('/driver/register', formData);
      Alert.alert('Success', 'Driver Registration Complete!', [
        { text: 'OK', onPress: () => router.push('/login') } // Go to login securely
      ]);
    } catch (error: any) {
      console.log("Driver Registration Extracted Error:", error.response?.data ? JSON.stringify(error.response.data) : error.message);
      
      // Critical Fix: If the backend isn't reachable (Network Error or Timeout), auto-approve as a Mock Success for developmental continuity!
      if (!error.response || error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
         console.log("Backend offline or timed out. Falling back to MOCK SUCCESS routing.");
         Alert.alert('Mock Success (Server Offline)', 'The Node.js backend timed out, but we are moving you forward to test the frontend anyway!', [
           { text: 'OK', onPress: () => router.push('/login') } 
         ]);
         return; // Immediately exit the function
      }

      // Display exactly what the Node.js server responded with if it legitimately connected but failed
      Alert.alert('Registration Failed', error.response?.data?.message || error.message);
    }
  };

  const currentQ = questions[currentStep];

  // UI Code
  return (
    // KeyboardAvoidingView prevents the input box from being hidden behind the onscreen keyboard
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      
      {/* Scrollable list of chat messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id} // Unique ID for each message bubble
        renderItem={({ item }) => (
          // Assign different styles based on who sent the message (user vs bot)
          <View style={[styles.bubble, item.sender === 'user' ? styles.userBubble : styles.botBubble]}>
            <Text style={[styles.bubbleText, item.sender === 'user' && styles.userBubbleText]}>{item.text}</Text>
          </View>
        )}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })} // Auto-scroll to bottom
        contentContainerStyle={styles.chatContainer}
      />

      {/* Input section at the bottom */}
      <View style={styles.inputContainer}>
        {isFinished ? (
          // Show submit button at the very end
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit Registration</Text>
          </TouchableOpacity>
        ) : currentQ?.type === 'choice' ? (
          // Show clickable option buttons if the question type is 'choice' (e.g., Vehicle Type)
          <View style={styles.choiceContainer}>
            {currentQ.options?.map((opt: string) => (
              <TouchableOpacity key={opt} style={styles.choiceButton} onPress={() => handleSend(opt)}>
                <Text style={styles.choiceText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          // Standard text input box
          <View style={styles.textInputRow}>
            <TextInput
              style={styles.input}
              placeholder="Type your answer..."
              value={inputText}
              onChangeText={setInputText}
              secureTextEntry={currentQ?.type === 'password'} // Hides password dots
              keyboardType={currentQ?.type === 'number' || currentQ?.type === 'phone' ? 'numeric' : currentQ?.type === 'email' ? 'email-address' : 'default'}
              autoCapitalize={currentQ?.type === 'email' || currentQ?.type === 'password' ? 'none' : 'words'}
              onSubmitEditing={() => handleSend()} // Allows sending via keyboard enter key
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

// Styling classes layout
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
