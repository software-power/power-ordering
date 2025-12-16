
import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { listProducts, createProduct, updateProduct, deleteProduct } from './controllers.js';

const router = Router();

router.get('/', requireAuth, listProducts);
router.post('/', requireAuth, createProduct);
router.put('/:id', requireAuth, updateProduct);
router.delete('/:id', requireAuth, deleteProduct);

export default router;
