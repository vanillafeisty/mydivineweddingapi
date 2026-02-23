import { Router } from "express";
import { executeQuery } from "../config/database.js";
import { v4 as uuidv4 } from "uuid";
import { authenticateToken, authorizeRole } from "../middleware/auth.js";

const router = Router();

// Get all connections for current user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status = "pending" } = req.query;

    let query = `
      SELECT c.*, 
             p.id as profileId, p.images, 
             u.firstName, u.lastName, u.avatar 
      FROM connections c
      JOIN profiles p ON c.senderId = p.userId OR c.receiverId = p.userId
      JOIN users u ON p.userId = u.id
      WHERE (c.senderId = ? OR c.receiverId = ?)
    `;

    const params = [userId, userId];

    if (status) {
      query += " AND c.status = ?";
      params.push(status);
    }

    query += " ORDER BY c.createdAt DESC";

    const connections = await executeQuery(query, params);

    res.json({
      success: true,
      data: connections,
    });
  } catch (error) {
    console.error("Get connections error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch connections",
        error: error.message,
      });
  }
});

// Send connection request
router.post("/send", authenticateToken, async (req, res) => {
  try {
    const senderId = req.user.userId;
    const { receiverId } = req.body;

    if (!receiverId) {
      return res
        .status(400)
        .json({ success: false, message: "Receiver ID required" });
    }

    if (senderId === receiverId) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot connect with yourself" });
    }

    // Check if connection already exists
    const existing = await executeQuery(
      `SELECT id FROM connections WHERE 
       (senderId = ? AND receiverId = ?) OR 
       (senderId = ? AND receiverId = ?)`,
      [senderId, receiverId, receiverId, senderId]
    );

    if (existing.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Connection already exists" });
    }

    const connectionId = uuidv4();
    await executeQuery(
      'INSERT INTO connections (id, senderId, receiverId, status) VALUES (?, ?, ?, "pending")',
      [connectionId, senderId, receiverId]
    );

    res.status(201).json({
      success: true,
      message: "Connection request sent",
      data: { connectionId },
    });
  } catch (error) {
    console.error("Send connection error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to send connection",
        error: error.message,
      });
  }
});

// Accept connection
router.put("/:connectionId/accept", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { connectionId } = req.params;

    const connections = await executeQuery(
      "SELECT * FROM connections WHERE id = ? AND receiverId = ?",
      [connectionId, userId]
    );

    if (connections.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Connection not found" });
    }

    await executeQuery(
      'UPDATE connections SET status = "accepted", updatedAt = NOW() WHERE id = ?',
      [connectionId]
    );

    res.json({
      success: true,
      message: "Connection accepted",
    });
  } catch (error) {
    console.error("Accept connection error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to accept connection",
        error: error.message,
      });
  }
});

// Reject connection
router.put("/:connectionId/reject", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { connectionId } = req.params;

    const connections = await executeQuery(
      "SELECT * FROM connections WHERE id = ? AND receiverId = ?",
      [connectionId, userId]
    );

    if (connections.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Connection not found" });
    }

    await executeQuery(
      'UPDATE connections SET status = "rejected", updatedAt = NOW() WHERE id = ?',
      [connectionId]
    );

    res.json({
      success: true,
      message: "Connection rejected",
    });
  } catch (error) {
    console.error("Reject connection error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to reject connection",
        error: error.message,
      });
  }
});

export default router;
