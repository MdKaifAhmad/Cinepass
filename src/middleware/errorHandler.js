const ApiError = require('../utils/apiError');
const logger = require('../config/logger');

/**
 * Global Express Error Handling Middleware (4 arguments required)
 */
function errorHandler(err, req, res, next) {
  let error = err;

  // Convert generic/unhandled errors to ApiError
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error.name === 'JsonWebTokenError' ? 401 : 500);
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, error.errors || [], err.stack);
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    ...(error.errors?.length > 0 && { errors: error.errors }),
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
  };

  logger.error(`[${req.method}] ${req.originalUrl} - ${error.statusCode} - ${error.message}`, {
    stack: error.stack,
    ip: req.ip,
  });

  return res.status(error.statusCode).json(response);
}

module.exports = errorHandler;
