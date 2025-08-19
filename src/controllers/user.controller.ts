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
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        throw new ValidationError('Invalid user ID');
      }

      const user = await this.userRepository.findUserWithEmployeeDetails(userId);
      if (!user) {
        throw new NotFoundError('User not found');
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
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        throw new ValidationError('Invalid user ID');
      }

      const updateData = req.body;

      // Check if user exists
      const existingUser = await this.userRepository.findById(userId);
      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      // Update user basic info if provided
      if (updateData.email && updateData.email !== existingUser.email) {
        // Check email uniqueness
        const emailExists = await this.userRepository.findByEmail(updateData.email);
        if (emailExists && emailExists.user_id !== userId) {
          throw new ConflictError('Email already exists');
        }
        await this.userRepository.updateEmail(userId, updateData.email);
      }

      if (updateData.username && updateData.username !== existingUser.username) {
        // Check username uniqueness
        const usernameExists = await this.userRepository.findByUsername(updateData.username);
        if (usernameExists && usernameExists.user_id !== userId) {
          throw new ConflictError('Username already exists');
        }
        await this.userRepository.updateUsername(userId, updateData.username);
      }

      // Update employee details if provided
      const userWithDetails = await this.userRepository.findUserWithEmployeeDetails(userId);
      if (userWithDetails && userWithDetails.employee_id) {
        const employeeUpdateData: any = {};
        if (updateData.first_name) employeeUpdateData.first_name = updateData.first_name;
        if (updateData.last_name) employeeUpdateData.last_name = updateData.last_name;
        if (updateData.phone) employeeUpdateData.phone = updateData.phone;

        if (Object.keys(employeeUpdateData).length > 0) {
          await this.employeeRepository.updateEmployee(userWithDetails.employee_id, employeeUpdateData);
        }
      }

      // Get updated user details
      const updatedUser = await this.userRepository.findUserWithEmployeeDetails(userId);

      logger.info('User updated successfully', { userId, updatedBy: req.user?.user_id });

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
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        throw new ValidationError('Invalid user ID');
      }

      const { status } = req.body;
      if (!['active', 'inactive', 'suspended'].includes(status)) {
        throw new ValidationError('Invalid status. Must be active, inactive, or suspended');
      }

      // Check if user exists
      const existingUser = await this.userRepository.findById(userId);
      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      // Update status
      await this.userRepository.updateStatus(userId, status);

      // Get updated user details
      const updatedUser = await this.userRepository.findUserWithEmployeeDetails(userId);

      logger.info('User status updated', { userId, status, updatedBy: req.user?.user_id });

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
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        throw new ValidationError('Invalid user ID');
      }

      // Check if user exists
      const existingUser = await this.userRepository.findById(userId);
      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      // Prevent self-deletion
      if (req.user?.user_id === userId) {
        throw new ValidationError('Cannot delete your own account');
      }

      // Soft delete by setting status to inactive
      await this.userRepository.updateStatus(userId, 'inactive');

      logger.info('User deleted (soft delete)', { userId, deletedBy: req.user?.user_id });

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