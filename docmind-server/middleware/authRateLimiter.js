const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for authentication routes.
 * Uses default IP-based key (IPv6 safe).
 */
const authRateLimiter = (max = 5, windowMs = 15 * 60 * 1000) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: 'Too many requests from this IP. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

module.exports = authRateLimiter;
