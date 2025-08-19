import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { authValidators } from '../validators/auth.validator';

const router = Router();
const userController = new UserController();

// All user routes require authentication
router.use(authenticate);

// Get all users
router.get('/', userController.getAllUsers);

// Get user statistics
router.get('/stats', userController.getUserStats);

// Get user by ID
router.get('/:id', userController.getUserById);

// Create new user (admin function)
router.post(
  '/',
  validate(authValidators.register),
  userController.createUser
);

// Update user
router.patch('/:id', userController.updateUser);

// Update user status
router.patch('/:id/status', userController.updateUserStatus);

// Delete user (soft delete)
router.delete('/:id', userController.deleteUser);

export default router;