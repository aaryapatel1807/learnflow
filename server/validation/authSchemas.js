/**
 * Joi validation schemas for authentication requests (AWD Task-3).
 *
 * Why schema validation matters for security: Joi enforces TYPES, not just
 * presence. A NoSQL-injection payload such as {"email": {"$gt": ""}} is an
 * object, not a string, so it is rejected here before it can ever reach a
 * Mongoose query.
 */
const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(60).required(),
  email: Joi.string().trim().lowercase().email().required(),
  // Minimum raised from 6 to 8 characters. Maximum 72 because bcrypt
  // truncates input beyond 72 bytes, so longer passwords add no security.
  password: Joi.string().min(8).max(72).required(),
  timezone: Joi.string().trim().max(64).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().required()
});

module.exports = { registerSchema, loginSchema };
