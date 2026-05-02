import { v4 as uuidv4 } from "uuid";
import TransportationSystem from "../models/TransportationSystem.js";
import SystemParent from "../models/SystemParent.js";
import SystemAttendant from "../models/SystemAttendant.js";
import Student from "../models/Student.js";
import Notification from "../models/Notification.js";
import Route from "../models/Route.js";
import Vehicle from "../models/Vehicle.js";
import User from "../models/User.js";

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

    try {
        const newSystem = await TransportationSystem.create(insertData);
        res.status(201).json({ message: "Transportation system created successfully.", system: newSystem });
    } catch (dbError) {
        if (dbError.code === 11000) {
            return res.status(409).json({ message: "A system with this information (Join Code or similar) already exists." });
        }
        throw dbError;
    }
  } catch (error) {
    console.log('Error creating system:', error);
    res.status(500).json({ message: "Error creating system: " + error.message, error: error.message });
  }
};

// Function: Delete a transportation system
export const deleteSystem = async (req, res) => {
  try {
    const { systemId } = req.params;

    if (!systemId) {
      return res.status(400).json({ message: "System ID is required." });
    }

    // 1. Notify parents and staff before deletion (optional but good)
    try {
      await notifyParents(systemId, "The transportation system has been disbanded by the driver.", "system_deleted");
    } catch (notifyErr) {
      console.log("[deleteSystem] Notification error (ignoring):", notifyErr.message);
    }

    // 2. Clear system links for students
    await Student.updateMany({ system_id: systemId }, { system_id: null });

    // 3. Delete the system (Cascades should handle system_parents and system_attendants)
    await TransportationSystem.findByIdAndDelete(systemId);
    await SystemParent.deleteMany({ system_id: systemId });
    await SystemAttendant.deleteMany({ system_id: systemId });

    res.status(200).json({ message: "System deleted successfully." });
  } catch (error) {
    console.error("[deleteSystem] Error:", error);
    res.status(500).json({ message: "Error deleting system", error: error.message });
  }
};

// Function: Get all systems created by a driver
export const getDriverSystems = async (req, res) => {
  try {
    const { driverId } = req.params;

    const systems = await TransportationSystem.find({ driver_id: driverId })
        .populate('route_id', 'name')
        .sort({ created_at: -1 });

    const formattedSystems = systems.map(s => {
        const obj = s.toObject();
        obj.routes = obj.route_id; // map for frontend
        return obj;
    });

    res.status(200).json({ systems: formattedSystems || [] });
  } catch (error) {
    res.status(500).json({ message: "Error fetching driver systems", error: error.message });
  }
};

