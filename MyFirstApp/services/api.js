import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────────────────
// API Base URL
// Make sure this points to your computer's local IP address
// on port 8000 (the port we just fixed the backend to use).
//
// HOW TO FIND YOUR IP:
//   Mac:     Open Terminal and run: ipconfig getifaddr en0
//   Windows: Open CMD and run:     ipconfig (look for IPv4 Address)
//
// Example: http://172.28.6.12:5000/api
// ─────────────────────────────────────────────────────────
const API_URL = 'http://192.168.8.184:5000/api';

// Create the Axios HTTP client with the base URL
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 seconds before giving up on a request
});

// ─────────────────────────────────────────────────────────
// Request Interceptor
// This code runs BEFORE every request is sent.
// It automatically attaches the saved login token to the request.
// ─────────────────────────────────────────────────────────
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
    return Promise.reject(error);
  }
);

export default api;
