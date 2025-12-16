import { Router } from 'express';
import { login, refreshToken, forgotPassword, resetPassword, getProfile } from './controllers.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/profile', requireAuth, getProfile);
export default router;
