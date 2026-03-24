import Location from "../models/Location.js";

export const updateLocation = async (req, res) => {
  try {
    const { driverId, latitude, longitude } = req.body;

    if (!driverId || !latitude || !longitude) {
      return res.status(400).json({ message: "Missing required location data." });
    }

    const newLocation = new Location({
      driverId,
      latitude,
      longitude
    });

    await newLocation.save();

    res.status(200).json({ message: "Location updated successfully", location: newLocation });
  } catch (error) {
    res.status(500).json({ message: "Error updating location", error: error.message });
  }
};
