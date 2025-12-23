import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import * as controllers from './controllers.js';

const router = Router();

router.get('/price-levels', requireAuth, controllers.listPriceLevels);
router.post('/price-levels', requireAuth, controllers.createPriceLevel);
router.delete('/price-levels/:id', requireAuth, controllers.deletePriceLevel);

export default router;
