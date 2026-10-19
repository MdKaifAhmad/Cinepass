const jwt = require('jsonwebtoken');
const ApiError = require('../utils/apiError');

/**
 * JWT Authentication Middleware
 * Validates 'Bearer <token>' in Authorization header and populates req.user
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Access denied. No token provided.'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'cinepass_dev_jwt_secret_key_2026_super_secure'
    );

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Token has expired, please log in again'));
    }
    return next(ApiError.unauthorized('Invalid authentication token'));
  }
}

module.exports = authMiddleware;
