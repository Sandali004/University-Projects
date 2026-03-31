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
        return res.status(409).json({ message: "This plate number is already registered to another system." });
      }
      return res.status(500).json({ message: "Database Error: " + error.message });
    }

    res.status(201).json({ message: "Transportation system created successfully.", system: data });
  } catch (error) {
    console.log('Error creating system:', error);
    res.status(500).json({ message: "Error creating system: " + error.message, error: error.message });
  }
};

// Function: Get all systems created by a driver
export const getDriverSystems = async (req, res) => {
  try {
    const { driverId } = req.params;

    const { data, error } = await supabase
      .from('transportation_systems')
      .select('*, routes(name)')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({ systems: data || [] });
  } catch (error) {
    res.status(500).json({ message: "Error fetching driver systems", error: error.message });
  }
};

// Function: Get system details by system ID (Generic)
export const getSystemById = async (req, res) => {
  try {
    const { systemId } = req.params;

    // 1. Fetch main system info with route join
    // Using explicit FK naming routes:route_id if generic routes(name) fails
    const { data, error } = await supabase
      .from('transportation_systems')
      .select('*, routes:route_id(name)')
      .eq('id', systemId)
      .single();

    if (error) {
      console.error(`[getSystemById] Fetch Error (System ${systemId}):`, error.message);
      if (error.code === 'PGRST116') return res.status(404).json({ message: "System not found." });
      throw error;
    }

    if (!data) {
      return res.status(404).json({ message: "No data found for system ID." });
    }

    // 2. Safely Fetch attendant if exists
    try {
      const { data: attendantData, error: aError } = await supabase
        .from('system_attendants')
        .select('is_present, users:attendant_id(name, email)')
        .eq('system_id', data.id)
        .single();
        
      if (!aError && attendantData && attendantData.users) {
        data.attendant = {
          name: attendantData.users.name,
          email: attendantData.users.email,
          is_present: attendantData.is_present
        };
      }
    } catch (attError) {
      console.warn("[getSystemById] Attendant fetch skipped or failed:", attError.message);
    }

    res.status(200).json({ system: data });
  } catch (error) {
    console.error("[getSystemById] Internal Error:", error);
    res.status(500).json({ message: "Internal server error fetching details", error: error.message });
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

// Function: Attendant joins a system via code
export const joinSystemAttendant = async (req, res) => {
  try {
    const { attendantId, joinCode } = req.body;

    if (!attendantId || !joinCode) {
      return res.status(400).json({ message: "Attendant ID and join code are required." });
    }

    // 1. Find the system by join code
    const { data: system, error: systemError } = await supabase
      .from('transportation_systems')
      .select('id, name')
      .eq('join_code', joinCode.toUpperCase())
      .single();

    if (systemError || !system) {
      return res.status(404).json({ message: "Invalid join code. System not found." });
    }

    // 2. Add attendant to system_attendants
    // Upsert or insert (assuming one system per attendant)
    const { error: joinError } = await supabase
      .from('system_attendants')
      .upsert([{ system_id: system.id, attendant_id: attendantId, is_present: true }], { onConflict: 'attendant_id' });

    if (joinError) throw joinError;

    // 3. Notify parents
    // Get attendant name
    const { data: userData } = await supabase
      .from('users')
      .select('name')
      .eq('id', attendantId)
      .single();
    
    const attendantName = userData?.name || "A new attendant";

    // Get all parents linked to this system
    const { data: parents, error: pError } = await supabase
      .from('system_parents')
      .select('parent_id')
      .eq('system_id', system.id);

    if (!pError && parents && parents.length > 0) {
      const notifications = parents.map(p => ({
        user_id: p.parent_id,
        message: `${attendantName} has joined the system "${system.name}" and is present.`,
        type: 'attendant_presence'
      }));

      await supabase.from('notifications').insert(notifications);
    }

    res.status(200).json({ message: "Successfully registered as attendant for this system.", systemId: system.id });
  } catch (error) {
    console.error("Error joining system as attendant:", error);
    res.status(500).json({ message: "Error joining system", error: error.message });
  }
};

// Function: Get parents in a system
export const getSystemParents = async (req, res) => {
  try {
    const { systemId } = req.params;

    const { data, error } = await supabase
      .from('system_parents')
      .select('parent_id, pickup_lat, pickup_lng, users(name, email)')
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

// Function: Get all systems a parent is in
export const getParentSystems = async (req, res) => {
  try {
    const { parentId } = req.params;
    const { data, error } = await supabase
      .from('system_parents')
      .select('system_id, transportation_systems(*, routes:route_id(name))')
      .eq('parent_id', parentId);

    if (error) throw error;

    const systems = data?.map(item => item.transportation_systems).filter(s => !!s) || [];
    
    // Fetch driver info for each system (simplified for list view)
    for (const system of systems) {
      const { data: driverData } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', system.driver_id)
        .single();
        
      if (driverData) system.driver = driverData;
    }

    res.status(200).json({ systems });
  } catch (error) {
    res.status(500).json({ message: "Error fetching parent systems", error: error.message });
  }
};

// Function: Get all systems an attendant is in
export const getAttendantSystems = async (req, res) => {
  try {
    const { attendantId } = req.params;
    const { data, error } = await supabase
      .from('system_attendants')
      .select('system_id, is_present, transportation_systems(*, routes(name))')
      .eq('attendant_id', attendantId);

    if (error) throw error;

    const systems = data?.map(item => {
      if (item.transportation_systems) {
        item.transportation_systems.is_present = item.is_present;
        return item.transportation_systems;
      }
      return null;
    }).filter(s => !!s) || [];

    // Fetch driver info for each
    for (const system of systems) {
      if (system.driver_id) {
        const { data: driverData } = await supabase
          .from('users')
          .select('name, email')
          .eq('id', system.driver_id)
          .single();
        if (driverData) system.driver = driverData;
      }
    }

    res.status(200).json({ systems });
  } catch (error) {
    res.status(500).json({ message: "Error fetching attendant systems", error: error.message });
  }
};

// Function: Update attendant presence
export const updateAttendantPresence = async (req, res) => {
  try {
    const { attendantId } = req.params;
    const { isPresent } = req.body;

    // 1. Update presence in database
    const { data: attendantRecord, error: updateError } = await supabase
      .from('system_attendants')
      .update({ is_present: isPresent })
      .eq('attendant_id', attendantId)
      .select('system_id')
      .single();

    if (updateError) throw updateError;

    const systemId = attendantRecord.system_id;

    // 2. Get attendant name
    const { data: userData } = await supabase
      .from('users')
      .select('name')
      .eq('id', attendantId)
      .single();
    
    const attendantName = userData?.name || "The attendant";

    // 3. Get all parents linked to this system
    const { data: parents, error: pError } = await supabase
      .from('system_parents')
      .select('parent_id')
      .eq('system_id', systemId);

    if (pError) throw pError;

    // 4. Create notifications for parents
    if (parents && parents.length > 0) {
      const notifications = parents.map(p => ({
        user_id: p.parent_id,
        message: `${attendantName} is now ${isPresent ? 'PRESENT' : 'NOT PRESENT'} in the vehicle.`,
        type: 'attendant_presence'
      }));

      const { error: nError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (nError) {
        console.error("[updateAttendantPresence] Notification error:", nError);
      }
    }

    res.status(200).json({ message: "Presence status updated and parents notified.", is_present: isPresent });
  } catch (error) {
    console.error("[updateAttendantPresence] Error:", error);
    res.status(500).json({ message: "Error updating presence", error: error.message });
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
// Function: Update parent's pickup location for a system
export const updateParentPickup = async (req, res) => {
  try {
    const { systemId, parentId } = req.params;
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ message: "Latitude and Longitude are required." });
    }

    const { error } = await supabase
      .from('system_parents')
      .update({ pickup_lat: lat, pickup_lng: lng })
      .eq('system_id', systemId)
      .eq('parent_id', parentId);

    if (error) throw error;

    res.status(200).json({ message: "Pickup location updated successfully." });
  } catch (error) {
    console.error("Error updating parent pickup location:", error);
    res.status(500).json({ message: "Error updating pickup location", error: error.message });
  }
};
