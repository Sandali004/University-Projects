import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────────────────
// API Base URL
//
//  IMPORTANT: Update the IP address below every time your
//    WiFi or hotspot changes!
//
// HOW TO FIND YOUR CURRENT IP:
//   Mac Terminal: run →  ipconfig getifaddr en0    (WiFi)
//                 run →  ipconfig getifaddr en1    (if WiFi fails)
//
// Set PORT to match what's in backend/.env (currently 5000)
//
// Example: http://192.168.1.45:5000/api
// ─────────────────────────────────────────────────────────
const API_URL = 'http://172.20.10.3:5000/api';

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
    const driverToken   = await AsyncStorage.getItem('driverToken');
    const parentToken   = await AsyncStorage.getItem('parentToken');
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
