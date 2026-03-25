import { supabase } from "../utils/supabase.js";

// Add a new student
export const addStudent = async (req, res) => {
  try {
    const { parentId, name, school, grade, pickupLocation, dropoffLocation } = req.body;

    if (!parentId || !name || !school) {
      return res.status(400).json({ message: "Parent ID, Name, and School are required." });
    }

    const { data, error } = await supabase
      .from('students')
      .insert([{
        parent_id: parentId,
        name,
        school,
        grade,
        pickup_location: pickupLocation,
        dropoff_location: dropoffLocation
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: "Student added successfully", student: data });
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
    const { name, school, grade, pickupLocation, dropoffLocation } = req.body;

    const { data, error } = await supabase
      .from('students')
      .update({
        name,
        school,
        grade,
        pickup_location: pickupLocation,
        dropoff_location: dropoffLocation
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ message: "Student updated successfully", student: data });
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
