import { 
  DoctorBranchMappingRepository,
  EmployeeFileRepository,
  EmployeeBranchRepository,
  PlanRepository,
  SubscriptionRepository,
  InvoiceRepository,
  PaymentRepository,
  ReferralDoctorRepository,
  EmployeeRepository,
  BranchRepository
} from '../repositories/user.repository';
import { 
  DoctorBranchMapping,
  EmployeeFile,
  EmployeeBranch,
  Plan,
  Subscription,
  Invoice,
  Payment,
  ReferralDoctor
} from '../models/user.model';
import { PaginationQuery, PaginatedResponse } from '../models/base.model';
import { 
  ConflictError, 
  NotFoundError,
  ValidationError 
} from '../errors/AppError';
import logger from '../utils/logger';

export class HMSService {
  private doctorBranchMappingRepository: DoctorBranchMappingRepository;
  private employeeFileRepository: EmployeeFileRepository;
  private employeeBranchRepository: EmployeeBranchRepository;
  private planRepository: PlanRepository;
  private subscriptionRepository: SubscriptionRepository;
  private invoiceRepository: InvoiceRepository;
  private paymentRepository: PaymentRepository;
  private referralDoctorRepository: ReferralDoctorRepository;
  private employeeRepository: EmployeeRepository;
  private branchRepository: BranchRepository;

  constructor() {
    this.doctorBranchMappingRepository = new DoctorBranchMappingRepository();
    this.employeeFileRepository = new EmployeeFileRepository();
    this.employeeBranchRepository = new EmployeeBranchRepository();
    this.planRepository = new PlanRepository();
    this.subscriptionRepository = new SubscriptionRepository();
    this.invoiceRepository = new InvoiceRepository();
    this.paymentRepository = new PaymentRepository();
    this.referralDoctorRepository = new ReferralDoctorRepository();
    this.employeeRepository = new EmployeeRepository();
    this.branchRepository = new BranchRepository();
  }

  // Doctor-Branch Mapping Management
  async createDoctorBranchMapping(
    data: Partial<DoctorBranchMapping>,
    createdBy: string
  ): Promise<DoctorBranchMapping> {
    if (!data.employee_id || !data.branch_id) {
      throw new ValidationError('Employee ID and Branch ID are required');
    }

    // Verify employee exists and is a doctor
    const employee = await this.employeeRepository.findByPrimaryKey(data.employee_id);
    if (!employee) {
      throw new NotFoundError('Employee not found');
    }
    if (!employee.is_doctor) {
      throw new ValidationError('Employee must be a doctor');
    }

    // Verify branch exists
    const branch = await this.branchRepository.findByPrimaryKey(data.branch_id);
    if (!branch) {
      throw new NotFoundError('Branch not found');
    }

    const mapping = await this.doctorBranchMappingRepository.create({
      ...data,
      morning_active: data.morning_active || false,
      afternoon_active: data.afternoon_active || false,
      evening_active: data.evening_active || false,
      days: data.days || 'Mon,Tue,Wed,Thu,Fri',
    }, createdBy);

    logger.info('Doctor-branch mapping created successfully', { 
      mappingId: mapping.doctor_branch_id,
      employeeId: mapping.employee_id,
      branchId: mapping.branch_id
    });

    return mapping;
  }

  async getDoctorBranchMappings(employeeId: number): Promise<DoctorBranchMapping[]> {
    return await this.doctorBranchMappingRepository.findByEmployeeId(employeeId);
  }

  async getBranchDoctorMappings(branchId: number): Promise<DoctorBranchMapping[]> {
    return await this.doctorBranchMappingRepository.findByBranchId(branchId);
  }

  async updateDoctorBranchMapping(
    mappingId: number,
    data: Partial<DoctorBranchMapping>,
    updatedBy: string
  ): Promise<boolean> {
    const mapping = await this.doctorBranchMappingRepository.findByPrimaryKey(mappingId);
    if (!mapping) {
      throw new NotFoundError('Doctor-branch mapping not found');
    }

    const updated = await this.doctorBranchMappingRepository.update(mappingId, data, updatedBy);

    if (updated) {
      logger.info('Doctor-branch mapping updated successfully', { mappingId });
    }

    return updated;
  }

  async deleteDoctorBranchMapping(mappingId: number, deletedBy: string): Promise<boolean> {
    const mapping = await this.doctorBranchMappingRepository.findByPrimaryKey(mappingId);
    if (!mapping) {
      throw new NotFoundError('Doctor-branch mapping not found');
    }

    const deleted = await this.doctorBranchMappingRepository.softDelete(mappingId, deletedBy);

    if (deleted) {
      logger.info('Doctor-branch mapping deleted successfully', { mappingId });
    }

    return deleted;
  }

