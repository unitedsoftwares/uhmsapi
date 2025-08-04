import Joi from 'joi';

export const organizationValidators = {
  create: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Organization name must be at least 2 characters long',
        'string.max': 'Organization name must not exceed 100 characters',
      }),
    ownerUserId: Joi.string()
      .uuid()
      .optional(),
  }),

  update: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .optional()
      .messages({
        'string.min': 'Organization name must be at least 2 characters long',
        'string.max': 'Organization name must not exceed 100 characters',
      }),
    isActive: Joi.boolean()
      .optional(),
  }),

  addMember: Joi.object({
    userEmail: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
      }),
    roleId: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.guid': 'Please provide a valid role ID',
      }),
  }),

  updateMemberRole: Joi.object({
    roleId: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.guid': 'Please provide a valid role ID',
      }),
  }),
};