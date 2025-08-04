import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { BaseRepository } from './base.repository';
import { 
  User, Employee, Role, Company, Branch, Menu, Feature, RoleMenu, RoleFeature,
  DoctorBranchMapping, EmployeeFile, EmployeeBranch, HMSSettings, Plan, 
  Subscription, Invoice, Payment, ReferralDoctor, UserWithDetails
} from '../models/user.model';
import { v4 as uuidv4 } from 'uuid';

// Company Repository
export class CompanyRepository extends BaseRepository<Company> {
  constructor() {
    super('companies', 'company_id', true);
  }

  async findByName(companyName: string, connection?: PoolConnection): Promise<Company | null> {
    const conn = connection || this.pool;
    const [rows] = await conn.execute<RowDataPacket[]>(
      'SELECT * FROM companies WHERE company_name = ? AND is_active = 1',
      [companyName]
    );
    return rows.length > 0 ? (rows[0] as Company) : null;
  }

  async findByEmail(email: string, connection?: PoolConnection): Promise<Company | null> {
    const conn = connection || this.pool;
    const [rows] = await conn.execute<RowDataPacket[]>(
      'SELECT * FROM companies WHERE company_email = ? AND is_active = 1',
      [email]
    );
    return rows.length > 0 ? (rows[0] as Company) : null;
  }
}

// Branch Repository
export class BranchRepository extends BaseRepository<Branch> {
  constructor() {
    super('branches', 'branch_id', true);
  }

  async findByCompanyId(companyId: number, connection?: PoolConnection): Promise<Branch[]> {
    const conn = connection || this.pool;
    const [rows] = await conn.execute<RowDataPacket[]>(
      'SELECT * FROM branches WHERE company_id = ? AND is_active = 1 ORDER BY branch_name',
      [companyId]
    );
    return rows as Branch[];
  }
}

// Employee Repository
export class EmployeeRepository extends BaseRepository<Employee> {
  constructor() {
    super('employees', 'employee_id', true);
  }

  async findByEmail(email: string, connection?: PoolConnection): Promise<Employee | null> {
    const conn = connection || this.pool;
    const [rows] = await conn.execute<RowDataPacket[]>(
      'SELECT * FROM employees WHERE email = ? AND is_active = 1',
      [email]
    );
    return rows.length > 0 ? (rows[0] as Employee) : null;
  }

  async findByCompanyId(companyId: number, connection?: PoolConnection): Promise<Employee[]> {
    const conn = connection || this.pool;
    const [rows] = await conn.execute<RowDataPacket[]>(
      'SELECT * FROM employees WHERE company_id = ? AND is_active = 1 ORDER BY employee_name',
      [companyId]
    );
    return rows as Employee[];
  }

  async findDoctorsByBranchId(branchId: number, connection?: PoolConnection): Promise<Employee[]> {
    const conn = connection || this.pool;
    const [rows] = await conn.execute<RowDataPacket[]>(
      'SELECT * FROM employees WHERE branch_id = ? AND is_doctor = 1 AND is_active = 1 ORDER BY employee_name',
      [branchId]
    );
    return rows as Employee[];
  }

  async updateEmployee(employeeId: number, data: any, connection?: PoolConnection): Promise<boolean> {
    const conn = connection || this.pool;
    const updateFields: string[] = [];
    const values: any[] = [];

    // Only update fields that are actually in the employees table
    const allowedFields = ['first_name', 'last_name', 'phone', 'designation', 'department', 'employee_name'];
    
    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    }

    // Update employee_name if first_name or last_name changed
    if ((data.first_name || data.last_name) && !data.employee_name) {
      const [employee] = await conn.execute<RowDataPacket[]>(
        'SELECT first_name, last_name FROM employees WHERE employee_id = ?',
        [employeeId]
      );
      if (employee.length > 0) {
        const firstName = data.first_name || employee[0].first_name;
        const lastName = data.last_name || employee[0].last_name;
        updateFields.push('employee_name = ?');
        values.push(`${firstName} ${lastName}`);
      }
    }

    if (updateFields.length === 0) return true;

