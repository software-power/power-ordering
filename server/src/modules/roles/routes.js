import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { listRoles, createRole, updateRole, deleteRole, getRolePermissions, setRolePermissions } from './controllers.js';

const router = Router();
router.get('/', requireAuth, requirePermission('role.view'), listRoles);
router.post('/', requireAuth, requirePermission('role.add'), createRole);
router.put('/:id', requireAuth, requirePermission('role.edit'), updateRole);
router.delete('/:id', requireAuth, requirePermission('role.delete'), deleteRole);
router.get('/:id/permissions', requireAuth, requirePermission('role.view'), getRolePermissions);
router.post('/:id/permissions', requireAuth, requirePermission('role.edit'), setRolePermissions);
export default router;
