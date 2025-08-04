import { Router } from 'express';
import { RoleController, HMSController, BillingController } from '../controllers/hms.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();
const roleController = new RoleController();
const hmsController = new HMSController();
const billingController = new BillingController();

// All routes require authentication
router.use(authenticate);

// Role Management Routes
router.post('/roles', roleController.createRole);
router.get('/roles', roleController.getRoles);
router.get('/roles/:id', roleController.getRoleById);
router.get('/roles/:id/permissions', roleController.getRolePermissions);

// Menu Management Routes
router.post('/menus', roleController.createMenu);
router.get('/menus/hierarchy', roleController.getMenuHierarchy);

// Permission Assignment Routes
router.post('/roles/:roleId/menus/:menuId', roleController.assignMenuToRole);

// Doctor-Branch Mapping Routes
router.post('/doctor-branch-mappings', hmsController.createDoctorBranchMapping);
router.get('/employees/:employeeId/branch-mappings', hmsController.getDoctorBranchMappings);
router.get('/branches/:branchId/doctor-mappings', hmsController.getBranchDoctorMappings);

// Employee File Management Routes
router.post('/employees/:employeeId/files', hmsController.uploadEmployeeFile);
router.get('/employees/:employeeId/files', hmsController.getEmployeeFiles);

// Referral Doctor Management Routes
router.post('/referral-doctors', hmsController.createReferralDoctor);
router.get('/referral-doctors', hmsController.getReferralDoctors);
router.get('/referral-doctors/search', hmsController.searchReferralDoctors);

// Plan Management Routes
router.post('/plans', billingController.createPlan);
router.get('/plans', billingController.getPlans);

// Subscription Management Routes
router.post('/subscriptions', billingController.createSubscription);
router.get('/companies/:companyId/subscriptions', billingController.getSubscriptionsByCompany);

// Invoice Management Routes
router.post('/invoices', billingController.createInvoice);
router.get('/companies/:companyId/invoices', billingController.getInvoicesByCompany);

// Payment Management Routes
router.post('/payments', billingController.createPayment);
router.get('/invoices/:invoiceId/payments', billingController.getPaymentsByInvoice);

export default router;