import { supabase } from "../utils/supabase.js";

// Function: Add a new vehicle for a driver
export const createVehicle = async (req, res) => {
  try {
    const { driverId, plateNumber, model, color, maxSeats } = req.body;

    if (!driverId || !plateNumber) {
      return res.status(400).json({ message: "Driver ID and plate number are required." });
    }

    const { data, error } = await supabase
      .from('vehicles')
      .insert([{
        driver_id: driverId,
        plate_number: plateNumber.trim().toUpperCase(),
        model: model?.trim(),
        color: color?.trim(),
        max_seats: parseInt(maxSeats, 10) || 0
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ message: "A vehicle with this plate number already exists." });
      }
      throw error;
    }

    res.status(201).json({ message: "Vehicle added successfully.", vehicle: data });
  } catch (error) {
    console.error("[createVehicle] Error:", error);
    res.status(500).json({ message: "Error adding vehicle", error: error.message });
  }
};

// Function: Get all vehicles owned by a driver
export const getDriverVehicles = async (req, res) => {
  try {
    const { driverId } = req.params;

    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({ vehicles: data || [] });
  } catch (error) {
    console.error("[getDriverVehicles] Error:", error);
    res.status(500).json({ message: "Error fetching vehicles", error: error.message });
  }
};

// Function: Delete a vehicle
export const deleteVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', vehicleId);

    if (error) throw error;

    res.status(200).json({ message: "Vehicle deleted successfully." });
  } catch (error) {
    console.error("[deleteVehicle] Error:", error);
    res.status(500).json({ message: "Error deleting vehicle", error: error.message });
  }
};
