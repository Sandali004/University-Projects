import { supabase } from "../utils/supabase.js";


export const getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }


    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (deleteError) {
      console.error("[NotificationController] Cleanup error:", deleteError.message);
      // We don't fail the request if cleanup fails, just log it.
    }

    // 2. Fetch the remaining notifications for the user
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw fetchError;
    }

    return res.status(200).json({ notifications: notifications || [] });
  } catch (error) {
    console.error("[NotificationController] Fetch error:", error);
    return res.status(500).json({ message: "Failed to fetch notifications.", error: error.message });
  }
};

// Delete a specific notification manually
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Notification ID is required." });
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return res.status(200).json({ message: "Notification deleted successfully." });
  } catch (error) {
    console.error("[NotificationController] Delete error:", error);
    return res.status(500).json({ message: "Failed to delete notification.", error: error.message });
  }
};
