import Joi from 'joi';
import { config } from '../config';

export const userValidators = {
  // Validate user ID parameter
  userIdParam: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'User ID must be a number',
        'number.integer': 'User ID must be an integer',
        'number.positive': 'User ID must be positive',
        'any.required': 'User ID is required',
      }),
  }),

  // Validate user update data
  updateUser: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .optional()
      .messages({
        'string.alphanum': 'Username must contain only letters and numbers',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username must not exceed 30 characters',
      }),
    email: Joi.string()
      .email()
      .optional()
      .messages({
        'string.email': 'Please provide a valid email address',
      }),
    first_name: Joi.string()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z\s]+$/)
      .optional()
      .messages({
        'string.pattern.base': 'First name must contain only letters and spaces',
        'string.min': 'First name must be at least 2 characters long',
        'string.max': 'First name must not exceed 50 characters',
      }),
    last_name: Joi.string()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z\s]+$/)
      .optional()
      .messages({
        'string.pattern.base': 'Last name must contain only letters and spaces',
        'string.min': 'Last name must be at least 2 characters long',
        'string.max': 'Last name must not exceed 50 characters',
      }),
    phone: Joi.string()
      .pattern(/^[0-9]{10}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Phone number must be 10 digits',
      }),
    role_id: Joi.number()
      .integer()
      .positive()
      .optional()
      .messages({
        'number.base': 'Role ID must be a number',
        'number.integer': 'Role ID must be an integer',
        'number.positive': 'Role ID must be positive',
      }),
    designation: Joi.string()
      .max(255)
      .optional()
      .messages({
        'string.max': 'Designation must not exceed 255 characters',
      }),
    department: Joi.string()
      .max(255)
      .optional()
      .messages({
        'string.max': 'Department must not exceed 255 characters',
      }),
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update',
  }),

  // Validate user status update
  updateUserStatus: Joi.object({
    status: Joi.string()
      .valid('active', 'inactive', 'suspended')
      .required()
      .messages({
        'any.only': 'Status must be one of: active, inactive, suspended',
        'any.required': 'Status is required',
      }),
  }),

  // Validate query parameters for user listing
  getUsersQuery: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .optional(),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10)
      .optional(),
    search: Joi.string()
      .max(255)
      .optional()
      .messages({
        'string.max': 'Search term must not exceed 255 characters',
      }),
    status: Joi.string()
      .valid('active', 'inactive', 'suspended', 'all')
      .default('active')
      .optional(),
    role_id: Joi.number()
      .integer()
      .positive()
      .optional(),
    sort_by: Joi.string()
      .valid('created_at', 'updated_at', 'first_name', 'last_name', 'email')
      .default('created_at')
      .optional(),
    sort_order: Joi.string()
      .valid('ASC', 'DESC')
      .default('DESC')
      .optional(),
  }),

  // Validate bulk operations
  bulkUpdateUsers: Joi.object({
    user_ids: Joi.array()
      .items(
        Joi.number()
          .integer()
          .positive()
          .required()
      )
      .min(1)
      .max(50)
      .required()
      .messages({
        'array.min': 'At least one user ID is required',
        'array.max': 'Cannot update more than 50 users at once',
      }),
    action: Joi.string()
      .valid('activate', 'deactivate', 'suspend')
      .required()
      .messages({
        'any.only': 'Action must be one of: activate, deactivate, suspend',
      }),
  }),

  // Validate password reset request
  resetPassword: Joi.object({
    new_password: Joi.string()
      .min(config.security.passwordMinLength)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': `Password must be at least ${config.security.passwordMinLength} characters long`,
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      }),
  }),
};