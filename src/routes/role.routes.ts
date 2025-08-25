import { Router } from 'express';
import { RoleController } from '../controllers/role.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const roleController = new RoleController();

// All role routes require authentication
router.use(authenticate);

// Get all roles
router.get('/', roleController.getAllRoles);

// Create new role
router.post('/', roleController.createRole);

// Get role by ID
router.get('/:id', roleController.getRoleById);

// Get menus by role ID
router.get('/:id/menus', roleController.getRoleMenus);

// Update role menu permissions
router.put('/:id/menus/:menuId', roleController.updateRoleMenuPermissions);

// Delete role
router.delete('/:id', roleController.deleteRole);

export default router;