    values.push(employeeId);
    const [result] = await conn.execute<ResultSetHeader>(
      `UPDATE employees SET ${updateFields.join(', ')}, updated_at = NOW() WHERE employee_id = ?`,
      values
    );
    return result.affectedRows > 0;
  }
}

// User Repository
export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users', 'user_id', false);
  }

  async findByEmail(email: string, connection?: PoolConnection): Promise<User | null> {
    const conn = connection || this.pool;
    const [rows] = await conn.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE email = ? AND status = ?',
      [email, 'active']
    );
    return rows.length > 0 ? (rows[0] as User) : null;
  }

  async findByEmployeeId(employeeId: number, connection?: PoolConnection): Promise<User | null> {
    const conn = connection || this.pool;
    const [rows] = await conn.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE employee_id = ? AND status = ?',
      [employeeId, 'active']
    );
    return rows.length > 0 ? (rows[0] as User) : null;
  }

  async findUserWithDetails(email: string, connection?: PoolConnection): Promise<UserWithDetails | null> {
    const conn = connection || this.pool;
    const [rows] = await conn.execute<RowDataPacket[]>(
      `SELECT 
        u.user_id, u.uuid as user_uuid, u.employee_id, u.role_id, u.email, 
        u.password_hash, u.expiry_minutes, u.status, u.created_by, u.created_at, u.updated_by, u.updated_at,
        e.employee_id as emp_id, e.uuid as employee_uuid, e.company_id, e.branch_id,
        e.employee_name, e.first_name, e.last_name, e.phone, e.designation,
        e.department, e.date_of_joining, e.is_doctor, e.is_active as emp_active,
        r.role_id as r_id, r.role_name, r.role_description, r.is_active as role_active,
        c.company_id as comp_id, c.company_name, c.is_active as comp_active,
        b.branch_id as br_id, b.branch_name, b.is_active as branch_active
      FROM users u
      INNER JOIN employees e ON u.employee_id = e.employee_id
      INNER JOIN roles r ON u.role_id = r.role_id
      INNER JOIN companies c ON e.company_id = c.company_id
      LEFT JOIN branches b ON e.branch_id = b.branch_id
      WHERE u.email = ? AND u.status = ? AND e.is_active = 1`,
      [email, 'active']
    );
    
    if (rows.length === 0) return null;
    
    const row = rows[0];
    return {
      user_id: row.user_id,
      uuid: row.user_uuid,
      employee_id: row.employee_id,
      role_id: row.role_id,
      email: row.email,
      password_hash: row.password_hash,
      expiry_minutes: row.expiry_minutes,
      status: row.status,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_by: row.updated_by,
      updated_at: row.updated_at,
      employee: {
        employee_id: row.emp_id,
        uuid: row.employee_uuid,
        company_id: row.company_id,
        branch_id: row.branch_id,
        employee_name: row.employee_name,
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email,
        phone: row.phone,
        designation: row.designation,
        department: row.department,
        date_of_joining: row.date_of_joining,
        is_doctor: row.is_doctor,
        is_active: row.emp_active,
        created_by: row.created_by,
        created_at: row.created_at,
        updated_by: row.updated_by,
        updated_at: row.updated_at
      },
      role: {
        role_id: row.r_id,
        uuid: row.uuid,
        role_name: row.role_name,
        role_description: row.role_description,
        is_active: row.role_active,
        created_by: row.created_by,
        created_at: row.created_at,
        updated_by: row.updated_by,
        updated_at: row.updated_at
      },
      company: {
        company_id: row.comp_id,
        uuid: row.uuid,
        company_name: row.company_name,
        is_active: row.comp_active,
        created_by: row.created_by,
        created_at: row.created_at,
        updated_by: row.updated_by,
        updated_at: row.updated_at
      },
      ...(row.br_id && {
        branch: {
          branch_id: row.br_id,
          uuid: row.uuid,
          company_id: row.company_id,
          branch_name: row.branch_name,
          is_active: row.branch_active,
          created_by: row.created_by,
          created_at: row.created_at,
          updated_by: row.updated_by,
          updated_at: row.updated_at
        }
      })
    } as UserWithDetails;
  }

  async createUserWithEmployee(
    employeeData: Omit<Employee, 'employee_id' | keyof import('../models/base.model').BaseEntity>,
    userData: Omit<User, 'user_id' | 'employee_id' | keyof import('../models/base.model').BaseEntity>,
    createdBy: string,
    connection?: PoolConnection
  ): Promise<{ user: User; employee: Employee }> {
    const conn = connection || this.pool;

    try {
      await conn.beginTransaction();

      // Create employee first
      const employeeUuid = uuidv4();
      const now = new Date();
      
      const employeeEntity = {
        ...employeeData,
        uuid: employeeUuid,
        created_at: now,
        created_by: createdBy,
        updated_at: now,
        updated_by: createdBy,
        is_active: 1,
      };

      const employeeColumns = Object.keys(employeeEntity);
      const employeePlaceholders = employeeColumns.map(() => '?').join(', ');
      const employeeValues = employeeColumns.map(col => (employeeEntity as any)[col]);

      const [employeeResult] = await conn.execute<ResultSetHeader>(
        `INSERT INTO employees (${employeeColumns.join(', ')}) VALUES (${employeePlaceholders})`,
        employeeValues
      );

      const employeeId = employeeResult.insertId;

      // Create user
      const userUuid = uuidv4();
      const userEntity = {
        ...userData,
        uuid: userUuid,
        employee_id: employeeId,
        created_at: now,
        created_by: createdBy,
        updated_at: now,
        updated_by: createdBy,
        status: 'active',
      };

      const userColumns = Object.keys(userEntity);
      const userPlaceholders = userColumns.map(() => '?').join(', ');
      const userValues = userColumns.map(col => (userEntity as any)[col]);

      const [userResult] = await conn.execute<ResultSetHeader>(
        `INSERT INTO users (${userColumns.join(', ')}) VALUES (${userPlaceholders})`,
        userValues
      );

      await conn.commit();

      const createdEmployee = { 
        ...employeeEntity, 
        employee_id: employeeId,
        is_active: true
      } as Employee;
      
      const createdUser = { 
        ...userEntity, 
        user_id: userResult.insertId
      } as User;

      return { user: createdUser, employee: createdEmployee };

    } catch (error) {
      await conn.rollback();
      throw error;
    }
  }


  async updateUserStatus(userId: number, status: 'active' | 'inactive' | 'suspended', updatedBy: string, connection?: PoolConnection): Promise<boolean> {
    const conn = connection || this.pool;
    const [result] = await conn.execute<ResultSetHeader>(
      'UPDATE users SET status = ?, updated_by = ?, updated_at = NOW() WHERE user_id = ?',
      [status, updatedBy, userId]
    );
    return result.affectedRows > 0;
  }

  async findById(userId: number, connection?: PoolConnection): Promise<User | null> {
    const conn = connection || this.pool;
    const [rows] = await conn.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE user_id = ?',
      [userId]
    );
    return rows.length > 0 ? (rows[0] as User) : null;
  }

  async findByUsername(username: string, connection?: PoolConnection): Promise<User | null> {
    const conn = connection || this.pool;
    const [rows] = await conn.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE username = ? AND status = ?',
      [username, 'active']
    );
    return rows.length > 0 ? (rows[0] as User) : null;
  }

  async updateLastLogin(userId: number, connection?: PoolConnection): Promise<boolean> {
    const conn = connection || this.pool;
    const [result] = await conn.execute<ResultSetHeader>(
      'UPDATE users SET updated_at = NOW() WHERE user_id = ?',
      [userId]
    );
    return result.affectedRows > 0;
  }

  async updateUser(userId: number, data: Partial<User>, connection?: PoolConnection): Promise<User> {
    const conn = connection || this.pool;
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    values.push(userId);
    
    await conn.execute(
      `UPDATE users SET ${fields}, updated_at = NOW() WHERE user_id = ?`,
      values
    );
    
    const updated = await this.findById(userId, connection);
    if (!updated) throw new Error('User not found after update');
    return updated;
  }

  async updatePassword(userId: number, passwordHash: string, connection?: PoolConnection): Promise<boolean> {
    const conn = connection || this.pool;
    const [result] = await conn.execute<ResultSetHeader>(
      'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE user_id = ?',
      [passwordHash, userId]
    );
    return result.affectedRows > 0;
  }

  async findUserWithEmployeeDetails(userId: number, connection?: PoolConnection): Promise<any | null> {
    const conn = connection || this.pool;
    const [rows] = await conn.execute<RowDataPacket[]>(
      `SELECT 
        u.user_id, u.uuid, u.username, u.employee_id, u.role_id, u.email, 
        u.password_hash, u.expiry_minutes, u.status, u.created_by, u.created_at, u.updated_by, u.updated_at,
        e.employee_id as emp_id, e.uuid as employee_uuid, e.company_id, e.branch_id,
        e.employee_name, e.first_name, e.last_name, e.phone, e.designation,
        e.department, e.date_of_joining, e.is_doctor, e.is_active as emp_active,
        r.role_id as r_id, r.role_name, r.role_description, r.is_active as role_active,
        c.company_id as comp_id, c.company_name, c.is_active as comp_active,
        b.branch_id as br_id, b.branch_name, b.is_active as branch_active
      FROM users u
      INNER JOIN employees e ON u.employee_id = e.employee_id
      INNER JOIN roles r ON u.role_id = r.role_id
      INNER JOIN companies c ON e.company_id = c.company_id
      LEFT JOIN branches b ON e.branch_id = b.branch_id
      WHERE u.user_id = ? AND u.status = ? AND e.is_active = 1`,
      [userId, 'active']
    );
    
    if (rows.length === 0) return null;
    
    const row = rows[0];
    return {
      user_id: row.user_id,
      uuid: row.uuid,
      username: row.username,
      employee_id: row.employee_id,
      role_id: row.role_id,
      email: row.email,
      password_hash: row.password_hash,
      expiry_minutes: row.expiry_minutes,
      status: row.status,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_by: row.updated_by,
      updated_at: row.updated_at,
      employee: {
        employee_id: row.emp_id,
        uuid: row.employee_uuid,
        company_id: row.company_id,
        branch_id: row.branch_id,
        employee_name: row.employee_name,
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email,
        phone: row.phone,
        designation: row.designation,
        department: row.department,
        date_of_joining: row.date_of_joining,
        is_doctor: row.is_doctor,
        is_active: row.emp_active,
        created_by: row.created_by,
        created_at: row.created_at,
        updated_by: row.updated_by,
        updated_at: row.updated_at
      },
      role: {
        role_id: row.r_id,
        uuid: row.uuid,
        role_name: row.role_name,
        role_description: row.role_description,
        is_active: row.role_active,
        created_by: row.created_by,
        created_at: row.created_at,
        updated_by: row.updated_by,
        updated_at: row.updated_at
      },
      company: {
        company_id: row.comp_id,
        uuid: row.uuid,
        company_name: row.company_name,
        is_active: row.comp_active,
        created_by: row.created_by,
        created_at: row.created_at,
        updated_by: row.updated_by,
        updated_at: row.updated_at
      },
      ...(row.br_id && {
        branch: {
          branch_id: row.br_id,
          uuid: row.uuid,
          company_id: row.company_id,
          branch_name: row.branch_name,
          is_active: row.branch_active,
          created_by: row.created_by,
          created_at: row.created_at,
          updated_by: row.updated_by,
          updated_at: row.updated_at
        }
      })
    };
  }

  getPool() {
    return this.pool;
  }
}

