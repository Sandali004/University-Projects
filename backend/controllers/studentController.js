import { supabase } from "../utils/supabase.js";
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
      const { data: systemData, error: systemError } = await supabase
        .from('transportation_systems')
        .select('id')
        .eq('join_code', joinCode)
        .single();
      
      if (systemError || !systemData) {
        return res.status(404).json({ message: "Invalid Van Join Code. Please check with your driver." });
      }
      resolvedSystemId = systemData.id;
    }

    const { data, error } = await supabase
      .from('students')
      .insert([{
        parent_id: parentId,
        name,
        school,
        grade,
        pickup_location: pickupLocation,
        dropoff_location: dropoffLocation,
        system_id: resolvedSystemId
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: "Student registered successfully", student: data });
  } catch (error) {
    res.status(500).json({ message: "Error adding student", error: error.message });
  }
};

// Get all students for a specific parent
export const getStudentsByParent = async (req, res) => {
  try {
    const { parentId } = req.params;

    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('parent_id', parentId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({ students: data || [] });
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
    const { data: currentStudent } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();

    let resolvedSystemId = systemId;
    if (joinCode) {
      const { data: systemData, error: systemError } = await supabase
        .from('transportation_systems')
        .select('id')
        .eq('join_code', joinCode)
        .single();
      
      if (systemError || !systemData) {
        return res.status(404).json({ message: "Invalid Van Join Code." });
      }
      resolvedSystemId = systemData.id;
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

    const { data, error } = await supabase
      .from('students')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // 2. Notifications for Removal
    if (currentStudent?.system_id && resolvedSystemId === null) {
      const oldSystemId = currentStudent.system_id;
      const studentName = currentStudent.name || "A student";

      if (role === 'Attendant') {
        const { data: parentData } = await supabase.from('users').select('name').eq('id', userId).single();
        const attendantName = parentData?.name || "The attendant";
        // Notify Driver
        await notifyStaff(oldSystemId, `${attendantName} has removed ${studentName} from the system.`, 'student_removed', userId);
        // Notify Parent
        if (currentStudent.parent_id) {
          await supabase.from('notifications').insert([{
            user_id: currentStudent.parent_id,
            system_id: oldSystemId,
            message: `Your child ${studentName} has been removed from the transportation system by the attendant.`,
            type: 'student_removed'
          }]);
        }
      } else if (role === 'Driver') {
        // Notify Parent
        if (currentStudent.parent_id) {
          await supabase.from('notifications').insert([{
            user_id: currentStudent.parent_id,
            system_id: oldSystemId,
            message: `Your child ${studentName} has been removed from the transportation system by the driver.`,
            type: 'student_removed'
          }]);
        }
      } else if (role === 'Parent') {
        // Notify Driver + Attendants
        await notifyStaff(oldSystemId, `Parent has removed ${studentName} from the system.`, 'student_removed', userId);
      }
    } 
    // 3. Notifications for Joining
    else if (!currentStudent?.system_id && resolvedSystemId) {
      if (role === 'Parent') {
        const studentName = data.name || "A new student";
        await notifyStaff(resolvedSystemId, `${studentName} has been added to your system by a parent.`, 'student_added', userId);
      }
    }

    res.status(200).json({ message: "Student profile updated", student: data });
  } catch (error) {
    console.error("[updateStudent] Error:", error);
    res.status(500).json({ message: "Error updating student", error: error.message });
  }
};

// Delete a student
export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (error) throw error;

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
    const { data: students, error } = await supabase
      .from('students')
      .select('*')
      .eq('system_id', systemId);

    if (error) throw error;

    // 2. Map parent names if possible (optional enhancement)
    const enrichedStudents = await Promise.all((students || []).map(async (s) => {
      if (s.parent_id) {
        const { data: parent } = await supabase
          .from('users')
          .select('name')
          .eq('id', s.parent_id)
          .single();
        return { ...s, parent_name: parent?.name || 'Unknown' };
      }
      return s;
    }));

    res.status(200).json({ students: enrichedStudents });
  } catch (error) {
    console.error("[getStudentsBySystem] Error:", error);
    res.status(500).json({ message: "Error fetching system students", error: error.message });
  }
};
