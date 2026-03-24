import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../utils/supabase.js";

export const registerAttendant = async (req, res) => {
  try {
    const { name, email, password, role = 'attendant' } = req.body;

    // 1. Structural Validation
    const errors = [];
    if (!name || name.trim().length < 2) errors.push("Full name is required (at least 2 characters).");
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) errors.push("A valid email address is required.");
    if (!password || password.length < 6) errors.push("Password must be at least 6 characters long.");

    if (errors.length > 0) {
      return res.status(400).json({ 
        message: "Registration failed due to invalid parameters.", 
        errors,
        validParameters: {
          name: "Text (min 2 chars)",
          email: "Valid email format",
          password: "Text (min 6 chars)"
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
      if (userError.code === '23505') {
        return res.status(409).json({ message: "This email address is already registered." });
      }
      throw userError;
    }

    res.status(201).json({ message: "Attendant registered successfully.", user: userData });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "An internal server error occurred during registration.", error: error.message });
  }
};

export const loginAttendant = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

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
