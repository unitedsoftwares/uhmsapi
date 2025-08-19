import { Request } from 'express';
import { UnauthorizedError } from '../errors/AppError';

export interface AuthContext {
  userId: number;
  userUuid: string;
  employeeId: number;
  employeeUuid?: string;
  companyId: number;
  branchId?: number;
  roleId: number;
  roleName?: string;
  isDoctor: boolean;
}

/**
 * Extract authentication context from request
 * This ensures all required IDs are available for CRUD operations
 */
export const getAuthContext = (req: Request): AuthContext => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const user = req.user;

  // Check for required fields with detailed error messages
  const missingFields: string[] = [];
  
  if (!user.user_id) missingFields.push('user_id');
  if (!user.company_id) missingFields.push('company_id');
  if (!user.employee_id) missingFields.push('employee_id');

  if (missingFields.length > 0) {
    throw new UnauthorizedError(`Invalid authentication token - missing fields: ${missingFields.join(', ')}`);
  }

  return {
    userId: user.user_id!,
    userUuid: user.user_uuid || '',
    employeeId: user.employee_id!,
    employeeUuid: user.employee_uuid,
    companyId: user.company_id!,
    branchId: user.branch_id,
    roleId: user.role_id || 0,
    roleName: user.role_name,
    isDoctor: user.is_doctor || false,
  };
};

/**
 * Check if user belongs to the specified company
 */
export const validateCompanyAccess = (
  authContext: AuthContext, 
  targetCompanyId: number
): boolean => {
  return authContext.companyId === targetCompanyId;
};

/**
 * Check if user belongs to the specified branch
 */
export const validateBranchAccess = (
  authContext: AuthContext, 
  targetBranchId: number
): boolean => {
  return authContext.branchId === targetBranchId;
};