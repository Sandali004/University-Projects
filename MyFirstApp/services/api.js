import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use the local IP address for the backend. 
// Note: 'localhost' or '127.0.0.1' points to the emulator itself in Android.
// Real device testing requires your computer's actual local IP (e.g., 192.168.x.x)
const API_URL = 'http://192.168.1.100:5000/api'; // CHANGE THIS IP BEFORE DEPLOYING!

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor to attach token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('driverToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