// Role Repository
export class RoleRepository extends BaseRepository<Role> {
  constructor() {
    super('roles', 'role_id', false);
  }

  async findByName(roleName: string, connection?: PoolConnection): Promise<Role | null> {
    const conn = connection || this.pool;
    const [rows] = await conn.execute<RowDataPacket[]>(
      'SELECT * FROM roles WHERE name = ?',
      [roleName]
    );
    return rows.length > 0 ? (rows[0] as Role) : null;
  }
}

// Menu Repository
export class MenuRepository extends BaseRepository<Menu> {
  constructor() {
    super('menus', 'menu_id', true);
  }

  async findByParentId(parentId: number | null, connection?: PoolConnection): Promise<Menu[]> {
    const conn = connection || this.pool;
    const whereClause = parentId 
      ? 'WHERE parent_menu_id = ? AND is_active = 1' 
      : 'WHERE parent_menu_id IS NULL AND is_active = 1';
    const params = parentId ? [parentId] : [];
    
    const [rows] = await conn.execute<RowDataPacket[]>(
      `SELECT * FROM menus ${whereClause} ORDER BY menu_order`,
      params
    );
    return rows as Menu[];
  }
}

// Feature Repository
export class FeatureRepository extends BaseRepository<Feature> {
  constructor() {
    super('features', 'feature_id', true);
  }

