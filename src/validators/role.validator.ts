import Joi from 'joi';

export const roleValidators = {
  create: Joi.object({
    name: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.min': 'Role name must be at least 2 characters long',
        'string.max': 'Role name must not exceed 50 characters',
      }),
    organizationId: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.guid': 'Please provide a valid organization ID',
      }),
    permissions: Joi.array()
      .items(Joi.string().uuid())
      .optional()
      .messages({
        'array.base': 'Permissions must be an array',
        'string.guid': 'Each permission ID must be a valid UUID',
      }),
  }),

  update: Joi.object({
    name: Joi.string()
      .min(2)
      .max(50)
      .optional()
      .messages({
        'string.min': 'Role name must be at least 2 characters long',
        'string.max': 'Role name must not exceed 50 characters',
      }),
    isActive: Joi.boolean()
      .optional(),
    permissions: Joi.array()
      .items(Joi.string().uuid())
      .optional()
      .messages({
        'array.base': 'Permissions must be an array',
        'string.guid': 'Each permission ID must be a valid UUID',
      }),
  }),
};