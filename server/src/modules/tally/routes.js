import { Router } from 'express';
import { testConnection, triggerSync, syncProductsNow, syncOrdersNow } from './controllers.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

router.post('/test-connection', requireAuth, testConnection);
router.post('/trigger-sync', requireAuth, triggerSync);
router.post('/products/sync', requireAuth, syncProductsNow);
router.post('/orders/sync', requireAuth, syncOrdersNow);

export default router;