  async findByMenuId(menuId: number, connection?: PoolConnection): Promise<Feature[]> {
    const conn = connection || this.pool;
    const [rows] = await conn.execute<RowDataPacket[]>(
      'SELECT * FROM features WHERE menu_id = ? AND is_active = 1',
      [menuId]
    );
    return rows as Feature[];
  }
}

// RoleMenu Repository
export class RoleMenuRepository extends BaseRepository<RoleMenu> {
  constructor() {
    super('role_menus', 'role_menu_id', false);
  }

  async findByRoleId(roleId: number, connection?: PoolConnection): Promise<RoleMenu[]> {
    const conn = connection || this.pool;
    const [rows] = await conn.execute<RowDataPacket[]>(
      'SELECT * FROM role_menus WHERE role_id = ?',
      [roleId]
    );
    return rows as RoleMenu[];
  }
}

// RoleFeature Repository
export class RoleFeatureRepository extends BaseRepository<RoleFeature> {
  constructor() {
    super('role_features', 'role_feature_id', true);
  }

  async findByRoleId(roleId: number, connection?: PoolConnection): Promise<RoleFeature[]> {
    const conn = connection || this.pool;
    const [rows] = await conn.execute<RowDataPacket[]>(
      'SELECT * FROM role_features WHERE role_id = ? AND is_active = 1',
      [roleId]
    );
    return rows as RoleFeature[];
  }
}

