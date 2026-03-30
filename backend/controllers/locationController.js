import { supabase } from "../utils/supabase.js";

// Controller function: updateDriverLocation
// 1. Accepts data from req.body
// 2. Validates required fields
// 3. Saves or updates the driver’s latest location in Supabase
// 4. Returns a success response
export const updateDriverLocation = async (req, res) => {
  try {
    // 1. Accept data from the incoming request body
    const { driverId, latitude, longitude, timestamp, driverName } = req.body;

    console.log('[LocationController] Received location update');
    console.log('[LocationController] Driver ID:', driverId);
    console.log('[LocationController] Coordinates:', { latitude, longitude });

    // 2. Validate required fields
    if (!driverId || !latitude || !longitude || !timestamp) {
      console.warn('[LocationController] Missing required fields');
      return res.status(400).json({ 
        success: false,
        message: "Missing required location data. Please send driverId, latitude, longitude, and timestamp." 
      });
    }

    // 3. Update in Supabase transportation_systems table
    // Note: We update with required name field to avoid NOT NULL constraint issues
    const payload = {
      current_lat: latitude, 
      current_lng: longitude,
      updated_at: new Date().toISOString(),
    };

    // If driver name is provided, include it
    if (driverName) {
      payload.name = driverName;
    }

    console.log('[LocationController] Updating transportation_systems table');
    console.log('[LocationController] Payload:', payload);

    const { error, data } = await supabase
      .from('transportation_systems')
      .update(payload)
      .eq('driver_id', driverId)
      .select();

    if (error) {
      console.error('[LocationController] Supabase error:', error.code, error.message);
      throw error;
    }

    console.log('[LocationController] Update successful, rows affected:', data?.length || 0);

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
