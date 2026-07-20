/**
 * API error class for consistent error responses.
 * Used by controllers and middleware to set status and message.
 */

class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = { ApiError };
