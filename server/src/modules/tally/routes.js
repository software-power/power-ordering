
import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { testConnection, syncProducts, syncOrders } from './controllers.js';

const router = Router();

router.post('/test', requireAuth, testConnection);
router.post('/products/sync', requireAuth, syncProducts);
router.post('/orders/sync', requireAuth, syncOrders);

export default router;
