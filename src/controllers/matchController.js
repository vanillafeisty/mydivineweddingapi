import { executeQuery } from "../config/database.js";

export const getTodayMatches = async (req, res) => {
  const query = `
    SELECT 
      u.profile_id as id, u.first_name as firstName, u.last_name as lastName, 
      u.profile_photo as avatar, u.gender_id, u.education, u.caste, u.plan, u.religion_id,
      
      CASE WHEN u.gender_id = 1 THEN 'Male' WHEN u.gender_id = 2 THEN 'Female' ELSE 'Other' END as gender,
     
      CASE WHEN u.religion_id = 1 THEN 'Hindu' WHEN u.religion_id = 2 THEN 'Christian' ELSE 'Other' END as religion,
      IFNULL(u.location, 'Chennai, TN') as location,
      TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) as age, 
      MAX(c.createdAt) as matchDate
    FROM users u
    JOIN connections c ON (u.profile_id = c.senderId OR u.profile_id = c.receiverId)
    WHERE c.status = 'accepted'
    GROUP BY 
      u.profile_id, u.first_name, u.last_name, u.profile_photo, 
      u.gender_id, u.education, u.caste, u.plan, u.religion_id, u.location, u.dob
    ORDER BY matchDate DESC
  `;
    
  try {
    const results = await executeQuery(query, []);
    res.json({ success: true, data: results });
  } catch (error) {
    console.error("SQL Error:", error);
    res.status(500).json({ success: false, message: "Error mapping user data" });
  }
};