import mongoose from "mongoose";

// Define the blueprint (schema) for saving live tracking locations
const locationSchema = new mongoose.Schema({
  // driverId links this location to a specific Driver in the Driver collection
  driverId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Driver", // Reference to the Driver model
    required: true, // A location must always belong to a driver
  },
  // GPS latitude coordinate
  latitude: { type: Number, required: true },
  
  // GPS longitude coordinate
  longitude: { type: Number, required: true },
  
  // The exact time the location was recorded (defaults to current time)
  timestamp: { type: Date, default: Date.now }, 
});

// Create the model using the schema
const Location = mongoose.model("Location", locationSchema);

// Export the model for use in location controllers
export default Location;
