/**
 * Authentication middleware for LearnFlow API
 * Validates JWT tokens and attaches user information to requests
 */

const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT token and attach user to request
 * @returns {Function} Express middleware function
 */
const authenticateToken = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. No token provided.' 
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user information to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token has expired. Please log in again.' 
      });
    }
    
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid token.' 
    });
  }
};

/**
 * Middleware to check if user has required role
 * @param {string[]} roles - Array of allowed roles
 * @returns {Function} Express middleware function
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required.' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Required role: ${roles.join(' or ')}` 
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is accessing their own resource or is admin
 * @param {string} userIdParam - Name of the route parameter containing user ID
 * @returns {Function} Express middleware function
 */
const authorizeUserOrAdmin = (userIdParam = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required.' 
      });
    }

    const targetUserId = req.params[userIdParam];
    
    // Allow if user is admin or accessing their own resource
    if (req.user.role === 'admin' || req.user.id === targetUserId) {
      return next();
    }

    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. You can only access your own resources.' 
    });
  };
};

/**
 * Middleware to check if user is an admin
 * Convenience wrapper for authorizeRoles(['admin'])
 * @returns {Function} Express middleware function
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required.' 
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Admin privileges required.' 
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  authorizeUserOrAdmin,
  isAdmin
};