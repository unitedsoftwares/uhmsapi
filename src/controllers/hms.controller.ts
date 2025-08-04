import { Request, Response, NextFunction } from 'express';
import { RoleService } from '../services/role.service';
import { HMSService, BillingService } from '../services/hms.service';
import { PaginationQuery } from '../models/base.model';
import logger from '../utils/logger';

export class RoleController {
  private roleService: RoleService;

  constructor() {
    this.roleService = new RoleService();
  }

  // Role Management
  createRole = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const roleData = req.body;
      const createdBy = req.user?.user_uuid || 'SYSTEM';

      const role = await this.roleService.createRole(roleData, createdBy);

      res.status(201).json({
        success: true,
        data: { role },
      });
    } catch (error) {
      next(error);
    }
  };

  getRoles = async (
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

      const result = await this.roleService.getRoles({}, pagination);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getRoleById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const roleId = parseInt(req.params.id);
      const role = await this.roleService.getRoleById(roleId);

      if (!role) {
        res.status(404).json({
          success: false,
          error: {
            message: 'Role not found',
            code: 'ROLE_NOT_FOUND',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: { role },
      });
    } catch (error) {
      next(error);
    }
  };

  getRolePermissions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const roleId = parseInt(req.params.id);
      const permissions = await this.roleService.getRolePermissions(roleId);

      res.json({
        success: true,
        data: permissions,
      });
    } catch (error) {
      next(error);
    }
  };

  // Menu Management
  createMenu = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const menuData = req.body;
      const createdBy = req.user?.user_uuid || 'SYSTEM';

      const menu = await this.roleService.createMenu(menuData, createdBy);

      res.status(201).json({
        success: true,
        data: { menu },
      });
    } catch (error) {
      next(error);
    }
  };

  getMenuHierarchy = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const hierarchy = await this.roleService.getMenuHierarchy();

      res.json({
        success: true,
        data: { menus: hierarchy },
      });
    } catch (error) {
      next(error);
    }
  };

  // Permission Assignment
  assignMenuToRole = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { roleId, menuId } = req.params;
      const permissions = req.body;
      const createdBy = req.user?.user_uuid || 'SYSTEM';

      const roleMenu = await this.roleService.assignMenuToRole(
        parseInt(roleId),
        parseInt(menuId),
        permissions,
        createdBy
      );

      res.status(201).json({
        success: true,
        data: { roleMenu },
      });
    } catch (error) {
      next(error);
    }
  };
}

export class HMSController {
  private hmsService: HMSService;

  constructor() {
    this.hmsService = new HMSService();
  }

  // Doctor-Branch Mapping
  createDoctorBranchMapping = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const mappingData = req.body;
      const createdBy = req.user?.user_uuid || 'SYSTEM';

      const mapping = await this.hmsService.createDoctorBranchMapping(mappingData, createdBy);

      res.status(201).json({
        success: true,
        data: { mapping },
      });
    } catch (error) {
      next(error);
    }
  };

  getDoctorBranchMappings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const mappings = await this.hmsService.getDoctorBranchMappings(employeeId);

      res.json({
        success: true,
        data: { mappings },
      });
    } catch (error) {
      next(error);
    }
  };

  getBranchDoctorMappings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const branchId = parseInt(req.params.branchId);
      const mappings = await this.hmsService.getBranchDoctorMappings(branchId);

      res.json({
        success: true,
        data: { mappings },
      });
    } catch (error) {
      next(error);
    }
  };

  // Employee File Management
  uploadEmployeeFile = async (
    req: Request & { file?: any },
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const fileData = {
        ...req.body,
        file_path: req.file?.path || req.body.file_path,
        file_name: req.file?.originalname || req.body.file_name,
        file_type: req.file?.mimetype || req.body.file_type,
        file_size: req.file?.size || req.body.file_size,
      };
      const uploadedBy = req.user?.user_uuid || 'SYSTEM';

      const employeeFile = await this.hmsService.uploadEmployeeFile(fileData, uploadedBy);

      res.status(201).json({
        success: true,
        data: { file: employeeFile },
      });
    } catch (error) {
      next(error);
    }
  };

  getEmployeeFiles = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const files = await this.hmsService.getEmployeeFiles(employeeId);

      res.json({
        success: true,
        data: { files },
      });
    } catch (error) {
      next(error);
    }
  };

  // Referral Doctor Management
  createReferralDoctor = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const doctorData = req.body;
      const createdBy = req.user?.user_uuid || 'SYSTEM';

      const doctor = await this.hmsService.createReferralDoctor(doctorData, createdBy);

      res.status(201).json({
        success: true,
        data: { doctor },
      });
    } catch (error) {
      next(error);
    }
  };

  getReferralDoctors = async (
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
      };

      const result = await this.hmsService.getReferralDoctors(filters, pagination);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  searchReferralDoctors = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const name = req.query.name as string;
      if (!name) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Name parameter is required',
            code: 'MISSING_NAME_PARAMETER',
          },
        });
        return;
      }

      const doctors = await this.hmsService.searchReferralDoctorsByName(name);

      res.json({
        success: true,
        data: { doctors },
      });
    } catch (error) {
      next(error);
    }
  };
}

export class BillingController {
  private billingService: BillingService;

  constructor() {
    this.billingService = new BillingService();
  }

  // Plan Management
  createPlan = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const planData = req.body;
      const createdBy = req.user?.user_uuid || 'SYSTEM';

      const plan = await this.billingService.createPlan(planData, createdBy);

      res.status(201).json({
        success: true,
        data: { plan },
      });
    } catch (error) {
      next(error);
    }
  };

  getPlans = async (
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
      };

      const result = await this.billingService.getPlans(filters, pagination);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // Subscription Management
  createSubscription = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const subscriptionData = req.body;
      const createdBy = req.user?.user_uuid || 'SYSTEM';

      const subscription = await this.billingService.createSubscription(subscriptionData, createdBy);

      res.status(201).json({
        success: true,
        data: { subscription },
      });
    } catch (error) {
      next(error);
    }
  };

  getSubscriptionsByCompany = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = parseInt(req.params.companyId);
      const subscriptions = await this.billingService.getSubscriptionsByCompanyId(companyId);

      res.json({
        success: true,
        data: { subscriptions },
      });
    } catch (error) {
      next(error);
    }
  };

  // Invoice Management
  createInvoice = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const invoiceData = req.body;
      const createdBy = req.user?.user_uuid || 'SYSTEM';

      const invoice = await this.billingService.createInvoice(invoiceData, createdBy);

      res.status(201).json({
        success: true,
        data: { invoice },
      });
    } catch (error) {
      next(error);
    }
  };

  getInvoicesByCompany = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = parseInt(req.params.companyId);
      const invoices = await this.billingService.getInvoicesByCompanyId(companyId);

      res.json({
        success: true,
        data: { invoices },
      });
    } catch (error) {
      next(error);
    }
  };

  // Payment Management
  createPayment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const paymentData = req.body;
      const createdBy = req.user?.user_uuid || 'SYSTEM';

      const payment = await this.billingService.createPayment(paymentData, createdBy);

      res.status(201).json({
        success: true,
        data: { payment },
      });
    } catch (error) {
      next(error);
    }
  };

  getPaymentsByInvoice = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const invoiceId = parseInt(req.params.invoiceId);
      const payments = await this.billingService.getPaymentsByInvoiceId(invoiceId);

      res.json({
        success: true,
        data: { payments },
      });
    } catch (error) {
      next(error);
    }
  };
}