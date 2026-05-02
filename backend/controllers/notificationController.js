import Notification from "../models/Notification.js";

export const getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    try {
        await Notification.deleteMany({
            created_at: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });
    } catch (deleteError) {
        console.error("[NotificationController] Cleanup error:", deleteError.message);
    }

    // 2. Fetch the remaining notifications for the user with system name join
    const notifications = await Notification.find({ user_id: userId })
        .populate('system_id', 'name')
        .sort({ created_at: -1 });

    const formattedNotifications = notifications.map(n => {
        const obj = n.toObject();
        obj.transportation_systems = obj.system_id;
        return obj;
    });

    return res.status(200).json({ notifications: formattedNotifications || [] });
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

    await Notification.findByIdAndDelete(id);

    return res.status(200).json({ message: "Notification deleted successfully." });
  } catch (error) {
    console.error("[NotificationController] Delete error:", error);
    return res.status(500).json({ message: "Failed to delete notification.", error: error.message });
  }
};
