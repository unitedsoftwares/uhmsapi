import { Router } from 'express';
import { CompanyController } from '../controllers/company.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();
const companyController = new CompanyController();

// All routes require authentication
router.use(authenticate);

// Company Management Routes
router.post('/companies', companyController.createCompany);
router.get('/companies', companyController.getCompanies);
router.get('/companies/:id', companyController.getCompanyById);
router.put('/companies/:id', companyController.updateCompany);
router.delete('/companies/:id', companyController.deleteCompany);
router.get('/companies/:id/stats', companyController.getCompanyStats);

// Branch Management Routes
router.post('/branches', companyController.createBranch);
router.get('/companies/:companyId/branches', companyController.getBranchesByCompany);
router.get('/branches/:id', companyController.getBranchById);
router.put('/branches/:id', companyController.updateBranch);
router.delete('/branches/:id', companyController.deleteBranch);

// Employee Management Routes
router.post('/employees', companyController.createEmployee);
router.get('/companies/:companyId/employees', companyController.getEmployeesByCompany);
router.get('/branches/:branchId/doctors', companyController.getDoctorsByBranch);
router.get('/employees/:id', companyController.getEmployeeById);
router.put('/employees/:id', companyController.updateEmployee);
router.delete('/employees/:id', companyController.deleteEmployee);

// Company Settings Routes
router.get('/companies/:companyId/settings', companyController.getCompanySettings);
router.put('/companies/:companyId/settings', companyController.updateCompanySettings);

export default router;