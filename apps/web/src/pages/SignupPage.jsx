/**
 * pages/SignupPage.jsx
 *
 * Premium glassmorphism signup page using authentic Coss UI primitives:
 *  - Coss UI Card
 *  - Coss UI Input
 *  - Coss UI Button
 *  - Coss UI Alert
 *  - Coss UI Spinner
 * Wired to POST /api/auth/signup via AuthContext.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

const SignupPage = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [details, setDetails] = useState([]);
  const [devUrl, setDevUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setDetails([]);
    setDevUrl('');
    setLoading(true);

    try {
      const data = await signup(form);
      const verificationUrl =
        data.demoVerificationUrl ||
        data.devVerificationUrl ||
        data.data?.demoVerificationUrl;

      if (verificationUrl) {
        setDevUrl(verificationUrl);
      } else {
        navigate('/login', { state: { message: data.message } });
      }
    } catch (err) {
      const res = err.response?.data;
      setError(res?.error || 'Signup failed. Please check your inputs and try again.');
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
          <h1 style={styles.title}>Create your account</h1>
          <p style={styles.subtitle}>Join the community to shape the future of our product roadmap.</p>
        </div>

        {/* Demo verification URL section */}
        {devUrl && (
          <div style={styles.devBox} role="region" aria-label="Demo Verification Link">
            <div style={styles.devHeader}>
              <span aria-hidden="true" style={{ fontSize: '1.05rem' }}>✉️</span>
              <strong>Demo verification link (Simulated email verification)</strong>
            </div>
            <p style={styles.devHelp}>
              In this demo deployment, email dispatch is simulated. Your account has been created, and you can complete verification immediately using the link below:
            </p>
            <div style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}>
              <Button
                id="open-demo-verification-btn"
                type="button"
                className="saas-button-primary w-full"
                style={{ height: 'auto', padding: '0.65rem 1rem', fontSize: '0.875rem', fontWeight: 600 }}
                onClick={() => {
                  if (devUrl.startsWith('http')) {
                    try {
                      const parsed = new URL(devUrl);
                      navigate(`${parsed.pathname}${parsed.search}`);
                    } catch {
                      window.location.href = devUrl;
                    }
                  } else {
                    navigate(devUrl);
                  }
                }}
              >
                Open Demo Verification Link &rarr;
              </Button>
            </div>
            <a href={devUrl} style={styles.devLink}>
              {devUrl}
            </a>
            <p style={{ ...styles.devHelp, marginTop: '0.35rem' }}>
              After completing verification, you can{' '}
              <Link to="/login" className="auth-link" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                sign in
              </Link>
              .
            </p>
          </div>
        )}

        {/* Error alert */}
        {error && (
          <Alert variant="error" style={{ marginBottom: '1.25rem' }}>
            <AlertTitle>Signup Error</AlertTitle>
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
            <label className="auth-label" htmlFor="signup-name">Full Name</label>
            <Input
              id="signup-name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              className="ff-input-glass"
              required
              autoComplete="name"
              placeholder="Jane Doe"
            />
          </div>

          <div style={styles.field}>
            <label className="auth-label" htmlFor="signup-email">Work Email</label>
            <Input
              id="signup-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="ff-input-glass"
              required
              autoComplete="email"
              placeholder="jane@company.com"
            />
          </div>

          <div style={styles.field}>
            <label className="auth-label" htmlFor="signup-password">Password</label>
            <div style={styles.passwordWrapper}>
              <Input
                id="signup-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
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
            <p style={styles.fieldHelp}>At least 8 characters with letters and numbers.</p>
          </div>

          <Button
            id="signup-submit"
            type="submit"
            style={styles.button}
            disabled={loading}
            className="saas-button-primary w-full"
          >
            {loading ? (
              <span style={styles.loadingRow}>
                <Spinner className="size-4" />
                Creating account…
              </span>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        {/* Footer */}
        <div style={styles.footer}>
          <span style={styles.footerText}>Already have an account?</span>{' '}
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
  fieldHelp: {
    fontSize: '0.75rem',
    color: 'rgba(255,255,255,0.40)',
    marginTop: '0.35rem',
    marginBottom: 0,
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

export default SignupPage;
