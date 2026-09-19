/**
 * pages/VerifyEmailPage.jsx
 *
 * Premium glassmorphism email verification page using authentic Coss UI primitives:
 *  - Coss UI Card
 *  - Coss UI Input
 *  - Coss UI Button
 *  - Coss UI Alert
 *  - Coss UI Spinner
 * Token from URL query (?token=...) triggers auto-verification on mount.
 * Manual token entry also supported.
 * Calls POST /api/auth/verify-email.
 */

import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient.js';
import AuthLayout from '../components/layout/AuthLayout.jsx';
import { Card } from '../components/ui/card.jsx';
import { Input } from '../components/ui/input.jsx';
import { Button } from '../components/ui/button.jsx';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert.jsx';
import { Spinner } from '../components/ui/spinner.jsx';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const handleVerify = async (tokenToVerify) => {
    const activeToken = tokenToVerify || token;
    if (!activeToken) {
      setStatus('error');
      setMessage('Please provide a verification token.');
      return;
    }

    setStatus('verifying');
    setMessage('');

    try {
      const response = await axiosClient.post('/auth/verify-email', { token: activeToken });
      setStatus('success');
      setMessage(response.data?.message || 'Email verified successfully! You can now log in.');
    } catch (err) {
      setStatus('error');
      setMessage(
        err.response?.data?.error || 'Verification failed. Token may be invalid or expired.'
      );
    }
  };

  useEffect(() => {
    if (tokenFromUrl) {
      handleVerify(tokenFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenFromUrl]);

  return (
    <AuthLayout>
      <Card className="auth-card-glass" style={styles.card}>
        {/* Heading */}
        <div style={styles.headingBlock}>
          <h1 style={styles.title}>Email verification</h1>
          <p style={styles.subtitle}>Confirming your email unlocks full community participation.</p>
        </div>

        {/* Verifying state */}
        {status === 'verifying' && (
          <Alert variant="info" style={{ marginBottom: '1.25rem' }}>
            <AlertTitle className="flex items-center gap-2">
              <Spinner className="size-4" />
              Verifying
            </AlertTitle>
            <AlertDescription>
              Verifying your email address, please wait…
            </AlertDescription>
          </Alert>
        )}

        {/* Success state */}
        {status === 'success' && (
          <div>
            <Alert variant="success" style={{ marginBottom: '1.25rem' }}>
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
            <Button
              className="w-full"
              variant="default"
              style={{ marginTop: '1rem', height: 'auto', padding: '0.75rem', backgroundColor: '#16a34a' }}
              onClick={() => { window.location.href = '/login'; }}
            >
              Continue to Sign In
            </Button>
          </div>
        )}

        {/* Error state + manual token entry */}
        {status === 'error' && (
          <Alert variant="error" style={{ marginBottom: '1.25rem' }}>
            <AlertTitle>Verification Error</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {/* Manual token entry form — shown unless success */}
        {status !== 'success' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify(token);
            }}
          >
            {status === 'error' && (
              <p style={styles.manualHelp}>
                You can manually paste your verification token below:
              </p>
            )}
            <div style={styles.field}>
              <label className="auth-label" htmlFor="verify-token">Verification Token</label>
              <Input
                id="verify-token"
                name="token"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="ff-input-glass"
                placeholder="Paste verification token here"
                disabled={status === 'verifying'}
              />
            </div>

            <Button
              id="verify-submit"
              type="submit"
              style={styles.button}
              disabled={status === 'verifying' || !token.trim()}
              className="saas-button-primary w-full"
            >
              {status === 'verifying' ? (
                <span style={styles.loadingRow}>
                  <Spinner className="size-4" />
                  Verifying…
                </span>
              ) : (
                'Verify Email'
              )}
            </Button>
          </form>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          <span style={styles.footerText}>Back to</span>{' '}
          <Link to="/login" className="auth-link">Sign In</Link>
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
  manualHelp: {
    fontSize: '0.85rem',
    color: 'rgba(255,255,255,0.50)',
    marginBottom: '0.75rem',
    lineHeight: 1.4,
  },
  button: {
    width: '100%',
    padding: '0.75rem',
    marginTop: '0.25rem',
    height: 'auto',
  },
  loadingRow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
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

export default VerifyEmailPage;
