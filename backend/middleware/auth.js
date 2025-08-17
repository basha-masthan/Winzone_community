const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-here'
    );

    // Check if user exists and is active
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'Account is banned',
        reason: user.banReason
      });
    }

    // Add user info to request
    req.user = decoded;
    req.userInfo = user;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.userInfo) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (req.userInfo.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking admin status'
    });
  }
};

// Middleware to check if user is moderator or admin
const requireModerator = async (req, res, next) => {
  try {
    if (!req.userInfo) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!['moderator', 'admin'].includes(req.userInfo.role)) {
      return res.status(403).json({
        success: false,
        message: 'Moderator or admin access required'
      });
    }

    next();
  } catch (error) {
    console.error('Moderator check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking moderator status'
    });
  }
};

// Middleware to check if user owns the resource or is admin
const requireOwnershipOrAdmin = (resourceUserIdField = 'userId') => {
  return async (req, res, next) => {
    try {
      if (!req.userInfo) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Admin can access any resource
      if (req.userInfo.role === 'admin') {
        return next();
      }

      // Check if user owns the resource
      const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
      if (!resourceUserId) {
        return res.status(400).json({
          success: false,
          message: 'Resource user ID is required'
        });
      }

      if (resourceUserId !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only access your own resources'
        });
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking resource ownership'
      });
    }
  };
};

// Middleware to rate limit requests
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old requests
    if (requests.has(ip)) {
      requests.set(ip, requests.get(ip).filter(timestamp => timestamp > windowStart));
    }

    const userRequests = requests.get(ip) || [];
    
    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.'
      });
    }

    userRequests.push(now);
    requests.set(ip, userRequests);

    next();
  };
};

// Middleware to validate request body
const validateBody = (requiredFields) => {
  return (req, res, next) => {
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    next();
  };
};

// Middleware to validate request parameters
const validateParams = (requiredParams) => {
  return (req, res, next) => {
    const missingParams = requiredParams.filter(param => !req.params[param]);
    
    if (missingParams.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required parameters: ${missingParams.join(', ')}`
      });
    }

    next();
  };
};

// Middleware to sanitize input
const sanitizeInput = (req, res, next) => {
  // Sanitize string inputs
  const sanitizeString = (str) => {
    if (typeof str === 'string') {
      return str.trim().replace(/[<>]/g, '');
    }
    return str;
  };

  // Recursively sanitize object
  const sanitizeObject = (obj) => {
    if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'string') {
          obj[key] = sanitizeString(obj[key]);
        } else if (typeof obj[key] === 'object') {
          sanitizeObject(obj[key]);
        }
      });
    }
  };

  sanitizeObject(req.body);
  sanitizeObject(req.params);
  sanitizeObject(req.query);

  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireModerator,
  requireOwnershipOrAdmin,
  rateLimit,
  validateBody,
  validateParams,
  sanitizeInput
};
