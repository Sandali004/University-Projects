import User from "../models/User.js";

// Fetch user profile based on ID and Role
export const getProfile = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "User ID is required" });

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ profile: user });
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile", error: error.message });
  }
};

// Update user profile details
export const updateProfile = async (req, res) => {
  try {
    const { userId, name, email, phone, licenseNumber, emergencyContact } = req.body;
    
    if (!userId) return res.status(400).json({ message: "User ID is required" });

    const updateData = {
      name: name?.trim(),
      email: email?.trim().toLowerCase(),
      phone: phone?.trim(),
      license_number: licenseNumber?.trim(),
      emergency_contact: emergencyContact?.trim(),
    };

    // Remove undefined or null fields
    Object.keys(updateData).forEach(key => (updateData[key] === undefined || updateData[key] === null) && delete updateData[key]);

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

    if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Profile updated successfully", profile: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
};

// Permanent account deletion
export const deleteAccount = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ message: "User ID is required" });

    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: "Account successfully deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting account", error: error.message });
  }
};
