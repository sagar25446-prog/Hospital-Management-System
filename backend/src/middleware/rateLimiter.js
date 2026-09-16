const rateLimit = require('express-rate-limit');

// Brute-force protection for sensitive endpoints like login
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 attempts per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts, please try again after 15 minutes' },
});

module.exports = {
  authLimiter
};
