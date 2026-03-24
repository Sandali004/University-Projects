import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../utils/supabase.js";

// Function: Register a new driver
export const registerDriver = async (req, res) => {
  try {
    const { name, email, password, plateNumber, role = 'driver' } = req.body;

    if (!name || !email || !password || !plateNumber) {
      return res.status(400).json({ message: "Missing required registration parameters." });
    }

    // 1. Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 2. Insert into users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([{ name, email, password_hash: passwordHash, role }])
      .select()
      .single();

    if (userError) throw userError;

    // 3. Insert into vans table
    const { error: vanError } = await supabase
      .from('vans')
      .insert([{ driver_id: userData.id, plate_number: plateNumber }]);

    if (vanError) throw vanError;

    res.status(201).json({ message: "Driver registered successfully.", user: userData });
  } catch (error) {
    res.status(500).json({ message: "Error registering driver", error: error.message });
  }
};

// Function: Login an existing driver
export const loginDriver = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    // 1. Fetch user from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
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
