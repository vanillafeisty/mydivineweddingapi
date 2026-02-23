import { executeQuery } from "../config/database.js";

export const createProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profileData = req.body;
    const existing = await executeQuery("SELECT id FROM profiles WHERE userId = ?", [userId]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: "Profile already exists" });
    }

    const query = `INSERT INTO profiles SET ?`;
    await executeQuery(query, { ...profileData, userId });
    
    res.status(201).json({ success: true, message: "Profile created successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create profile", error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await executeQuery("SELECT * FROM profiles WHERE userId = ?", [userId]);
    res.json({ success: true, data: profile[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const searchProfiles = async (req, res) => {
  try {
    const { religion, caste, location, minAge, maxAge } = req.query;
    let query = "SELECT * FROM profiles WHERE isVerified = 1";
    const params = [];

    if (religion) { query += " AND religion = ?"; params.push(religion); }
    if (caste) { query += " AND caste = ?"; params.push(caste); }
    if (location) { query += " AND location LIKE ?"; params.push(`%${location}%`); }
    if (minAge) { query += " AND age >= ?"; params.push(minAge); }
    if (maxAge) { query += " AND age <= ?"; params.push(maxAge); }

    const results = await executeQuery(query, params);
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: "Search failed" });
  }
};

export const getPendingProfiles = async (req, res) => {
  try {
    const query = `
      SELECT p.*, u.firstName, u.lastName, u.avatar 
      FROM profiles p 
      JOIN users u ON p.userId = u.id 
      WHERE p.isVerified = 0 OR p.isVerified IS NULL
      ORDER BY p.createdAt DESC
    `;
    const pendingProfiles = await executeQuery(query);
    res.json({ success: true, data: pendingProfiles });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const verifyProfile = async (req, res) => {
  try {
    const { profileId } = req.params;
    const result = await executeQuery(
      "UPDATE profiles SET isVerified = 1, updatedAt = NOW() WHERE id = ?",
      [profileId]
    );
    res.json({ success: true, message: "Profile verified successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to verify profile" });
  }
};

export const getAdminStats = async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users) as totalUsers,
        (SELECT COUNT(*) FROM profiles WHERE isVerified = 0 OR isVerified IS NULL) as pendingProfiles,
        (SELECT COUNT(*) FROM connections WHERE status = 'accepted') as totalMatches
    `;
    const stats = await executeQuery(statsQuery);
    res.json({ success: true, data: stats[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Stats failed" });
  }
};