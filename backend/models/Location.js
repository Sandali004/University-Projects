// NOTE: This project currently uses Supabase under the hood, but you requested a MongoDB Location model.
// Below is the clean, beginner-friendly MongoDB Mongoose schema for your reference.
// Because "mongoose" is not currently installed or connected in your index.js, this code is commented out to prevent crashes.

/*
// 1. Import Mongoose
import mongoose from 'mongoose';

// 2. Define the schema structure for a Location
const locationSchema = new mongoose.Schema({
  driverId: {
    type: String, // String prevents ID length issues
    required: true,
  },
  latitude: {
    type: Number, // Decimals need Number type
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: String, // Stored as ISOString
    required: true,
  }
});

// 3. Export the model so the controller can use it
export default mongoose.model('Location', locationSchema);
*/

// ==========================================
// TEMPORARY FALLBACK MEMORY DATABASE
// ==========================================
// Since the Mongo database isn't fully ready/installed yet, we are exporting a simple array 
// to serve as a temporary memory storage, as you requested. This keeps the backend from crashing!
const memoryLocations = [];

export default memoryLocations;
