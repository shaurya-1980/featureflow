/**
 * components/layout/AuthLayout.jsx
 *
 * Shared full-page auth background with:
 *  - Deep indigo→blue gradient (works in both light & dark theme modes)
 *  - Three animated gradient blobs for depth
 *  - Centered glass card slot for the form
 *  - FeatureFlow wordmark at top-left linking home
 *  - Subtle grid overlay texture
 */

import React from 'react';
import { Link } from 'react-router-dom';
import FeatureFlowLogo from '../brand/FeatureFlowLogo.jsx';

export const AuthLayout = ({ children }) => {
  return (
    <div style={styles.root}>
      {/* Background blobs */}
      <div style={{ ...styles.blob, ...styles.blob1 }} aria-hidden="true" />
      <div style={{ ...styles.blob, ...styles.blob2 }} aria-hidden="true" />
      <div style={{ ...styles.blob, ...styles.blob3 }} aria-hidden="true" />

      {/* Subtle grid overlay */}
      <div style={styles.grid} aria-hidden="true" />

      {/* Top-left brand mark */}
      <div style={styles.topBar}>
        <Link to="/" style={styles.brandLink} aria-label="FeatureFlow — go home">
          <FeatureFlowLogo variant="wordmark" size={26} textColor="#ffffff" />
        </Link>
      </div>

      {/* Form card slot */}
      <main style={styles.center}>
        <div style={styles.cardWrapper} className="animate-fade-in">
          {children}
        </div>
      </main>

      {/* Bottom tagline */}
      <footer style={styles.footer}>
        <span style={styles.footerText}>
          © {new Date().getFullYear()} FeatureFlow — Feature Request & Public Roadmap Portal
        </span>
      </footer>
    </div>
  );
};

const styles = {
  root: {
    minHeight: '100vh',
    position: 'relative',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, var(--auth-bg-from) 0%, var(--auth-bg-to) 100%)',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  },
  blob: {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(80px)',
    pointerEvents: 'none',
    willChange: 'transform',
  },
  blob1: {
    width: '520px',
    height: '520px',
    top: '-140px',
    left: '-120px',
    backgroundColor: 'var(--auth-blob-1)',
    animation: 'blobFloat 14s ease-in-out infinite',
  },
  blob2: {
    width: '420px',
    height: '420px',
    bottom: '-80px',
    right: '-100px',
    backgroundColor: 'var(--auth-blob-2)',
    animation: 'blobFloat 18s ease-in-out infinite reverse',
  },
  blob3: {
    width: '300px',
    height: '300px',
    top: '40%',
    left: '60%',
    backgroundColor: 'var(--auth-blob-3)',
    animation: 'authBlobPulse 10s ease-in-out infinite',
  },
  grid: {
    position: 'absolute',
    inset: 0,
    backgroundImage:
      'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
    backgroundSize: '48px 48px',
    pointerEvents: 'none',
  },
  topBar: {
    position: 'relative',
    zIndex: 10,
    padding: '1.5rem 2rem',
    flexShrink: 0,
  },
  brandLink: {
    display: 'inline-flex',
    alignItems: 'center',
    textDecoration: 'none',
  },
  center: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem 1.25rem 2rem',
    position: 'relative',
    zIndex: 10,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: '440px',
  },
  footer: {
    position: 'relative',
    zIndex: 10,
    textAlign: 'center',
    padding: '1.25rem',
    flexShrink: 0,
  },
  footerText: {
    fontSize: '0.775rem',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: '0.01em',
  },
};

export default AuthLayout;
