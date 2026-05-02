import Student from "../models/Student.js";
import TransportationSystem from "../models/TransportationSystem.js";
import SystemAttendant from "../models/SystemAttendant.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { notifyStaff, notifyParents } from './systemController.js';

// Add a new student
export const addStudent = async (req, res) => {
  try {
    const { parentId, name, school, grade, pickupLocation, dropoffLocation, joinCode, systemId } = req.body;

    if (!parentId || !name || !school) {
      return res.status(400).json({ message: "Parent ID, Name, and School are required." });
    }

    let resolvedSystemId = systemId || null;
    if (joinCode && !resolvedSystemId) {
      const systemData = await TransportationSystem.findOne({ join_code: joinCode });
      
      if (!systemData) {
        return res.status(404).json({ message: "Invalid Van Join Code. Please check with your driver." });
      }
      resolvedSystemId = systemData._id;
    }

    const newStudent = await Student.create({
        parent_id: parentId,
        name,
        school,
        grade,
        pickup_location: pickupLocation,
        dropoff_location: dropoffLocation,
        system_id: resolvedSystemId
    });

    res.status(201).json({ message: "Student registered successfully", student: newStudent });
  } catch (error) {
    res.status(500).json({ message: "Error adding student", error: error.message });
  }
};

// Get all students for a specific parent
export const getStudentsByParent = async (req, res) => {
  try {
    const { parentId } = req.params;

    const students = await Student.find({ parent_id: parentId }).sort({ created_at: -1 });

    res.status(200).json({ students: students || [] });
  } catch (error) {
    res.status(500).json({ message: "Error fetching students", error: error.message });
  }
};

// Update an existing student
export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, school, grade, pickupLocation, dropoffLocation, joinCode, systemId, role, userId } = req.body;

    // 1. Get current student data to see if system_id is changing
    const currentStudent = await Student.findById(id);

    let resolvedSystemId = systemId;
    if (joinCode) {
      const systemData = await TransportationSystem.findOne({ join_code: joinCode });
      
      if (!systemData) {
        return res.status(404).json({ message: "Invalid Van Join Code." });
      }
      resolvedSystemId = systemData._id;
    }

    const updatePayload = {
      name,
      school,
      grade,
      pickup_location: pickupLocation,
      dropoff_location: dropoffLocation
    };
    if (resolvedSystemId !== undefined) {
      updatePayload.system_id = resolvedSystemId;
    }

    const updatedStudent = await Student.findByIdAndUpdate(id, updatePayload, { new: true });

    // 2. Notifications for Removal
    if (currentStudent?.system_id && resolvedSystemId === null) {
      const oldSystemId = currentStudent.system_id;
      const studentName = currentStudent.name || "A student";

      if (role === 'Attendant') {
        const parentData = await User.findById(userId);
        const attendantName = parentData?.name || "The attendant";
        // Notify Driver
        await notifyStaff(oldSystemId, `${attendantName} has removed ${studentName} from the system.`, 'student_removed', userId);
        // Notify Parent
        if (currentStudent.parent_id) {
          await Notification.create({
            user_id: currentStudent.parent_id,
            system_id: oldSystemId,
            message: `Your child ${studentName} has been removed from the transportation system by the attendant.`,
            type: 'student_removed'
          });
        }
      } else if (role === 'Driver') {
        // Notify Parent
        if (currentStudent.parent_id) {
          await Notification.create({
            user_id: currentStudent.parent_id,
            system_id: oldSystemId,
            message: `Your child ${studentName} has been removed from the transportation system by the driver.`,
            type: 'student_removed'
          });
        }
      } else if (role === 'Parent') {
        // Notify Driver + Attendants
        await notifyStaff(oldSystemId, `Parent has removed ${studentName} from the system.`, 'student_removed', userId);
      }
    } 
    // 3. Notifications for Joining
    else if (!currentStudent?.system_id && resolvedSystemId) {
      if (role === 'Parent') {
        const studentName = updatedStudent.name || "A new student";
        await notifyStaff(resolvedSystemId, `${studentName} has been added to your system by a parent.`, 'student_added', userId);
      }
    }

    res.status(200).json({ message: "Student profile updated", student: updatedStudent });
  } catch (error) {
    console.error("[updateStudent] Error:", error);
    res.status(500).json({ message: "Error updating student", error: error.message });
  }
};

