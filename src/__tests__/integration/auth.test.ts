import request from 'supertest';
import { TestServer } from '../setup/test-server';
import { TestDatabase } from '../setup/test-database';

describe('Auth API Integration Tests', () => {
  let baseUrl: string;
  let authToken: string;
  let refreshToken: string;
  let userId: number;
  let testCompanyId: number;
  let testRoleId: number;

  beforeAll(async () => {
    const port = await TestServer.start();
    baseUrl = TestServer.getBaseUrl();
  });

  afterAll(async () => {
    await TestServer.stop();
  });

  beforeEach(async () => {
    await TestServer.resetDatabase();
    
    // Get test company and role IDs
    const db = TestDatabase.getConnection();
    const [companies] = await db.query<any[]>('SELECT company_id, is_active FROM companies WHERE company_name = ?', ['Test Hospital']);
    testCompanyId = companies[0]?.company_id || 1;
    
    const [roles] = await db.query<any[]>('SELECT role_id FROM roles WHERE role_name = ?', ['Admin']);
    testRoleId = roles[0]?.role_id || 2;
    
  });

  describe('POST /auth/register', () => {
    let validUser: any;
    
    beforeEach(() => {
      validUser = {
        email: 'newuser@test.com',
        password: 'Test@123456',
        username: 'newuser',
        first_name: 'New',
        last_name: 'User',
        phone: '9876543210',
        company_id: testCompanyId,
        role_id: testRoleId
      };
    });

    it('should register a new user successfully', async () => {
      const response = await request(baseUrl)
        .post('/auth/register')
        .send(validUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('user_id');
      expect(response.body.data.user).toHaveProperty('email', validUser.email);
      expect(response.body.data.user).toHaveProperty('username', validUser.username);
      expect(response.body.data.user).not.toHaveProperty('password');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');

      userId = response.body.data.user.user_id;
    });

    it('should not register user with existing email', async () => {
      // Register first user
      await request(baseUrl)
        .post('/auth/register')
        .send(validUser);

      // Try to register with same email
      const response = await request(baseUrl)
        .post('/auth/register')
        .send(validUser);

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });

    it('should not register user with existing username', async () => {
      // Register first user
      await request(baseUrl)
        .post('/auth/register')
        .send(validUser);

      // Try to register with same username but different email
      const response = await request(baseUrl)
        .post('/auth/register')
        .send({
          ...validUser,
          email: 'different@test.com'
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should validate required fields', async () => {
      const response = await request(baseUrl)
        .post('/auth/register')
        .send({
          email: 'test@test.com'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });

    it('should validate email format', async () => {
      const response = await request(baseUrl)
        .post('/auth/register')
        .send({
          ...validUser,
          email: 'invalid-email'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should validate password complexity', async () => {
      const response = await request(baseUrl)
        .post('/auth/register')
        .send({
          ...validUser,
          password: 'weak'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should validate phone number format', async () => {
      const response = await request(baseUrl)
        .post('/auth/register')
        .send({
          ...validUser,
          phone: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /auth/login', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = {
        email: 'testlogin@test.com',
        password: 'Test@123456',
        username: 'testlogin',
        first_name: 'Test',
        last_name: 'Login',
        phone: '9876543210',
        company_id: testCompanyId,
        role_id: testRoleId
      };

      // Register a user for login tests
      const response = await request(baseUrl)
        .post('/auth/register')
        .send(testUser);
      
      if (response.body.data?.user?.id) {
        userId = response.body.data.user.id;
      }
    });

    it('should login with valid email and password', async () => {
      const response = await request(baseUrl)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user).not.toHaveProperty('password');

      authToken = response.body.data.token;
      refreshToken = response.body.data.refreshToken;
    });

    it('should login with valid username and password', async () => {
      const response = await request(baseUrl)
        .post('/auth/login')
        .send({
          email: testUser.username,
          password: testUser.password
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should not login with invalid password', async () => {
      const response = await request(baseUrl)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should not login with non-existent email', async () => {
      const response = await request(baseUrl)
        .post('/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'Test@123456'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should validate required fields', async () => {
      const response = await request(baseUrl)
        .post('/auth/login')
        .send({
          email: testUser.email
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should handle inactive users', async () => {
      // Update user to inactive status
      const db = TestDatabase.getConnection();
      await db.query('UPDATE users SET status = ? WHERE id = ?', ['inactive', userId]);

      const response = await request(baseUrl)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /auth/refresh-token', () => {
    beforeEach(async () => {
      // Register and login to get tokens
      const registerResponse = await request(baseUrl)
        .post('/auth/register')
        .send({
          email: 'refresh@test.com',
          password: 'Test@123456',
          username: 'refreshuser',
          first_name: 'Refresh',
          last_name: 'User',
          phone: '9876543210',
          company_id: testCompanyId,
          role_id: testRoleId
        });

      if (registerResponse.body.data) {
        authToken = registerResponse.body.data.token;
        refreshToken = registerResponse.body.data.refreshToken;
        userId = registerResponse.body.data.user?.id;
      }
    });

    it('should refresh token with valid refresh token', async () => {
      const response = await request(baseUrl)
        .post('/auth/refresh-token')
        .send({
          refreshToken: refreshToken
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.token).not.toBe(authToken);
    });

    it('should not refresh with invalid refresh token', async () => {
      const response = await request(baseUrl)
        .post('/auth/refresh-token')
        .send({
          refreshToken: 'invalid-refresh-token'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should not refresh with missing refresh token', async () => {
      const response = await request(baseUrl)
        .post('/auth/refresh-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should not refresh token for inactive user', async () => {
      // Update user to inactive
      const db = TestDatabase.getConnection();
      await db.query('UPDATE users SET status = ? WHERE id = ?', ['inactive', userId]);

      const response = await request(baseUrl)
        .post('/auth/refresh-token')
        .send({
          refreshToken: refreshToken
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(baseUrl)
        .post('/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Logged out successfully');
    });
  });

  describe('GET /auth/profile', () => {
    beforeEach(async () => {
      // Register user for profile tests
      const registerResponse = await request(baseUrl)
        .post('/auth/register')
        .send({
          email: 'profile@test.com',
          password: 'Test@123456',
          username: 'profileuser',
          first_name: 'Profile',
          last_name: 'User',
          phone: '9876543210',
          company_id: testCompanyId,
          role_id: testRoleId
        });

      if (registerResponse.body.data) {
        authToken = registerResponse.body.data.token;
        userId = registerResponse.body.data.user?.id;
      }
    });

    it('should get user profile with valid token', async () => {
      const response = await request(baseUrl)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', userId);
      expect(response.body.data).toHaveProperty('email', 'profile@test.com');
      expect(response.body.data).toHaveProperty('username', 'profileuser');
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should not get profile without token', async () => {
      const response = await request(baseUrl)
        .get('/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should not get profile with invalid token', async () => {
      const response = await request(baseUrl)
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should not get profile with expired token', async () => {
      // Generate an expired token
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { userId: userId },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' }
      );

      const response = await request(baseUrl)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('PATCH /auth/profile', () => {
    beforeEach(async () => {
      const registerResponse = await request(baseUrl)
        .post('/auth/register')
        .send({
          email: 'update@test.com',
          password: 'Test@123456',
          username: 'updateuser',
          first_name: 'Update',
          last_name: 'User',
          phone: '9876543210',
          company_id: testCompanyId,
          role_id: testRoleId
        });

      if (registerResponse.body.data) {
        authToken = registerResponse.body.data.token;
        userId = registerResponse.body.data.user?.id;
      }
    });

    it('should update user profile successfully', async () => {
      const updateData = {
        first_name: 'Updated',
        last_name: 'Name',
        phone: '9999999999'
      };

      const response = await request(baseUrl)
        .patch('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Profile updated successfully');
      expect(response.body.data).toHaveProperty('first_name', 'Updated');
      expect(response.body.data).toHaveProperty('last_name', 'Name');
      expect(response.body.data).toHaveProperty('phone', '9999999999');
    });

    it('should not update email or username', async () => {
      const response = await request(baseUrl)
        .patch('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'newemail@test.com',
          username: 'newusername'
        });

      expect(response.status).toBe(200);
      
      // Verify email and username didn't change
      const profileResponse = await request(baseUrl)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(profileResponse.body.data.email).toBe('update@test.com');
      expect(profileResponse.body.data.username).toBe('updateuser');
    });

    it('should validate phone number format', async () => {
      const response = await request(baseUrl)
        .patch('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          phone: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should not update profile without authentication', async () => {
      const response = await request(baseUrl)
        .patch('/auth/profile')
        .send({
          first_name: 'Updated'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /auth/change-password', () => {
    const originalPassword = 'Test@123456';
    const newPassword = 'NewTest@123456';

    beforeEach(async () => {
      const registerResponse = await request(baseUrl)
        .post('/auth/register')
        .send({
          email: 'changepass@test.com',
          password: originalPassword,
          username: 'changepassuser',
          first_name: 'Change',
          last_name: 'Password',
          phone: '9876543210',
          company_id: testCompanyId,
          role_id: testRoleId
        });

      if (registerResponse.body.data) {
        authToken = registerResponse.body.data.token;
        userId = registerResponse.body.data.user?.id;
      }
    });

    it('should change password successfully', async () => {
      const response = await request(baseUrl)
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: originalPassword,
          newPassword: newPassword
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Password changed successfully');

      // Verify can login with new password
      const loginResponse = await request(baseUrl)
        .post('/auth/login')
        .send({
          email: 'changepass@test.com',
          password: newPassword
        });

      expect(loginResponse.status).toBe(200);
    });

    it('should not change password with incorrect current password', async () => {
      const response = await request(baseUrl)
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'WrongPassword@123',
          newPassword: newPassword
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Current password is incorrect');
    });

    it('should validate new password complexity', async () => {
      const response = await request(baseUrl)
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: originalPassword,
          newPassword: 'weak'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should not allow same password', async () => {
      const response = await request(baseUrl)
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: originalPassword,
          newPassword: originalPassword
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      const errorMsg = response.body.errors?.find((e: any) => e.field === 'newPassword')?.message || response.body.message;
      expect(errorMsg).toContain('New password must be different from current password');
    });

    it('should require authentication', async () => {
      const response = await request(baseUrl)
        .post('/auth/change-password')
        .send({
          currentPassword: originalPassword,
          newPassword: newPassword
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should validate required fields', async () => {
      const response = await request(baseUrl)
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: originalPassword
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Token Validation Edge Cases', () => {
    beforeEach(async () => {
      const registerResponse = await request(baseUrl)
        .post('/auth/register')
        .send({
          email: 'token@test.com',
          password: 'Test@123456',
          username: 'tokenuser',
          first_name: 'Token',
          last_name: 'User',
          phone: '9876543210',
          company_id: testCompanyId,
          role_id: testRoleId
        });

      if (registerResponse.body.data) {
        authToken = registerResponse.body.data.token;
        userId = registerResponse.body.data.user?.id;
      }
    });

    it('should handle malformed authorization header', async () => {
      const response = await request(baseUrl)
        .get('/auth/profile')
        .set('Authorization', 'InvalidFormat');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should handle token for deleted user', async () => {
      // Delete the user
      const db = TestDatabase.getConnection();
      await db.query('DELETE FROM users WHERE id = ?', [userId]);

      const response = await request(baseUrl)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });
  });
});