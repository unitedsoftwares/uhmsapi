import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { authValidators } from '../validators/auth.validator';
import { 
  loginRateLimiter, 
  registrationRateLimiter, 
  passwordChangeRateLimiter,
  authRateLimiter 
} from '../middleware/authRateLimiter';

const router = Router();
const authController = new AuthController();

// Public routes
router.post(
  '/register',
  registrationRateLimiter,
  validate(authValidators.register),
  authController.register
);

router.post(
  '/register-complete',
  registrationRateLimiter,
  validate(authValidators.registerComplete),
  authController.registerComplete
);

router.post(
  '/login',
  loginRateLimiter,
  validate(authValidators.login),
  authController.login
);

router.post(
  '/refresh-token',
  authRateLimiter,
  validate(authValidators.refreshToken),
  authController.refreshToken
);

router.post(
  '/logout',
  authenticate,
  authController.logout
);

// Protected routes
router.get(
  '/profile',
  authenticate,
  authController.getProfile
);

router.patch(
  '/profile',
  authenticate,
  validate(authValidators.updateProfile),
  authController.updateProfile
);

router.post(
  '/change-password',
  authenticate,
  passwordChangeRateLimiter,
  validate(authValidators.changePassword),
  authController.changePassword
);

export default router;