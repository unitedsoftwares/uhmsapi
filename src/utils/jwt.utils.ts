import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';
import { TokenPayload } from '../models/user.model';
import { UnauthorizedError } from '../errors/AppError';

export const generateToken = (
  payload: Omit<TokenPayload, 'iat' | 'exp' | 'iss' | 'aud'>,
  type: 'access' | 'refresh'
): string => {
  const secret = type === 'access' 
    ? config.jwt.accessTokenSecret 
    : config.jwt.refreshTokenSecret;
    
  const expiresIn = type === 'access' 
    ? config.jwt.accessTokenExpiry 
    : config.jwt.refreshTokenExpiry;

  return jwt.sign(
    payload,
    secret,
    {
      expiresIn: expiresIn,
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    } as SignOptions
  );
};

export const verifyToken = (token: string, type: 'access' | 'refresh'): TokenPayload => {
  try {
    const secret = type === 'access' 
      ? config.jwt.accessTokenSecret 
      : config.jwt.refreshTokenSecret;

    const decoded = jwt.verify(token, secret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    }) as TokenPayload;

    // Token type validation is handled by using different secrets for access and refresh tokens

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid token');
    }
    throw error;
  }
};

export const generateAccessToken = (userId: number, username: string): string => {
  // Legacy function for backward compatibility - should be deprecated
  const payload: Omit<TokenPayload, 'iat' | 'exp' | 'iss' | 'aud'> = {
    userId: userId,
    email: username,
    roleId: 0,
    companyId: 0,
    user_id: userId,
    user_uuid: '',
    employee_id: 0,
    employee_uuid: '',
    role_id: 0,
    role_name: '',
    company_id: 0,
    company_name: '',
    branch_id: undefined,
    branch_name: undefined,
    employee_name: '',
    is_doctor: false,
  };
  return generateToken(payload, 'access');
};

export const generateRefreshToken = (userId: number, username: string): string => {
  // Legacy function for backward compatibility - should be deprecated
  const payload: Omit<TokenPayload, 'iat' | 'exp' | 'iss' | 'aud'> = {
    userId: userId,
    email: username,
    roleId: 0,
    companyId: 0,
    user_id: userId,
    user_uuid: '',
    employee_id: 0,
    employee_uuid: '',
    role_id: 0,
    role_name: '',
    company_id: 0,
    company_name: '',
    branch_id: undefined,
    branch_name: undefined,
    employee_name: '',
    is_doctor: false,
  };
  return generateToken(payload, 'refresh');
};

export const extractTokenFromHeader = (authHeader?: string): string => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('No token provided');
  }
  return authHeader.substring(7);
};