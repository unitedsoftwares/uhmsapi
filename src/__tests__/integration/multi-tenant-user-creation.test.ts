import request from 'supertest';
import { app } from '../../app';
import { TestDatabase } from '../setup/test-database';

describe('Multi-Tenant User Creation', () => {
  let adminToken: string;
  let companyId: number;

  beforeAll(async () => {
    await TestDatabase.setup();
    await TestDatabase.seedTestData();
  });

  afterAll(async () => {
    await TestDatabase.cleanup();
  });

  beforeEach(async () => {
    await TestDatabase.clearTables();
    await TestDatabase.seedTestData();
  });

  beforeEach(async () => {
    // First, register a company admin
    const adminRegistration = {
      username: 'admin123',
      email: 'admin@testcompany.com',
      password: 'password123',
      first_name: 'Admin',
      last_name: 'User',
      phone: '9876543210',
      company_name: 'Test Company'
    };

    const adminResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(adminRegistration)
      .expect(201);

    adminToken = adminResponse.body.data.token;
    companyId = adminResponse.body.data.user.company_id;
  });

  describe('POST /auth/register-user', () => {
    it('should create a new user under the admin\'s company', async () => {
      const newUserData = {
        username: 'employee123',
        email: 'employee@testcompany.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Employee',
        phone: '9876543211',
        role_id: 1
      };

      const response = await request(app)
        .post('/api/v1/auth/register-user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUserData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully under your company');
      expect(response.body.data.user.email).toBe(newUserData.email);
      expect(response.body.data.user.company_id).toBe(companyId);
    });

    it('should fail when not authenticated', async () => {
      const newUserData = {
        username: 'employee123',
        email: 'employee@testcompany.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Employee',
        phone: '9876543211',
        role_id: 1
      };

      await request(app)
        .post('/api/v1/auth/register-user')
        .send(newUserData)
        .expect(401);
    });

    it('should fail with duplicate email', async () => {
      const newUserData = {
        username: 'employee123',
        email: 'admin@testcompany.com', // Same as admin email
        password: 'password123',
        first_name: 'John',
        last_name: 'Employee',
        phone: '9876543211',
        role_id: 1
      };

      const response = await request(app)
        .post('/api/v1/auth/register-user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUserData)
        .expect(409);

      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid data', async () => {
      const invalidUserData = {
        username: 'ab', // Too short
        email: 'invalid-email',
        password: '123', // Too short
        first_name: '',
        last_name: '',
        phone: '123', // Invalid format
        role_id: 1
      };

      await request(app)
        .post('/api/v1/auth/register-user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidUserData)
        .expect(400);
    });
  });

  describe('Multi-tenant isolation', () => {
    it('should only show users from the same company', async () => {
      // Create a user under the admin's company
      const newUserData = {
        username: 'employee123',
        email: 'employee@testcompany.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Employee',
        phone: '9876543211',
        role_id: 1
      };

      await request(app)
        .post('/api/v1/auth/register-user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUserData)
        .expect(201);

      // Get all users - should only return users from the same company
      const usersResponse = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(usersResponse.body.success).toBe(true);
      expect(Array.isArray(usersResponse.body.data)).toBe(true);
      
      // All users should belong to the same company
      usersResponse.body.data.forEach((user: any) => {
        expect(user.company_id).toBe(companyId);
      });
    });
  });
});