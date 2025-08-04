import request from 'supertest';
import { TestServer } from '../setup/test-server';
import { TestDatabase } from '../setup/test-database';

describe('Enhanced Registration API Tests', () => {
  let baseUrl: string;

  beforeAll(async () => {
    const port = await TestServer.start();
    baseUrl = TestServer.getBaseUrl();
  });

  afterAll(async () => {
    await TestServer.stop();
  });

  beforeEach(async () => {
    await TestServer.resetDatabase();
  });

  describe('POST /auth/register-complete', () => {
    const validRegistration = {
      email: 'admin@company.com',
      password: 'Admin@123456',
      first_name: 'John',
      last_name: 'Doe',
      phone: '9876543210',
      designation: 'System Administrator',
      department: 'IT',
      address_line1: '123 Main Street',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      pincode: '10001',
      company_name: 'Test Company Inc',
      company_email: 'info@testcompany.com',
      company_phone: '1234567890',
      is_admin: true
    };

    it('should create complete registration with new company', async () => {
      const response = await request(baseUrl)
        .post('/auth/register-complete')
        .send(validRegistration);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Registration completed successfully');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
      
      // Verify user details
      const user = response.body.data.user;
      expect(user).toHaveProperty('user_id');
      expect(user).toHaveProperty('email', validRegistration.email);
      expect(user).toHaveProperty('employee_name', 'John Doe');
      expect(user).toHaveProperty('role_name', 'Administrator');
      expect(user).toHaveProperty('company_name', validRegistration.company_name);
      expect(user).toHaveProperty('branch_name', 'Default Branch');

      // Verify data was created in all tables
      const db = TestDatabase.getConnection();
      
      // Check company
      const [companies] = await db.query(
        'SELECT * FROM companies WHERE company_name = ?',
        [validRegistration.company_name]
      );
      expect(companies).toHaveLength(1);
      
      // Check branch
      const [branches] = await db.query(
        'SELECT * FROM branches WHERE branch_name = ?',
        ['Default Branch']
      );
      expect(branches).toHaveLength(1);
      
      // Check employee
      const [employees] = await db.query(
        'SELECT * FROM employees WHERE email = ?',
        [validRegistration.email]
      );
      expect(employees).toHaveLength(1);
      
      // Check user
      const [users] = await db.query(
        'SELECT * FROM users WHERE email = ?',
        [validRegistration.email]
      );
      expect(users).toHaveLength(1);
      
      // Check employee_branches
      const [empBranches] = await db.query(
        'SELECT * FROM employee_branches WHERE employee_id = ?',
        [(employees as any[])[0].employee_id]
      );
      expect(empBranches).toHaveLength(1);
      
      // Check admin role permissions
      const [roleMenus] = await db.query(
        'SELECT * FROM role_menus WHERE role_id = ?',
        [(users as any[])[0].role_id]
      );
      expect((roleMenus as any[]).length).toBeGreaterThan(0);
      expect((roleMenus as any[]).every((rm: any) => rm.can_view === 1 && rm.can_create === 1 && rm.can_edit === 1 && rm.can_delete === 1)).toBe(true);
      
      // Check role features
      const [roleFeatures] = await db.query(
        'SELECT * FROM role_features WHERE role_id = ?',
        [(users as any[])[0].role_id]
      );
      expect((roleFeatures as any[]).length).toBeGreaterThan(0);
      expect((roleFeatures as any[]).every((rf: any) => rf.is_active === 1)).toBe(true);
    });

    it('should register under existing company', async () => {
      // First create a company
      const firstReg = await request(baseUrl)
        .post('/auth/register-complete')
        .send(validRegistration);

      const db = TestDatabase.getConnection();
      const [companies] = await db.query(
        'SELECT company_id FROM companies WHERE company_name = ?',
        [validRegistration.company_name]
      );

      // Register another user under same company
      const { company_name, ...regWithoutCompany } = validRegistration;
      const secondReg = {
        ...regWithoutCompany,
        email: 'user2@company.com',
        first_name: 'Jane',
        company_id: (companies as any[])[0].company_id
      };

      const response = await request(baseUrl)
        .post('/auth/register-complete')
        .send(secondReg);

      expect(response.status).toBe(201);
      expect(response.body.data.user.company_name).toBe(validRegistration.company_name);
    });

    it('should not register with existing email', async () => {
      // First registration
      await request(baseUrl)
        .post('/auth/register-complete')
        .send(validRegistration);

      // Try to register with same email
      const response = await request(baseUrl)
        .post('/auth/register-complete')
        .send(validRegistration);

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Email already registered');
    });

    it('should validate required fields', async () => {
      const response = await request(baseUrl)
        .post('/auth/register-complete')
        .send({
          email: 'test@test.com'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });

    it('should validate email format', async () => {
      const response = await request(baseUrl)
        .post('/auth/register-complete')
        .send({
          ...validRegistration,
          email: 'invalid-email'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should validate password complexity', async () => {
      const response = await request(baseUrl)
        .post('/auth/register-complete')
        .send({
          ...validRegistration,
          password: 'weak'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should handle non-existent company_id', async () => {
      const { company_name, ...regWithoutCompany } = validRegistration;
      const response = await request(baseUrl)
        .post('/auth/register-complete')
        .send({
          ...regWithoutCompany,
          company_id: 99999
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Company not found');
    });

    it('should allow login after registration', async () => {
      // Register first
      await request(baseUrl)
        .post('/auth/register-complete')
        .send(validRegistration);

      // Try to login
      const loginResponse = await request(baseUrl)
        .post('/auth/login')
        .send({
          email: validRegistration.email,
          password: validRegistration.password
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty('success', true);
      expect(loginResponse.body.data).toHaveProperty('token');
    });
  });
});