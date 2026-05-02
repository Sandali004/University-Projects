import Attendance from "../models/Attendance.js";
import Student from "../models/Student.js";
import SystemAttendant from "../models/SystemAttendant.js";
import Notification from "../models/Notification.js";

// Mark student attendance (pickup or dropoff)
export const markAttendance = async (req, res) => {
  try {
    const { studentId, type, systemId } = req.body;

    if (!studentId || !type) {
      return res.status(400).json({ message: "Student ID and type are required." });
    }

    if (type !== 'pickup' && type !== 'dropoff') {
      return res.status(400).json({ message: "Type must be 'pickup' or 'dropoff'." });
    }

    // Set today at 00:00:00 for strict daily matching
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. Get current attendance for today
    const existing = await Attendance.findOne({
      student_id: studentId,
      date: { $gte: today, $lt: tomorrow }
    });

    let result;
    if (existing) {
      // Update existing record
      existing[type === 'pickup' ? 'pickup' : 'drop_off'] = true;
      result = await existing.save();
    } else {
      // Insert new record
      const updateData = {
        student_id: studentId,
        date: new Date(),
        [type === 'pickup' ? 'pickup' : 'drop_off']: true
      };
      result = await Attendance.create(updateData);
    }

    // 2. Fetch student and parent info for notification
    const student = await Student.findById(studentId, 'name parent_id');

    if (student && student.parent_id) {
      const parentId = student.parent_id;
      const activityLabel = type === 'pickup' ? 'picked up' : 'dropped off';
      
      // 3. Create notification for parent
      await Notification.create({
        user_id: parentId,
        system_id: systemId || null,
        message: `Your child ${student.name} has been ${activityLabel}.`,
        type: 'attendance'
      });
    }

    res.status(200).json({ message: `Student marked as ${type} successfully.`, attendance: result });
  } catch (error) {
    console.error("[markAttendance] Error:", error);
    res.status(500).json({ message: "Error marking attendance", error: error.message });
  }
};

// Get last 7 days of activities for a student (with permission check)
export const getStudentActivities = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { userId, role } = req.query;

    if (!studentId) {
      return res.status(400).json({ message: "Student ID is required." });
    }

    // --- Permission Check ---
    if (role === 'Attendant') {
      // 1. Get the system_id for this student
      const student = await Student.findById(studentId, 'system_id');
      
      if (!student || !student.system_id) {
        return res.status(404).json({ message: "Student not found or not assigned to a system." });
      }

      // 2. Check if this attendant has activity access for this system
      const attEntry = await SystemAttendant.findOne({
        system_id: student.system_id,
        attendant_id: userId
      }, 'can_view_activities');
      
      if (!attEntry || !attEntry.can_view_activities) {
        return res.status(403).json({ message: "Access Denied: You do not have permission to view student activities." });
      }
    }
    // Note: Drivers and Parents (of the child) are assumed to have access for now.
    // --- End Permission Check ---

    const activities = await Attendance.find({ student_id: studentId })
        .sort({ date: -1 })
        .limit(7);

    res.status(200).json({ activities: activities || [] });
  } catch (error) {
    console.error("[getStudentActivities] Error:", error);
    res.status(500).json({ message: "Error fetching student activities", error: error.message });
  }
};
