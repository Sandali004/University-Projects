import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../utils/supabase.js";


// REGISTER PARENT
// Saves parent into the 'users' table with role = 'parent'

export const registerParent = async (req, res) => {
  try {
    console.log("[Backend] registerParent body:", req.body);
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

    // Insert into 'users' table with role = 'parent'
    const { data, error } = await supabase
      .from("users")
      .insert([{
        name:          name.trim(),
        email:         email.trim().toLowerCase(),
        password_hash: passwordHash,
        role:          "parent",
      }])
      .select()
      .single();

    if (error) {
      console.error("Supabase error (registerParent):", error);
      if (error.code === "23505") {
        return res.status(409).json({ message: "This email address is already registered." });
      }
      throw error;
    }

    return res.status(201).json({
      message: "Parent registered successfully!",
      user: { id: data.id, name: data.name, email: data.email, role: data.role },
    });

  } catch (error) {
    console.error("Unexpected error (registerParent):", error);
    return res.status(500).json({ 
      message: "Server error during registration.", 
      error: error.message,
      details: error
    });
  }
};



// LOGIN PARENT
// Finds user in 'users' table by email WHERE role = 'parent'

export const loginParent = async (req, res) => {
  try {
    const { email, input, password } = req.body;
    const identifier = (email || input || "").trim().toLowerCase();

    if (!identifier || !password) {
      return res.status(400).json({ message: "Please provide your email and password." });
    }

    // Find user by email AND role = 'parent'
    console.log(`[Backend] Attempting login for identifier: ${identifier} (role: parent)`);
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", identifier)
      .eq("role", "parent")
      .single();

    if (error || !user) {
      console.warn(`[Backend] Login failed: User not found or error occurred for ${identifier}. Error:`, error?.message || "User not found");
      return res.status(401).json({ message: "Invalid email or password." });
    }

    console.log(`[Backend] User found: ${user.email}. Comparing passwords...`);
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      console.warn(`[Backend] Login failed: Password mismatch for ${identifier}.`);
      return res.status(401).json({ message: "Invalid email or password." });
    }

    console.log(`[Backend] Login successful for: ${user.email}`);

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "fallback_secret_key",
      { expiresIn: "10d" }
    );

    return res.status(200).json({
      message: "Login successful!",
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }, // changed 'parent' to 'user'
    });

  } catch (error) {
    console.error("Unexpected error (loginParent):", error);
    return res.status(500).json({ message: "Server error during login.", error: error.message });
  }
};
