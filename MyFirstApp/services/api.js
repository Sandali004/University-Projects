import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the Base URL that points to our Node.js Backend API
// Note: When testing on a real Android/iOS device, 'localhost' will fail. 
// You must use your computer's actual local IPv4 address (e.g., 192.168.x.x).
const API_URL = 'http://192.168.1.100:5000/api'; 

// Create an Axios instance: a customized HTTP client with our base settings
const api = axios.create({
  baseURL: API_URL,
});

// Axios Request Interceptor
// This piece of code automatically runs BEFORE every API request is sent
api.interceptors.request.use(
  async (config) => {
    // Try to get the saved authentication token from local storage
    const token = await AsyncStorage.getItem('driverToken');
    
    // If we have a token (meaning the user is logged in), attach it to the request headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; 
    }
    
    return config; // Continue sending the request
  },
  (error) => {
    // If the request setup fails, reject the promise with the error
    return Promise.reject(error);
  }
);

// Export the customized api instance for use across frontend screens
export default api;
