import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
  }
};
