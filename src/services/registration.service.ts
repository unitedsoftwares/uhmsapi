import { PoolConnection } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { 
  UserRepository, 
  EmployeeRepository, 
  RoleRepository,
  BranchRepository 
} from '../repositories/user.repository';
import { CompanyRepository } from '../repositories/company.repository';
import { 
  ConflictError, 
  NotFoundError,
  ValidationError 
} from '../errors/AppError';
import { generateToken } from '../utils/jwt.utils';
import logger from '../utils/logger';
import { config } from '../config';

export interface EnhancedRegisterDTO {
  // User credentials
  email: string;
  password: string;
  
  // Employee details  
  first_name: string;
  last_name: string;
  phone: string;
  designation?: string;
  department?: string;
  
  // Address details
  address_line1?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  
  // Company details
  company_name: string;
  company_email?: string;
  company_phone?: string;
  company_id?: number; // If registering under existing company
  
  // Role
  is_admin?: boolean;
}

export interface RegistrationResponse {
  user: {
    user_id: number;
    email: string;
    employee_name: string;
    role_name: string;
    company_name: string;
    branch_name: string;
  };
  tokens: {
    access_token: string;
    refresh_token: string;
  };
}

export class RegistrationService {
  private userRepository: UserRepository;
  private employeeRepository: EmployeeRepository;
  private roleRepository: RoleRepository;
  private companyRepository: CompanyRepository;
  private branchRepository: BranchRepository;
  private systemUuid: string = uuidv4(); // System user UUID for created_by fields

  constructor() {
    this.userRepository = new UserRepository();
    this.employeeRepository = new EmployeeRepository();
    this.roleRepository = new RoleRepository();
    this.companyRepository = new CompanyRepository();
    this.branchRepository = new BranchRepository();
  }

