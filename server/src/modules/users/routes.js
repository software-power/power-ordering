import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { listUsers, createUser, updateUser, deleteUser, assignRole, getParentUser } from './controllers.js';

const router = Router();
router.get('/', requireAuth, requirePermission('user.view'), listUsers);
router.get('/parent', requireAuth, getParentUser);
router.post('/', requireAuth, requirePermission('user.add'), createUser);
router.put('/:id', requireAuth, requirePermission('user.edit'), updateUser);
router.delete('/:id', requireAuth, requirePermission('user.delete'), deleteUser);
router.post('/:id/role', requireAuth, requirePermission('user.edit'), assignRole);
export default router;
