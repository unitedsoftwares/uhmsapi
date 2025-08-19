import { 
  UserRepository, 
  EmployeeRepository, 
  RoleRepository,
  BranchRepository,
  RoleMenuRepository,
  RoleFeatureRepository,
  MenuRepository 
} from '../repositories/user.repository';
import { CompanyRepository } from '../repositories/company.repository';
import { 
  LoginDTO, 
  AuthResponse, 
  ChangePasswordDTO,
  TokenPayload,
  UserWithDetails
} from '../models/user.model';
import { 
  RegisterDTO, 
  LoginRequestDTO, 
  UpdateProfileRequestDTO, 
  ChangePasswordRequestDTO 
} from '../models/auth.model';
import { 
  UnauthorizedError, 
  ConflictError, 
  NotFoundError,
  ValidationError,
  ForbiddenError 
} from '../errors/AppError';
import { 
  generateToken, 
  verifyToken 
} from '../utils/jwt.utils';
import { validatePassword } from '../utils/validation.utils';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger';
import { config } from '../config';
import { v4 as uuidv4 } from 'uuid';

export class AuthService {
  private userRepository: UserRepository;
  private employeeRepository: EmployeeRepository;
  private roleRepository: RoleRepository;
  private companyRepository: CompanyRepository;
  private branchRepository: BranchRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.employeeRepository = new EmployeeRepository();
    this.roleRepository = new RoleRepository();
    this.companyRepository = new CompanyRepository();
    this.branchRepository = new BranchRepository();
  }

  async register(data: RegisterDTO): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Check username uniqueness
    const existingUsername = await this.userRepository.findByUsername(data.username);
    if (existingUsername) {
      throw new ConflictError('Username already taken');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, config.security.bcryptRounds);

    // Start transaction to create company, branch, employee and user
    const pool = this.userRepository.getPool();
    let connection;
    
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      let companyId: number;
      let roleId: number;

      // Create or get company
      if (data.company_id) {
        // Verify company exists
        const company = await this.companyRepository.findByPrimaryKey(data.company_id);
        if (!company) {
          throw new NotFoundError('Company not found');
        }
        companyId = data.company_id;
      } else {
        // Create new company
        companyId = await this.createCompany(data, connection);
        // Create default branch for new company
        await this.createDefaultBranch(companyId, connection);
      }

      // Get or create admin role
      if (data.role_id) {
        // Verify role exists
        const role = await this.roleRepository.findByPrimaryKey(data.role_id);
        if (!role) {
          throw new NotFoundError('Role not found');
        }
        roleId = data.role_id;
      } else {
        // Get or create admin role
        roleId = await this.getOrCreateAdminRole(connection);
      }

      // Create employee with company_id
      const employeeData = { ...data, company_id: companyId };
      const employeeId = await this.createEmployee(employeeData, connection);

      // Create user
      const userId = await this.createUser({
        username: data.username,
        email: data.email,
        password: passwordHash,
        employee_id: employeeId,
        role_id: roleId,
      }, connection);

      await connection.commit();

      // Get user details with employee info for response
      const userDetails = await this.userRepository.findUserWithEmployeeDetails(userId, connection);
      if (!userDetails) {
        throw new Error('Failed to retrieve user after creation');
      }

      // Generate tokens
      const tokenPayload: TokenPayload = {
        userId: userId,
        email: data.email,
        roleId: roleId,
        companyId: companyId,
        user_id: userId,
        user_uuid: userDetails.uuid,
        employee_id: userDetails.employee_id,
        employee_uuid: userDetails.employee?.uuid,
        role_id: roleId,
        role_name: userDetails.role?.role_name,
        company_id: companyId,
        company_name: userDetails.employee?.company_name,
        branch_id: userDetails.employee?.branch_id,
        branch_name: userDetails.employee?.branch_name,
        employee_name: `${userDetails.employee?.first_name || ''} ${userDetails.employee?.last_name || ''}`.trim(),
        is_doctor: userDetails.employee?.is_doctor || false,
      };

      const accessToken = generateToken(tokenPayload, 'access');
      const refreshToken = generateToken(tokenPayload, 'refresh');

      logger.info('User registered successfully', { 
        userId,
        email: data.email 
      });

      return {
        user: {
        user_id: userId,
          username: data.username,
          email: data.email,
          first_name: userDetails.employee.first_name,
          last_name: userDetails.employee.last_name,
          phone: userDetails.employee.phone,
          role_id: roleId,
          company_id: companyId,
          status: 'active',
        },
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      };

    } catch (error) {
      if (connection) {
        await connection.rollback();
      }
      logger.error('Registration failed:', error);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  async login(data: LoginRequestDTO): Promise<AuthResponse> {
    // Try to find user by email or username
    const user = await this.userRepository.findByEmail(data.email) || 
                 await this.userRepository.findByUsername(data.email);
    
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check password
    const isValidPassword = await bcrypt.compare(data.password, user.password_hash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new ForbiddenError('Account is not active');
    }

    // Get user with employee details
    const userWithDetails = await this.userRepository.findUserWithEmployeeDetails(user.user_id);
    if (!userWithDetails) {
      throw new Error('Failed to retrieve user details');
    }

    // Get role menus and features
    const roleMenuRepo = new RoleMenuRepository();
    const roleFeatureRepo = new RoleFeatureRepository();
    const menuRepo = new MenuRepository();
    const roleMenus = await roleMenuRepo.findByRoleId(user.role_id!);
    const roleFeatures = await roleFeatureRepo.findByRoleId(user.role_id!);
    const roleMenusWithDetails = await Promise.all(roleMenus.map(async rm => {
      const menu = await menuRepo.findByPrimaryKey(rm.menu_id!);
      return {
        ...rm,
        ...(menu || {})
      };
    }));

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.user_id,
      email: user.email,
      roleId: user.role_id!,
      companyId: userWithDetails.employee.company_id,
      user_id: user.user_id,
      user_uuid: userWithDetails.uuid,
      employee_id: userWithDetails.employee_id,
      employee_uuid: userWithDetails.employee.uuid,
      role_id: user.role_id!,
      role_name: userWithDetails.role?.role_name,
      company_id: userWithDetails.employee.company_id,
      company_name: userWithDetails.employee.company_name,
      branch_id: userWithDetails.employee.branch_id,
      branch_name: userWithDetails.employee.branch_name,
      employee_name: `${userWithDetails.employee.first_name} ${userWithDetails.employee.last_name || ''}`.trim(),
      is_doctor: userWithDetails.employee.is_doctor || false,
    };

    const accessToken = generateToken(tokenPayload, 'access');
    const refreshToken = generateToken(tokenPayload, 'refresh');

    // Update last login
    await this.userRepository.updateLastLogin(user.user_id);

    logger.info('User logged in successfully', { 
      userId: user.user_id,
      email: user.email 
    });

    return {
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        first_name: userWithDetails.employee.first_name,
        last_name: userWithDetails.employee.last_name,
        phone: userWithDetails.employee.phone,
        role_id: user.role_id,
        company_id: userWithDetails.employee.company_id,
        status: user.status,
        role: userWithDetails.role,
        role_menus: roleMenusWithDetails,
        role_features: roleFeatures,
      },
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  }

  async refreshToken(refreshTokenString: string): Promise<AuthResponse> {
    try {
      const payload = verifyToken(refreshTokenString, 'refresh');
      
      // Get fresh user data with employee details
      const userWithDetails = await this.userRepository.findUserWithEmployeeDetails(payload.userId);
      if (!userWithDetails) {
        throw new UnauthorizedError('User not found');
      }

      if (userWithDetails.status !== 'active') {
        throw new ForbiddenError('Account is not active');
      }

      // Generate new tokens
      const tokenPayload: TokenPayload = {
        userId: userWithDetails.user_id,
        email: userWithDetails.email,
        roleId: userWithDetails.role_id!,
        companyId: userWithDetails.employee.company_id,
        user_id: userWithDetails.user_id,
        user_uuid: userWithDetails.uuid,
        employee_id: userWithDetails.employee_id,
        employee_uuid: userWithDetails.employee.uuid,
        role_id: userWithDetails.role_id!,
        role_name: userWithDetails.role?.role_name,
        company_id: userWithDetails.employee.company_id,
        company_name: userWithDetails.employee.company_name,
        branch_id: userWithDetails.employee.branch_id,
        branch_name: userWithDetails.employee.branch_name,
        employee_name: `${userWithDetails.employee.first_name} ${userWithDetails.employee.last_name || ''}`.trim(),
        is_doctor: userWithDetails.employee.is_doctor || false,
      };

      const accessToken = generateToken(tokenPayload, 'access');
      const newRefreshToken = generateToken(tokenPayload, 'refresh');

      return {
        user: {
          id: userWithDetails.user_id,
          username: userWithDetails.username,
          email: userWithDetails.email,
          first_name: userWithDetails.employee.first_name,
          last_name: userWithDetails.employee.last_name,
          phone: userWithDetails.employee.phone,
          role_id: userWithDetails.role_id,
          company_id: userWithDetails.employee.company_id,
          status: userWithDetails.status,
        },
        access_token: accessToken,
        refresh_token: newRefreshToken,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      };

    } catch (error) {
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  async getProfile(userId: number): Promise<any> {
    const userWithDetails = await this.userRepository.findUserWithEmployeeDetails(userId);
    if (!userWithDetails) {
      throw new NotFoundError('User not found');
    }

    return {
      id: userWithDetails.user_id,
      username: userWithDetails.username,
      email: userWithDetails.email,
      first_name: userWithDetails.employee.first_name,
      last_name: userWithDetails.employee.last_name,
      phone: userWithDetails.employee.phone,
      role_id: userWithDetails.role_id,
      company_id: userWithDetails.employee.company_id,
      status: userWithDetails.status,
      created_at: userWithDetails.created_at,
      updated_at: userWithDetails.updated_at,
    };
  }

  async updateProfile(data: UpdateProfileRequestDTO, userId: number): Promise<any> {
    const userWithDetails = await this.userRepository.findUserWithEmployeeDetails(userId);
    if (!userWithDetails) {
      throw new NotFoundError('User not found');
    }

    // Update employee fields (first_name, last_name, phone are in employees table)
    await this.employeeRepository.updateEmployee(userWithDetails.employee_id, data);

    // Get updated user details
    const updatedUser = await this.userRepository.findUserWithEmployeeDetails(userId);
    if (!updatedUser) {
      throw new Error('Failed to retrieve updated user');
    }

    return {
      id: updatedUser.user_id,
      username: updatedUser.username,
      email: updatedUser.email,
      first_name: updatedUser.employee.first_name,
      last_name: updatedUser.employee.last_name,
      phone: updatedUser.employee.phone,
      role_id: updatedUser.role_id,
      company_id: updatedUser.employee.company_id,
      status: updatedUser.status,
    };
  }

  async changePassword(data: ChangePasswordRequestDTO, userId: number): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(data.currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Check if new password is different
    if (data.currentPassword === data.newPassword) {
      throw new ValidationError('New password must be different from current password');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(data.newPassword, config.security.bcryptRounds);

    // Update password
    await this.userRepository.updatePassword(userId, newPasswordHash);

    logger.info('Password changed successfully', { userId });
  }

  private async createCompany(data: RegisterDTO, connection: any): Promise<number> {
    const companyData = {
      uuid: uuidv4(),
      company_name: data.company_name || `${data.first_name} ${data.last_name} Company`,
      company_email: data.company_email || data.email,
      company_phone: data.company_phone || data.phone,
      contact_person_name: `${data.first_name} ${data.last_name}`,
      contact_person_email: data.email,
      contact_person_phone: data.phone,
      is_active: 1,
      created_by: uuidv4(),
      created_at: new Date(),
      updated_by: uuidv4(),
      updated_at: new Date(),
    };

    const columns = Object.keys(companyData);
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map(col => (companyData as any)[col]);

    const [result] = await connection.execute(
      `INSERT INTO companies (${columns.join(', ')}) VALUES (${placeholders})`,
      values
    );

    return result.insertId;
  }

  private async createDefaultBranch(companyId: number, connection: any): Promise<number> {
    const branchData = {
      uuid: uuidv4(),
      company_id: companyId,
      branch_name: 'Default Branch',
      is_active: 1,
      created_by: uuidv4(),
      created_at: new Date(),
      updated_by: uuidv4(),
      updated_at: new Date(),
    };

    const columns = Object.keys(branchData);
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map(col => (branchData as any)[col]);

    const [result] = await connection.execute(
      `INSERT INTO branches (${columns.join(', ')}) VALUES (${placeholders})`,
      values
    );

    return result.insertId;
  }

  private async getOrCreateAdminRole(connection: any): Promise<number> {
    // Check if admin role exists
    const [existingRoles] = await connection.execute(
      'SELECT role_id FROM roles WHERE role_name = ?',
      ['Administrator']
    );

    if (existingRoles.length > 0) {
      return existingRoles[0].role_id;
    }

    // Create admin role
    const roleData = {
      uuid: uuidv4(),
      role_name: 'Administrator',
      role_description: 'System Administrator',
      is_active: 1,
      created_by: uuidv4(),
      created_at: new Date(),
      updated_by: uuidv4(),
      updated_at: new Date(),
    };

    const columns = Object.keys(roleData);
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map(col => (roleData as any)[col]);

    const [result] = await connection.execute(
      `INSERT INTO roles (${columns.join(', ')}) VALUES (${placeholders})`,
      values
    );

    return result.insertId;
  }

  private async createEmployee(data: RegisterDTO & { company_id: number }, connection: any): Promise<number> {
    const employeeData = {
      uuid: uuidv4(),
      company_id: data.company_id,
      employee_code: `EMP${Date.now()}`,
      employee_name: `${data.first_name} ${data.last_name}`,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone: data.phone,
      date_of_joining: new Date(),
      is_active: 1,
      created_by: uuidv4(),
      created_at: new Date(),
      updated_by: uuidv4(),
      updated_at: new Date(),
    };

    const columns = Object.keys(employeeData);
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map(col => (employeeData as any)[col]);

    const [result] = await connection.execute(
      `INSERT INTO employees (${columns.join(', ')}) VALUES (${placeholders})`,
      values
    );

    return result.insertId;
  }

  private async createUser(data: any, connection: any): Promise<number> {
    const userData = {
      uuid: uuidv4(),
      username: data.username,
      email: data.email,
      password_hash: data.password,
      employee_id: data.employee_id,
      role_id: data.role_id,
      status: 'active',
      created_by: uuidv4(),
      updated_by: uuidv4(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    const columns = Object.keys(userData);
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map(col => (userData as any)[col]);

    const [result] = await connection.execute(
      `INSERT INTO users (${columns.join(', ')}) VALUES (${placeholders})`,
      values
    );

    return result.insertId;
  }
}
