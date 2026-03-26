import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * loginHelper (internal)
 * Makes the actual API call and saves the session data.
 */
async function loginHelper(endpoint, email, password, tokenKey, dataKey) {
  try {
    const response = await api.post(endpoint, { email, password });
    const { token, user, message } = response.data;

    // Clear all previous sessions to prevent role confusion
    await AsyncStorage.removeItem('driverToken');
    await AsyncStorage.removeItem('driverData');
    await AsyncStorage.removeItem('parentToken');
    await AsyncStorage.removeItem('parentData');
    await AsyncStorage.removeItem('attendantToken');
    await AsyncStorage.removeItem('attendantData');

    // Save session data locally
    if (token) {
      await AsyncStorage.setItem(tokenKey, token);
    }
    if (user) {
      await AsyncStorage.setItem(dataKey, JSON.stringify(user));
    }

    return { success: true, user, message };
  } catch (error) {
    console.error(`[loginService] Error calling ${endpoint}:`, error.response?.data || error.message);
    const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
    return { success: false, message };
  }
}

// ─────────────────────────────────────────────────────────
// loginDriver
// ─────────────────────────────────────────────────────────
export async function loginDriver(email, password) {
  const result = await loginHelper('/driver/login', email, password, 'driverToken', 'driverData');
  return result.success 
    ? { success: true, driver: result.user } 
    : result;
}

// loginParent

export async function loginParent(email, password) {
  const result = await loginHelper('/parent/login', email, password, 'parentToken', 'parentData');
  return result.success 
    ? { success: true, parent: result.user } 
    : result;
}

// loginAttendant

export async function loginAttendant(email, password) {
  const result = await loginHelper('/attendant/login', email, password, 'attendantToken', 'attendantData');
  return result.success 
    ? { success: true, attendant: result.user } 
    : result;
}
