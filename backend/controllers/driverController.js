import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../utils/supabase.js";

// Function: Register a new driver
export const registerDriver = async (req, res) => {
  try {
    const { name, email, password, plateNumber, role = 'driver' } = req.body;

    // 1. Structural Validation
    const errors = [];
    if (!name || name.trim().length < 2) errors.push("Full name is required (at least 2 characters).");
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) errors.push("A valid email address is required.");
    if (!password || password.length < 6) errors.push("Password must be at least 6 characters long.");
    if (!plateNumber || plateNumber.trim().length < 3) errors.push("Valid vehicle plate number is required.");

    if (errors.length > 0) {
      return res.status(400).json({ 
        message: "Registration failed due to invalid parameters.", 
        errors,
        validParameters: {
          name: "Text (min 2 chars)",
          email: "Valid email format",
          password: "Text (min 6 chars)",
          plateNumber: "Text (e.g., WP-ABC-1234)"
        }
      });
    }

    // 2. Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Insert into users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([{ name, email, password_hash: passwordHash, role }])
      .select()
      .single();

    if (userError) {
      if (userError.code === '23505') { // Postgres Unique Violation code
        return res.status(409).json({ message: "This email address is already registered." });
      }
      throw userError;
    }

    // 4. Insert into vans table
    const { error: vanError } = await supabase
      .from('vans')
      .insert([{ driver_id: userData.id, plate_number: plateNumber }]);

    if (vanError) {
      if (vanError.code === '23505') {
        // Cleanup created user if van creation fails due to duplicate plate
        await supabase.from('users').delete().eq('id', userData.id);
        return res.status(409).json({ message: "This vehicle plate number is already registered by another driver." });
      }
      throw vanError;
    }

    res.status(201).json({ message: "Driver registered successfully.", user: userData });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "An internal server error occurred during registration.", error: error.message });
  }
};

// Function: Login an existing driver
export const loginDriver = async (req, res) => {
  try {
    const { email, input, password } = req.body;
    const identifier = email || input;
    
    if (!identifier || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // 1. Fetch user from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', identifier)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // 2. Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // 3. Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role }, 
      process.env.JWT_SECRET || "fallback_secret_key", 
      { expiresIn: "10d" }
    );

    res.status(200).json({ 
      message: "Login successful", 
      token, 
      user: { id: user.id, name: user.name, email: user.email, role: user.role } 
    });

  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

export const sendAlert = async (req, res) => {
  // Logic for sending alerts could be added here using the notifications table
  res.status(200).json({ message: "Alert functionality placeholder." });
};
