import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { RegistrationService, EnhancedRegisterDTO } from '../services/registration.service';
import { LoginDTO, UpdateProfileDTO, ChangePasswordDTO } from '../models/user.model';
import { RegisterDTO, LoginRequestDTO, UpdateProfileRequestDTO, ChangePasswordRequestDTO } from '../models/auth.model';
import { config } from '../config';
import logger from '../utils/logger';

export class AuthController {
  private authService: AuthService;
  private registrationService: RegistrationService;

  constructor() {
    this.authService = new AuthService();
    this.registrationService = new RegistrationService();
  }

  register = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const registerData: RegisterDTO = req.body;

      const result = await this.authService.register(registerData);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: result.user,
          token: result.access_token,
          refreshToken: result.refresh_token,
          expires_at: result.expires_at,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  registerComplete = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const registerData: EnhancedRegisterDTO = req.body;

      const result = await this.registrationService.registerComplete(registerData);

      res.status(201).json({
        success: true,
        message: 'Registration completed successfully',
        data: {
          user: result.user,
          token: result.tokens.access_token,
          refreshToken: result.tokens.refresh_token,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const loginData: LoginRequestDTO = {
        email: req.body.email,
        password: req.body.password,
      };

      const result = await this.authService.login(loginData);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          token: result.access_token,
          refreshToken: result.refresh_token,
          expires_at: result.expires_at,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      
      if (!refreshToken) {
        res.status(401).json({
          success: false,
          error: {
            message: 'Refresh token required',
            code: 'REFRESH_TOKEN_REQUIRED',
          },
        });
        return;
      }

      const result = await this.authService.refreshToken(refreshToken);

      res.json({
        success: true,
        data: {
          token: result.access_token,
          refreshToken: result.refresh_token,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Clear refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: config.env === 'production',
        sameSite: 'strict',
        path: '/',
      });

      logger.info('User logged out', { 
        userId: req.user?.user_id,
        email: req.user?.email 
      });

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = await this.authService.getProfile(req.user!.userId || req.user!.user_id!);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const updateData: UpdateProfileRequestDTO = {
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        phone: req.body.phone,
      };

      // Remove undefined values
      const cleanedData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      ) as UpdateProfileRequestDTO;

      const user = await this.authService.updateProfile(
        cleanedData,
        req.user!.userId || req.user!.user_id!
      );

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const changePasswordData: ChangePasswordRequestDTO = {
        currentPassword: req.body.currentPassword,
        newPassword: req.body.newPassword,
      };

      await this.authService.changePassword(
        changePasswordData,
        req.user!.userId || req.user!.user_id!
      );

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  registerUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const registerData: RegisterDTO = req.body;    
      // Get company_id from authenticated user for multi-tenant isolation
      const companyId = req.user?.company_id;
      if (!companyId) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Company information not found in user context',
            code: 'COMPANY_NOT_FOUND',
          },
        });
        return;
      }

      // Add the admin's company_id to the user data to ensure they're added to the same company
      const userDataWithCompany = {
        ...registerData,
        company_id: companyId
      };

      // Use the existing auth service register method with company_id
      const result = await this.authService.register(userDataWithCompany);

      res.status(201).json({
        success: true,
        message: 'User registered successfully under your company',
        data: {
          user: result.user,
          token: result.access_token,
          refreshToken: result.refresh_token,
          expires_at: result.expires_at,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}