  // Employee File Management
  async uploadEmployeeFile(
    data: Partial<EmployeeFile>,
    uploadedBy: string
  ): Promise<EmployeeFile> {
    if (!data.employee_id || !data.file_name || !data.file_path || !data.content_category) {
      throw new ValidationError('Employee ID, file name, file path, and content category are required');
    }

    // Verify employee exists
    const employee = await this.employeeRepository.findByPrimaryKey(data.employee_id);
    if (!employee) {
      throw new NotFoundError('Employee not found');
    }

    const employeeFile = await this.employeeFileRepository.create({
      ...data,
      uploaded_by: uploadedBy,
      uploaded_at: new Date(),
    }, uploadedBy);

    logger.info('Employee file uploaded successfully', { 
      fileId: employeeFile.id,
      employeeId: employeeFile.employee_id,
      fileName: employeeFile.file_name
    });

    return employeeFile;
  }

  async getEmployeeFiles(employeeId: number): Promise<EmployeeFile[]> {
    return await this.employeeFileRepository.findByEmployeeId(employeeId);
  }

  async deleteEmployeeFile(fileId: number): Promise<boolean> {
    const file = await this.employeeFileRepository.findByPrimaryKey(fileId);
    if (!file) {
      throw new NotFoundError('Employee file not found');
    }

    const deleted = await this.employeeFileRepository.hardDelete(fileId);

    if (deleted) {
      logger.info('Employee file deleted successfully', { fileId });
    }

    return deleted;
  }

  // Employee-Branch Access Management
  async grantEmployeeBranchAccess(
    employeeId: number,
    branchId: number,
    createdBy: string
  ): Promise<EmployeeBranch> {
    // Verify employee and branch exist
    const employee = await this.employeeRepository.findByPrimaryKey(employeeId);
    if (!employee) {
      throw new NotFoundError('Employee not found');
    }

    const branch = await this.branchRepository.findByPrimaryKey(branchId);
    if (!branch) {
      throw new NotFoundError('Branch not found');
    }

    const employeeBranch = await this.employeeBranchRepository.create({
      employee_id: employeeId,
      branch_id: branchId,
      is_active: true,
    }, createdBy);

    logger.info('Employee branch access granted successfully', { 
      employeeId,
      branchId
    });

    return employeeBranch;
  }

  async getEmployeeBranchAccess(employeeId: number): Promise<EmployeeBranch[]> {
    return await this.employeeBranchRepository.findByEmployeeId(employeeId);
  }

  // Referral Doctor Management
  async createReferralDoctor(
    data: Partial<ReferralDoctor>,
    createdBy: string
  ): Promise<ReferralDoctor> {
    if (!data.name) {
      throw new ValidationError('Doctor name is required');
    }

    const referralDoctor = await this.referralDoctorRepository.create(data, createdBy);

    logger.info('Referral doctor created successfully', { 
      doctorId: referralDoctor.id,
      doctorName: referralDoctor.name
    });

    return referralDoctor;
  }

  async getReferralDoctors(
    filters: Partial<ReferralDoctor> = {},
    pagination?: PaginationQuery
  ): Promise<PaginatedResponse<ReferralDoctor>> {
    return await this.referralDoctorRepository.findAll(filters, pagination);
  }

  async searchReferralDoctorsByName(name: string): Promise<ReferralDoctor[]> {
    return await this.referralDoctorRepository.findByName(name);
  }

  async updateReferralDoctor(
    doctorId: number,
    data: Partial<ReferralDoctor>,
    updatedBy: string
  ): Promise<boolean> {
    const doctor = await this.referralDoctorRepository.findByPrimaryKey(doctorId);
    if (!doctor) {
      throw new NotFoundError('Referral doctor not found');
    }

    const updated = await this.referralDoctorRepository.update(doctorId, data, updatedBy);

    if (updated) {
      logger.info('Referral doctor updated successfully', { doctorId });
    }

    return updated;
  }

  async deleteReferralDoctor(doctorId: number, deletedBy: string): Promise<boolean> {
    const doctor = await this.referralDoctorRepository.findByPrimaryKey(doctorId);
    if (!doctor) {
      throw new NotFoundError('Referral doctor not found');
    }

    const deleted = await this.referralDoctorRepository.softDelete(doctorId, deletedBy);

    if (deleted) {
      logger.info('Referral doctor deleted successfully', { doctorId });
    }

    return deleted;
  }
}

export class BillingService {
  private planRepository: PlanRepository;
  private subscriptionRepository: SubscriptionRepository;
  private invoiceRepository: InvoiceRepository;
  private paymentRepository: PaymentRepository;

  constructor() {
    this.planRepository = new PlanRepository();
    this.subscriptionRepository = new SubscriptionRepository();
    this.invoiceRepository = new InvoiceRepository();
    this.paymentRepository = new PaymentRepository();
  }

  // Plan Management
  async createPlan(data: Partial<Plan>, createdBy: string): Promise<Plan> {
    if (!data.plan_name || !data.price || !data.billing_cycle) {
      throw new ValidationError('Plan name, price, and billing cycle are required');
    }

    // Check if plan with same name already exists
    const existingPlan = await this.planRepository.findByName(data.plan_name);
    if (existingPlan) {
      throw new ConflictError('Plan with this name already exists');
    }

    const plan = await this.planRepository.create({
      ...data,
      max_users: data.max_users || 0,
      max_branches: data.max_branches || 0,
      api_access: data.api_access || false,
      support_level: data.support_level || 'basic',
    }, createdBy);

    logger.info('Plan created successfully', { 
      planId: plan.plan_id,
      planName: plan.plan_name
    });

    return plan;
  }

