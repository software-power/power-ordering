
import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { listOrders, createOrder, updateOrder, deleteOrder } from './controllers.js';

const router = Router();

router.get('/', requireAuth, listOrders);
router.post('/', requireAuth, createOrder);
router.put('/:id', requireAuth, updateOrder);
router.delete('/:id', requireAuth, deleteOrder);

export default router;
