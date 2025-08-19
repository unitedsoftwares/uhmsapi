import { Router } from 'express';
import { RoleController } from '../controllers/role.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const roleController = new RoleController();

// All role routes require authentication
router.use(authenticate);

// Get all roles
router.get('/', roleController.getAllRoles);

// Get role by ID
router.get('/:id', roleController.getRoleById);

export default router;