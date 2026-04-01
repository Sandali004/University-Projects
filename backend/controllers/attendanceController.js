import { supabase } from "../utils/supabase.js";

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

    const today = new Date().toISOString().split('T')[0];

    // 1. Get current attendance for today
    const { data: existing, error: fetchError } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .eq('date', today)
      .single();

    let updateData = {
      student_id: studentId,
      date: today,
      [type === 'pickup' ? 'pickup' : 'drop_off']: true
    };

    let result;
    if (existing) {
      // Update existing record
      const { data, error } = await supabase
        .from('attendance')
        .update({ [type === 'pickup' ? 'pickup' : 'drop_off']: true })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from('attendance')
        .insert([updateData])
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    // 2. Fetch student and parent info for notification
    const { data: student, error: sError } = await supabase
      .from('students')
      .select('name, parent_id')
      .eq('id', studentId)
      .single();

    if (!sError && student) {
      const parentId = student.parent_id;
      const activityLabel = type === 'pickup' ? 'picked up' : 'dropped off';
      
      // 3. Create notification for parent
      await supabase.from('notifications').insert([{
        user_id: parentId,
        system_id: systemId || null,
        message: `Your child ${student.name} has been ${activityLabel}.`,
        type: 'attendance'
      }]);
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
      const { data: student, error: sError } = await supabase
        .from('students')
        .select('system_id')
        .eq('id', studentId)
        .single();
      
      if (sError || !student?.system_id) {
        return res.status(404).json({ message: "Student not found or not assigned to a system." });
      }

      // 2. Check if this attendant has activity access for this system
      const { data: attEntry, error: aError } = await supabase
        .from('system_attendants')
        .select('can_view_activities')
        .eq('system_id', student.system_id)
        .eq('attendant_id', userId)
        .single();
      
      if (aError || !attEntry?.can_view_activities) {
        return res.status(403).json({ message: "Access Denied: You do not have permission to view student activities." });
      }
    }
    // Note: Drivers and Parents (of the child) are assumed to have access for now.
    // --- End Permission Check ---

    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .order('date', { ascending: false })
      .limit(7);

    if (error) throw error;

    res.status(200).json({ activities: data || [] });
  } catch (error) {
    console.error("[getStudentActivities] Error:", error);
    res.status(500).json({ message: "Error fetching student activities", error: error.message });
  }
};
