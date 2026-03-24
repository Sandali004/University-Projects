import memoryLocations from "../models/Location.js";

// Controller function: updateDriverLocation
// 1. Accepts data from req.body
// 2. Validates required fields
// 3. Saves or updates the driver’s latest location
// 4. Returns a success response
export const updateDriverLocation = async (req, res) => {
  try {
    // 1. Accept data from the incoming request body
    const { driverId, latitude, longitude, timestamp } = req.body;

    // 2. Validate required fields (never trust user input directly)
    if (!driverId || !latitude || !longitude || !timestamp) {
      return res.status(400).json({ 
        success: false,
        message: "Missing required location data. Please send driverId, latitude, longitude, and timestamp." 
      });
    }

    // 3. In-memory temporary database logic (Replace with MongoDB locationSchema.findOneAndUpdate later if needed)
    // Check if driver has already sent a location point before
    const existingIndex = memoryLocations.findIndex(loc => loc.driverId === driverId);

    if (existingIndex !== -1) {
      // Driver exists -> Update the driver's latest location
      memoryLocations[existingIndex] = { driverId, latitude, longitude, timestamp };
    } else {
      // Driver is new -> Save a brand new location entry
      memoryLocations.push({ driverId, latitude, longitude, timestamp });
    }

    // Print a simple clean log to terminal confirming update happened securely
    console.log(`[Live Location] Updated for Driver: ${driverId} ` +
                `| Lat: ${latitude} | Lng: ${longitude} | Time: ${timestamp}`);

    // 4. Return a successful, structured response back to the React Native app
    return res.status(200).json({ 
      success: true, 
      message: "Driver live location updated successfully in memory.",
      data: { driverId, latitude, longitude, timestamp }
    });

  } catch (error) {
    // Return standard error code and message gracefully without crashing the app
    console.error("Critical error updating driver location:", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Server Error updating location.", 
      error: error.message 
    });
  }
};
