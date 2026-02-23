import { Router } from "express";
import {
  createProfile,
  getProfile,
  searchProfiles,
  getPendingProfiles,
  verifyProfile,
  getAdminStats
} from "../controllers/profileController.js";
import { authenticateToken, authorizeRole } from "../middleware/auth.js";

const router = Router();

// * Public/General Routes *
router.get("/search", searchProfiles);

// * User Protected Routes *
router.post("/", authenticateToken, createProfile);
router.get("/me", authenticateToken, getProfile);

// * Admin Only Routes *
router.get("/admin/stats", authenticateToken, authorizeRole(1,2), getAdminStats);
router.get("/admin/pending", authenticateToken, authorizeRole(1,2), getPendingProfiles);
router.patch("/admin/verify/:profileId", authenticateToken, authorizeRole(1,2), verifyProfile);

export default router;