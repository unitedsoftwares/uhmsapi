import { Request, Response, NextFunction } from 'express';
import { UserRepository, EmployeeRepository } from '../repositories/user.repository';
import { AuthService } from '../services/auth.service';
import { RegisterDTO } from '../models/auth.model';
import { NotFoundError, ValidationError, ConflictError } from '../errors/AppError';
import logger from '../utils/logger';

export class UserController {
  private userRepository: UserRepository;
  private employeeRepository: EmployeeRepository;
  private authService: AuthService;

  constructor() {
    this.userRepository = new UserRepository();
    this.employeeRepository = new EmployeeRepository();
    this.authService = new AuthService();
  }

  // Get all users (filtered by company for multi-tenant isolation)
  getAllUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Get company_id from authenticated user for multi-tenant isolation
      const companyId = req.user?.company_id;
      
      if (!companyId) {
        throw new ValidationError('Company information not found in user context');
      }

      const users = await this.userRepository.findAllUsersWithDetails(companyId);

      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  };

  // Get user by ID
  getUserById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).validatedParams?.id || parseInt(req.params.id);
      if (isNaN(userId)) {
        throw new ValidationError('Invalid user ID');
      }

      const currentUserCompanyId = req.user?.company_id;
      if (!currentUserCompanyId) {
        throw new ValidationError('Company information not found in user context');
      }

      const user = await this.userRepository.findUserWithEmployeeDetails(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Ensure the user belongs to the same company as the requester (multi-tenant security)
      if (user.employee?.company_id !== currentUserCompanyId) {
        throw new NotFoundError('User not found'); // Don't reveal that user exists in different company
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  // Create new user (admin function)
  createUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userData: RegisterDTO = req.body;
      
      // Get company_id from authenticated user for multi-tenant isolation
      const companyId = req.user?.company_id;
      
      if (!companyId) {
        throw new ValidationError('Company information not found in user context');
      }

      // Add the admin's company_id to the user data to ensure they're added to the same company
      const userDataWithCompany = {
        ...userData,
        company_id: companyId
      };

      // Use the existing auth service register method with company_id
      const result = await this.authService.register(userDataWithCompany);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: result.user,
      });
    } catch (error) {
      next(error);
    }
  };

  // Update user
  updateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).validatedParams?.id || parseInt(req.params.id);
      if (isNaN(userId)) {
        throw new ValidationError('Invalid user ID');
      }

      const updateData = req.body;
      const currentUserCompanyId = req.user?.company_id;

      if (!currentUserCompanyId) {
        throw new ValidationError('Company information not found in user context');
      }

      // Check if user exists and belongs to the same company (multi-tenant security)
      const existingUserWithDetails = await this.userRepository.findUserWithEmployeeDetails(userId);
      if (!existingUserWithDetails) {
        throw new NotFoundError('User not found');
      }

      // Ensure the user belongs to the same company as the requester
      if (existingUserWithDetails.employee?.company_id !== currentUserCompanyId) {
        throw new NotFoundError('User not found'); // Don't reveal that user exists in different company
      }

      // Prevent users from updating their own role or critical fields
      if (req.user?.user_id === userId) {
        if (updateData.role_id) {
          throw new ValidationError('Cannot change your own role');
        }
        if (updateData.status) {
          throw new ValidationError('Cannot change your own status');
        }
      }

      // Validate and sanitize update data
      const allowedFields = ['email', 'username', 'first_name', 'last_name', 'phone', 'role_id'];
      const sanitizedUpdateData = Object.keys(updateData)
        .filter(key => allowedFields.includes(key))
        .reduce((obj: any, key) => {
          obj[key] = updateData[key];
          return obj;
        }, {});

      // Update user basic info if provided
      if (sanitizedUpdateData.email && sanitizedUpdateData.email !== existingUserWithDetails.email) {
        // Check email uniqueness within the company
        const emailExists = await this.userRepository.findByEmail(sanitizedUpdateData.email);
        if (emailExists && emailExists.user_id !== userId) {
          throw new ConflictError('Email already exists');
        }
        await this.userRepository.updateEmail(userId, sanitizedUpdateData.email);
      }

      if (sanitizedUpdateData.username && sanitizedUpdateData.username !== existingUserWithDetails.username) {
        // Check username uniqueness
        const usernameExists = await this.userRepository.findByUsername(sanitizedUpdateData.username);
        if (usernameExists && usernameExists.user_id !== userId) {
          throw new ConflictError('Username already exists');
        }
        await this.userRepository.updateUsername(userId, sanitizedUpdateData.username);
      }

      // Update role if provided and user has permission
      if (sanitizedUpdateData.role_id && sanitizedUpdateData.role_id !== existingUserWithDetails.role_id) {
        // Only allow role updates if the current user is not updating themselves
        if (req.user?.user_id !== userId) {
          await this.userRepository.updateUser(userId, { role_id: sanitizedUpdateData.role_id });
        }
      }

      // Update employee details if provided
      if (existingUserWithDetails.employee_id) {
        const employeeUpdateData: any = {};
        if (sanitizedUpdateData.first_name) employeeUpdateData.first_name = sanitizedUpdateData.first_name;
        if (sanitizedUpdateData.last_name) employeeUpdateData.last_name = sanitizedUpdateData.last_name;
        if (sanitizedUpdateData.phone) employeeUpdateData.phone = sanitizedUpdateData.phone;

        if (Object.keys(employeeUpdateData).length > 0) {
          await this.employeeRepository.updateEmployee(existingUserWithDetails.employee_id, employeeUpdateData);
        }
      }

      // Get updated user details
      const updatedUser = await this.userRepository.findUserWithEmployeeDetails(userId);

      logger.info('User updated successfully', {
        userId,
        updatedBy: req.user?.user_id,
        companyId: currentUserCompanyId,
        updatedFields: Object.keys(sanitizedUpdateData)
      });

      res.json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  };

  // Update user status
  updateUserStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).validatedParams?.id || parseInt(req.params.id);
      if (isNaN(userId)) {
        throw new ValidationError('Invalid user ID');
      }

      const { status } = req.body;
      if (!['active', 'inactive', 'suspended'].includes(status)) {
        throw new ValidationError('Invalid status. Must be active, inactive, or suspended');
      }

      const currentUserCompanyId = req.user?.company_id;
      if (!currentUserCompanyId) {
        throw new ValidationError('Company information not found in user context');
      }

      // Check if user exists and belongs to the same company (multi-tenant security)
      const existingUserWithDetails = await this.userRepository.findUserWithEmployeeDetails(userId);
      if (!existingUserWithDetails) {
        throw new NotFoundError('User not found');
      }

      // Ensure the user belongs to the same company as the requester
      if (existingUserWithDetails.employee?.company_id !== currentUserCompanyId) {
        throw new NotFoundError('User not found'); // Don't reveal that user exists in different company
      }

      // Prevent users from changing their own status
      if (req.user?.user_id === userId) {
        throw new ValidationError('Cannot change your own status');
      }

      // Additional security: Check if trying to change status of a super admin
      if (existingUserWithDetails.role?.role_name === 'Administrator' ||
          existingUserWithDetails.role?.role_name === 'Super Admin') {
        // Only allow if the current user is also an admin
        const currentUserDetails = await this.userRepository.findUserWithEmployeeDetails(req.user?.user_id!);
        if (!currentUserDetails ||
            (currentUserDetails.role?.role_name !== 'Administrator' &&
             currentUserDetails.role?.role_name !== 'Super Admin')) {
          throw new ValidationError('Insufficient permissions to change this user\'s status');
        }
      }

      // Update status
      await this.userRepository.updateStatus(userId, status);

      // Get updated user details
      const updatedUser = await this.userRepository.findUserWithEmployeeDetails(userId);

      logger.info('User status updated', {
        userId,
        status,
        updatedBy: req.user?.user_id,
        companyId: currentUserCompanyId,
        targetUserRole: existingUserWithDetails.role?.role_name
      });

      res.json({
        success: true,
        message: 'User status updated successfully',
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  };

  // Delete user (soft delete)
  deleteUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).validatedParams?.id || parseInt(req.params.id);
      if (isNaN(userId)) {
        throw new ValidationError('Invalid user ID');
      }

      const currentUserCompanyId = req.user?.company_id;
      if (!currentUserCompanyId) {
        throw new ValidationError('Company information not found in user context');
      }

      // Check if user exists and belongs to the same company (multi-tenant security)
      const existingUserWithDetails = await this.userRepository.findUserWithEmployeeDetails(userId);
      if (!existingUserWithDetails) {
        throw new NotFoundError('User not found');
      }

      // Ensure the user belongs to the same company as the requester
      if (existingUserWithDetails.employee?.company_id !== currentUserCompanyId) {
        throw new NotFoundError('User not found'); // Don't reveal that user exists in different company
      }

      // Prevent self-deletion
      if (req.user?.user_id === userId) {
        throw new ValidationError('Cannot delete your own account');
      }

      // Check if user is already inactive
      if (existingUserWithDetails.status === 'inactive') {
        throw new ValidationError('User is already deleted');
      }

      // Additional security: Check if trying to delete a super admin or company owner
      if (existingUserWithDetails.role?.role_name === 'Administrator' ||
          existingUserWithDetails.role?.role_name === 'Super Admin') {
        // Only allow if the current user is also an admin
        const currentUserDetails = await this.userRepository.findUserWithEmployeeDetails(req.user?.user_id!);
        if (!currentUserDetails ||
            (currentUserDetails.role?.role_name !== 'Administrator' &&
             currentUserDetails.role?.role_name !== 'Super Admin')) {
          throw new ValidationError('Insufficient permissions to delete this user');
        }
      }

      // Soft delete by setting status to inactive
      await this.userRepository.updateStatus(userId, 'inactive');

      logger.info('User deleted (soft delete)', {
        userId,
        deletedBy: req.user?.user_id,
        companyId: currentUserCompanyId,
        deletedUserRole: existingUserWithDetails.role?.role_name
      });

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // Get user statistics (filtered by company for multi-tenant isolation)
  getUserStats = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Get company_id from authenticated user for multi-tenant isolation
      const companyId = req.user?.company_id;
      
      if (!companyId) {
        throw new ValidationError('Company information not found in user context');
      }

      const stats = await this.userRepository.getUserStatistics(companyId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };
}