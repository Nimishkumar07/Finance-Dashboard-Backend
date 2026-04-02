const Joi = require('joi');
const { ALL_ROLES } = require('../constants/roles');

const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50),
  email: Joi.string().trim().lowercase().email(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

const updateRoleSchema = Joi.object({
  role: Joi.string().valid(...ALL_ROLES).required()
    .messages({
      'any.only': `Role must be one of: ${ALL_ROLES.join(', ')}`,
      'any.required': 'Role is required',
    }),
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('active', 'inactive').required()
    .messages({
      'any.only': 'Status must be either active or inactive',
      'any.required': 'Status is required',
    }),
});

const userQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  role: Joi.string().valid(...ALL_ROLES),
  status: Joi.string().valid('active', 'inactive'),
  search: Joi.string().trim().max(100),
});

module.exports = { updateUserSchema, updateRoleSchema, updateStatusSchema, userQuerySchema };
