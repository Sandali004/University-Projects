import { supabase } from "../utils/supabase.js";
import { v4 as uuidv4 } from "uuid";

// Helper: Generate a unique 6-character join code
const generateJoinCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Function: Create a new transportation system
export const createSystem = async (req, res) => {
  try {
    const { driverId, name, plateNumber, vehicleType, maxSeats, routeId } = req.body;

    if (!driverId || !name || !plateNumber) {
      return res.status(400).json({ message: "Driver ID, system name, and plate number are required." });
    }

    const joinCode = generateJoinCode();

    const insertData = {
      driver_id: driverId,
      name,
      plate_number: plateNumber,
      vehicle_type: vehicleType,
      max_seats: parseInt(maxSeats, 10) || 0,
      join_code: joinCode
    };

    if (routeId) {
      insertData.route_id = routeId;
    }

    const { data, error } = await supabase
      .from('transportation_systems')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.log('Error from Supabase createSystem:', error);
      if (error.code === '23505') {
        return res.status(409).json({ message: "You already have a system or this plate number is taken." });
      }
      return res.status(500).json({ message: "Database Error: " + error.message });
    }

    res.status(201).json({ message: "Transportation system created successfully.", system: data });
  } catch (error) {
    console.log('Error creating system:', error);
    res.status(500).json({ message: "Error creating system: " + error.message, error: error.message });
  }
};

// Function: Get system details by driver ID
export const getSystem = async (req, res) => {
  try {
    const { driverId } = req.params;

    const { data, error } = await supabase
      .from('transportation_systems')
      .select('*, routes(name)')
      .eq('driver_id', driverId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"

    res.status(200).json({ system: data || null });
  } catch (error) {
    res.status(500).json({ message: "Error fetching system", error: error.message });
  }
};

// Function: Parent joins a system via code
export const joinSystem = async (req, res) => {
  try {
    const { parentId, joinCode } = req.body;

    if (!parentId || !joinCode) {
      return res.status(400).json({ message: "Parent ID and join code are required." });
    }

    // 1. Find the system by join code
    const { data: system, error: systemError } = await supabase
      .from('transportation_systems')
      .select('id')
      .eq('join_code', joinCode.toUpperCase())
      .single();

    if (systemError || !system) {
      return res.status(404).json({ message: "Invalid join code. System not found." });
    }

    // 2. Add parent to system_parents
    const { error: joinError } = await supabase
      .from('system_parents')
      .insert([{ system_id: system.id, parent_id: parentId }]);

    if (joinError) {
      if (joinError.code === '23505') {
        return res.status(409).json({ message: "You are already a member of this system." });
      }
      throw joinError;
    }

    res.status(200).json({ message: "Successfully joined the transportation system.", systemId: system.id });
  } catch (error) {
    res.status(500).json({ message: "Error joining system", error: error.message });
  }
};

// Function: Get parents in a system
export const getSystemParents = async (req, res) => {
  try {
    const { systemId } = req.params;

    const { data, error } = await supabase
      .from('system_parents')
      .select('parent_id, users(name, email)')
      .eq('system_id', systemId);

    if (error) throw error;

    res.status(200).json({ parents: data });
  } catch (error) {
    res.status(500).json({ message: "Error fetching parents", error: error.message });
  }
};

// Function: Remove parent from system
export const removeParent = async (req, res) => {
  try {
    const { systemId, parentId } = req.params;

    const { error } = await supabase
      .from('system_parents')
      .delete()
      .eq('system_id', systemId)
      .eq('parent_id', parentId);

    if (error) throw error;

    res.status(200).json({ message: "Parent removed from system successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error removing parent", error: error.message });
  }
};

// Function: Get all available routes
export const getRoutes = async (req, res) => {
  try {
    const { data, error } = await supabase.from('routes').select('*');
    if (error) throw error;
    res.status(200).json({ routes: data });
  } catch (error) {
    res.status(500).json({ message: "Error fetching routes", error: error.message });
  }
};

// Function: Get what system a parent is in
export const getParentSystem = async (req, res) => {
  try {
    const { parentId } = req.params;
    const { data, error } = await supabase
      .from('system_parents')
      .select('system_id, transportation_systems(*, routes(name))')
      .eq('parent_id', parentId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    res.status(200).json({ system: data?.transportation_systems || null });
  } catch (error) {
    res.status(500).json({ message: "Error fetching parent system", error: error.message });
  }
};

// Function: Update system route
export const updateSystemRoute = async (req, res) => {
  try {
    const { systemId } = req.params;
    const { routeId } = req.body;

    const { data, error } = await supabase
      .from('transportation_systems')
      .update({ route_id: routeId })
      .eq('id', systemId)
      .select('*, routes(name)')
      .single();

    if (error) throw error;

    res.status(200).json({ message: "Route updated successfully.", system: data });
  } catch (error) {
    res.status(500).json({ message: "Error updating route", error: error.message });
  }
};


// START TRACKING NOTIFY

export const startTrackingNotify = async (req, res) => {
  try {
    const { systemId } = req.params;
    const { driverName } = req.body;

    // Get all parents linked to this system
    const { data: parents, error: pError } = await supabase
      .from('system_parents')
      .select('parent_id')
      .eq('system_id', systemId);

    if (pError) throw pError;

    if (parents && parents.length > 0) {
      const notifications = parents.map(p => ({
        user_id: p.parent_id,
        message: `${driverName || 'The driver'} has started live location sharing.`,
        type: 'tracking_start'
      }));

      const { error: nError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (nError) throw nError;
    }

    res.status(200).json({ message: "Parents notified of tracking start." });
  } catch (error) {
    console.error("Error notifying tracking start:", error);
    res.status(500).json({ message: "Internal Server Error notifying start." });
  }
};


// STOP TRACKING NOTIFY

export const stopTrackingNotify = async (req, res) => {
  try {
    const { systemId } = req.params;

    const { data: parents, error: pError } = await supabase
      .from('system_parents')
      .select('parent_id')
      .eq('system_id', systemId);

    if (pError) throw pError;

    if (parents && parents.length > 0) {
      const notifications = parents.map(p => ({
        user_id: p.parent_id,
        message: "Driver has stopped live location sharing.",
        type: 'tracking_stop'
      }));

      const { error: nError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (nError) throw nError;
    }

    res.status(200).json({ message: "Parents notified of tracking stop." });
  } catch (error) {
    console.error("Error notifying tracking stop:", error);
    res.status(500).json({ message: "Internal Server Error notifying stop." });
  }
};
