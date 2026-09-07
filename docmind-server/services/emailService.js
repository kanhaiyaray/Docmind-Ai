const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@docmind.ai';

/**
 * Send a verification email
 */
const sendVerificationEmail = async (to, name, token) => {
  const link = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
  const html = `
    <h1>Welcome to DocMind, ${name}!</h1>
    <p>Please verify your email address by clicking the link below:</p>
    <a href="${link}" style="display:inline-block;padding:12px 24px;background:#6c5ce7;color:#fff;border-radius:6px;text-decoration:none;">Verify Email</a>
    <p>If you didn't create an account, please ignore this email.</p>
    <p>This link expires in 1 hour.</p>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: 'DocMind - Verify Your Email',
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error(error.message);
    }
    return data;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Failed to send verification email');
  }
};

/**
 * Send a password reset email
 */
const sendPasswordResetEmail = async (to, name, token) => {
  const link = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
  const html = `
    <h1>Reset Your DocMind Password</h1>
    <p>Hi ${name},</p>
    <p>We received a request to reset your password. Click the link below to choose a new one:</p>
    <a href="${link}" style="display:inline-block;padding:12px 24px;background:#6c5ce7;color:#fff;border-radius:6px;text-decoration:none;">Reset Password</a>
    <p>If you didn't request this, please ignore this email.</p>
    <p>This link expires in 1 hour.</p>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: 'DocMind - Password Reset',
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error(error.message);
    }
    return data;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Failed to send reset email');
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