// DoctorBranchMapping Repository
export class DoctorBranchMappingRepository extends BaseRepository<DoctorBranchMapping> {
  constructor() {
    super('doctor_branch_mapping', 'doctor_branch_id', true);
  }

  async findByEmployeeId(employeeId: number, connection?: PoolConnection): Promise<DoctorBranchMapping[]> {
    const conn = connection || this.pool;
    const [rows] = await conn.execute<RowDataPacket[]>(
      'SELECT * FROM doctor_branch_mapping WHERE employee_id = ? AND is_active = 1',
      [employeeId]
    );
    return rows as DoctorBranchMapping[];
  }

  async findByBranchId(branchId: number, connection?: PoolConnection): Promise<DoctorBranchMapping[]> {
    const conn = connection || this.pool;
    const [rows] = await conn.execute<RowDataPacket[]>(
      'SELECT * FROM doctor_branch_mapping WHERE branch_id = ? AND is_active = 1',
      [branchId]
    );
    return rows as DoctorBranchMapping[];
  }
}

// EmployeeFile Repository
export class EmployeeFileRepository extends BaseRepository<EmployeeFile> {
  constructor() {
    super('employee_files', 'id', false);
  }

  async findByEmployeeId(employeeId: number, connection?: PoolConnection): Promise<EmployeeFile[]> {
    const conn = connection || this.pool;
    const [rows] = await conn.execute<RowDataPacket[]>(
      'SELECT * FROM employee_files WHERE employee_id = ? ORDER BY uploaded_at DESC',
      [employeeId]
    );
    return rows as EmployeeFile[];
  }
}

// EmployeeBranch Repository
export class EmployeeBranchRepository extends BaseRepository<EmployeeBranch> {
  constructor() {
    super('employee_branches', 'employee_branch_id', true);
  }

