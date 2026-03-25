// ============================================================
// registrationService.js
//
// Registers users via the BACKEND API.
// ============================================================

import api from './api';

/**
 * registerHelper (internal)
 * Makes the actual API call for registration.
 */
async function registerHelper(endpoint, formData) {
  try {
    const response = await api.post(endpoint, formData);
    return { success: true, user: response.data.user, message: response.data.message };
  } catch (error) {
    console.error(`[registrationService] Error calling ${endpoint}:`, error.response?.data || error.message);
    const message = error.response?.data?.message || 'Registration failed. Please try again.';
    return { success: false, message };
  }
}

// ─────────────────────────────────────────────────────────
// registerDriver
// ─────────────────────────────────────────────────────────
export async function registerDriver(formData) {
  return await registerHelper('/driver/register', formData);
}

// ─────────────────────────────────────────────────────────
// registerParent
// ─────────────────────────────────────────────────────────
export async function registerParent(formData) {
  return await registerHelper('/parent/register', formData);
}

// ─────────────────────────────────────────────────────────
// registerAttendant
// ─────────────────────────────────────────────────────────
export async function registerAttendant(formData) {
  return await registerHelper('/attendant/register', formData);
}
