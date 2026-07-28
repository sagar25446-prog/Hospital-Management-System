/**
 * Verifies JWT access token and attaches decoded payload to req.user.
 * Use on routes that require authentication.
 */

const jwt = require('jsonwebtoken');
const { ApiError } = require('../utils/ApiError');

/**
 * Middleware: require valid access token. Sets req.user = { id, email, role }.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = (req.cookies && req.cookies.hospital_access_token) || 
    (authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null);

  if (!token) {
    return next(new ApiError(401, 'Access token required'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Access token expired'));
    }
    return next(new ApiError(401, 'Invalid access token'));
  }
}

/**
 * Optional auth: if token present and valid, set req.user; otherwise continue without it.
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = (req.cookies && req.cookies.hospital_access_token) || 
    (authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null);

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (_) {
    // Ignore invalid/expired token for optional auth
  }
  next();
}

module.exports = { authMiddleware, optionalAuth };
