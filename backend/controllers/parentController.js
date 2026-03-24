import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../utils/supabase.js";

export const registerParent = async (req, res) => {
  try {
    const { name, email, password, childName, role = 'parent' } = req.body;

    if (!name || !email || !password || !childName) {
      return res.status(400).json({ message: "Missing required registration parameters." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([{ name, email, password_hash: passwordHash, role }])
      .select()
      .single();

    if (userError) throw userError;

    const { error: studentError } = await supabase
      .from('students')
      .insert([{ name: childName, parent_id: userData.id }]);

    if (studentError) throw studentError;

    res.status(201).json({ message: "Parent registered successfully.", user: userData });
  } catch (error) {
    res.status(500).json({ message: "Error registering parent", error: error.message });
  }
};

export const loginParent = async (req, res) => {
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
