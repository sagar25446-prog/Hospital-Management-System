/**
 * Global error handler. Sends JSON with statusCode and message.
 * ApiError is used by auth and other modules for consistent HTTP errors.
 */

const { ApiError } = require('../utils/ApiError');

const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      logger.error(`[ApiError] ${err.message}`, err);
    }
    return res.status(err.statusCode).json({ message: err.message });
  }
  
  logger.error(err.message || 'Unhandled error', err);
  return res.status(500).json({ message: 'Internal server error' });
}

module.exports = { errorHandler };
