import { executeQuery } from "../config/database.js";
import { hashPassword, comparePassword } from "../utils/passwordUtils.js";
import { generateTokens } from "../utils/tokenManager.js";
import { v4 as uuidv4 } from "uuid";
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// --- LOGIN LOGIC ---
export const loginUser = async (req, res) => {
  try {
    const email = (req.body.email || req.body.email_address || "").trim();
    const password = req.body.password;
    
    // This catches 'true', true, or 'isAdminLogin'
    const isAdmin = req.body.isAdmin === true || 
                    req.body.isAdminLogin === true || 
                    req.body.isAdmin === 'true' ||
                    req.body.isAdminLogin === 'true';

    console.log(`[AUTH] Login Attempt: ${email} | AdminFlag: ${isAdmin}`);

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }

    // Determine which table to search
    const query = isAdmin
      ? `SELECT id, email_address, password, role_id FROM admin_credentials WHERE email_address = ?`
      : `SELECT profile_id as id, email_address, mobile_no, password, role_id, status FROM users WHERE email_address = ? OR mobile_no = ?`;

    const params = isAdmin ? [email] : [email, email];
    const results = await executeQuery(query, params);

    if (results.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid Identity - User not found" });
    }

    const user = results[0];
    const isPasswordValid = await comparePassword(password, user.password);
    const isPlainMatch = (password === user.password); // Fallback for plain text

    if (!isPasswordValid && !isPlainMatch) {
      return res.status(401).json({ success: false, message: "Invalid Credentials - Password wrong" });
    }

    const { accessToken } = generateTokens(user.id, user.role_id);

    res.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email_address,
        role: user.role_id,
        accessToken
      }
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


export const fixUserPasswords = async (req, res) => {
  try {
    const hashed = await hashPassword('test@123');
    const users = await executeQuery("SELECT profile_id, mobile_no FROM users", []);

    for (const user of users) {
      if (user.mobile_no) {
        await executeQuery(
          "UPDATE users SET password = ?, change_password = 0 WHERE profile_id = ?",
          [hashed, user.profile_id]
        );
      }
    }
    res.json({ success: true, message: "All user passwords reset to 'test@123'" });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

//--- LOGOUT LOGIC ---
export const logoutUser = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, message: "Refresh token required" });
    res.json({ success: true, message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Logout failed" });
  }
};



// --- GET ALL ADMINS ---
export const getAllAdmins = async (req, res) => {
  try {
    const admins = await executeQuery(
      "SELECT id, firstName, email_address as email, role_id, status FROM admin_credentials",
      []
    );
    const formatted = admins.map(a => ({
      ...a,
      name: a.firstName,
      role: a.role_id === 1 ? 'super admin' : 'admin',
      status: 'ACTIVE'
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// --- ADD ADMIN (By Super Admin) ---
export const addAdminBySuperAdmin = async (req, res) => {
  const { email_address, firstName, lastName } = req.body;
  const Password = 'secure123';
  const hashed = await hashPassword(Password);
  await executeQuery(
    "INSERT INTO admin_credentials (firstName, lastName, email_address, password, role_id) VALUES (?, ?, ?, ?, 2)",
    [firstName, lastName, email_address, hashed]
  );

  res.json({ success: true, message: "Admin added!" });
};

// --- RESET ADMIN PASSWORD (Forget Password) ---
export const resetAdminPassword = async (req, res) => {
  try {
    const { email_address, newPassword } = req.body;

    // 1. Check if admin exists
    const admins = await executeQuery(
      "SELECT id FROM admin_credentials WHERE email_address = ?",
      [email_address]
    );

    if (admins.length === 0) {
      return res.status(404).json({ success: false, message: "Admin email not found" });
    }

    // 2. Hash new password
    const hashed = await hashPassword(newPassword);

    // 3. Update password
    await executeQuery(
      "UPDATE admin_credentials SET password = ? WHERE email_address = ?",
      [hashed, email_address]
    );

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Reset Admin Password Error:", error);
    res.status(500).json({ success: false, message: "Failed to reset password" });
  }
};



// --- REGISTER USER (Simple) ---
export const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email_address } = req.body;
    const userPassword = 'password123';
    // profile_id is AUTO_INCREMENT, so no uuid needed for users table.
    // However, if we need valid data for other non-null fields:

    // Check required fields in new schema:
    // first_name, last_name, dob, gender_id, mobile_no, email_address are NOT NULL.
    // registerUser (Simple) usually comes from a basic form.

    // We might need to provide defaults or return error if fields missing.
    // Assuming this simple registration is deprecated or needs to be robust. 
    // I'll update it to minimally work if possible, or fail gracefully.

    const hashed = await hashPassword(userPassword);

    await executeQuery(
      `INSERT INTO users (
         first_name, last_name, email_address, password, role_id, status, 
         dob, gender_id, mobile_no
       ) VALUES (?, ?, ?, ?, 3, 'active', '1990-01-01', 1, '0000000000')`,
      // providing dummy mobile/dob to satisfy schema constraint if not provided?
      // This simple registerUser might be legacy.
      [firstName, lastName, email_address, hashed]
    );

    res.status(201).json({ success: true, message: "Registration successful! Default password: password123" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Registration failed: " + error.message });
  }
};


// --- GET CURRENT USER ---
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id; // profile_id (int)

    const results = await executeQuery(
      "SELECT * FROM users WHERE profile_id = ?",
      [userId]
    );

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = results[0];

    // Response structure expected by client
    res.json({
      success: true,
      data: {
        ...user,
        firstName: user.first_name,
        lastName: user.last_name,
        email_address: user.email_address,
        mobile: user.mobile_no
      }
    });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};



// --- REQUEST LOGIN CODE ---
export const requestLoginCode = async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    const last10Digits = mobileNumber.replace(/\D/g, '').slice(-10);

    const users = await executeQuery(
      "SELECT profile_id FROM users WHERE mobile_no LIKE ?",
      [`%${last10Digits}`]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "Number not found" });
    }

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    await executeQuery(
      "UPDATE users SET login_code = ? WHERE profile_id = ?",
      [code, users[0].profile_id]
    );
    res.json({ success: true, message: "Code generated", code: code });

  } catch (error) {
    console.error("Request Code Error:", error);
    res.status(500).json({ success: false });
  }
};