// Delete a student
export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    await Student.findByIdAndDelete(id);

    res.status(200).json({ message: "Student deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting student", error: error.message });
  }
};

export const getStudentsBySystem = async (req, res) => {
  try {
    const { systemId } = req.params;

    if (!systemId) {
      return res.status(400).json({ message: "System ID is required." });
    }

    // 1. Fetch students
    const students = await Student.find({ system_id: systemId });

    // 2. Map parent names if possible (optional enhancement)
    const enrichedStudents = await Promise.all((students || []).map(async (s) => {
      const studentObj = s.toObject(); // Need plain object to add custom properties
      if (studentObj.parent_id) {
        const parent = await User.findById(studentObj.parent_id);
        return { ...studentObj, parent_name: parent?.name || 'Unknown' };
      }
      return studentObj;
    }));

    res.status(200).json({ students: enrichedStudents });
  } catch (error) {
    console.error("[getStudentsBySystem] Error:", error);
    res.status(500).json({ message: "Error fetching system students", error: error.message });
  }
};

// Update Payment Status
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, role, userId, systemId } = req.body;

    if (!paymentStatus) {
      return res.status(400).json({ message: "Payment status is required." });
    }

    // Authorization Check: Driver or authorized Attendant
    if (role === 'Parent') {
      return res.status(403).json({ message: "Parents cannot update payment status." });
    }

    if (role === 'Attendant') {
      // Verify attendant has can_edit_payments permission
      const attData = await SystemAttendant.findOne({
        system_id: systemId,
        attendant_id: userId
      });
      
      if (!attData || !attData.can_edit_payments) {
        return res.status(403).json({ message: "You do not have permission to edit payment status." });
      }
    }

    const updatedStudent = await Student.findByIdAndUpdate(id, { payment_status: paymentStatus }, { new: true });

    // Notify Parent
    if (updatedStudent.parent_id) {
      await Notification.create({
        user_id: updatedStudent.parent_id,
        system_id: systemId,
        message: `Payment status for ${updatedStudent.name} has been updated to ${paymentStatus}.`,
        type: 'payment_update'
      });
    }

    res.status(200).json({ message: "Payment status updated successfully", student: updatedStudent });
  } catch (error) {
    console.error("[updatePaymentStatus] Error:", error);
    res.status(500).json({ message: "Error updating payment status", error: error.message });
  }
};

// Send Payment Reminder
export const sendPaymentReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, userId, systemId } = req.body;

    // 1. Fetch student and system details
    const student = await Student.findById(id).populate('system_id', 'name');

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    // 2. Authorization Check
    if (role === 'Attendant') {
      const attData = await SystemAttendant.findOne({
        system_id: systemId,
        attendant_id: userId
      });
      
      if (!attData || !attData.can_view_payments) {
        return res.status(403).json({ message: "You do not have permission to send payment reminders." });
      }
    } else if (role !== 'Driver') {
      return res.status(403).json({ message: "Unauthorized." });
    }

    // 3. Send Notification to Parent
    if (student.parent_id) {
      const systemName = student.system_id?.name || "the transportation system";
      await Notification.create({
        user_id: student.parent_id,
        system_id: systemId,
        message: `Reminder: Payment for ${student.name} is pending in ${systemName}. Please complete it soon.`,
        type: 'payment_reminder'
      });
    }

    res.status(200).json({ message: "Payment reminder sent to parent." });
  } catch (error) {
    console.error("[sendPaymentReminder] Error:", error);
    res.status(500).json({ message: "Error sending payment reminder", error: error.message });
  }
};
