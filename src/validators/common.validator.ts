import Joi from 'joi';
import { config } from '../config';

export const commonValidators = {
  uuidParam: Joi.object({
    id: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.guid': 'Invalid ID format',
      }),
  }),

  organizationIdParam: Joi.object({
    organizationId: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.guid': 'Invalid organization ID format',
      }),
  }),

  userIdParam: Joi.object({
    userId: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.guid': 'Invalid user ID format',
      }),
  }),

  pagination: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(config.pagination.defaultPage)
      .optional(),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(config.pagination.maxLimit)
      .default(config.pagination.defaultLimit)
      .optional(),
    sortBy: Joi.string()
      .optional(),
    sortOrder: Joi.string()
      .valid('ASC', 'DESC')
      .default('DESC')
      .optional(),
  }),

  organizationContext: Joi.object({
    organizationId: Joi.string()
      .uuid()
      .optional()
      .messages({
        'string.guid': 'Invalid organization ID format',
      }),
  }),
};