  async getPlans(
    filters: Partial<Plan> = {},
    pagination?: PaginationQuery
  ): Promise<PaginatedResponse<Plan>> {
    return await this.planRepository.findAll(filters, pagination);
  }

  async getPlanById(planId: number): Promise<Plan | null> {
    return await this.planRepository.findByPrimaryKey(planId);
  }

  async updatePlan(
    planId: number,
    data: Partial<Plan>,
    updatedBy: string
  ): Promise<boolean> {
    const plan = await this.planRepository.findByPrimaryKey(planId);
    if (!plan) {
      throw new NotFoundError('Plan not found');
    }

    const updated = await this.planRepository.update(planId, data, updatedBy);

    if (updated) {
      logger.info('Plan updated successfully', { planId });
    }

    return updated;
  }

  // Subscription Management
  async createSubscription(
    data: Partial<Subscription>,
    createdBy: string
  ): Promise<Subscription> {
    if (!data.company_id || !data.plan_id || !data.price || !data.start_date) {
      throw new ValidationError('Company ID, plan ID, price, and start date are required');
    }

    // Verify plan exists
    const plan = await this.planRepository.findByPrimaryKey(data.plan_id);
    if (!plan) {
      throw new NotFoundError('Plan not found');
    }

    const subscription = await this.subscriptionRepository.create({
      ...data,
      auto_renew: data.auto_renew !== undefined ? data.auto_renew : true,
    }, createdBy);

    logger.info('Subscription created successfully', { 
      subscriptionId: subscription.subscription_id,
      companyId: subscription.company_id,
      planId: subscription.plan_id
    });

    return subscription;
  }

  async getSubscriptionsByCompanyId(companyId: number): Promise<Subscription[]> {
    return await this.subscriptionRepository.findByCompanyId(companyId);
  }

  async getSubscriptionById(subscriptionId: number): Promise<Subscription | null> {
    return await this.subscriptionRepository.findByPrimaryKey(subscriptionId);
  }

  // Invoice Management
  async createInvoice(
    data: Partial<Invoice>,
    createdBy: string
  ): Promise<Invoice> {
    if (!data.invoice_number || !data.subscription_id || !data.company_id || 
        !data.invoice_date || !data.due_date || !data.total_amount) {
      throw new ValidationError('Invoice number, subscription ID, company ID, dates, and total amount are required');
    }

    // Check if invoice number already exists
    const existingInvoice = await this.invoiceRepository.findByInvoiceNumber(data.invoice_number);
    if (existingInvoice) {
      throw new ConflictError('Invoice with this number already exists');
    }

    const invoice = await this.invoiceRepository.create({
      ...data,
      paid_amount: data.paid_amount || 0,
      status: data.status || 'pending',
    }, createdBy);

    logger.info('Invoice created successfully', { 
      invoiceId: invoice.invoice_id,
      invoiceNumber: invoice.invoice_number,
      companyId: invoice.company_id
    });

    return invoice;
  }

  async getInvoicesByCompanyId(companyId: number): Promise<Invoice[]> {
    return await this.invoiceRepository.findByCompanyId(companyId);
  }

  async getInvoiceById(invoiceId: number): Promise<Invoice | null> {
    return await this.invoiceRepository.findByPrimaryKey(invoiceId);
  }

  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | null> {
    return await this.invoiceRepository.findByInvoiceNumber(invoiceNumber);
  }

  // Payment Management
  async createPayment(
    data: Partial<Payment>,
    createdBy: string
  ): Promise<Payment> {
    if (!data.invoice_id || !data.company_id || !data.payment_date || !data.amount_paid) {
      throw new ValidationError('Invoice ID, company ID, payment date, and amount are required');
    }

    // Verify invoice exists
    const invoice = await this.invoiceRepository.findByPrimaryKey(data.invoice_id);
    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    const payment = await this.paymentRepository.create(data, createdBy);

    // Update invoice paid amount
    const newPaidAmount = invoice.paid_amount + data.amount_paid;
    const invoiceStatus = newPaidAmount >= invoice.total_amount ? 'paid' : 'pending';
    
    await this.invoiceRepository.update(
      data.invoice_id,
      { 
        paid_amount: newPaidAmount,
        status: invoiceStatus
      },
      createdBy
    );

    logger.info('Payment created successfully', { 
      paymentId: payment.payment_id,
      invoiceId: payment.invoice_id,
      amount: payment.amount_paid
    });

    return payment;
  }

  async getPaymentsByInvoiceId(invoiceId: number): Promise<Payment[]> {
    return await this.paymentRepository.findByInvoiceId(invoiceId);
  }

  async getPaymentById(paymentId: number): Promise<Payment | null> {
    return await this.paymentRepository.findByPrimaryKey(paymentId);
  }
}