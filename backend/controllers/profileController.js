import { supabase } from "../utils/supabase.js";

// Fetch user profile based on ID and Role
export const getProfile = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "User ID is required" });

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ profile: data });
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

    // Remove undefined fields
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ message: "Profile updated successfully", profile: data });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
};

// Permanent account deletion
export const deleteAccount = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ message: "User ID is required" });

    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", userId);

    if (error) throw error;

    res.status(200).json({ message: "Account successfully deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting account", error: error.message });
  }
};
