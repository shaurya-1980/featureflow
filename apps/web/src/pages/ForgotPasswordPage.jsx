/**
 * pages/ForgotPasswordPage.jsx
 *
 * Premium glassmorphism forgot password page using authentic Coss UI primitives:
 *  - Coss UI Card
 *  - Coss UI Input
 *  - Coss UI Button
 *  - Coss UI Alert
 *  - Coss UI Spinner
 * Wired to POST /api/auth/forgot-password.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient.js';
import AuthLayout from '../components/layout/AuthLayout.jsx';
import { Card } from '../components/ui/card.jsx';
import { Input } from '../components/ui/input.jsx';
import { Button } from '../components/ui/button.jsx';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert.jsx';
import { Spinner } from '../components/ui/spinner.jsx';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [devResetUrl, setDevResetUrl] = useState('');
  const [error, setError] = useState('');
  const [details, setDetails] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setDetails([]);
    setDevResetUrl('');
    setStatus('submitting');

    try {
      const response = await axiosClient.post('/auth/forgot-password', { email });
      setStatus('success');
      setMessage(
        response.data?.message ||
          'If that email is registered, a password reset link has been sent.'
      );
      if (response.data?.devResetUrl) {
        setDevResetUrl(response.data.devResetUrl);
      }
    } catch (err) {
      const res = err.response?.data;
      setError(res?.error || 'Request failed. Please try again.');
      setDetails(res?.details || []);
      setStatus('idle');
    }
  };

  return (
    <AuthLayout>
      <Card className="auth-card-glass" style={styles.card}>
        {/* Heading */}
        <div style={styles.headingBlock}>
          <h1 style={styles.title}>Reset your password</h1>
          <p style={styles.subtitle}>
            Enter your account email and we'll send you a password reset link.
          </p>
        </div>

        {/* Error alert */}
        {error && (
          <Alert variant="error" style={{ marginBottom: '1.25rem' }}>
            <AlertTitle>Error</AlertTitle>
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

        {/* Success state */}
        {status === 'success' && (
          <div>
            <Alert variant="success" style={{ marginBottom: '1.25rem' }}>
              <AlertTitle>Check your inbox</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>

            {devResetUrl && (
              <div style={styles.devBox} role="alert">
                <div style={styles.devHeader}>
                  <span aria-hidden="true">🛠️</span>
                  <strong>Dev Mode — Password Reset Link</strong>
                </div>
                <a href={devResetUrl} style={styles.devLink} target="_blank" rel="noreferrer">
                  {devResetUrl}
                </a>
                <p style={styles.devHelp}>
                  Exposed only in development. Click or copy to reset password immediately.
                </p>
              </div>
            )}

            <Button
              className="w-full"
              variant="default"
              style={{ marginTop: '1rem', height: 'auto', padding: '0.75rem' }}
              onClick={() => { window.location.href = '/login'; }}
            >
              Back to Sign In
            </Button>
          </div>
        )}

        {/* Form — shown when not yet succeeded */}
        {status !== 'success' && (
          <form onSubmit={handleSubmit} noValidate>
            <div style={styles.field}>
              <label className="auth-label" htmlFor="forgot-email">Account Email</label>
              <Input
                id="forgot-email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="ff-input-glass"
                required
                autoComplete="email"
                placeholder="you@company.com"
              />
            </div>

            <Button
              id="forgot-submit"
              type="submit"
              style={styles.button}
              disabled={status === 'submitting'}
              className="saas-button-primary w-full"
            >
              {status === 'submitting' ? (
                <span style={styles.loadingRow}>
                  <Spinner className="size-4" />
                  Sending link…
                </span>
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </form>
        )}

        {/* Footer */}
        {status !== 'success' && (
          <div style={styles.footer}>
            <span style={styles.footerText}>Remember your password?</span>{' '}
            <Link to="/login" className="auth-link">Sign in</Link>
          </div>
        )}
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
  devBox: {
    background: 'rgba(251, 191, 36, 0.10)',
    border: '1px solid rgba(251, 191, 36, 0.30)',
    borderRadius: '8px',
    padding: '0.85rem',
    marginBottom: '1.25rem',
    fontSize: '0.825rem',
  },
  devHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    color: '#fbbf24',
    fontWeight: 700,
    marginBottom: '0.35rem',
  },
  devLink: {
    color: '#93c5fd',
    fontWeight: 600,
    wordBreak: 'break-all',
    display: 'block',
    marginBottom: '0.35rem',
    fontSize: '0.8rem',
  },
  devHelp: {
    color: 'rgba(255,255,255,0.50)',
    margin: 0,
    fontSize: '0.78rem',
  },
};

export default ForgotPasswordPage;