  async registerComplete(data: EnhancedRegisterDTO): Promise<RegistrationResponse> {
    // Validate email uniqueness
    const existingEmail = await this.checkEmailExists(data.email);
    if (existingEmail) {
      throw new ConflictError('Email already registered');
    }

    // Get database connection for transaction
    const pool = this.userRepository.getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Step 1: Create or get company
      const companyId = await this.createOrGetCompany(data, connection);

      // Step 2: Create default branch
      const branchId = await this.createDefaultBranch(companyId, data, connection);

      // Step 3: Create or get admin role
      const roleId = await this.createOrGetAdminRole(connection);

      // Step 4: Create employee
      const employeeId = await this.createEmployee(data, companyId, branchId, connection);

      // Step 5: Create employee-branch association
      await this.createEmployeeBranchAssociation(employeeId, branchId, connection);

      // Step 6: Create user account
      const userId = await this.createUserAccount(data, employeeId, roleId, connection);

      // Step 7: Grant admin permissions if admin role
      if (data.is_admin) {
        await this.grantAdminPermissions(roleId, connection);
      }

      await connection.commit();

      // Generate tokens
      const tokens = this.generateTokens(userId, data.email, roleId, companyId);

      // Get company name if not provided
      let companyName = data.company_name;
      if (!companyName && data.company_id) {
        const [companies] = await connection.execute(
          'SELECT company_name FROM companies WHERE company_id = ?',
          [companyId]
        );
        companyName = (companies as any[])[0]?.company_name || 'Unknown Company';
      }

      logger.info('User registration completed successfully', { 
        userId,
        email: data.email,
        companyId,
        branchId,
        roleId
      });

      return {
        user: {
          user_id: userId,
          email: data.email,
          employee_name: `${data.first_name} ${data.last_name}`,
          role_name: 'Administrator',
          company_name: companyName,
          branch_name: 'Default Branch'
        },
        tokens
      };

    } catch (error) {
      await connection.rollback();
      logger.error('Registration failed', { error, email: data.email });
      throw error;
    } finally {
      connection.release();
    }
  }

  private async checkEmailExists(email: string): Promise<boolean> {
    const [result] = await this.userRepository.getPool().execute(
      'SELECT 1 FROM users WHERE email = ? UNION SELECT 1 FROM employees WHERE email = ?',
      [email, email]
    );
    return Array.isArray(result) && result.length > 0;
  }

  private async createOrGetCompany(data: EnhancedRegisterDTO, connection: PoolConnection): Promise<number> {
    if (data.company_id) {
      // Verify company exists
      const [companies] = await connection.execute(
        'SELECT company_id FROM companies WHERE company_id = ? AND is_active = 1',
        [data.company_id]
      );
      if (!Array.isArray(companies) || companies.length === 0) {
        throw new NotFoundError('Company not found');
      }
      return data.company_id;
    }

    // Create new company
    const companyUuid = uuidv4();
    const [result] = await connection.execute(
      `INSERT INTO companies (
        uuid, company_name, company_email, company_phone,
        address_line1, city, state, country, pincode,
        contact_person_name, contact_person_email, contact_person_phone,
        is_active, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        companyUuid, data.company_name, data.company_email || null, data.company_phone || null,
        data.address_line1 || null, data.city || null, data.state || null, 
        data.country || null, data.pincode || null,
        `${data.first_name} ${data.last_name}`, data.email, data.phone,
        1, this.systemUuid, this.systemUuid
      ]
    );

    return (result as any).insertId;
  }

  private async createDefaultBranch(companyId: number, data: EnhancedRegisterDTO, connection: PoolConnection): Promise<number> {
    const branchUuid = uuidv4();
    const [result] = await connection.execute(
      `INSERT INTO branches (
        uuid, company_id, branch_name, branch_phone,
        address_line1, city, state, country, pincode,
        is_active, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        branchUuid, companyId, 'Default Branch', data.phone,
        data.address_line1 || null, data.city || null, data.state || null,
        data.country || null, data.pincode || null,
        1, this.systemUuid, this.systemUuid
      ]
    );

    return (result as any).insertId;
  }

  private async createOrGetAdminRole(connection: PoolConnection): Promise<number> {
    // Check if admin role exists
    const [roles] = await connection.execute(
      'SELECT role_id FROM roles WHERE role_name = ?',
      ['Administrator']
    );

    if (Array.isArray(roles) && roles.length > 0) {
      return (roles[0] as any).role_id;
    }

    // Create admin role
    const roleUuid = uuidv4();
    const [result] = await connection.execute(
      `INSERT INTO roles (
        uuid, role_name, role_description,
        is_active, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        roleUuid, 'Administrator', 'System Administrator with full access',
        1, this.systemUuid, this.systemUuid
      ]
    );

    return (result as any).insertId;
  }

  private async createEmployee(data: EnhancedRegisterDTO, companyId: number, branchId: number, connection: PoolConnection): Promise<number> {
    const employeeUuid = uuidv4();
    const employeeName = `${data.first_name} ${data.last_name}`;
    const employeeCode = `EMP${Date.now()}`;
    
    const [result] = await connection.execute(
      `INSERT INTO employees (
        uuid, company_id, branch_id, employee_code, employee_name, first_name, last_name,
        email, phone, designation, department,
        address_line1, city, state, country, pincode,
        date_of_joining, is_active, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        employeeUuid, companyId, branchId, employeeCode, employeeName, data.first_name, data.last_name,
        data.email, data.phone, data.designation || 'Administrator', data.department || 'Administration',
        data.address_line1 || null, data.city || null, data.state || null,
        data.country || null, data.pincode || null,
        new Date(), 1, this.systemUuid, this.systemUuid
      ]
    );

    return (result as any).insertId;
  }

  private async createEmployeeBranchAssociation(employeeId: number, branchId: number, connection: PoolConnection): Promise<void> {
    const uuid = uuidv4();
    await connection.execute(
      `INSERT INTO employee_branches (
        uuid, employee_id, branch_id,
        is_active, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [uuid, employeeId, branchId, 1, this.systemUuid, this.systemUuid]
    );
  }

  private async createUserAccount(data: EnhancedRegisterDTO, employeeId: number, roleId: number, connection: PoolConnection): Promise<number> {
    const userUuid = uuidv4();
    const passwordHash = await bcrypt.hash(data.password, config.security.bcryptRounds);
    const username = data.email.split('@')[0]; // Use email prefix as username

    const [result] = await connection.execute(
      `INSERT INTO users (
        uuid, username, employee_id, role_id, email, password_hash,
        status, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userUuid, username, employeeId, roleId, data.email, passwordHash,
        'active', this.systemUuid, this.systemUuid
      ]
    );

    return (result as any).insertId;
  }

  private async grantAdminPermissions(roleId: number, connection: PoolConnection): Promise<void> {
    // Grant all menu permissions
    await connection.execute(
      `INSERT INTO role_menus (
        uuid, role_id, menu_id,
        can_view, can_create, can_edit, can_delete,
        created_by, updated_by
      )
      SELECT 
        UUID(), ?, menu_id,
        1, 1, 1, 1,
        ?, ?
      FROM menus 
      WHERE is_active = 1
      ON DUPLICATE KEY UPDATE
        can_view = 1, can_create = 1, can_edit = 1, can_delete = 1`,
      [roleId, this.systemUuid, this.systemUuid]
    );

    // Grant all feature permissions
    await connection.execute(
      `INSERT INTO role_features (
        uuid, role_id, feature_id, is_active,
        created_by, updated_by
      )
      SELECT 
        UUID(), ?, feature_id, 1,
        ?, ?
      FROM features 
      WHERE is_active = 1
      ON DUPLICATE KEY UPDATE
        is_active = 1`,
      [roleId, this.systemUuid, this.systemUuid]
    );
  }

  private generateTokens(userId: number, email: string, roleId: number, companyId: number) {
    const tokenPayload = {
      userId,
      email,
      roleId,
      companyId
    };

    return {
      access_token: generateToken(tokenPayload, 'access'),
      refresh_token: generateToken(tokenPayload, 'refresh')
    };
  }
}