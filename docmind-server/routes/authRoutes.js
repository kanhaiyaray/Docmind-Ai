const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
  logoutAll,
  getMe,
  updateProfile,
  changePassword,
  getSessions,
  revokeSession,
  revokeOthers,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const authRateLimiter = require('../middleware/authRateLimiter');

// ---- Validation helpers ----
const passwordValidations = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain a lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain a number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Password must contain a special character')
    .custom((value) => {
      const common = ['password', '12345678', 'qwerty', 'abc123', 'password123'];
      if (common.includes(value.toLowerCase())) {
        throw new Error('Password is too common. Please choose a stronger one.');
      }
      return true;
    }),
];

const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  ...passwordValidations,
];

const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

// ---- Public routes with rate limiting ----
router.post('/register', authRateLimiter(5, 60 * 60 * 1000), registerValidation, register);
router.post('/login', authRateLimiter(5, 15 * 60 * 1000), loginValidation, login);
router.get('/verify-email', verifyEmail);
router.post(
  '/resend-verification',
  authRateLimiter(3, 60 * 60 * 1000),
  body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  resendVerification
);
router.post('/forgot-password', authRateLimiter(3, 60 * 60 * 1000), forgotPassword);
router.post('/reset-password', authRateLimiter(5, 60 * 60 * 1000), resetPassword);
router.post('/refresh', refreshToken);

// ---- Protected routes ----
router.post('/logout', protect, logout);
router.post('/logout-all', protect, logoutAll);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, passwordValidations, changePassword);

// ---- Session management ----
router.get('/sessions', protect, getSessions);
router.delete('/sessions/:id', protect, revokeSession);
router.post('/sessions/revoke-others', protect, revokeOthers);

module.exports = router;
