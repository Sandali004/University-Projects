import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import TransportationSystem from "../models/TransportationSystem.js";
import SystemAttendant from "../models/SystemAttendant.js";
import SystemParent from "../models/SystemParent.js";
import Notification from "../models/Notification.js";

// REGISTER DRIVER
// Saves driver into the 'users' table with role = 'driver'
export const registerDriver = async (req, res) => {
  try {
    console.log("[Backend] registerDriver body:", req.body);
    const { name, email, password } = req.body;

    // Validate required fields
    const errors = [];
    if (!name || name.trim().length < 2)         errors.push("Full name is required (at least 2 characters).");
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) errors.push("A valid email address is required.(Ex : test@test.com)");
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

    // Check if email exists
    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
        return res.status(409).json({ message: "This email address is already registered." });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert into 'users' table with role = 'driver'
    const newUser = await User.create({
        name:          name.trim(),
        email:         email.trim().toLowerCase(),
        password_hash: passwordHash,
        role:          "driver",
    });

    // 4. Send Success Response
    return res.status(201).json({ 
      message: "Driver registered successfully.", 
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } 
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

    // Find user by email ONLY first (to diagnose role mismatch better)
    console.log(`[Backend] Attempting login for identifier: ${identifier}`);
    const user = await User.findOne({ email: identifier });

    if (!user) {
      console.warn(`[Backend] Login aborted: Email not found for ${identifier}.`);
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Role verification
    if (user.role !== "driver") {
      console.warn(`[Backend] Login aborted: Role mismatch for ${identifier}. Expected 'driver', found '${user.role}'.`);
      return res.status(401).json({ message: "Invalid email or password." });
    }

    console.log(`[Backend] User found: ${user.email} (Role: ${user.role}). Comparing passwords...`);

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      console.warn(`[Backend] Login aborted: Password mismatch for ${identifier}.`);
      return res.status(401).json({ message: "Invalid email or password." });
    }

    console.log(`[Backend] Login successful for: ${user.email}`);

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
    const { driverId, alertType, message, systemId } = req.body;

    if (!driverId || !alertType || !message) {
      return res.status(400).json({ message: "Sender ID, alert type, and message are required." });
    }

    let targetSystemId = systemId;
    let systemName = "";

    // 1. Identify the system and verify permissions
    if (targetSystemId) {
      // Find system by ID
      const system = await TransportationSystem.findById(targetSystemId);

      if (!system) {
        return res.status(404).json({ message: "Transportation system not found." });
      }

      systemName = system.name;
      
      // Verify Sender Permissions
      const isDriver = system.driver_id.toString() === driverId;
      let isAuthorizedAttendant = false;

      if (!isDriver) {
        const attendantEntry = await SystemAttendant.findOne({
            system_id: targetSystemId,
            attendant_id: driverId
        });
        
        if (attendantEntry?.has_control) {
          isAuthorizedAttendant = true;
        }
      }

      if (!isDriver && !isAuthorizedAttendant) {
        return res.status(403).json({ message: "You do not have permission to send alerts for this system." });
      }
    } else {
      // Fallback: Find system by driver_id (Old behavior/Driver only)
      const system = await TransportationSystem.findOne({ driver_id: driverId });

      if (!system) {
        return res.status(404).json({ message: "No transportation system found for this driver." });
      }
      targetSystemId = system.id;
      systemName = system.name;
    }

    // 2. Find all parents connected to this system
    const parents = await SystemParent.find({ system_id: targetSystemId });

    if (!parents || parents.length === 0) {
      return res.status(200).json({ message: "No parents in system to notify." });
    }

    // 3. Create a notification for each parent
    const notifications = parents.map(p => ({
      user_id: p.parent_id,
      system_id: targetSystemId,
      message: `${systemName} Update: [${alertType}] ${message}`,
      type: alertType.toLowerCase().replace(/\s+/g, '_')
    }));

    await Notification.insertMany(notifications);

    return res.status(200).json({ message: `Alert sent to ${parents.length} parents successfully.` });
  } catch (error) {
    console.error("Unexpected error (sendAlert):", error);
    return res.status(500).json({ message: "Server error sending alert.", error: error.message });
  }
};

