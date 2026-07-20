/**
 * Global error handler. Sends JSON with statusCode and message.
 * ApiError is used by auth and other modules for consistent HTTP errors.
 */

const { ApiError } = require('../utils/ApiError');

function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ message: err.message });
  }
  console.error(err);
  return res.status(500).json({ message: 'Internal server error' });
}

module.exports = { errorHandler };
