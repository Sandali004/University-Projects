import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

<<<<<<< HEAD
// ─────────────────────────────────────────────────────────
// API Base URL
// Make sure this points to your computer's local IP address
// on port 5000.
//
// HOW TO FIND YOUR IP:
//   Mac:     Open Terminal and run: ipconfig getifaddr en0
//   Windows: Open CMD and run:     ipconfig (look for IPv4 Address)
//
// Example: http://172.28.6.12:5000/api
// ─────────────────────────────────────────────────────────
const API_URL = 'http://192.168.1.6:5000/api'; // Or use 'http://192.168.1.6:5000/api' if that is your current IP

// Create the Axios HTTP client with the base URL
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 seconds before giving up on a request
});


api.interceptors.request.use(
  async (config) => {
    // Check for any of the three possible saved tokens (driver, parent, attendant)
    const driverToken = await AsyncStorage.getItem('driverToken');
    const parentToken = await AsyncStorage.getItem('parentToken');
    const attendantToken = await AsyncStorage.getItem('attendantToken');

    // Use whichever token is available
    const token = driverToken || parentToken || attendantToken;

    if (token) {
      // Attach token to the Authorization header
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
=======
// Define the Base URL that points to our Node.js Backend API
// Note: When testing on a real Android/iOS device, 'localhost' will fail. 
// You must use your computer's actual local IPv4 address (e.g., 192.168.x.x).
const API_URL = 'http://192.168.1.100:5000/api'; 

// Create an Axios instance: a customized HTTP client with our base settings
const api = axios.create({
  baseURL: API_URL,
  timeout: 5000, // Abort the request if the backend doesn't explicitly respond in 5 seconds
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
>>>>>>> IT24103379
    return Promise.reject(error);
  }
);

<<<<<<< HEAD
=======
// Export the customized api instance for use across frontend screens
>>>>>>> IT24103379
export default api;
