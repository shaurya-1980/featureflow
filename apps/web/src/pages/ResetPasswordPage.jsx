/**
 * pages/ResetPasswordPage.jsx
 *
 * Premium glassmorphism reset password page using authentic Coss UI primitives:
 *  - Coss UI Card
 *  - Coss UI Input
 *  - Coss UI Button
 *  - Coss UI Alert
 *  - Coss UI Spinner
 * Token from URL query (?token=...) or manual entry.
 * Calls POST /api/auth/reset-password.
 */

import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient.js';
import AuthLayout from '../components/layout/AuthLayout.jsx';
import { Card } from '../components/ui/card.jsx';
import { Input } from '../components/ui/input.jsx';
import { Button } from '../components/ui/button.jsx';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert.jsx';
import { Spinner } from '../components/ui/spinner.jsx';

const EyeOpen = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const EyeClosed = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setDetails([]);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter both fields.');
      return;
    }

    if (!token.trim()) {
      setError('Password reset token is required.');
      return;
    }

    setLoading(true);

    try {
      const response = await axiosClient.post('/auth/reset-password', {
        token: token.trim(),
        newPassword,
      });
      const message =
        response.data?.message ||
        'Password reset successfully. Please log in with your new password.';
      navigate('/login', { state: { message } });
    } catch (err) {
      const res = err.response?.data;
      setError(res?.error || 'Password reset failed. The token may be invalid or expired.');
      setDetails(res?.details || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="auth-card-glass" style={styles.card}>
        {/* Heading */}
        <div style={styles.headingBlock}>
          <h1 style={styles.title}>Create new password</h1>
          <p style={styles.subtitle}>Choose a strong password to protect your account.</p>
        </div>

        {/* Error alert */}
        {error && (
          <Alert variant="error" style={{ marginBottom: '1.25rem' }}>
            <AlertTitle>Reset Error</AlertTitle>
            <AlertDescription>
              <div>{error}</div>
              {details.length > 0 && (
                <ul style={styles.detailList}>
                  {details.map((d, i) => (
                    <li key={i}><strong>{d.field}</strong>: {d.message}</li>
                  ))}
                </ul>
              )}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Token field — only shown if not in URL */}
          {!tokenFromUrl && (
            <div style={styles.field}>
              <label className="auth-label" htmlFor="reset-token">Reset Token</label>
              <Input
                id="reset-token"
                name="token"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="ff-input-glass"
                required
                placeholder="Paste your reset token"
              />
            </div>
          )}

          <div style={styles.field}>
            <label className="auth-label" htmlFor="reset-new-password">New Password</label>
            <div style={styles.passwordWrapper}>
              <Input
                id="reset-new-password"
                name="newPassword"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="ff-input-glass"
                style={{ paddingRight: '2.75rem' }}
                required
                autoComplete="new-password"
                placeholder="Min 8 chars, 1 letter & 1 number"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeToggle}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeClosed /> : <EyeOpen />}
              </button>
            </div>
          </div>

          <div style={styles.field}>
            <label className="auth-label" htmlFor="reset-confirm-password">Confirm New Password</label>
            <div style={styles.passwordWrapper}>
              <Input
                id="reset-confirm-password"
                name="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="ff-input-glass"
                style={{ paddingRight: '2.75rem' }}
                required
                autoComplete="new-password"
                placeholder="Re-enter your new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={styles.eyeToggle}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeClosed /> : <EyeOpen />}
              </button>
            </div>
          </div>

          <Button
            id="reset-submit"
            type="submit"
            style={styles.button}
            disabled={loading}
            className="saas-button-primary w-full"
          >
            {loading ? (
              <span style={styles.loadingRow}>
                <Spinner className="size-4" />
                Resetting password…
              </span>
            ) : (
              'Reset Password'
            )}
          </Button>
        </form>

        {/* Footer */}
        <div style={styles.footer}>
          <span style={styles.footerText}>Remember your password?</span>{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </div>
      </Card>
    </AuthLayout>
  );
};

const styles = {
  card: {
    padding: '2.25rem 2.25rem 2rem',
    color: '#ffffff',
  },
  headingBlock: {
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '1.65rem',
    fontWeight: 800,
    color: '#ffffff',
    margin: '0 0 0.3rem 0',
    letterSpacing: '-0.025em',
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: '0.9rem',
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 1.5,
  },
  field: {
    marginBottom: '1.1rem',
  },
  passwordWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  eyeToggle: {
    position: 'absolute',
    right: '0.7rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'rgba(255,255,255,0.55)',
    padding: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 150ms ease',
    lineHeight: 0,
    zIndex: 2,
  },
  button: {
    width: '100%',
    padding: '0.75rem',
    marginTop: '0.5rem',
    height: 'auto',
  },
  loadingRow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  detailList: {
    marginTop: '0.4rem',
    paddingLeft: '1.15rem',
    fontSize: '0.8rem',
  },
  footer: {
    marginTop: '1.5rem',
    textAlign: 'center',
    fontSize: '0.875rem',
    borderTop: '1px solid rgba(255,255,255,0.10)',
    paddingTop: '1.25rem',
  },
  footerText: {
    color: 'rgba(255,255,255,0.55)',
  },
};

export default ResetPasswordPage;