// Function: Get system details by system ID (Generic)
export const getSystemById = async (req, res) => {
  try {
    const { systemId } = req.params;

    // 1. Fetch main system info
    const systemData = await TransportationSystem.findById(systemId)
        .populate('route_id', 'name')
        .populate('driver_id', 'name phone license_number')
        .populate('vehicle_id');

    if (!systemData) {
      return res.status(404).json({ message: "System not found." });
    }

    const system = systemData.toObject();
    
    // Map populated fields back to what frontend expects
    if (system.route_id) system.routes = system.route_id;
    if (system.driver_id) system.driver = system.driver_id;
    if (system.vehicle_id) system.vehicle = system.vehicle_id;

    // 3. Safely Fetch attendant if exists
    try {
      const attendants = await SystemAttendant.find({ system_id: systemId }).populate('attendant_id', 'name email');
        
      if (attendants && attendants.length > 0) {
        const attEntry = attendants[0].toObject();
          
        if (attEntry.attendant_id) {
          system.attendant = {
            id: attEntry.attendant_id._id,
            name: attEntry.attendant_id.name,
            email: attEntry.attendant_id.email,
            is_present: attEntry.is_present || false,
            has_control: attEntry.has_control || false,
            can_view_activities: attEntry.can_view_activities || false,
            can_view_payments: attEntry.can_view_payments || false,
            can_edit_payments: attEntry.can_edit_payments || false
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
    const system = await TransportationSystem.findOne({ join_code: joinCode.toUpperCase() }, 'id name');

    if (!system) {
        return res.status(404).json({ message: "Invalid join code." });
    }

    // 2. Add parent to system_parents
    try {
        await SystemParent.create({ system_id: system._id, parent_id: parentId });
    } catch (joinError) {
        if (joinError.code === 11000) {
            return res.status(409).json({ message: "You are already a member of this system." });
        }
        throw joinError;
    }

    // 3. Notify Staff
    const userData = await User.findById(parentId, 'name');
    if (userData) {
      await notifyStaff(system._id, `${userData.name} has joined the system "${system.name}" as a parent.`, 'parent_joined');
    }

    res.status(200).json({ message: "Successfully joined the transportation system.", systemId: system._id });
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
    const system = await TransportationSystem.findOne({ join_code: joinCode.toUpperCase() }, 'id name');

    if (!system) {
      return res.status(404).json({ message: "Invalid join code. System not found." });
    }

    // 2. Add attendant to system_attendants
    // Upsert or insert (assuming one system per attendant)
    await SystemAttendant.findOneAndUpdate(
        { attendant_id: attendantId },
        { system_id: system._id, is_present: true },
        { upsert: true, new: true }
    );

    // 3. Fetch attendant name for notifications
    const userData = await User.findById(attendantId, 'name');
    const attendantName = userData?.name || "A new attendant";

    // 4. Notify Driver and Parents
    await notifyStaff(system._id, `${attendantName} has joined the system "${system.name}" as an attendant.`, 'attendant_joined');
    await notifyParents(system._id, `${attendantName} has joined the vehicle staff for system "${system.name}".`, 'attendant_joined');

    res.status(200).json({ message: "Successfully registered as attendant for this system.", systemId: system._id });
  } catch (error) {
    console.error("Error joining system as attendant:", error);
    res.status(500).json({ message: "Error joining system", error: error.message });
  }
};

// Function: Get parents in a system
export const getSystemParents = async (req, res) => {
  try {
    const { systemId } = req.params;

    const parentsData = await SystemParent.find({ system_id: systemId }).populate('parent_id', 'name email');

    const parents = parentsData.map(p => {
        const obj = p.toObject();
        obj.users = obj.parent_id;
        obj.parent_id = obj.parent_id?._id;
        return obj;
    });

    res.status(200).json({ parents });
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
    const parentData = await User.findById(parentId, 'name');
    const systemData = await TransportationSystem.findById(systemId, 'name');
    
    const parentName = parentData?.name || "A parent";
    const systemName = systemData?.name || "the system";

    await SystemParent.findOneAndDelete({ system_id: systemId, parent_id: parentId });

    // 2. Notifications
    if (role === 'Attendant') {
      const attData = await User.findById(userId, 'name');
      const attendantName = attData?.name || "An attendant";
      
      // Notify Driver
      await notifyStaff(systemId, `${attendantName} has removed ${parentName} from the system.`, 'parent_removed', userId);
      // Notify Parent
      await Notification.create({
        user_id: parentId,
        system_id: systemId,
        message: `You have been removed from the transportation system "${systemName}" by the attendant.`,
        type: 'parent_removed'
      });
    } else if (role === 'Parent' || parentId === userId) {
      // Parent leaving
      await notifyStaff(systemId, `${parentName} has left the system "${systemName}".`, 'parent_left');
    } else if (role === 'Driver') {
      // Driver removing parent
      await Notification.create({
        user_id: parentId,
        system_id: systemId,
        message: `You have been removed from the transportation system "${systemName}" by the driver.`,
        type: 'parent_removed'
      });
    }

    res.status(200).json({ message: "Parent removed from system successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error removing parent", error: error.message });
  }
};

// Function: Get all available routes
export const getRoutes = async (req, res) => {
  try {
    const routes = await Route.find();
    res.status(200).json({ routes });
  } catch (error) {
    res.status(500).json({ message: "Error fetching routes", error: error.message });
  }
};

// Function: Get all systems a parent is in
export const getParentSystems = async (req, res) => {
  try {
    const { parentId } = req.params;
    const parentSystemsData = await SystemParent.find({ parent_id: parentId })
        .populate({
            path: 'system_id',
            populate: { path: 'route_id', select: 'name' }
        });

    const systems = [];
    
    // Fetch driver info for each system (simplified for list view)
    for (const item of parentSystemsData) {
      if (item.system_id) {
          const system = item.system_id.toObject();
          system.routes = system.route_id; // map for frontend
          
          if (system.driver_id) {
            const driverData = await User.findById(system.driver_id, 'name email');
            if (driverData) system.driver = driverData;
          }
          systems.push(system);
      }
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
    const attendantSystemsData = await SystemAttendant.find({ attendant_id: attendantId })
        .populate({
            path: 'system_id',
            populate: { path: 'route_id', select: 'name' }
        });

    const systems = [];

    // Fetch driver info for each
    for (const item of attendantSystemsData) {
      if (item.system_id) {
        const system = item.system_id.toObject();
        system.is_present = item.is_present;
        system.routes = system.route_id;
        
        if (system.driver_id) {
            const driverData = await User.findById(system.driver_id, 'name email');
            if (driverData) system.driver = driverData;
        }
        systems.push(system);
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
    const attendantRecord = await SystemAttendant.findOneAndUpdate(
        { attendant_id: attendantId },
        { is_present: isPresent },
        { new: true }
    );

    if (!attendantRecord) {
        return res.status(404).json({ message: "Attendant not found." });
    }

    const systemId = attendantRecord.system_id;

    // 2. Get attendant name
    const userData = await User.findById(attendantId, 'name');
    const attendantName = userData?.name || "The attendant";

    // 3. Get all parents linked to this system
    const parents = await SystemParent.find({ system_id: systemId }, 'parent_id');

    // 4. Create notifications for parents and driver
    const systemInfo = await TransportationSystem.findById(systemId, 'driver_id');

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
        await Notification.insertMany(notifications);
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

    const system = await TransportationSystem.findByIdAndUpdate(
        systemId,
        { route_id: routeId },
        { new: true }
    ).populate('route_id', 'name');

    const formattedSystem = system.toObject();
    formattedSystem.routes = formattedSystem.route_id;

    res.status(200).json({ message: "Route updated successfully.", system: formattedSystem });
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
    const parents = await SystemParent.find({ system_id: systemId }, 'parent_id');

    if (parents && parents.length > 0) {
      const notifications = parents.map(p => ({
        user_id: p.parent_id,
        system_id: systemId, // Added system_id
        message: `${driverName || 'The driver'} has started live location sharing.`,
        type: 'tracking_start'
      }));

      await Notification.insertMany(notifications);
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

    const parents = await SystemParent.find({ system_id: systemId }, 'parent_id');

    if (parents && parents.length > 0) {
      const notifications = parents.map(p => ({
        user_id: p.parent_id,
        system_id: systemId, // Added system_id
        message: "Driver has stopped live location sharing.",
        type: 'tracking_stop'
      }));

      await Notification.insertMany(notifications);
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

    await SystemParent.findOneAndUpdate(
        { system_id: systemId, parent_id: parentId },
        { pickup_lat: lat, pickup_lng: lng }
    );

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
    const attEntry = await SystemAttendant.findOne({ attendant_id: attendantId }, 'is_present system_id');

    if (!attEntry) {
      return res.status(404).json({ message: "Attendant not found in any system." });
    }

    // 2. Validation: Cannot give control if not present
    if (hasControl && !attEntry.is_present) {
      return res.status(400).json({ message: "Cannot give control to an attendant who is not present." });
    }

    // 3. Update control status
    await SystemAttendant.findOneAndUpdate(
        { attendant_id: attendantId },
        { has_control: hasControl }
    );

    // 4. Notify attendant
    await Notification.create({
      user_id: attendantId,
      system_id: attEntry.system_id,
      message: `You have been ${hasControl ? 'GRANTED' : 'REVOKED'} full control of the system.`,
      type: 'control_update'
    });

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
    const attEntry = await SystemAttendant.findOne({ attendant_id: attendantId }, 'system_id');

    if (!attEntry) {
      return res.status(404).json({ message: "Attendant not found in any system." });
    }

    // 2. Update status
    await SystemAttendant.findOneAndUpdate(
        { attendant_id: attendantId },
        { can_view_activities: canViewActivities }
    );

    // 3. Notify attendant
    await Notification.create({
      user_id: attendantId,
      system_id: attEntry.system_id,
      message: `You have been ${canViewActivities ? 'GRANTED' : 'REVOKED'} permission to view student activities.`,
      type: 'activity_access_update'
    });

    res.status(200).json({ 
      message: `Activity access ${canViewActivities ? 'granted' : 'revoked'} successfully.`, 
      can_view_activities: canViewActivities 
    });
  } catch (error) {
    console.error("[updateAttendantActivityAccess] Error:", error);
    res.status(500).json({ message: "Error updating activity access", error: error.message });
  }
};

// Function: Update attendant payment access status
export const updateAttendantPaymentAccess = async (req, res) => {
  try {
    const { attendantId } = req.params;
    const { canViewPayments, canEditPayments } = req.body;

    // 1. Fetch current entry
    const attEntry = await SystemAttendant.findOne({ attendant_id: attendantId }, 'system_id');

    if (!attEntry) {
      return res.status(404).json({ message: "Attendant not found in any system." });
    }

    // 2. Validation: canEditPayments can only be true if canViewPayments is true
    const finalCanEdit = canViewPayments ? canEditPayments : false;

    // 3. Update status
    await SystemAttendant.findOneAndUpdate(
        { attendant_id: attendantId },
        { 
            can_view_payments: canViewPayments,
            can_edit_payments: finalCanEdit
        }
    );

    // 4. Notify attendant
    await Notification.create({
      user_id: attendantId,
      system_id: attEntry.system_id,
      message: `Your payment access permissions have been updated.`,
      type: 'payment_access_update'
    });

    res.status(200).json({ 
      message: `Payment access updated successfully.`, 
      can_view_payments: canViewPayments,
      can_edit_payments: finalCanEdit
    });
  } catch (error) {
    console.error("[updateAttendantPaymentAccess] Error:", error);
    res.status(500).json({ message: "Error updating payment access", error: error.message });
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
    
    const routeData = await Route.create({ name: finalRouteName });

    // 2. Update transportation system with coordinates AND the new route_id
    const systemData = await TransportationSystem.findByIdAndUpdate(
        systemId,
        {
            start_lat: startLat,
            start_lng: startLng,
            start_location_name: startName,
            end_lat: endLat,
            end_lng: endLng,
            end_location_name: endName,
            route_polyline: routePolyline,
            route_id: routeData._id, // Formalizing the link
        },
        { new: true }
    );

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
    const system = await TransportationSystem.findById(systemId, 'driver_id');

    // 2. Get Attendants
    const attendants = await SystemAttendant.find({ system_id: systemId }, 'attendant_id');

    const recipients = [];
    if (system?.driver_id && system.driver_id.toString() !== excludeId) recipients.push(system.driver_id);
    if (attendants) {
      attendants.forEach(a => {
        if (a.attendant_id.toString() !== excludeId) recipients.push(a.attendant_id);
      });
    }

    if (recipients.length > 0) {
      const notifications = recipients.map(uid => ({
        user_id: uid,
        system_id: systemId,
        message,
        type
      }));
      await Notification.insertMany(notifications);
    }
  } catch (err) {
    console.error("[notifyStaff] Error:", err.message);
  }
};

// HELPER: Notify all parents of a system
export const notifyParents = async (systemId, message, type = 'system_update', excludeId = null) => {
  try {
    const parents = await SystemParent.find({ system_id: systemId }, 'parent_id');

    if (parents && parents.length > 0) {
      const notifications = parents
        .filter(p => p.parent_id.toString() !== excludeId)
        .map(p => ({
          user_id: p.parent_id,
          system_id: systemId,
          message,
          type
        }));
      
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    }
  } catch (err) {
    console.error("[notifyParents] Error:", err.message);
  }
};
