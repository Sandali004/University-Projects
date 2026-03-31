import { supabase } from "../utils/supabase.js";

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
    const { name, school, grade, pickupLocation, dropoffLocation, joinCode, systemId } = req.body;

    let resolvedSystemId = systemId || undefined;
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

    res.status(200).json({ message: "Student profile updated", student: data });
  } catch (error) {
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

// Get all students for a specific system
export const getStudentsBySystem = async (req, res) => {
  try {
    const { systemId } = req.params;

    if (!systemId) {
      return res.status(400).json({ message: "System ID is required." });
    }

    const { data, error } = await supabase
      .from('students')
      .select('*, users!parent_id(name, email)') // Join with parent
      .eq('system_id', systemId);

    if (error) throw error;

    res.status(200).json({ students: data || [] });
  } catch (error) {
    console.error("[getStudentsBySystem] Error:", error);
    res.status(500).json({ message: "Error fetching system students", error: error.message });
  }
};
