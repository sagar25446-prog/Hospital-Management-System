/**
 * Role-based access: allow only specified roles. Must run after authMiddleware.
 */

const { ApiError } = require('../utils/ApiError');

/**
 * @param {string[]} allowedRoles - e.g. ['admin', 'reception']
 * @returns {Function} Express middleware
 */
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'Insufficient permissions'));
    }
    next();
  };
}

module.exports = { requireRole };
