import { generateToken, verifyToken, extractTokenFromHeader } from './jwt.utils';
import { config } from '../config';
import { UnauthorizedError } from '../errors/AppError';

// Mock config
jest.mock('../config', () => ({
  config: {
    jwt: {
      accessTokenSecret: 'test-access-secret',
      refreshTokenSecret: 'test-refresh-secret',
      accessTokenExpiry: '15m',
      refreshTokenExpiry: '7d',
      issuer: 'test-issuer',
      audience: 'test-audience',
    },
  },
}));

describe('JWT Utils', () => {
  const testPayload = {
    userId: 123,
    email: 'test@example.com',
    roleId: 1,
    companyId: 1,
    user_id: 123,
    user_uuid: 'test-uuid',
    employee_id: 456,
    employee_uuid: 'emp-uuid',
    role_id: 1,
    role_name: 'admin',
    company_id: 1,
    company_name: 'Test Company',
    branch_id: 1,
    branch_name: 'Test Branch',
    employee_name: 'Test Employee',
    is_doctor: false,
  };

  describe('generateToken', () => {
    it('should generate access token', () => {
      const token = generateToken(testPayload, 'access');
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should generate refresh token', () => {
      const token = generateToken(testPayload, 'refresh');
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

  });

  describe('verifyToken', () => {
    it('should verify valid access token', () => {
      const token = generateToken(testPayload, 'access');
      const decoded = verifyToken(token, 'access');
      
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
    });

    it('should verify valid refresh token', () => {
      const token = generateToken(testPayload, 'refresh');
      const decoded = verifyToken(token, 'refresh');
      
      expect(decoded.userId).toBe(testPayload.userId);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyToken('invalid.token.here', 'access')).toThrow('Invalid token');
    });

    it('should throw error for wrong token type', () => {
      const accessToken = generateToken(testPayload, 'access');
      expect(() => verifyToken(accessToken, 'refresh')).toThrow('Invalid token');
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const token = extractTokenFromHeader('Bearer eyJhbGciOiJIUzI1NiIs...');
      expect(token).toBe('eyJhbGciOiJIUzI1NiIs...');
    });

    it('should throw error for missing header', () => {
      expect(() => extractTokenFromHeader(undefined)).toThrow('No token provided');
      expect(() => extractTokenFromHeader('')).toThrow('No token provided');
    });

    it('should throw error for invalid format', () => {
      expect(() => extractTokenFromHeader('InvalidFormat')).toThrow('No token provided');
      expect(() => extractTokenFromHeader('Basic auth')).toThrow('No token provided');
      expect(() => extractTokenFromHeader('Bearer')).toThrow('No token provided');
    });
  });
});