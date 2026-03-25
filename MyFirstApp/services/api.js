import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://172.20.10.3:5000/api';

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
    return Promise.reject(error);
  }
);

export default api;
