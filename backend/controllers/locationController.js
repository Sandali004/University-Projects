import { supabase } from "../utils/supabase.js";

export const updateLocation = async (req, res) => {
  try {
    const { driverId, latitude, longitude } = req.body;

    if (!driverId || !latitude || !longitude) {
      return res.status(400).json({ message: "Missing required location data." });
    }

    const { error } = await supabase
      .from('vans')
      .update({ current_lat: latitude, current_lng: longitude })
      .eq('driver_id', driverId);

    if (error) throw error;

    res.status(200).json({ message: "Location updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating location", error: error.message });
  }
};
