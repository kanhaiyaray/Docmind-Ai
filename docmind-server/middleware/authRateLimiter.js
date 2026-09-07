const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for authentication routes.
 * Uses email from request body (if available) + IP as the key.
 * @param {number} max - max requests per window
 * @param {number} windowMs - window in milliseconds
 * @returns {Function} express-rate-limit middleware
 */
const authRateLimiter = (max = 5, windowMs = 15 * 60 * 1000) => {
  return rateLimit({
    windowMs,
    max,
    keyGenerator: (req) => {
      // If email is present, use it with IP to prevent email enumeration
      const email = req.body?.email || '';
      return `${email}-${req.ip}`;
    },
    message: {
      success: false,
      message: 'Too many requests from this email/IP. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

module.exports = authRateLimiter;
