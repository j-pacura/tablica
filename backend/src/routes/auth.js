import express from 'express';
import { register, login, refresh, getProfile } from '../controllers/authController.js';
import { registerValidation, loginValidation } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/refresh', refresh);

// Protected routes
router.get('/profile', authenticateToken, getProfile);

export default router;
