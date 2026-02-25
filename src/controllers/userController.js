import { executeQuery } from "../config/database.js";

export const getAllUsers = async (req, res) => {
  try {

    const query = `SELECT * FROM users WHERE role_id = 3 ORDER BY created_at DESC`;

    const users = await executeQuery(query, []);

    const formattedUsers = users.map(user => {
      // Gender Mapping
      const genderMap = { 1: 'Male', 2: 'Female' };

      // Marital Status Mapping (Assumption based on common IDs)
      const maritalMap = { 1: 'Never Married', 2: 'Divorced', 3: 'Widowed', 4: 'Awaiting Divorce' };

      return {
        id: user.profile_id,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        username: user.username,
        email_address: user.email_address,
        mobile: user.mobile_no || 'No Phone',
        role: 'User', // Fixed for this query
        status: user.status || 'active',
        plan: user.plan || 'free',
        joinedDate: user.created_at,
        verified: user.status === 'verified',
        avatar: user.profile_photo ? `http://localhost:5000/${user.profile_photo}` : `https://ui-avatars.com/api/?name=${user.first_name}&background=random`,

        // --- Identity ---
        dob: user.dob,
        gender: genderMap[user.gender_id] || 'Unspecified',
        maritalStatus: maritalMap[user.marital_status_id] || 'Unspecified',
        motherTongue: 'Tamil', // Default/Placeholder as not in DB yet

        // --- Location ---
        location: user.location,
        address: user.address,
        district: '', // Not in DB
        city: user.location ? user.location.split(',')[0] : '',
        state: '', // Not in DB
        country: 'India', // Default
        pincode: '', // Not in DB

        // --- Religious ---
        religion: 'Hindu', // Default/Map from religion_id if needed
        caste: user.caste,
        subCaste: user.sub_caste,
        community: user.community,
        gothram: '', // Not in DB
        dosham: '', // Not in DB
        raasi: user.raasi_id ? `Raasi ID: ${user.raasi_id}` : '',
        nakshatra: user.nakshatra_id ? `Star ID: ${user.nakshatra_id}` : '',
        lagnam: user.lagnam,
        poorviham: user.poorviham,
        kulaDeivam: user.kuladeivam,
        timeOfBirth: user.time_of_birth,
        placeOfBirth: user.place_of_birth,

        // --- Professional ---
        education: user.education,
        occupation: '', // Not in DB (was in profiles)
        income: '', // Not in DB

        // --- Other ---
        disability: user.disability === 1 ? 'Yes' : 'No',
        disabilityComments: user.disability_comments,
        idNumber: user.aadhar_card,

        // --- Placeholders for UI compatibility ---
        photos: [],
        profileScore: 50
      };
    });

    res.json({ success: true, data: formattedUsers });
  } catch (error) {
    console.error("DB Fetch Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAdminsOnly = async (req, res) => {
  try {
    const admins = await executeQuery(
      "SELECT id, firstName, lastName, email_address as email, role, role_id, status FROM users WHERE role_id IN (1, 2)",
      []
    );
    res.json({ success: true, data: admins });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching admins" });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = req.body;
    const query = `
      UPDATE users SET 
        location = ?, 
        address = ?, 
        caste = ?, 
        sub_caste = ?, 
        education = ?, 
        occupation = ?
      WHERE profile_id = ?
    `;

    const params = [
      data.location, data.address, data.caste, data.sub_caste,
      data.education, data.occupation,
      userId
    ];

    await executeQuery(query, params);
    res.json({ success: true, message: "MySQL Updated Successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};