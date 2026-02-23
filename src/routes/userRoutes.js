import express from 'express';
import { getAllUsers, getAdminsOnly } from '../controllers/userController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, authorizeRole(1, 2), getAllUsers);
router.get('/admins', authenticateToken, authorizeRole(1), getAdminsOnly);


export default router;