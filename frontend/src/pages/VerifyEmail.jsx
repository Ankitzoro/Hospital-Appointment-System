import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { resendVerificationOtp, verifyEmailOtp } from '../services/api';

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await verifyEmailOtp({ email, otp });
      setMessage('Email verified successfully. You can log in now.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setMessage('');
    setResending(true);
    try {
      await resendVerificationOtp({ email });
      setMessage('A new OTP has been sent to your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <div className="auth-header">
          <div className="auth-logo">📧</div>
          <div className="auth-title">Verify your email</div>
          <div className="auth-subtitle">Enter the 6-digit code sent to your inbox</div>
        </div>
        <div className="auth-body">
          {message && <div className="alert alert-success">✅ {message}</div>}
          {error && <div className="alert alert-error">⚠️ {error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email <span>*</span></label>
              <input
                className="form-control"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">OTP <span>*</span></label>
              <input
                className="form-control"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? <><span className="spinner" /> Verifying...</> : 'Verify Email'}
            </button>
          </form>
          <button
            type="button"
            className="btn btn-outline btn-full"
            style={{ marginTop: 12 }}
            onClick={handleResend}
            disabled={resending || !email}
          >
            {resending ? 'Sending...' : 'Resend OTP'}
          </button>
        </div>
        <div className="auth-footer">
          Already verified? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
