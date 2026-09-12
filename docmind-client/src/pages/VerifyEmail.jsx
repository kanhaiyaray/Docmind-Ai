import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { CheckCircle, XCircle, Loader, Mail } from 'lucide-react';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendError, setResendError] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    const verify = async () => {
      try {
        const response = await api.get(`/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage(response.data.message || 'Email verified successfully!');
      } catch (error) {
        setStatus('error');
        setMessage(
          error.response?.data?.message ||
            'Verification failed. The token may be invalid or expired.'
        );
      }
    };

    verify();
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    setResendError('');
    setResendMessage('');
    if (!resendEmail.trim()) {
      setResendError('Please enter your email');
      return;
    }
    setResending(true);
    try {
      const res = await api.post('/auth/resend-verification', {
        email: resendEmail.trim(),
      });
      setResendMessage(
        res.data.message || 'If your account is unverified, a new link has been sent.'
      );
    } catch (err) {
      setResendError(
        err.response?.data?.message || 'Failed to resend. Please try again.'
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa] dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader className="h-12 w-12 text-purple-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Verifying your email...
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Please wait while we confirm your address.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Email Verified!
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2">{message}</p>
            <Link
              to="/login"
              className="mt-6 inline-block px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Go to Login
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Verification Failed
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2">{message}</p>

            <form onSubmit={handleResend} className="mt-6 text-left">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Resend verification email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-custom pl-10"
                  required
                />
              </div>
              {resendError && (
                <p className="text-red-500 text-xs mt-2">{resendError}</p>
              )}
              {resendMessage && (
                <p className="text-green-600 text-xs mt-2">{resendMessage}</p>
              )}
              <button
                type="submit"
                disabled={resending}
                className="btn-primary w-full mt-3 flex items-center justify-center gap-2"
              >
                {resending ? 'Sending...' : 'Resend Verification Email'}
              </button>
            </form>

            <div className="mt-4">
              <Link
                to="/login"
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
              >
                Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
