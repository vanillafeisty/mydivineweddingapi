import { Router } from "express";
import { getAllStories, createStory, updateStory, deleteStory} from "../controllers/successStoriesController.js";
import { authenticateToken, authorizeRole } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";


const router = Router();

// Anyone can see the success stories (Public)
router.get("/", getAllStories);

// Only Admins and Super admins can add new stories (Protected)
router.post("/", authenticateToken, authorizeRole(1,2),upload.single('story_photo'), createStory);

// Only Admins and Super admins can update EXIXSTING stories(Protected)
router.put("/:id", authenticateToken, authorizeRole(1,2), upload.single('story_photo'), updateStory);

// Only Admins and Super admins can delete EXIXSTING stories(Protected)
router.delete("/:id", authenticateToken, authorizeRole(1,2), deleteStory);
export default router;