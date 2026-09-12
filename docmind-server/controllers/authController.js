const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require('../services/emailService');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = async (userId, deviceInfo = {}) => {
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh',
    { expiresIn: '7d' }
  );

  await RefreshToken.create({
    userId,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    deviceInfo: {
      userAgent: deviceInfo.userAgent || '',
      ipAddress: deviceInfo.ipAddress || '',
    },
  });

  return refreshToken;
};

const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  };
};

const setAuthCookies = (res, token, refreshToken) => {
  const cookieOptions = {
    ...getCookieOptions(),
    maxAge: 15 * 60 * 1000,
  };
  res.cookie('token', token, cookieOptions);
  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const clearAuthCookies = (res) => {
  const cookieOptions = getCookieOptions();
  res.clearCookie('token', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
  res.clearCookie('_csrf', cookieOptions);
};

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((e) => e.msg).join(', ');
      return res
        .status(400)
        .json({ success: false, message: errorMessages, errors: errors.array() });
    }

    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: 'User already exists with this email' });
    }

    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      isEmailVerified: false,
    });

    await user.save();

    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = Date.now() + 60 * 60 * 1000;
    await user.save();

    try {
      await sendVerificationEmail(user.email, user.name, verificationToken);
    } catch (emailError) {
      console.error('Verification email failed:', emailError);
    }

    const token = generateToken(user._id);
    const refreshToken = await generateRefreshToken(user._id, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.connection.remoteAddress,
    });

    setAuthCookies(res, token, refreshToken);

    res.status(201).json({
      success: true,
      user: user.getPublicProfile(),
      message: 'Registration successful. Please verify your email.',
    });
  } catch (error) {
    console.error('Register error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Server error during registration' });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((e) => e.msg).join(', ');
      return res
        .status(400)
        .json({ success: false, message: errorMessages, errors: errors.array() });
    }

    const { email, password } = req.body;
    console.log(`🔐 Login attempt for: ${email}`);

    // Must select +password since it's excluded by default
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password +failedLoginAttempts +accountLockedUntil')
      .select('+emailVerificationToken');

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid email or password' });
    }

    // ----- LOCKOUT CHECK -----
    if (user.isAccountLocked && user.isAccountLocked()) {
      const minutesLeft = Math.ceil(
        (user.accountLockedUntil - Date.now()) / (60 * 1000)
      );
      return res.status(423).json({
        success: false,
        message: `Account is locked due to too many failed login attempts. Try again in ${minutesLeft} minute(s).`,
        code: 'ACCOUNT_LOCKED',
      });
    }

    if (!user.isActive) {
      return res
        .status(401)
        .json({ success: false, message: 'Account is deactivated' });
    }

    if (!user.isEmailVerified) {
      return res.status(401).json({
        success: false,
        message:
          'Please verify your email before logging in. Check your inbox for the verification link.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      // Increment failed attempts (locks after 5)
      await user.incrementFailedLoginAttempts();
      const remaining = Math.max(0, 5 - (user.failedLoginAttempts || 0));
      return res.status(401).json({
        success: false,
        message:
          remaining > 0
            ? `Invalid email or password. ${remaining} attempt(s) remaining before lockout.`
            : 'Too many failed attempts. Account locked for 15 minutes.',
      });
    }

    // Reset failed attempts on successful login
    if (user.failedLoginAttempts > 0 || user.accountLockedUntil) {
      await user.resetFailedLoginAttempts();
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);
    const refreshToken = await generateRefreshToken(user._id, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.connection.remoteAddress,
    });

    setAuthCookies(res, token, refreshToken);

    res.json({ success: true, user: user.getPublicProfile() });
  } catch (error) {
    console.error('Login error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Server error during login' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res
        .status(400)
        .json({ success: false, message: 'Verification token is required' });
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid or expired verification token' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully. You can now log in.',
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Server error during email verification' });
  }
};

