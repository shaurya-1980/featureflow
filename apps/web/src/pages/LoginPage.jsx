/**
 * pages/LoginPage.jsx
 *
 * Premium glassmorphism login page using authentic Coss UI primitives:
 *  - Coss UI Card
 *  - Coss UI Input
 *  - Coss UI Button
 *  - Coss UI Alert
 *  - Coss UI Spinner
 * Wired to POST /api/auth/login via AuthContext.
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
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

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(false);

  const infoMessage = location.state?.message || '';

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setDetails([]);
    setLoading(true);

    try {
      await login(form);
      const destination = location.state?.from?.pathname || '/';
      navigate(destination, { replace: true });
    } catch (err) {
      const res = err.response?.data;
      setError(res?.error || 'Invalid credentials. Please check your email and password.');
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
          <h1 style={styles.title}>Welcome back</h1>
          <p style={styles.subtitle}>Sign in to submit requests and join discussions.</p>
        </div>

        {/* Info alert */}
        {infoMessage && (
          <Alert variant="info" style={{ marginBottom: '1.25rem' }}>
            <AlertTitle>Notice</AlertTitle>
            <AlertDescription>{infoMessage}</AlertDescription>
          </Alert>
        )}

        {/* Error alert */}
        {error && (
          <Alert variant="error" style={{ marginBottom: '1.25rem' }}>
            <AlertTitle>Sign In Error</AlertTitle>
            <AlertDescription>
              <div>{error}</div>
              {details.length > 0 && (
                <ul style={styles.detailList}>
                  {details.map((d, i) => (
                    <li key={i}>
                      <strong>{d.field}</strong>: {d.message}
                    </li>
                  ))}
                </ul>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div style={styles.field}>
            <label className="auth-label" htmlFor="login-email">Email address</label>
            <Input
              id="login-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="ff-input-glass"
              required
              autoComplete="email"
              placeholder="name@company.com"
            />
          </div>

          <div style={styles.field}>
            <div style={styles.passwordHeader}>
              <label className="auth-label" htmlFor="login-password" style={{ marginBottom: 0 }}>
                Password
              </label>
              <Link to="/forgot-password" className="auth-link" style={{ fontSize: '0.8rem' }}>
                Forgot password?
              </Link>
            </div>
            <div style={styles.passwordWrapper}>
              <Input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                className="ff-input-glass"
                style={{ paddingRight: '2.75rem' }}
                required
                autoComplete="current-password"
                placeholder="••••••••"
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

          <Button
            id="login-submit"
            type="submit"
            style={styles.button}
            disabled={loading}
            className="saas-button-primary w-full"
          >
            {loading ? (
              <span style={styles.loadingRow}>
                <Spinner className="size-4" />
                Signing in…
              </span>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        {/* Footer */}
        <div style={styles.footer}>
          <span style={styles.footerText}>Don't have an account?</span>{' '}
          <Link to="/signup" className="auth-link">
            Create an account
          </Link>
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
  passwordHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.4rem',
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

export default LoginPage;
