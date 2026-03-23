import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const registerParent = async (req, res) => {
  try {
    console.log("[Parent Register] Received Data:", req.body);
    const { name, username, phone, email, password, childName, schoolName, pickupAddress, dropoffAddress } = req.body;

    if (!name || !username || !phone || !email || !password || !childName || !schoolName || !pickupAddress || !dropoffAddress) {
       console.log("Missing fields in parent registration!");
       return res.status(400).json({ message: "All Parent registration fields are required." });
    }

    // --- TEMPORARY MOCK LOGIC ---
    // Skipping MongoDB. 
    console.log("Mock Parent successfully registered in memory!");
    res.status(201).json({ message: "Parent registered successfully (Mock)." });

  } catch (error) {
    res.status(500).json({ message: "Error registering parent", error: error.message });
  }
};

export const loginParent = async (req, res) => {
  try {
    const { input, password } = req.body; 
    
    // --- TEMPORARY MOCK LOGIC ---
    if (!input || !password) {
      return res.status(400).json({ message: "Invalid credentials." }); 
    }

    const token = jwt.sign(
      { id: "mock_parent_123" }, 
      process.env.JWT_SECRET || "fallback_secret_key", 
      { expiresIn: "10d" }
    );

    res.status(200).json({ 
      message: "Login successful (Mock)", 
      token, 
      parent: { id: "mock_parent_123", name: "Mock Parent", username: input, email: input } 
    });

  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};
