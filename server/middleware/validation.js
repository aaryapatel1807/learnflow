/**
 * Request validation middleware for LearnFlow API
 * Provides centralized input validation using common validation patterns
 */

/**
 * Validates required fields in request body
 * @param {string[]} fields - Array of required field names
 * @returns {Function} Express middleware function
 */
const validateRequiredFields = (fields) => {
  return (req, res, next) => {
    const errors = [];
    
    fields.forEach(field => {
      if (!req.body[field] || req.body[field].toString().trim() === '') {
        errors.push(`${field} is required`);
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    next();
  };
};

/**
 * Validates email format
 * @returns {Function} Express middleware function
 */
const validateEmail = () => {
  return (req, res, next) => {
    if (req.body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(req.body.email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }
    }
    next();
  };
};

/**
 * Validates password strength
 * @param {number} minLength - Minimum password length
 * @returns {Function} Express middleware function
 */
const validatePassword = (minLength = 6) => {
  return (req, res, next) => {
    if (req.body.password) {
      if (req.body.password.length < minLength) {
        return res.status(400).json({
          success: false,
          message: `Password must be at least ${minLength} characters long`
        });
      }
    }
    next();
  };
};

/**
 * Validates MongoDB ObjectId format
 * @param {string} paramName - Name of the route parameter containing ObjectId
 * @returns {Function} Express middleware function
 */
const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format. Must be a valid ObjectId.`
      });
    }
    
    next();
  };
};

/**
 * Validates numeric range for fields
 * @param {string} field - Field name to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {Function} Express middleware function
 */
const validateNumericRange = (field, min, max) => {
  return (req, res, next) => {
    if (req.body[field] !== undefined) {
      const value = Number(req.body[field]);
      
      if (isNaN(value)) {
        return res.status(400).json({
          success: false,
          message: `${field} must be a number`
        });
      }
      
      if (value < min || value > max) {
        return res.status(400).json({
          success: false,
          message: `${field} must be between ${min} and ${max}`
        });
      }
    }
    
    next();
  };
};

/**
 * Validates string length
 * @param {string} field - Field name to validate
 * @param {number} min - Minimum length
 * @param {number} max - Maximum length
 * @returns {Function} Express middleware function
 */
const validateStringLength = (field, min, max) => {
  return (req, res, next) => {
    if (req.body[field] !== undefined) {
      const value = req.body[field].toString().trim();
      
      if (value.length < min) {
        return res.status(400).json({
          success: false,
          message: `${field} must be at least ${min} characters long`
        });
      }
      
      if (value.length > max) {
        return res.status(400).json({
          success: false,
          message: `${field} must not exceed ${max} characters`
        });
      }
    }
    
    next();
  };
};

/**
 * Sanitizes input by trimming strings
 * @returns {Function} Express middleware function
 */
const sanitizeInput = () => {
  return (req, res, next) => {
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = req.body[key].trim();
        }
      });
    }
    
    next();
  };
};

module.exports = {
  validateRequiredFields,
  validateEmail,
  validatePassword,
  validateObjectId,
  validateNumericRange,
  validateStringLength,
  sanitizeInput
};