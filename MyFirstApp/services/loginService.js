// ============================================================
// loginService.js
//
// Authenticates users DIRECTLY from the Supabase 'users' table.
//
// Login logic:
//   1. Find user by email in 'users' table
//   2. Check that the role matches the login screen
//      (driver login → role must be 'driver', etc.)
//   3. Hash the entered password and compare with stored hash
//   4. If all checks pass → login successful
// ============================================================

import * as Crypto from 'expo-crypto';
import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Hash the password exactly the same way as during registration (SHA-256)
async function hashPassword(plainText) {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    plainText
  );
}

// ─────────────────────────────────────────────────────────
// loginFromUsersTable (internal helper)
// Finds a user by email from the 'users' table,
// verifies their role and password, then saves session data.
// ─────────────────────────────────────────────────────────
async function loginFromUsersTable(email, password, expectedRole) {
  console.log(`[loginService] Attempting ${expectedRole} login for: ${email}`);

  // 1. Basic field check
  if (!email || !password) {
    return { success: false, message: 'Please enter your email and password.' };
  }

  const cleanEmail = email.trim().toLowerCase();

  // 2. Query the 'users' table — find user by email AND role
  //    This ensures a driver cannot log in through the parent screen, etc.
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', cleanEmail)   // match by email
    .eq('role', expectedRole)  // ALSO match by role (very important!)
    .single();                 // we expect exactly one result

  // 3. If no user found with that email+role combination
  if (error || !user) {
    console.log(`[loginService] No ${expectedRole} found with email: ${cleanEmail}`);
    // Always use a generic message so we don't reveal whether email exists
    return { success: false, message: 'Invalid email or password.' };
  }

  // 4. Hash the entered password and compare with the stored hash
  const enteredHash = await hashPassword(password);
  if (enteredHash !== user.password_hash) {
    console.log('[loginService] Password does not match.');
    return { success: false, message: 'Invalid email or password.' };
  }

  // 5. Build a clean user profile object (never expose password_hash)
  const userData = {
    id:    user.id,
    name:  user.name,
    email: user.email,
    role:  user.role,
  };

  console.log(`[loginService] Login successful! ${expectedRole}: ${user.name}`);
  return { success: true, user: userData };
}

// ─────────────────────────────────────────────────────────
// loginDriver
// Checks the 'users' table where role = 'driver'
// ─────────────────────────────────────────────────────────
export async function loginDriver(email, password) {
  const result = await loginFromUsersTable(email, password, 'driver');

  // Save session data locally if login is successful
  if (result.success) {
    await AsyncStorage.setItem('driverToken', result.user.id);
    await AsyncStorage.setItem('driverData', JSON.stringify(result.user));
  }

  // Return { success, driver } so the screen can use result.driver
  return result.success
    ? { success: true, driver: result.user }
    : result;
}

// ─────────────────────────────────────────────────────────
// loginParent
// Checks the 'users' table where role = 'parent'
// ─────────────────────────────────────────────────────────
export async function loginParent(email, password) {
  const result = await loginFromUsersTable(email, password, 'parent');

  if (result.success) {
    await AsyncStorage.setItem('parentToken', result.user.id);
    await AsyncStorage.setItem('parentData', JSON.stringify(result.user));
  }

  return result.success
    ? { success: true, parent: result.user }
    : result;
}

// ─────────────────────────────────────────────────────────
// loginAttendant
// Checks the 'users' table where role = 'attendant'
// ─────────────────────────────────────────────────────────
export async function loginAttendant(email, password) {
  const result = await loginFromUsersTable(email, password, 'attendant');

  if (result.success) {
    await AsyncStorage.setItem('attendantToken', result.user.id);
    await AsyncStorage.setItem('attendantData', JSON.stringify(result.user));
  }

  return result.success
    ? { success: true, attendant: result.user }
    : result;
}
