import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import logger from '../utils/logger';
import { config } from '../config';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
    if (err instanceof AppError) {
      const { statusCode, message, code, details } = err;
      
      logger.error({
        type: 'AppError',
        statusCode,
        message,
        code,
        details,
        path: req.path,
        method: req.method,
        ip: req.ip,
      });

      // For validation errors, include the errors array
      if (code === 'VALIDATION_ERROR' && Array.isArray(details)) {
        return res.status(statusCode).json({
          success: false,
          message,
          errors: details,
        });
      }

      return res.status(statusCode).json({
        success: false,
        message,
      });
    }

  // Handle MySQL errors
  if (err.name === 'MySQLError' || (err as any).code) {
    const mysqlError = err as any;
    
    logger.error({
      type: 'DatabaseError',
      code: mysqlError.code,
      errno: mysqlError.errno,
      message: mysqlError.message,
      sql: mysqlError.sql,
      path: req.path,
      method: req.method,
      service: config.serviceName,
    });

    // Handle specific MySQL errors
    switch (mysqlError.code) {
      case 'ER_DUP_ENTRY':
        return res.status(409).json({
          success: false,
          error: {
            message: 'Duplicate entry',
            code: 'DUPLICATE_ENTRY',
          },
        });
      case 'ER_NO_REFERENCED_ROW_2':
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid reference',
            code: 'INVALID_REFERENCE',
          },
        });
      case 'ECONNRESET':
        return res.status(503).json({
          success: false,
          error: {
            message: 'Database connection lost. Please try again.',
            code: 'CONNECTION_LOST',
          },
        });
      case 'ETIMEDOUT':
        return res.status(503).json({
          success: false,
          error: {
            message: 'Database connection timeout. Please try again.',
            code: 'CONNECTION_TIMEOUT',
          },
        });
      case 'ECONNREFUSED':
        return res.status(503).json({
          success: false,
          error: {
            message: 'Unable to connect to database. Please try again later.',
            code: 'CONNECTION_REFUSED',
          },
        });
      default:
        return res.status(500).json({
          success: false,
          error: {
            message: 'Database error',
            code: 'DATABASE_ERROR',
          },
        });
    }
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    logger.error({
      type: 'JWTError',
      message: err.message,
      path: req.path,
      method: req.method,
    });

    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid token',
        code: 'INVALID_TOKEN',
      },
    });
  }

  if (err.name === 'TokenExpiredError') {
    logger.error({
      type: 'JWTError',
      message: 'Token expired',
      path: req.path,
      method: req.method,
    });

    return res.status(401).json({
      success: false,
      error: {
        message: 'Token expired',
        code: 'TOKEN_EXPIRED',
      },
    });
  }

  // Handle unknown errors
  logger.error({
    type: 'UnknownError',
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
  });

  return res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      ...(config.env === 'development' && { 
        details: err.message,
        stack: err.stack 
      }),
    },
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'ROUTE_NOT_FOUND',
      path: req.path,
    },
  });
};
