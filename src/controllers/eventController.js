import { executeQuery } from "../config/database.js";
import { v4 as uuidv4 } from "uuid";

// Create a New Event
export const createEvent = async (req, res) => {
  try {
    const { title, description, event_date, location, type } = req.body;
    const adminId = req.user.id;
    const latestEvents = await executeQuery(
      "SELECT id FROM events WHERE id LIKE 'E%' ORDER BY CAST(SUBSTRING(id, 2) AS UNSIGNED) DESC LIMIT 1",
      []
    );

    let nextId = "E1"; 
    if (latestEvents.length > 0) {
      const currentMaxNum = parseInt(latestEvents[0].id.substring(1));
      nextId = `E${currentMaxNum + 1}`; 
    }
    await executeQuery(
      "INSERT INTO events (id, title, description, event_date, location, type, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [nextId, title, description, event_date, location, type, adminId]
    );

    res.status(201).json({ success: true, message: `Event ${nextId} created successfully!` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to create event" });
  }
};



//  Get events to show 
export const getEvents = async (req, res) => {
  const query = `
    SELECT 
      e.*, 
      a.firstName as adminName 
    FROM events e
    LEFT JOIN admin_credentials a ON e.created_by = a.id
    ORDER BY e.event_date ASC
  `;
    
  try {
    const results = await executeQuery(query, []);
    res.json({ success: true, data: results });
  } catch (error) {
    console.error("SQL Error in eventController:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};



// Updating an event
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, location, event_date, type } = req.body;
     let safeDate = event_date;
    if (!event_date || event_date.includes('-00')) {
       safeDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    }

    console.log(`--- ADMIN EVENT UPDATE: ${id} ---`);

    let query = `
      UPDATE events 
      SET title = ?, 
          description = ?, 
          location = ?, 
          event_date = ?, 
          type = ?, 
          updatedAt = NOW()
    `;
    let params = [title, description, location, safeDate, type];

    
    if (req.file) {
      const photo_path = `/uploads/${req.file.filename}`;
      query += ", event_photo = ?";
      params.push(photo_path);
    }

    query += " WHERE id = ?";
    params.push(id);

    const result = await executeQuery(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Event not found." });
    }

    res.json({ 
      success: true, 
      message: "✨ Event updated successfully!" 
    });

  } catch (error) {
    console.error("SQL UPDATE ERROR:", error.message);
    res.status(500).json({ success: false, message: "Update failed", error: error.message });
  }
};