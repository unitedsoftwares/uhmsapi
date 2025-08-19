import request from 'supertest';
import { app } from '../../app';
import { TestDatabase } from '../setup/test-database';

describe('User Management API', () => {
  let authToken: string;
  let testUserId: number;

  beforeAll(async () => {
    await TestDatabase.setup();
    await TestDatabase.seedTestData();
    
    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'Test123!@#'
      });
    
    authToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    await TestDatabase.cleanup();
  });

  describe('POST /users', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@test.com',
        phone: '9876543210',
        password: 'Test123!@#',
        username: 'johndoe',
        company_name: 'Test Company'
      };

      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(userData.email);
      expect(response.body.data.first_name).toBe(userData.first_name);
      
      testUserId = response.body.data.user_id;
    });

    it('should return error for duplicate email', async () => {
      const userData = {
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'john.doe@test.com', // Same email as above
        phone: '9876543211',
        password: 'Test123!@#',
        username: 'janedoe',
        company_name: 'Test Company 2'
      };

      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Email already registered');
    });
  });

  describe('GET /users', () => {
    it('should get all users', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /users/:id', () => {
    it('should get user by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user_id).toBe(testUserId);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/v1/users/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /users/:id', () => {
    it('should update user successfully', async () => {
      const updateData = {
        first_name: 'John Updated',
        phone: '9876543299'
      };

      const response = await request(app)
        .patch(`/api/v1/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.employee.first_name).toBe(updateData.first_name);
    });
  });

  describe('PATCH /users/:id/status', () => {
    it('should update user status', async () => {
      const response = await request(app)
        .patch(`/api/v1/users/${testUserId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'inactive' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('inactive');
    });
  });

  describe('GET /roles', () => {
    it('should get all roles', async () => {
      const response = await request(app)
        .get('/api/v1/roles')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete user successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });
  });
});