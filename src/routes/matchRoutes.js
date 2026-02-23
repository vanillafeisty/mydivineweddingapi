import express from 'express';
import { getTodayMatches } from '../controllers/matchController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/today-report', authenticateToken, authorizeRole(1, 2), getTodayMatches);

export default router;