  async findByEmployeeId(employeeId: number, connection?: PoolConnection): Promise<EmployeeBranch[]> {
    const conn = connection || this.pool;
    const [rows] = await conn.execute<RowDataPacket[]>(
      'SELECT * FROM employee_branches WHERE employee_id = ? AND is_active = 1',
      [employeeId]
    );
    return rows as EmployeeBranch[];
  }
}

// HMSSettings Repository
export class HMSSettingsRepository extends BaseRepository<HMSSettings> {
  constructor() {
    super('hms_settings', 'settings_id', false);
  }

  async findByCompanyId(companyId: number, connection?: PoolConnection): Promise<HMSSettings | null> {
    const conn = connection || this.pool;
    const [rows] = await conn.execute<RowDataPacket[]>(
      'SELECT * FROM hms_settings WHERE company_id = ?',
      [companyId]
    );
    return rows.length > 0 ? (rows[0] as HMSSettings) : null;
  }
}

// Plan Repository
export class PlanRepository extends BaseRepository<Plan> {
  constructor() {
    super('plans', 'plan_id', true);
  }

  async findByName(planName: string, connection?: PoolConnection): Promise<Plan | null> {
    const conn = connection || this.pool;
    const [rows] = await conn.execute<RowDataPacket[]>(
      'SELECT * FROM plans WHERE plan_name = ? AND is_active = 1',
      [planName]
    );
    return rows.length > 0 ? (rows[0] as Plan) : null;
  }
}

// Subscription Repository
export class SubscriptionRepository extends BaseRepository<Subscription> {
  constructor() {
    super('subscriptions', 'subscription_id', true);
  }

  async findByCompanyId(companyId: number, connection?: PoolConnection): Promise<Subscription[]> {
    const conn = connection || this.pool;
    const [rows] = await conn.execute<RowDataPacket[]>(
      'SELECT * FROM subscriptions WHERE company_id = ? AND is_active = 1 ORDER BY created_at DESC',
      [companyId]
    );
    return rows as Subscription[];
  }
}

// Invoice Repository
export class InvoiceRepository extends BaseRepository<Invoice> {
  constructor() {
    super('invoices', 'invoice_id', false);
  }

  async findByCompanyId(companyId: number, connection?: PoolConnection): Promise<Invoice[]> {
    const conn = connection || this.pool;
    const [rows] = await conn.execute<RowDataPacket[]>(
      'SELECT * FROM invoices WHERE company_id = ? ORDER BY created_at DESC',
      [companyId]
    );
    return rows as Invoice[];
  }

  async findByInvoiceNumber(invoiceNumber: string, connection?: PoolConnection): Promise<Invoice | null> {
    const conn = connection || this.pool;
    const [rows] = await conn.execute<RowDataPacket[]>(
      'SELECT * FROM invoices WHERE invoice_number = ?',
      [invoiceNumber]
    );
    return rows.length > 0 ? (rows[0] as Invoice) : null;
  }
}

// Payment Repository
export class PaymentRepository extends BaseRepository<Payment> {
  constructor() {
    super('payments', 'payment_id', false);
  }

  async findByInvoiceId(invoiceId: number, connection?: PoolConnection): Promise<Payment[]> {
    const conn = connection || this.pool;
    const [rows] = await conn.execute<RowDataPacket[]>(
      'SELECT * FROM payments WHERE invoice_id = ? ORDER BY payment_date DESC',
      [invoiceId]
    );
    return rows as Payment[];
  }
}

// ReferralDoctor Repository
export class ReferralDoctorRepository extends BaseRepository<ReferralDoctor> {
  constructor() {
    super('referral_doctors', 'id', true);
  }

  async findByName(name: string, connection?: PoolConnection): Promise<ReferralDoctor[]> {
    const conn = connection || this.pool;
    const [rows] = await conn.execute<RowDataPacket[]>(
      'SELECT * FROM referral_doctors WHERE name LIKE ? AND is_active = 1',
      [`%${name}%`]
    );
    return rows as ReferralDoctor[];
  }
}