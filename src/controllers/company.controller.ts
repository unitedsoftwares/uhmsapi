import { Request, Response, NextFunction } from 'express';
import { CompanyService } from '../services/company.service';
import { CreateCompanyDTO, CreateEmployeeDTO } from '../models/user.model';
import { PaginationQuery } from '../models/base.model';
import logger from '../utils/logger';

export class CompanyController {
  private companyService: CompanyService;

  constructor() {
    this.companyService = new CompanyService();
  }

  // Company Management
  createCompany = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyData: CreateCompanyDTO = req.body;
      const createdBy = req.user?.user_uuid || 'SYSTEM';

      const company = await this.companyService.createCompany(companyData, createdBy);

      res.status(201).json({
        success: true,
        data: { company },
      });
    } catch (error) {
      next(error);
    }
  };

  getCompanies = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const pagination: PaginationQuery = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        sort_by: req.query.sort_by as string,
        sort_order: req.query.sort_order as 'ASC' | 'DESC',
      };

      const filters = {
        is_active: req.query.is_active === 'false' ? false : true,
        ...(req.query.search && {
          company_name: req.query.search as string,
        }),
      };

      const result = await this.companyService.getCompanies(filters, pagination);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getCompanyById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = parseInt(req.params.id);
      const company = await this.companyService.getCompanyById(companyId);

      if (!company) {
        res.status(404).json({
          success: false,
          error: {
            message: 'Company not found',
            code: 'COMPANY_NOT_FOUND',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: { company },
      });
    } catch (error) {
      next(error);
    }
  };

  updateCompany = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = parseInt(req.params.id);
      const updateData = req.body;
      const updatedBy = req.user?.user_uuid || 'SYSTEM';

      const updated = await this.companyService.updateCompany(companyId, updateData, updatedBy);

      if (!updated) {
        res.status(404).json({
          success: false,
          error: {
            message: 'Company not found or no changes made',
            code: 'UPDATE_FAILED',
          },
        });
        return;
      }

      res.json({
        success: true,
        message: 'Company updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  deleteCompany = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = parseInt(req.params.id);
      const deletedBy = req.user?.user_uuid || 'SYSTEM';

      const deleted = await this.companyService.deleteCompany(companyId, deletedBy);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: {
            message: 'Company not found',
            code: 'COMPANY_NOT_FOUND',
          },
        });
        return;
      }

      res.json({
        success: true,
        message: 'Company deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getCompanyStats = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = parseInt(req.params.id);
      const stats = await this.companyService.getCompanyStats(companyId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  // Branch Management
  createBranch = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const branchData = req.body;
      const createdBy = req.user?.user_uuid || 'SYSTEM';

      const branch = await this.companyService.createBranch(branchData, createdBy);

      res.status(201).json({
        success: true,
        data: { branch },
      });
    } catch (error) {
      next(error);
    }
  };

  getBranchesByCompany = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = parseInt(req.params.companyId);
      const branches = await this.companyService.getBranchesByCompanyId(companyId);

      res.json({
        success: true,
        data: { branches },
      });
    } catch (error) {
      next(error);
    }
  };

  getBranchById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const branchId = parseInt(req.params.id);
      const branch = await this.companyService.getBranchById(branchId);

      if (!branch) {
        res.status(404).json({
          success: false,
          error: {
            message: 'Branch not found',
            code: 'BRANCH_NOT_FOUND',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: { branch },
      });
    } catch (error) {
      next(error);
    }
  };

  updateBranch = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const branchId = parseInt(req.params.id);
      const updateData = req.body;
      const updatedBy = req.user?.user_uuid || 'SYSTEM';

      const updated = await this.companyService.updateBranch(branchId, updateData, updatedBy);

      if (!updated) {
        res.status(404).json({
          success: false,
          error: {
            message: 'Branch not found or no changes made',
            code: 'UPDATE_FAILED',
          },
        });
        return;
      }

      res.json({
        success: true,
        message: 'Branch updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  deleteBranch = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const branchId = parseInt(req.params.id);
      const deletedBy = req.user?.user_uuid || 'SYSTEM';

      const deleted = await this.companyService.deleteBranch(branchId, deletedBy);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: {
            message: 'Branch not found',
            code: 'BRANCH_NOT_FOUND',
          },
        });
        return;
      }

      res.json({
        success: true,
        message: 'Branch deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // Employee Management
  createEmployee = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const employeeData: CreateEmployeeDTO = {
        ...req.body,
        date_of_joining: new Date(req.body.date_of_joining || new Date()),
        is_doctor: Boolean(req.body.is_doctor),
      };
      const createdBy = req.user?.user_uuid || 'SYSTEM';

      const employee = await this.companyService.createEmployee(employeeData, createdBy);

      res.status(201).json({
        success: true,
        data: { employee },
      });
    } catch (error) {
      next(error);
    }
  };

  getEmployeesByCompany = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = parseInt(req.params.companyId);
      const employees = await this.companyService.getEmployeesByCompanyId(companyId);

      res.json({
        success: true,
        data: { employees },
      });
    } catch (error) {
      next(error);
    }
  };

  getDoctorsByBranch = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const branchId = parseInt(req.params.branchId);
      const doctors = await this.companyService.getDoctorsByBranchId(branchId);

      res.json({
        success: true,
        data: { doctors },
      });
    } catch (error) {
      next(error);
    }
  };

  getEmployeeById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const employeeId = parseInt(req.params.id);
      const employee = await this.companyService.getEmployeeById(employeeId);

      if (!employee) {
        res.status(404).json({
          success: false,
          error: {
            message: 'Employee not found',
            code: 'EMPLOYEE_NOT_FOUND',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: { employee },
      });
    } catch (error) {
      next(error);
    }
  };

  updateEmployee = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const employeeId = parseInt(req.params.id);
      const updateData = req.body;
      const updatedBy = req.user?.user_uuid || 'SYSTEM';

      const updated = await this.companyService.updateEmployee(employeeId, updateData, updatedBy);

      if (!updated) {
        res.status(404).json({
          success: false,
          error: {
            message: 'Employee not found or no changes made',
            code: 'UPDATE_FAILED',
          },
        });
        return;
      }

      res.json({
        success: true,
        message: 'Employee updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  deleteEmployee = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const employeeId = parseInt(req.params.id);
      const deletedBy = req.user?.user_uuid || 'SYSTEM';

      const deleted = await this.companyService.deleteEmployee(employeeId, deletedBy);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: {
            message: 'Employee not found',
            code: 'EMPLOYEE_NOT_FOUND',
          },
        });
        return;
      }

      res.json({
        success: true,
        message: 'Employee deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // Company Settings
  getCompanySettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = parseInt(req.params.companyId);
      const settings = await this.companyService.getCompanySettings(companyId);

      res.json({
        success: true,
        data: { settings },
      });
    } catch (error) {
      next(error);
    }
  };

  updateCompanySettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = parseInt(req.params.companyId);
      const settings = req.body;
      const updatedBy = req.user?.user_uuid || 'SYSTEM';

      const result = await this.companyService.updateCompanySettings(companyId, settings, updatedBy);

      res.json({
        success: true,
        message: 'Company settings updated successfully',
        data: { result },
      });
    } catch (error) {
      next(error);
    }
  };
}