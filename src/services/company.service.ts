import { 
  CompanyRepository, 
  BranchRepository, 
  EmployeeRepository,
  SubscriptionRepository,
  HMSSettingsRepository
} from '../repositories/user.repository';
import { 
  Company, 
  Branch, 
  Employee, 
  CreateCompanyDTO, 
  CreateEmployeeDTO
} from '../models/user.model';
import { PaginationQuery, PaginatedResponse } from '../models/base.model';
import { 
  ConflictError, 
  NotFoundError,
  ValidationError 
} from '../errors/AppError';
import logger from '../utils/logger';

export class CompanyService {
  private companyRepository: CompanyRepository;
  private branchRepository: BranchRepository;
  private employeeRepository: EmployeeRepository;
  private subscriptionRepository: SubscriptionRepository;
  private hmsSettingsRepository: HMSSettingsRepository;

  constructor() {
    this.companyRepository = new CompanyRepository();
    this.branchRepository = new BranchRepository();
    this.employeeRepository = new EmployeeRepository();
    this.subscriptionRepository = new SubscriptionRepository();
    this.hmsSettingsRepository = new HMSSettingsRepository();
  }

  // Company Management
  async createCompany(data: CreateCompanyDTO, createdBy: string): Promise<Company> {
    // Check if company with same name or email already exists
    if (data.company_name) {
      const existingByName = await this.companyRepository.findByName(data.company_name);
      if (existingByName) {
        throw new ConflictError('Company with this name already exists');
      }
    }

    if (data.company_email) {
      const existingByEmail = await this.companyRepository.findByEmail(data.company_email);
      if (existingByEmail) {
        throw new ConflictError('Company with this email already exists');
      }
    }

    const company = await this.companyRepository.create({
      ...data,
      is_active: true,
    }, createdBy);

    logger.info('Company created successfully', { 
      companyId: company.company_id, 
      companyName: company.company_name 
    });

    return company;
  }

  async getCompanyById(companyId: number): Promise<Company | null> {
    return await this.companyRepository.findByPrimaryKey(companyId);
  }

  async getCompanies(
    filters: Partial<Company> = {},
    pagination?: PaginationQuery
  ): Promise<PaginatedResponse<Company>> {0
    return await this.companyRepository.findAll(filters, pagination);
  }

  async updateCompany(
    companyId: number,
    data: Partial<CreateCompanyDTO>,
    updatedBy: string
  ): Promise<boolean> {
    const company = await this.companyRepository.findByPrimaryKey(companyId);
    if (!company) {
      throw new NotFoundError('Company not found');
    }

    // Check for conflicts if updating name or email
    if (data.company_name && data.company_name !== company.company_name) {
      const existingByName = await this.companyRepository.findByName(data.company_name);
      if (existingByName && existingByName.company_id !== companyId) {
        throw new ConflictError('Company with this name already exists');
      }
    }

    if (data.company_email && data.company_email !== company.company_email) {
      const existingByEmail = await this.companyRepository.findByEmail(data.company_email);
      if (existingByEmail && existingByEmail.company_id !== companyId) {
        throw new ConflictError('Company with this email already exists');
      }
    }

    const updated = await this.companyRepository.update(companyId, data, updatedBy);

    if (updated) {
      logger.info('Company updated successfully', { companyId });
    }

    return updated;
  }

  async deleteCompany(companyId: number, deletedBy: string): Promise<boolean> {
    const company = await this.companyRepository.findByPrimaryKey(companyId);
    if (!company) {
      throw new NotFoundError('Company not found');
    }

    const deleted = await this.companyRepository.softDelete(companyId, deletedBy);

    if (deleted) {
      logger.info('Company deleted successfully', { companyId });
    }

    return deleted;
  }

  // Branch Management
  async createBranch(
    data: Partial<Branch>,
    createdBy: string
  ): Promise<Branch> {
    // Verify company exists
    if (!data.company_id) {
      throw new ValidationError('Company ID is required');
    }

    const company = await this.companyRepository.findByPrimaryKey(data.company_id);
    if (!company) {
      throw new NotFoundError('Company not found');
    }

    const branch = await this.branchRepository.create({
      ...data,
      is_active: true,
    }, createdBy);

    logger.info('Branch created successfully', { 
      branchId: branch.branch_id, 
      branchName: branch.branch_name,
      companyId: branch.company_id
    });

    return branch;
  }

  async getBranchesByCompanyId(companyId: number): Promise<Branch[]> {
    return await this.branchRepository.findByCompanyId(companyId);
  }

  async getBranchById(branchId: number): Promise<Branch | null> {
    return await this.branchRepository.findByPrimaryKey(branchId);
  }

  async updateBranch(
    branchId: number,
    data: Partial<Branch>,
    updatedBy: string
  ): Promise<boolean> {
    const branch = await this.branchRepository.findByPrimaryKey(branchId);
    if (!branch) {
      throw new NotFoundError('Branch not found');
    }

    const updated = await this.branchRepository.update(branchId, data, updatedBy);

    if (updated) {
      logger.info('Branch updated successfully', { branchId });
    }

    return updated;
  }

