import { Router } from "express";
import { createEvent, getEvents, updateEvent } from "../controllers/eventController.js";
import { authenticateToken, authorizeRole } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js"; 

const router = Router();

router.get("/", authenticateToken, authorizeRole(1,2), getEvents);

router.post("/", authenticateToken, authorizeRole(1,2), upload.single('event_photo'), createEvent);


router.put("/:id", authenticateToken, authorizeRole(1,2), upload.single('event_photo'), updateEvent);

export default router;