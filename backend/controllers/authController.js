import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// UNIFIED LOGIN
// This handles login for any user role (driver, parent, attendant)
export const loginUser = async (req, res) => {
  try {
    const { email, input, password } = req.body;
    const identifier = (email || input || "").trim().toLowerCase();

    if (!identifier || !password) {
      return res.status(400).json({ message: "Please provide your email and password." });
    }

    console.log(`[Backend] Unified login attempt for identifier: ${identifier}`);

    // 1. Find the user by email regardless of role
    const user = await User.findOne({ email: identifier });

    if (!user) {
      console.warn(`[Backend] Login failed: User not found for ${identifier}.`);
      return res.status(401).json({ message: "Invalid email or password." });
    }

    console.log(`[Backend] User found: ${user.email} (Role: ${user.role}). Comparing passwords...`);

    // 2. Compare passwords
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      console.warn(`[Backend] Login failed: Password mismatch for ${identifier}.`);
      return res.status(401).json({ message: "Invalid email or password." });
    }

    console.log(`[Backend] Unified login successful for: ${user.email}`);

    // 3. Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "fallback_secret_key",
      { expiresIn: "10d" }
    );

    // 4. Return user data including role
    return res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Unexpected error during unified login:", error);
    return res.status(500).json({ 
      message: "Server error during login.", 
      error: error.message 
    });
  }
};