  async deleteBranch(branchId: number, deletedBy: string): Promise<boolean> {
    const branch = await this.branchRepository.findByPrimaryKey(branchId);
    if (!branch) {
      throw new NotFoundError('Branch not found');
    }

    const deleted = await this.branchRepository.softDelete(branchId, deletedBy);

    if (deleted) {
      logger.info('Branch deleted successfully', { branchId });
    }

    return deleted;
  }

  // Employee Management
  async createEmployee(data: CreateEmployeeDTO, createdBy: string): Promise<Employee> {
    // Check if employee with same email already exists
    const existingEmployee = await this.employeeRepository.findByEmail(data.email);
    if (existingEmployee) {
      throw new ConflictError('Employee with this email already exists');
    }

    // Verify company exists
    const company = await this.companyRepository.findByPrimaryKey(data.company_id);
    if (!company) {
      throw new NotFoundError('Company not found');
    }

    // Verify branch exists if provided
    if (data.branch_id) {
      const branch = await this.branchRepository.findByPrimaryKey(data.branch_id);
      if (!branch || branch.company_id !== data.company_id) {
        throw new NotFoundError('Branch not found or does not belong to company');
      }
    }

    const employee = await this.employeeRepository.create({
      ...data,
      is_active: true,
    }, createdBy);

    logger.info('Employee created successfully', { 
      employeeId: employee.employee_id, 
      employeeName: employee.employee_name,
      companyId: employee.company_id
    });

    return employee;
  }

  async getEmployeesByCompanyId(companyId: number): Promise<Employee[]> {
    return await this.employeeRepository.findByCompanyId(companyId);
  }

  async getEmployeeById(employeeId: number): Promise<Employee | null> {
    return await this.employeeRepository.findByPrimaryKey(employeeId);
  }

  async getEmployeeByEmail(email: string): Promise<Employee | null> {
    return await this.employeeRepository.findByEmail(email);
  }

  async getDoctorsByBranchId(branchId: number): Promise<Employee[]> {
    return await this.employeeRepository.findDoctorsByBranchId(branchId);
  }

  async updateEmployee(
    employeeId: number,
    data: Partial<CreateEmployeeDTO>,
    updatedBy: string
  ): Promise<boolean> {
    const employee = await this.employeeRepository.findByPrimaryKey(employeeId);
    if (!employee) {
      throw new NotFoundError('Employee not found');
    }

    // Check for email conflicts if updating email
    if (data.email && data.email !== employee.email) {
      const existingByEmail = await this.employeeRepository.findByEmail(data.email);
      if (existingByEmail && existingByEmail.employee_id !== employeeId) {
        throw new ConflictError('Employee with this email already exists');
      }
    }

    const updated = await this.employeeRepository.update(employeeId, data, updatedBy);

    if (updated) {
      logger.info('Employee updated successfully', { employeeId });
    }

    return updated;
  }

  async deleteEmployee(employeeId: number, deletedBy: string): Promise<boolean> {
    const employee = await this.employeeRepository.findByPrimaryKey(employeeId);
    if (!employee) {
      throw new NotFoundError('Employee not found');
    }

    const deleted = await this.employeeRepository.softDelete(employeeId, deletedBy);

    if (deleted) {
      logger.info('Employee deleted successfully', { employeeId });
    }

    return deleted;
  }

  // Company Settings Management
  async getCompanySettings(companyId: number) {
    return await this.hmsSettingsRepository.findByCompanyId(companyId);
  }

  async updateCompanySettings(
    companyId: number,
    settings: Record<string, any>,
    updatedBy: string
  ) {
    const existingSettings = await this.hmsSettingsRepository.findByCompanyId(companyId);
    
    if (existingSettings) {
      // Update existing settings
      return await this.hmsSettingsRepository.update(
        existingSettings.settings_id,
        { settings_json: settings },
        updatedBy
      );
    } else {
      // Create new settings
      return await this.hmsSettingsRepository.create({
        company_id: companyId,
        settings_json: settings,
      }, updatedBy);
    }
  }

  // Company Dashboard/Stats
  async getCompanyStats(companyId: number) {
    const company = await this.companyRepository.findByPrimaryKey(companyId);
    if (!company) {
      throw new NotFoundError('Company not found');
    }

    const branches = await this.branchRepository.findByCompanyId(companyId);
    const employees = await this.employeeRepository.findByCompanyId(companyId);
    const subscriptions = await this.subscriptionRepository.findByCompanyId(companyId);

    const doctors = employees.filter(emp => emp.is_doctor);
    const activeEmployees = employees.filter(emp => emp.is_active);

    return {
      company,
      stats: {
        total_branches: branches.length,
        total_employees: employees.length,
        active_employees: activeEmployees.length,
        total_doctors: doctors.length,
        active_subscriptions: subscriptions.filter(sub => sub.is_active).length,
      },
      branches,
      recent_employees: employees.slice(0, 10), // Last 10 employees
    };
  }
}