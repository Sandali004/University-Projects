import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
<<<<<<< HEAD
import { supabase } from "../utils/supabase.js";

// ─────────────────────────────────────────────────────────
// REGISTER ATTENDANT
// Saves attendant into the 'users' table with role = 'attendant'
// ─────────────────────────────────────────────────────────
export const registerAttendant = async (req, res) => {
  try {
    console.log("[Backend] registerAttendant body:", req.body);
    const { name, email, password } = req.body;

    const errors = [];
    if (!name || name.trim().length < 2)         errors.push("Full name is required (at least 2 characters).");
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) errors.push("A valid email address is required.(Ex : test@test.com)");
    if (!password || password.length < 6)         errors.push("Password must be at least 6 characters.");

    if (errors.length > 0) {
      return res.status(400).json({ message: "Validation failed.", errors });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert into 'users' table with role = 'attendant'
    const { data, error } = await supabase
      .from("users")
      .insert([{
        name:          name.trim(),
        email:         email.trim().toLowerCase(),
        password_hash: passwordHash,
        role:          "attendant",
      }])
      .select()
      .single();

    if (error) {
      console.error("Supabase error (registerAttendant):", error);
      if (error.code === "23505") {
        return res.status(409).json({ message: "This email address is already registered." });
      }
      throw error;
    }

    return res.status(201).json({
      message: "Attendant registered successfully!",
      user: { id: data.id, name: data.name, email: data.email, role: data.role },
    });

  } catch (error) {
    console.error("Unexpected error (registerAttendant):", error);
    return res.status(500).json({ 
      message: "Server error during registration.", 
      error: error.message,
      details: error
    });
  }
};


// ─────────────────────────────────────────────────────────
// LOGIN ATTENDANT
// Finds user in 'users' table by email WHERE role = 'attendant'
// ─────────────────────────────────────────────────────────
export const loginAttendant = async (req, res) => {
  try {
    const { email, input, password } = req.body;
    const identifier = (email || input || "").trim().toLowerCase();

    if (!identifier || !password) {
      return res.status(400).json({ message: "Please provide your email and password." });
    }

    // Find user by email AND role = 'attendant'
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", identifier)
      .eq("role", "attendant")
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

    return res.status(200).json({
      message: "Login successful!",
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }, // changed 'attendant' to 'user'
    });

  } catch (error) {
    console.error("Unexpected error (loginAttendant):", error);
    return res.status(500).json({ message: "Server error during login.", error: error.message });
=======

export const registerAttendant = async (req, res) => {
  try {
    console.log("[Attendant Register] Received Data:", req.body);
    const { name, username, phone, email, password, nicNumber, assignedRoute, emergencyContact } = req.body;

    if (!name || !username || !phone || !email || !password || !nicNumber || !assignedRoute || !emergencyContact) {
       console.log("Missing fields in attendant registration!");
       return res.status(400).json({ message: "All Attendant registration fields are required." });
    }

    // --- TEMPORARY MOCK LOGIC ---
    // Skipping MongoDB setup correctly as requested.
    console.log("Mock Attendant successfully registered in memory!");
    res.status(201).json({ message: "Attendant registered successfully (Mock)." });

  } catch (error) {
    res.status(500).json({ message: "Error registering attendant", error: error.message });
  }
};

export const loginAttendant = async (req, res) => {
  try {
    const { input, password } = req.body; 
    
    // --- TEMPORARY MOCK LOGIC ---
    if (!input || !password) {
      return res.status(400).json({ message: "Invalid credentials." }); 
    }

    const token = jwt.sign(
      { id: "mock_attendant_123" }, 
      process.env.JWT_SECRET || "fallback_secret_key", 
      { expiresIn: "10d" }
    );

    res.status(200).json({ 
      message: "Login successful (Mock)", 
      token, 
      attendant: { id: "mock_attendant_123", name: "Mock Attendant", username: input, email: input } 
    });

  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
>>>>>>> IT24103379
  }
};
