import express from 'express';
import { getPendingOrders, updateOrderStatus, syncProductsFromTally } from './controllers.js';
import { requireAuth } from '../../middleware/auth.js';

const router = express.Router();

// All integration routes should require auth. 
// The Tally Middleware script will need to login or have an API Key.
// For MVP, we'll assume it logs in as a user (e.g. Admin or Tally Operator).
router.use(requireAuth);

router.get('/pending-orders', getPendingOrders);
router.post('/update-order-status', updateOrderStatus);
router.post('/sync-products', syncProductsFromTally);

export default router;
