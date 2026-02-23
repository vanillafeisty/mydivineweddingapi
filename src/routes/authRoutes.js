import { Router } from "express";
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getCurrentUser,
  addAdminBySuperAdmin,
  requestLoginCode,
  verifyPhoneCode,
  getAllAdmins,
  sendVerificationMail,
  sendRegistrationSuccessMail,
  registerWizardUser,
  fixUserPasswords,
  updatePassword,
  resetAdminPassword
} from "../controllers/authController.js";
import { authenticateToken, authorizeRole } from "../middleware/auth.js";
import { loginLimiter, authLimiter } from "../middleware/rateLimiter.js";
import { seedDatabase, updateUniquePhones } from '../controllers/seedController.js';


const router = Router();

// Public routes
router.post("/register", authLimiter, registerUser);
router.post("/login", loginLimiter, loginUser);
router.post("/refresh-token", authLimiter, refreshAccessToken);
router.post("/logout", logoutUser);
router.get('/getcurrentuser', authenticateToken, getCurrentUser);
router.post('/update-phones', updateUniquePhones);
router.get('/admins', authenticateToken, authorizeRole(1), getAllAdmins);
router.post('/add-admin', authenticateToken, authorizeRole(1), addAdminBySuperAdmin);
router.post('/admin/reset-password', resetAdminPassword); // Added this route
router.post('/seed-data', seedDatabase);
router.post('/request-code', requestLoginCode);
router.post('/verify-code', verifyPhoneCode);
router.post('/send-verification-mail', sendVerificationMail);
router.post('/send-success-mail', sendRegistrationSuccessMail);
import { upload } from "../middleware/upload.js"; // Import upload middleware

// ... (other imports)

// ... (previous routes)
router.post('/register-wizard', upload.single('photo'), registerWizardUser);
router.post('/fix-passwords', fixUserPasswords);


// Protected routes
router.post('/update-password', authenticateToken, updatePassword);
router.get("/me", authenticateToken, getCurrentUser);


export default router;
