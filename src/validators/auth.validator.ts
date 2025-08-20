import Joi from "joi";
import { config } from "../config";

export const authValidators = {
   register: Joi.object({
      username: Joi.string().alphanum().min(3).max(30).required().messages({
         "string.alphanum": "Username must contain only letters and numbers",
         "string.min": "Username must be at least 3 characters long",
         "string.max": "Username must not exceed 30 characters",
      }),
      email: Joi.string().email().required().messages({
         "string.email": "Please provide a valid email address",
      }),
      password: Joi.string()
         .min(config.security.passwordMinLength)
         .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
         .required()
         .messages({
            "string.min": `Password must be at least ${config.security.passwordMinLength} characters long`,
            "string.pattern.base":
               "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
         }),
      first_name: Joi.string()
         .min(2)
         .max(50)
         .pattern(/^[a-zA-Z\s]+$/)
         .required()
         .messages({
            "string.pattern.base": "First name must contain only letters and spaces",
         }),
      last_name: Joi.string()
         .min(2)
         .max(50)
         .pattern(/^[a-zA-Z\s]+$/)
         .required()
         .messages({
            "string.pattern.base": "Last name must contain only letters and spaces",
         }),
      phone: Joi.string()
         .pattern(/^[0-9]{10}$/)
         .required()
         .messages({
            "string.pattern.base": "Phone number must be 10 digits",
         }),
      company_id: Joi.number().integer().positive().optional(),
      role_id: Joi.number().integer().positive().optional(),
      company_name: Joi.string().max(255).optional(),
      company_email: Joi.string().email().optional(),
      company_phone: Joi.string().max(20).optional(),
   }),

   login: Joi.object({
      email: Joi.string().required().messages({
         "string.empty": "Email or username is required",
      }),
      password: Joi.string().required().messages({
         "string.empty": "Password is required",
      }),
   }),

   refreshToken: Joi.object({
      refreshToken: Joi.string().required().messages({
         "string.empty": "Refresh token is required",
      }),
   }),

   changePassword: Joi.object({
      currentPassword: Joi.string().required().messages({
         "string.empty": "Current password is required",
      }),
      newPassword: Joi.string()
         .min(config.security.passwordMinLength)
         .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
         .required()
         .invalid(Joi.ref("currentPassword"))
         .messages({
            "string.min": `Password must be at least ${config.security.passwordMinLength} characters long`,
            "string.pattern.base":
               "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
            "any.invalid": "New password must be different from current password",
         }),
   }),

   updateProfile: Joi.object({
      email: Joi.string().email().optional().messages({
         "string.email": "Please provide a valid email address",
      }),
      first_name: Joi.string()
         .min(2)
         .max(50)
         .pattern(/^[a-zA-Z\s]+$/)
         .optional()
         .messages({
            "string.pattern.base": "First name must contain only letters and spaces",
         }),
      last_name: Joi.string()
         .min(2)
         .max(50)
         .pattern(/^[a-zA-Z\s]+$/)
         .optional()
         .messages({
            "string.pattern.base": "Last name must contain only letters and spaces",
         }),
      phone: Joi.string()
         .pattern(/^[0-9]{10}$/)
         .optional()
         .messages({
            "string.pattern.base": "Phone number must be 10 digits",
         }),
   }),

   registerComplete: Joi.object({
      // User credentials
      email: Joi.string().email().required().messages({
         "string.email": "Please provide a valid email address",
      }),
      password: Joi.string()
         .min(config.security.passwordMinLength)
         .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
         .required()
         .messages({
            "string.min": `Password must be at least ${config.security.passwordMinLength} characters long`,
            "string.pattern.base":
               "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
         }),

      // Employee details
      first_name: Joi.string()
         .min(2)
         .max(50)
         .pattern(/^[a-zA-Z\s]+$/)
         .required()
         .messages({
            "string.pattern.base": "First name must contain only letters and spaces",
         }),
      last_name: Joi.string()
         .min(2)
         .max(50)
         .pattern(/^[a-zA-Z\s]+$/)
         .required()
         .messages({
            "string.pattern.base": "Last name must contain only letters and spaces",
         }),
      phone: Joi.string()
         .pattern(/^[0-9]{10}$/)
         .required()
         .messages({
            "string.pattern.base": "Phone number must be 10 digits",
         }),
      designation: Joi.string().max(255).optional(),
      department: Joi.string().max(255).optional(),

      // Address details
      address_line1: Joi.string().max(255).optional(),
      city: Joi.string().max(100).optional(),
      state: Joi.string().max(100).optional(),
      country: Joi.string().max(100).optional(),
      pincode: Joi.string().max(20).optional(),

      // Company details
      company_name: Joi.string().max(255).when("company_id", {
         is: Joi.exist(),
         then: Joi.optional(),
         otherwise: Joi.required(),
      }),
      company_email: Joi.string().email().optional(),
      company_phone: Joi.string().max(20).optional(),
      company_id: Joi.number().integer().positive().optional(),

      // Role
      is_admin: Joi.boolean().optional().default(true),
   }),
};