// ---  VERIFY PHONE CODE ---
export const verifyPhoneCode = async (req, res) => {
  try {
    const { mobileNumber, code } = req.body;
    const last10Digits = mobileNumber.replace(/\D/g, '').slice(-10);
    const users = await executeQuery(
      "SELECT profile_id, role_id, email_address as email FROM users WHERE mobile_no LIKE ? AND login_code = ?",
      [`%${last10Digits}`, code]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: "Incorrect Code" });
    }

    const user = users[0];

    await executeQuery("UPDATE users SET login_code = NULL WHERE profile_id = ?", [user.profile_id]);

    // user.role_id is int.
    const { accessToken } = generateTokens(user.profile_id, user.role_id);

    res.json({
      success: true,
      data: { accessToken, role: user.role_id, email_address: user.email_address }
    });
  } catch (error) {
    console.error("Verify Code Error:", error);
    res.status(500).json({ success: false });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const results = await executeQuery("SELECT password FROM users WHERE profile_id = ?", [userId]);
    if (results.length === 0) return res.status(404).json({ success: false, message: "User not found" });

    const user = results[0];

    const isPasswordValid = await comparePassword(currentPassword, user.password);
    const isPlainMatch = (currentPassword === user.password);

    if (!isPasswordValid && !isPlainMatch) {
      return res.status(400).json({ success: false, message: "Incorrect current password" });
    }

    const hashedNew = await hashPassword(newPassword);
    await executeQuery("UPDATE users SET password = ?, change_password = 1 WHERE profile_id = ?", [hashedNew, userId]);

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// --- REFRESH TOKEN LOGIC ---
export const refreshAccessToken = async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Access token refreshed successfully"
    });
  } catch (error) {
    console.error("Refresh Token Error:", error);
    res.status(500).json({ success: false, message: "Refresh failed" });
  }
};


//--- SEND REGISTRATION EMAIL CODE ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

export const sendVerificationMail = async (req, res) => {

  try {
    const { email_address } = req.body;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    // 1. Send the  email
    await transporter.sendMail({
      from: '"Divine Matrimony" <noreply.divinematrimony@gmail.com>',
      to: email_address,
      subject: "Your Identity Verification Code",
      text: `Your verification code is: ${code}`
    });

    // 2. Respond to frontend with the code for verification
    res.json({
      success: true,
      message: "Code sent to email",
      code: code
    });

  } catch (error) {
    console.error("SMTP Error Details:", error);
    res.status(500).json({ success: false, message: "SMTP Delivery Failed: " + error.message });
  }
};

