import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { getMyMenus } from './controllers.js';
const router = Router();
router.get('/my', requireAuth, getMyMenus);
export default router;