// ----- NEW: resend verification email -----
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Don't leak whether the account exists
    if (!user) {
      return res.json({
        success: true,
        message:
          'If an account with that email exists and is unverified, a new link has been sent.',
      });
    }

    if (user.isEmailVerified) {
      return res.json({
        success: true,
        message: 'This email is already verified. You can log in.',
      });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = Date.now() + 60 * 60 * 1000;
    await user.save();

    try {
      await sendVerificationEmail(user.email, user.name, verificationToken);
    } catch (emailError) {
      console.error('Resend verification email failed:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again later.',
      });
    }

    res.json({
      success: true,
      message: 'If an account with that email exists and is unverified, a new link has been sent.',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.json({
        success: true,
        message:
          'If an account with that email exists, a reset link has been sent.',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
    await user.save();

    try {
      await sendPasswordResetEmail(user.email, user.name, resetToken);
    } catch (emailError) {
      console.error('Reset email failed:', emailError);
    }

    res.json({
      success: true,
      message:
        'If an account with that email exists, a reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters',
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+password');

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.failedLoginAttempts = 0;
    user.accountLockedUntil = null;
    await user.save();

    res.json({
      success: true,
      message:
        'Password reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Server error during password reset' });
  }
};

const refreshToken = async (req, res) => {
  try {
    const oldRefreshToken = req.cookies.refreshToken;

    if (!oldRefreshToken) {
      return res
        .status(401)
        .json({ success: false, message: 'No refresh token provided' });
    }

    let decoded;
    try {
      decoded = jwt.verify(
        oldRefreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh'
      );
    } catch (error) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid refresh token' });
    }

    const storedToken = await RefreshToken.findOne({
      token: oldRefreshToken,
      userId: decoded.userId,
      isRevoked: false,
    });

    if (!storedToken) {
      return res
        .status(401)
        .json({ success: false, message: 'Refresh token not found or revoked' });
    }

    if (storedToken.expiresAt < new Date()) {
      await RefreshToken.findByIdAndUpdate(storedToken._id, { isRevoked: true });
      return res
        .status(401)
        .json({ success: false, message: 'Refresh token expired' });
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res
        .status(401)
        .json({ success: false, message: 'User not found or inactive' });
    }

    await RefreshToken.findByIdAndUpdate(storedToken._id, { isRevoked: true });

    const newRefreshToken = await generateRefreshToken(user._id, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.connection.remoteAddress,
    });

    const newAccessToken = generateToken(user._id);

    setAuthCookies(res, newAccessToken, newRefreshToken);

    res.json({ success: true, message: 'Token refreshed successfully' });
  } catch (error) {
    console.error('Refresh token error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Server error during token refresh' });
  }
};

const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await RefreshToken.findOneAndUpdate(
        { token: refreshToken },
        { isRevoked: true }
      );
    }

    clearAuthCookies(res);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Server error during logout' });
  }
};

const logoutAll = async (req, res) => {
  try {
    await RefreshToken.updateMany({ userId: req.userId }, { isRevoked: true });
    clearAuthCookies(res);
    res.json({ success: true, message: 'Logged out from all devices' });
  } catch (error) {
    console.error('Logout all error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Server error during logout all' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user: user.getPublicProfile() });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, settings } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (settings) user.settings = { ...user.settings, ...settings };

    await user.save();

    res.json({ success: true, user: user.getPublicProfile() });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId).select('+password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getSessions = async (req, res) => {
  try {
    const sessions = await RefreshToken.find({
      userId: req.userId,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    }).select('_id token deviceInfo createdAt expiresAt');

    const currentRefreshToken = req.cookies.refreshToken;

    const formattedSessions = sessions.map((s) => ({
      id: s._id,
      deviceInfo: s.deviceInfo,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      isCurrent: s.token === currentRefreshToken,
    }));

    res.json({ success: true, sessions: formattedSessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch sessions' });
  }
};

const revokeSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = await RefreshToken.findOne({
      _id: sessionId,
      userId: req.userId,
      isRevoked: false,
    });

    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: 'Session not found or already revoked' });
    }

    if (session.token === req.cookies.refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Cannot revoke current session. Use logout instead.',
      });
    }

    session.isRevoked = true;
    await session.save();

    res.json({ success: true, message: 'Session revoked successfully' });
  } catch (error) {
    console.error('Revoke session error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to revoke session' });
  }
};

const revokeOthers = async (req, res) => {
  try {
    const currentRefreshToken = req.cookies.refreshToken;

    if (!currentRefreshToken) {
      return res
        .status(401)
        .json({ success: false, message: 'No active session' });
    }

    await RefreshToken.updateMany(
      {
        userId: req.userId,
        token: { $ne: currentRefreshToken },
        isRevoked: false,
      },
      { isRevoked: true }
    );

    res.json({ success: true, message: 'All other sessions revoked' });
  } catch (error) {
    console.error('Revoke others error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to revoke other sessions' });
  }
};

module.exports = {
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
};
