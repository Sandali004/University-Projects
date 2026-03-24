// Import mongoose to create a database schema (blueprint)
import mongoose from "mongoose";

// Define the blueprint (schema) for a Driver
// This tells MongoDB exactly what data fields a driver must have
const driverSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Driver's full name, required
  username: { type: String, required: true, unique: true }, // Driver's login username
  phone: { type: String, required: true }, // Driver's phone number
  email: { type: String, required: true, unique: true }, // Driver's email (must be unique)
  password: { type: String, required: true }, // Hashed password for security
  licenseNumber: { type: String, required: true, unique: true }, // Unique driving license
  vehicleType: { type: String, enum: ["Car", "Van", "Bus"], required: true }, // Only allows Car, Van, or Bus
  vehicleNumber: { type: String, required: true, unique: true }, // Unique vehicle registration
  seatCount: { type: Number, required: true }, // Number of passenger seats
  route: { type: String, required: true }, // The driver's primary route
  emergencyContact: { type: String, required: true }, // Provided explicitly by the chatbot
  role: { type: String, default: 'Driver' } // Differentiator when decoding later
}, { timestamps: true }); // Automatically adds createdAt and updatedAt fields to track when data was stored

// Create the model from the schema
const Driver = mongoose.model("Driver", driverSchema);

// Export the model so it can be used in controllers to save/find drivers
export default Driver;
