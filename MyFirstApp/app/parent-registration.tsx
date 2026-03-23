import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';

// Parent specific questions
const questions = [
  { id: 'name', type: 'text', text: 'Hello! Let\'s get you registered as a Parent. What is your full name?' },
  { id: 'phone', type: 'phone', text: 'What is your phone number?' },
  { id: 'email', type: 'email', text: 'What is your email address?' },
  { id: 'password', type: 'password', text: 'Please enter a password.' },
  { id: 'childName', type: 'text', text: 'What is your child\'s name?' },
  { id: 'childGrade', type: 'text', text: 'What is your child\'s grade/class?' },
  { id: 'pickupLocation', type: 'text', text: 'What is the pickup location?' },
  { id: 'dropLocation', type: 'text', text: 'What is the drop location?' },
  { id: 'emergencyContact', type: 'phone', text: 'Finally, what is your emergency contact number?' },
];

export default function ParentRegistration() {
  const [messages, setMessages] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [inputText, setInputText] = useState('');
  const [formData, setFormData] = useState<any>({});
  const [isFinished, setIsFinished] = useState(false);
  const router = useRouter();
  const flatListRef = useRef<any>();

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
    console.log("Submitting Parent Registration:", formData);
    Alert.alert('Success', 'Parent Registration Complete!', [
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
  submitButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' }
});
