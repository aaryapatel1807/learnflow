/**
 * Generic Joi validation middleware (AWD Task-3).
 *
 * Usage: router.post('/register', validate(registerSchema), handler)
 *
 * - abortEarly: false  -> collect every error, not just the first one.
 * - stripUnknown: true -> fields that are not in the schema are dropped,
 *   so a client cannot smuggle extra fields (e.g. "role": "admin") into
 *   a request body that a handler might pass on to the database.
 * On failure it returns the API's standard error shape with HTTP 400.
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.details.map((detail) => detail.message)
    });
  }

  req.body = value; // replace body with the validated, sanitized value
  next();
};

module.exports = validate;
