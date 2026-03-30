import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../utils/supabase.js";

// REGISTER DRIVER
// Saves driver into the 'users' table with role = 'driver'
export const registerDriver = async (req, res) => {
  try {
    console.log("[Backend] registerDriver body:", req.body);
    const { name, email, password } = req.body;

    // Validate required fields
    const errors = [];
    if (!name || name.trim().length < 2)         errors.push("Full name is required (at least 2 characters).");
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

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert into 'users' table with role = 'driver'
    const { data, error } = await supabase
      .from("users")
      .insert([{
        name:          name.trim(),
        email:         email.trim().toLowerCase(),
        password_hash: passwordHash,
        role:          "driver",
      }])
      .select()
      .single();

    if (error) {
      console.error("Supabase error (registerDriver):", error);
      if (error.code === "23505") {
        return res.status(409).json({ message: "This email address is already registered." });
      }
      throw error;
    }

    // 4. Send Success Response
    return res.status(201).json({ 
      message: "Driver registered successfully.", 
      user: { id: data.id, name: data.name, email: data.email, role: data.role } 
    });
  } catch (error) {
    console.error("Unexpected error (registerDriver):", error);
    return res.status(500).json({ 
      message: "Server error during registration.", 
      error: error.message,
      details: error
    });
  }
};


// LOGIN DRIVER
// Finds user in 'users' table by email WHERE role = 'driver'

export const loginDriver = async (req, res) => {
  try {
    const { email, input, password } = req.body;
    const identifier = (email || input || "").trim().toLowerCase();

    if (!identifier || !password) {
      return res.status(400).json({ message: "Please provide your email and password." });
    }

    // Find user by email AND role = 'driver'
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", identifier)
      .eq("role", "driver")
      .single();

    if (error || !user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "fallback_secret_key",
      { expiresIn: "10d" }
    );

    return res.status(200).json({
      message: "Login successful!",
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }, // changed 'driver' to 'user'
    });

  } catch (error) {
    console.error("Unexpected error (loginDriver):", error);
    return res.status(500).json({ message: "Server error during login.", error: error.message });
  }
};


// SEND ALERT (Placeholder)

export const sendAlert = async (req, res) => {
  try {
    const { driverId, alertType, message } = req.body;

    if (!driverId || !alertType || !message) {
      return res.status(400).json({ message: "Driver ID, alert type, and message are required." });
    }

    // 1. Find the system for this driver
    const { data: system, error: sysError } = await supabase
      .from('transportation_systems')
      .select('id, name')
      .eq('driver_id', driverId)
      .single();

    if (sysError || !system) {
      return res.status(404).json({ message: "No transportation system found for this driver." });
    }

    // 2. Find all parents connected to this system
    const { data: parents, error: parError } = await supabase
      .from('system_parents')
      .select('parent_id')
      .eq('system_id', system.id);

    if (parError || !parents || parents.length === 0) {
      return res.status(200).json({ message: "No parents in system to notify." });
    }

    // 3. Create a notification for each parent
    const notifications = parents.map(p => ({
      user_id: p.parent_id,
      message: `${system.name} Update: [${alertType}] ${message}`,
      type: alertType.toLowerCase().replace(/\s+/g, '_')
    }));

    const { error: notifError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notifError) throw notifError;

    return res.status(200).json({ message: `Alert sent to ${parents.length} parents successfully.` });
  } catch (error) {
    console.error("Unexpected error (sendAlert):", error);
    return res.status(500).json({ message: "Server error sending alert.", error: error.message });
  }
};
