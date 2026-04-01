import { supabase } from "../utils/supabase.js";
import { v4 as uuidv4 } from "uuid";

// Helper: Generate a unique 6-character join code
const generateJoinCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Function: Create a new transportation system
export const createSystem = async (req, res) => {
  try {
    const { driverId, name, plateNumber, vehicleType, maxSeats, routeId, vehicleId } = req.body;

    if (!driverId || !name) {
      return res.status(400).json({ message: "Driver ID and system name are required." });
    }

    const joinCode = generateJoinCode();

    const insertData = {
      driver_id: driverId,
      name,
      plate_number: plateNumber,
      vehicle_type: vehicleType,
      max_seats: parseInt(maxSeats, 10) || 0,
      join_code: joinCode,
      vehicle_id: vehicleId || null
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
        return res.status(409).json({ message: "A system with this information (Join Code or similar) already exists." });
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

    // 1. Fetch main system info (Case-insensitive table check)
    const { data: system, error: sError } = await supabase
      .from('transportation_systems')
      .select('*')
      .eq('id', systemId)
      .single();

    if (sError || !system) {
      console.error(`[getSystemById] Fetch Error:`, sError?.message);
      return res.status(404).json({ message: "System not found." });
    }

    // 2. Fetch route info separately
    if (system.route_id) {
      const { data: routeData } = await supabase
        .from('routes')
        .select('name')
        .eq('id', system.route_id)
        .single();
      if (routeData) system.routes = routeData;
    }

    // 2a. Fetch Driver info
    const { data: driverData } = await supabase
      .from('users')
      .select('name, phone, license_number')
      .eq('id', system.driver_id)
      .single();
    if (driverData) system.driver = driverData;

    // 2b. Fetch Vehicle info
    if (system.vehicle_id) {
      const { data: vData } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', system.vehicle_id)
        .single();
      if (vData) system.vehicle = vData;
    }

    // 3. Safely Fetch attendant if exists
    try {
      const { data: attendants } = await supabase
        .from('system_attendants')
        .select('*')
        .eq('system_id', system.id);
        
      if (attendants && attendants.length > 0) {
        const attEntry = attendants[0]; // Take first attendant if multiple
        const { data: userData } = await supabase
          .from('users')
          .select('name, email')
          .eq('id', attEntry.attendant_id)
          .single();
          
        if (userData) {
          system.attendant = {
            id: attEntry.attendant_id,
            name: userData.name,
            email: userData.email,
            is_present: attEntry.is_present || false,
            has_control: attEntry.has_control || false,
            can_view_activities: attEntry.can_view_activities || false
          };
        }
      }
    } catch (attError) {
      console.error("[getSystemById] Error fetching attendant:", attError.message);
    }

    // 4. Added: Pass through manual route details
    system.start_lat = system.start_lat;
    system.start_lng = system.start_lng;
    system.end_lat = system.end_lat;
    system.end_lng = system.end_lng;
    system.start_location_name = system.start_location_name;
    system.end_location_name = system.end_location_name;
    system.route_polyline = system.route_polyline;

    res.status(200).json({ system });
  } catch (error) {
    console.error("[getSystemById] Internal Error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
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

    // 3. Notify Staff
    const { data: userData } = await supabase.from('users').select('name').eq('id', parentId).single();
    if (userData) {
      await notifyStaff(system.id, `${userData.name} has joined the system "${system.name}" as a parent.`, 'parent_joined');
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

    // 3. Fetch attendant name for notifications
    const { data: userData } = await supabase
      .from('users')
      .select('name')
      .eq('id', attendantId)
      .single();
    
    const attendantName = userData?.name || "A new attendant";

    // 4. Notify Driver and Parents
    await notifyStaff(system.id, `${attendantName} has joined the system "${system.name}" as an attendant.`, 'attendant_joined');
    await notifyParents(system.id, `${attendantName} has joined the vehicle staff for system "${system.name}".`, 'attendant_joined');

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
    const { role, userId } = req.query; // Using query for DELETE or body if caller uses PUT

    // 1. Get Parent Name and System Name before removal
    const { data: parentData } = await supabase.from('users').select('name').eq('id', parentId).single();
    const { data: systemData } = await supabase.from('transportation_systems').select('name').eq('id', systemId).single();
    
    const parentName = parentData?.name || "A parent";
    const systemName = systemData?.name || "the system";

    const { error } = await supabase
      .from('system_parents')
      .delete()
      .eq('system_id', systemId)
      .eq('parent_id', parentId);

    if (error) throw error;

    // 2. Notifications
    if (role === 'Attendant') {
      const { data: attData } = await supabase.from('users').select('name').eq('id', userId).single();
      const attendantName = attData?.name || "An attendant";
      
      // Notify Driver
      await notifyStaff(systemId, `${attendantName} has removed ${parentName} from the system.`, 'parent_removed', userId);
      // Notify Parent
      await supabase.from('notifications').insert([{
        user_id: parentId,
        system_id: systemId,
        message: `You have been removed from the transportation system "${systemName}" by the attendant.`,
        type: 'parent_removed'
      }]);
    } else if (role === 'Parent' || parentId === userId) {
      // Parent leaving
      await notifyStaff(systemId, `${parentName} has left the system "${systemName}".`, 'parent_left');
    } else if (role === 'Driver') {
      // Driver removing parent
      await supabase.from('notifications').insert([{
        user_id: parentId,
        system_id: systemId,
        message: `You have been removed from the transportation system "${systemName}" by the driver.`,
        type: 'parent_removed'
      }]);
    }

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

    // 4. Create notifications for parents and driver
    const { data: systemInfo } = await supabase
      .from('transportation_systems')
      .select('driver_id')
      .eq('id', systemId)
      .single();

    const notifications = [];
    
    // Add parents to notifications
    if (parents && parents.length > 0) {
      parents.forEach(p => notifications.push({
        user_id: p.parent_id,
        system_id: systemId,
        message: `${attendantName} is now ${isPresent ? 'PRESENT' : 'NOT PRESENT'} in the vehicle.`,
        type: 'attendant_presence'
      }));
    }

    // Add driver to notifications
    if (systemInfo?.driver_id) {
      notifications.push({
        user_id: systemInfo.driver_id,
        system_id: systemId,
        message: `Attendant ${attendantName} is now marked as ${isPresent ? 'PRESENT' : 'NOT PRESENT'}.`,
        type: 'attendant_presence'
      });
    }

    if (notifications.length > 0) {
      const { error: nError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (nError) {
        console.error("[updateAttendantPresence] Notification error:", nError);
      }
    }

    res.status(200).json({ message: "Presence status updated and notifications sent.", is_present: isPresent });
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
        system_id: systemId, // Added system_id
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
        system_id: systemId, // Added system_id
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

// Function: Update attendant control status
export const updateAttendantControl = async (req, res) => {
  try {
    const { attendantId } = req.params;
    const { hasControl } = req.body;

    // 1. Fetch current presence status
    const { data: attEntry, error: fetchError } = await supabase
      .from('system_attendants')
      .select('is_present, system_id')
      .eq('attendant_id', attendantId)
      .single();

    if (fetchError || !attEntry) {
      return res.status(404).json({ message: "Attendant not found in any system." });
    }

    // 2. Validation: Cannot give control if not present
    if (hasControl && !attEntry.is_present) {
      return res.status(400).json({ message: "Cannot give control to an attendant who is not present." });
    }

    // 3. Update control status
    const { error: updateError } = await supabase
      .from('system_attendants')
      .update({ has_control: hasControl })
      .eq('attendant_id', attendantId);

    if (updateError) throw updateError;

    // 4. Notify attendant
    await supabase.from('notifications').insert([{
      user_id: attendantId,
      system_id: attEntry.system_id,
      message: `You have been ${hasControl ? 'GRANTED' : 'REVOKED'} full control of the system.`,
      type: 'control_update'
    }]);

    res.status(200).json({ 
      message: `Control ${hasControl ? 'granted' : 'revoked'} successfully.`, 
      has_control: hasControl 
    });
  } catch (error) {
    console.error("[updateAttendantControl] Error:", error);
    res.status(500).json({ message: "Error updating control", error: error.message });
  }
};

// Function: Update attendant activity access status
export const updateAttendantActivityAccess = async (req, res) => {
  try {
    const { attendantId } = req.params;
    const { canViewActivities } = req.body;

    // 1. Fetch current entry
    const { data: attEntry, error: fetchError } = await supabase
      .from('system_attendants')
      .select('system_id')
      .eq('attendant_id', attendantId)
      .single();

    if (fetchError || !attEntry) {
      return res.status(404).json({ message: "Attendant not found in any system." });
    }

    // 2. Update status
    const { error: updateError } = await supabase
      .from('system_attendants')
      .update({ can_view_activities: canViewActivities })
      .eq('attendant_id', attendantId);

    if (updateError) throw updateError;

    // 3. Notify attendant
    await supabase.from('notifications').insert([{
      user_id: attendantId,
      system_id: attEntry.system_id,
      message: `You have been ${canViewActivities ? 'GRANTED' : 'REVOKED'} permission to view student activities.`,
      type: 'activity_access_update'
    }]);

    res.status(200).json({ 
      message: `Activity access ${canViewActivities ? 'granted' : 'revoked'} successfully.`, 
      can_view_activities: canViewActivities 
    });
  } catch (error) {
    console.error("[updateAttendantActivityAccess] Error:", error);
    res.status(500).json({ message: "Error updating activity access", error: error.message });
  }
};

// Function: Update system route details (Manual Selection)
export const updateSystemRouteMap = async (req, res) => {
  try {
    const { systemId } = req.params;
    const { 
      startLat, startLng, startName, 
      endLat, endLng, endName, 
      routeName, 
      routePolyline 
    } = req.body;

    if (!startLat || !endLat) {
      return res.status(400).json({ message: "Start and End coordinates are required." });
    }

    // 1. Create a formal route in 'routes' table
    const finalRouteName = routeName || `${startName || 'Start'} to ${endName || 'End'}`;
    
    const { data: routeData, error: routeError } = await supabase
      .from('routes')
      .insert([{ name: finalRouteName }])
      .select()
      .single();

    if (routeError) throw routeError;

    // 2. Update transportation system with coordinates AND the new route_id
    const { data: systemData, error: systemError } = await supabase
      .from('transportation_systems')
      .update({
        start_lat: startLat,
        start_lng: startLng,
        start_location_name: startName,
        end_lat: endLat,
        end_lng: endLng,
        end_location_name: endName,
        route_polyline: routePolyline,
        route_id: routeData.id, // Formalizing the link
        updated_at: new Date().toISOString()
      })
      .eq('id', systemId)
      .select()
      .single();

    if (systemError) throw systemError;

    // 3. Notify parents of the route change
    await notifyParents(systemId, `The route for system "${systemData.name}" has been updated to "${finalRouteName}".`, 'route_updated');

    res.status(200).json({ message: "Route map and system route updated successfully.", system: systemData });
  } catch (error) {
    console.error("[updateSystemRouteMap] Error:", error);
    res.status(500).json({ message: "Error updating route map", error: error.message });
  }
};

// HELPER: Notify all staff (Driver + Attendants) of a system
export const notifyStaff = async (systemId, message, type = 'system_update', excludeId = null) => {
  try {
    // 1. Get Driver
    const { data: system } = await supabase
      .from('transportation_systems')
      .select('driver_id')
      .eq('id', systemId)
      .single();

    // 2. Get Attendants
    const { data: attendants } = await supabase
      .from('system_attendants')
      .select('attendant_id')
      .eq('system_id', systemId);

    const recipients = [];
    if (system?.driver_id && system.driver_id !== excludeId) recipients.push(system.driver_id);
    if (attendants) {
      attendants.forEach(a => {
        if (a.attendant_id !== excludeId) recipients.push(a.attendant_id);
      });
    }

    if (recipients.length > 0) {
      const notifications = recipients.map(uid => ({
        user_id: uid,
        system_id: systemId,
        message,
        type
      }));
      await supabase.from('notifications').insert(notifications);
    }
  } catch (err) {
    console.error("[notifyStaff] Error:", err.message);
  }
};

// HELPER: Notify all parents of a system
export const notifyParents = async (systemId, message, type = 'system_update', excludeId = null) => {
  try {
    const { data: parents } = await supabase
      .from('system_parents')
      .select('parent_id')
      .eq('system_id', systemId);

    if (parents && parents.length > 0) {
      const notifications = parents
        .filter(p => p.parent_id !== excludeId)
        .map(p => ({
          user_id: p.parent_id,
          system_id: systemId,
          message,
          type
        }));
      
      if (notifications.length > 0) {
        await supabase.from('notifications').insert(notifications);
      }
    }
  } catch (err) {
    console.error("[notifyParents] Error:", err.message);
  }
};