// 2. SEND FINAL SUCCESS CONFIRMATION
export const sendRegistrationSuccessMail = async (req, res) => {
  try {
    const { email_address, firstName, username, password } = req.body;
    await transporter.sendMail({
      from: '"Divine Matrimony" <noreply.divinematrimony@gmail.com>',
      to: email_address,
      subject: "Welcome to Divine Matrimony! - Registration Successful",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #6d28d9;">Congratulations ${firstName}!</h2>
          <p>Your profile has been successfully registered on Divine Matrimony.</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Username:</strong> ${username}</p>
            <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
          </div>

          <p>Please keep these credentials safe. You can now log in using these details.</p>
          <p>Best Regards,<br>Divine Matrimony Team</p>
        </div>
      `
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Email Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};



// --- REGISTER WIZARD USER ---
export const registerWizardUser = async (req, res) => {
  try {
    const data = req.body;
    console.log("Register Wizard Data Incoming:", data);

    // Basic Mapping
    const mobileNo = data.mobile_no || data.mobile;
    const emailAddr = data.email_address || data.email;

    // Basic Validation
    if (!mobileNo || !emailAddr || !data.firstName) {
      return res.status(400).json({ success: false, message: "Missing required fields: mobile, email, or name." });
    }

    // Duplicate Check
    const existing = await executeQuery(
      "SELECT profile_id, mobile_no, email_address FROM users WHERE mobile_no = ? OR email_address = ?",
      [mobileNo, emailAddr]
    );

    if (existing.length > 0) {
      if (existing.some(u => u.mobile_no === mobileNo)) {
        return res.status(400).json({ success: false, message: "This mobile number is already registered." });
      }
      return res.status(400).json({ success: false, message: "This email address is already registered." });
    }

    const hashedPassword = await hashPassword('test@123');

    // Format Time (MySQL expects HH:MM:SS)
    let formattedTime = data.timeOfBirth;
    if (formattedTime && formattedTime.length === 5) {
      formattedTime = `${formattedTime}:00`;
    }

    // Handle Profile Photo
    let profilePhotoPath = null;
    if (req.file) {
      profilePhotoPath = `uploads/profile_photos/${req.file.filename}`;
    }

    // Insert into USERS table (NEW SCHEMA)
    // Gender ID mapping: 1 = Male, 2 = Female
    const genderEnum = data.gender ? (data.gender === 'Male' ? 1 : 2) : 1;

    // Users table now contains all profile details. 
    // We insert directly into users. 
    // profile_id is AUTO_INCREMENT, so we get insertId.

    const result = await executeQuery(
      `INSERT INTO users (
        first_name, last_name, username, password, role_id,
        dob, gender_id, location, address, mobile_no, email_address,
        religion_id, caste, sub_caste, community, poorviham, kuladeivam,
        time_of_birth, place_of_birth, raasi_id, nakshatra_id, lagnam,
        marital_status_id, disability, disability_comments, profile_photo, change_password, status
      ) VALUES (?, ?, ?, ?, 3, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'active')`,
      [
        data.firstName,                          // first_name
        data.lastName,                           // last_name
        mobileNo,                                // username (using mobile)
        hashedPassword,                          // password
        data.dob || '1990-01-01',               // dob
        genderEnum,                              // gender_id
        data.location || '',                    // location
        data.address || '',                     // address
        mobileNo,                               // mobile_no
        emailAddr,                              // email_address
        data.religion_id || 1,                  // religion_id (assuming default 1)
        data.caste || '',                       // caste
        data.subCaste || '',                    // sub_caste
        data.community || '',                   // community
        data.poorviham || '',                   // poorviham
        data.kuladeivam || '',                  // kuladeivam
        formattedTime || '00:00:00',            // time_of_birth
        data.placeOfBirth || '',                // place_of_birth
        data.raasi_id || 1,                     // raasi_id
        data.nakshatra_id || 1,                 // nakshatra_id
        data.lagnam || '',                      // lagnam
        data.maritalStatus_id || 1,             // marital_status_id
        (data.disabilities === 'Yes' ? 1 : 2),  // disability
        data.disabilityDetails || '',           // disability_comments
        profilePhotoPath                        // profile_photo
      ]
    );

    const newUserId = result.insertId;

    // Profiles table is REMOVED. All data is now in users table.


    // Initial Verification Entry
    if (data.aadhaarNumber) {
      const verifyId = uuidv4();
      await executeQuery(
        "INSERT INTO verification (id, userId, aadhaarNumber, verificationStatus) VALUES (?, ?, ?, 'pending')",
        [verifyId, newUserId, data.aadhaarNumber]
      );
    }

    // Auto-login token
    const { accessToken } = generateTokens(newUserId, 3);

    res.status(201).json({
      success: true,
      message: "Registration successful!",
      data: { userId: newUserId, accessToken }
    });
  } catch (error) {
    console.error("CRITICAL: Register Wizard Error:", error);
    res.status(500).json({ success: false, message: "Database Save Error: " + error.message });
  }
};