import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt.utils';
import { TokenPayload } from '../models/user.model';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      companyId?: number;
      branchId?: number;
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    const decoded = verifyToken(token, 'access') as TokenPayload;
    req.user = decoded;
    req.companyId = decoded.company_id;
    req.branchId = decoded.branch_id;
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = extractTokenFromHeader(authHeader);
      const decoded = verifyToken(token, 'access') as TokenPayload;
      req.user = decoded;
      req.companyId = decoded.company_id;
      req.branchId = decoded.branch_id;
    }
    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
};

// Middleware to check if user belongs to specific company
export const requireCompany = (companyId?: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED',
        },
      });
    }

    if (companyId && req.user.company_id !== companyId) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied to this company',
          code: 'COMPANY_ACCESS_DENIED',
        },
      });
    }

    return next();
  };
};

// Middleware to check if user belongs to specific branch
export const requireBranch = (branchId?: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED',
        },
      });
    }

    if (branchId && req.user.branch_id !== branchId) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied to this branch',
          code: 'BRANCH_ACCESS_DENIED',
        },
      });
    }

    return next();
  };
};

// Middleware to check if user has specific role
export const requireRole = (roleId: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED',
        },
      });
    }

    if (req.user.role_id !== roleId) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Insufficient role permissions',
          code: 'ROLE_ACCESS_DENIED',
        },
      });
    }

    return next();
  };
};