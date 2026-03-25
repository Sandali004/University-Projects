import { supabase } from "../utils/supabase.js";

// Controller function: updateDriverLocation
// 1. Accepts data from req.body
// 2. Validates required fields
// 3. Saves or updates the driver’s latest location in Supabase
// 4. Returns a success response
export const updateDriverLocation = async (req, res) => {
  try {
    // 1. Accept data from the incoming request body
    const { driverId, latitude, longitude, timestamp } = req.body;

    // 2. Validate required fields
    if (!driverId || latitude == null || longitude == null || !timestamp) {
      return res.status(400).json({ 
        success: false,
        message: "Missing required location data. Please send driverId, latitude, longitude, and timestamp." 
      });
    }

    // 3. Update in Supabase
    // Note: We use the transportation_systems table to track the latest location of the driver/vehicle
    const { error } = await supabase
      .from('transportation_systems')
      .update({ current_lat: latitude, current_lng: longitude })
      .eq('driver_id', driverId);

    if (error) throw error;

    // 4. Return a successful, structured response back to the React Native app
    return res.status(200).json({ 
      success: true, 
      message: "Driver live location updated successfully.",
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