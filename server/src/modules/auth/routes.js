import { Router } from 'express';
import { login, refreshToken, forgotPassword, resetPassword } from './controllers.js';
const router = Router();
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
export default router;
