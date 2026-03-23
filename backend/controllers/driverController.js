import Driver from "../models/Driver.js";
import bcrypt from "bcryptjs"; // Library to hash passwords securely
import jwt from "jsonwebtoken"; // Library to create authentication tokens

// Helper function: Validates if the seat count is allowed for the chosen vehicle type
const isValidSeatCount = (vehicleType, seatCount) => {
  if (vehicleType === "Car") return seatCount >= 4 && seatCount <= 6;
  if (vehicleType === "Van") return seatCount >= 8 && seatCount <= 15;
  if (vehicleType === "Bus") return seatCount >= 20 && seatCount <= 50;
  return false;
};

// Function: Register a new driver
export const registerDriver = async (req, res) => {
  try {
    // 1. Extract all driver details sent from the frontend request body
    const { name, username, phone, email, password, licenseNumber, vehicleType, vehicleNumber, seatCount, route } = req.body;

    // 2. Validate the seat count based on business rules
    if (!isValidSeatCount(vehicleType, seatCount)) {
      return res.status(400).json({ message: `Invalid seat count for ${vehicleType}.` });
    }

    // 3. Check if a driver with this email or username already exists in the database
    const existingDriver = await Driver.findOne({ $or: [{ email }, { username }] });
    if (existingDriver) {
      return res.status(400).json({ message: "Driver already exists with this email or username." }); // 400 means Bad Request
    }

    // 4. Hash the password for security (10 is the salt round complexity)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Create a new driver record in memory
    const driver = new Driver({
      name, username, phone, email, password: hashedPassword, licenseNumber, vehicleType, vehicleNumber, seatCount, route
    });

    // 6. Save the new driver into the MongoDB database
    await driver.save();
    
    // 7. Send success response back to frontend
    res.status(201).json({ message: "Driver registered successfully." }); // 201 means Created

  } catch (error) {
    // Send 500 server error if something crashes
    res.status(500).json({ message: "Error registering driver", error: error.message });
  }
};

// Function: Login an existing driver
export const loginDriver = async (req, res) => {
  try {
    const { email, password } = req.body; // Extract login credentials (email can be username)
    
    // 1. Find the driver by email or username
    const driver = await Driver.findOne({ $or: [{ email }, { username: email }] });
    if (!driver) {
      return res.status(404).json({ message: "Driver not found." }); // Return error if no driver matches
    }

    // 2. Compare the entered password with the securely hashed password in the database
    const isMatch = await bcrypt.compare(password, driver.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    // 3. Generate a JSON Web Token (JWT) so the driver stays logged in
    const token = jwt.sign(
      { id: driver._id }, // Payload containing driver ID
      process.env.JWT_SECRET || "fallback_secret_key", // Secret key to sign the token
      { expiresIn: "10d" } // Token expires in 10 days
    );

    // 4. Return success along with the token and basic driver details
    res.status(200).json({ 
      message: "Login successful", 
      token, 
      driver: { id: driver._id, name: driver.name, email: driver.email } 
    });

  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

// Function: Process and log emergency or delay alerts
export const sendAlert = async (req, res) => {
  try {
    const { driverId, alertType, message } = req.body;
    
    // For now, we simply log the alert to the terminal. 
    // In production, this would save to a database or trigger a push notification.
    console.log(`[ALERT] Driver ${driverId} sent a ${alertType} alert: ${message}`);
    
    res.status(200).json({ message: "Alert processed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error sending alert", error: error.message });
  }
};
