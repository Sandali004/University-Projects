import Driver from "../models/Driver.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Helper to validate seat count based on vehicle type
const isValidSeatCount = (vehicleType, seatCount) => {
  if (vehicleType === "Car") return seatCount >= 4 && seatCount <= 6;
  if (vehicleType === "Van") return seatCount >= 8 && seatCount <= 15;
  if (vehicleType === "Bus") return seatCount >= 20 && seatCount <= 50;
  return false;
};

export const registerDriver = async (req, res) => {
  try {
    const { name, phone, email, password, licenseNumber, vehicleType, vehicleNumber, seatCount, route } = req.body;

    if (!isValidSeatCount(vehicleType, seatCount)) {
      return res.status(400).json({ message: `Invalid seat count for ${vehicleType}.` });
    }

    const existingDriver = await Driver.findOne({ email });
    if (existingDriver) {
      return res.status(400).json({ message: "Driver already exists with this email." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const driver = new Driver({
      name, phone, email, password: hashedPassword, licenseNumber, vehicleType, vehicleNumber, seatCount, route
    });

    await driver.save();
    res.status(201).json({ message: "Driver registered successfully." });

  } catch (error) {
    res.status(500).json({ message: "Error registering driver", error: error.message });
  }
};

export const loginDriver = async (req, res) => {
  try {
    const { email, password } = req.body;
    const driver = await Driver.findOne({ email });
    
    if (!driver) {
      return res.status(404).json({ message: "Driver not found." });
    }

    const isMatch = await bcrypt.compare(password, driver.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign({ id: driver._id }, process.env.JWT_SECRET || "fallback_secret_key", { expiresIn: "10d" });

    res.status(200).json({ 
      message: "Login successful", 
      token, 
      driver: { id: driver._id, name: driver.name, email: driver.email } 
    });

  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

export const sendAlert = async (req, res) => {
  try {
    const { driverId, alertType, message } = req.body;
    // Just logging the alert for MVP scope
    console.log(`[ALERT] Driver ${driverId} sent a ${alertType} alert: ${message}`);
    res.status(200).json({ message: "Alert processed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error sending alert", error: error.message });
  }
};
