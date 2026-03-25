// ============================================================
// registrationService.js
//
// Saves new users DIRECTLY into the Supabase 'users' table.
// The 'users' table stores all roles (driver, parent, attendant)
// in one place, identified by a 'role' column.
//
// Table structure (from schema.sql):
//   id            UUID (auto-generated)
//   name          TEXT
//   email         TEXT (must be unique)
//   password_hash TEXT
//   role          TEXT ('driver' | 'parent' | 'attendant')
//   created_at    TIMESTAMPTZ
//   updated_at    TIMESTAMPTZ
// ============================================================

import * as Crypto from 'expo-crypto';
import { supabase } from './supabase';

// ─────────────────────────────────────────────────────────
// hashPassword
// Converts a plain-text password into a secure SHA-256 hash.
// We NEVER store plain passwords in the database.
// ─────────────────────────────────────────────────────────
async function hashPassword(plainText) {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    plainText
  );
  return hash;
}

// ─────────────────────────────────────────────────────────
// saveToUsersTable (internal helper)
// Used by all three register functions below.
// Inserts a single row into the 'users' table.
// ─────────────────────────────────────────────────────────
async function saveToUsersTable({ name, email, password, role }) {
  console.log(`[registrationService] Registering ${role}: ${email}`);

  // 1. Validate required fields
  if (!name || name.trim().length < 2)
    return { success: false, message: 'Full name is required (at least 2 characters).' };
  if (!email || !/^\S+@\S+\.\S+$/.test(email))
    return { success: false, message: 'Please enter a valid email address.' };
  if (!password || password.length < 6)
    return { success: false, message: 'Password must be at least 6 characters long.' };

  // 2. Hash the password before saving
  console.log('[registrationService] Hashing password...');
  const passwordHash = await hashPassword(password);

  // 3. Insert into Supabase 'users' table
  console.log('[registrationService] Inserting into users table...');
  const { data, error } = await supabase
    .from('users')
    .insert([{
      name:          name.trim(),
      email:         email.trim().toLowerCase(),
      password_hash: passwordHash,
      role:          role,           // 'driver', 'parent', or 'attendant'
    }])
    .select()
    .single();

  // 4. Handle errors
  if (error) {
    console.error('[registrationService] Supabase error:', error);

    // Error code 23505 = unique constraint violation (email already exists)
    if (error.code === '23505') {
      return { success: false, message: 'This email address is already registered. Please use a different email or log in.' };
    }
    return { success: false, message: error.message || 'A database error occurred. Please try again.' };
  }

  console.log(`[registrationService] ${role} registered! ID: ${data.id}`);
  return { success: true, data };
}

// ─────────────────────────────────────────────────────────
// registerDriver
// Registers a driver user (role = 'driver')
// ─────────────────────────────────────────────────────────
export async function registerDriver(formData) {
  return await saveToUsersTable({
    name:     formData.name,
    email:    formData.email,
    password: formData.password,
    role:     'driver',
  });
}

// ─────────────────────────────────────────────────────────
// registerParent
// Registers a parent user (role = 'parent')
// ─────────────────────────────────────────────────────────
export async function registerParent(formData) {
  return await saveToUsersTable({
    name:     formData.name,
    email:    formData.email,
    password: formData.password,
    role:     'parent',
  });
}

// ─────────────────────────────────────────────────────────
// registerAttendant
// Registers an attendant user (role = 'attendant')
// ─────────────────────────────────────────────────────────
export async function registerAttendant(formData) {
  return await saveToUsersTable({
    name:     formData.name,
    email:    formData.email,
    password: formData.password,
    role:     'attendant',
  });
}
