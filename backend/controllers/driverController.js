import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Function: Register a new driver (MOCK VERSION)
export const registerDriver = async (req, res) => {
  try {
    console.log("[Driver Registration] Incoming Request Body:", req.body);
    // 1. Extract all driver details sent from the frontend request body
    const { name, username, phone, email, password, licenseNumber, vehicleType, vehicleNumber, seatCount, route, emergencyContact } = req.body;

    // Verify all minimum standard payload fields exist dynamically to debug
    if (!name || !username || !phone || !email || !password || !licenseNumber || !vehicleType || !vehicleNumber || !seatCount || !route || !emergencyContact) {
      console.log("Missing fields detected in driver registration!");
      return res.status(400).json({ message: "Missing required registration parameters." });
    }

    // --- TEMPORARY MOCK LOGIC ---
    // We are skipping MongoDB storage for now.
    console.log("Mock Driver successfully registered in memory!");
    
    // Send success response back to frontend
    res.status(201).json({ message: "Driver registered successfully (Mock)." }); // 201 means Created
  } catch (error) {
    res.status(500).json({ message: "Error registering driver", error: error.message });
  }
};

// Function: Login an existing driver (MOCK VERSION)
export const loginDriver = async (req, res) => {
  try {
    const { input, password } = req.body; // Extract login credentials
    
    // --- TEMPORARY MOCK LOGIC ---
    // We are skipping MongoDB validation for now. Let any non-empty input through.
    if (!input || !password) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    // 3. Generate a JSON Web Token (JWT) so the driver stays logged in
    const token = jwt.sign(
      { id: "mock_driver_123" }, 
      process.env.JWT_SECRET || "fallback_secret_key", 
      { expiresIn: "10d" }
    );

    // 4. Send successful response with the token
    res.status(200).json({ 
      message: "Login successful (Mock)", 
      token, 
      driver: { id: "mock_driver_123", name: "Mock Driver", username: input, email: input } 
    });

  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};
