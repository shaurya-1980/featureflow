/**
 * components/layout/Navbar.jsx
 *
 * Polished SaaS navigation bar using authentic Coss UI primitives:
 *  - Original SVG brand logo (FeatureFlowLogo)
 *  - Primary nav links (Features, Roadmap, Admin if admin role)
 *  - Active route highlighting with subtle pill treatment
 *  - Coss UI Avatar with deterministic color & initials fallback
 *  - Coss UI Badge for Admin Portal and role indicators
 *  - Dark / light theme toggle (ThemeToggle using Coss Button)
 *  - Mobile responsive hamburger menu with accessible drawer
 *  - Coss UI Buttons for auth and logout actions
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getAvatarColor } from '../../utils/statusStyles.js';
import FeatureFlowLogo from '../brand/FeatureFlowLogo.jsx';
import ThemeToggle from '../ui/ThemeToggle.jsx';
import { Button } from '../ui/button.jsx';
import { Badge } from '../ui/badge.jsx';
import { Avatar, AvatarFallback } from '../ui/avatar.jsx';

export const Navbar = () => {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = user?.role === 'admin';
  const currentPath = location.pathname;

  const isFeaturesActive = currentPath === '/' || currentPath.startsWith('/posts');
  const isRoadmapActive = currentPath === '/roadmap';
  const isAdminActive = currentPath === '/admin';

  const authorName = user?.name || 'User';
  const authorInitial = authorName.charAt(0).toUpperCase();
  const avatarBg = getAvatarColor(authorName);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header style={styles.header}>
      <div style={styles.navContainer}>
        {/* Brand & Left Navigation */}
        <div style={styles.brandAndNav}>
          <Link to="/" style={styles.brandLink} onClick={closeMobileMenu} aria-label="FeatureFlow home">
            <FeatureFlowLogo variant="wordmark" size={28} textColor="var(--text-primary)" />
          </Link>

          <nav style={styles.primaryNav} aria-label="Main Navigation">
            <Link
              to="/"
              style={{
                ...styles.navLink,
                ...(isFeaturesActive ? styles.navLinkActive : {}),
              }}
            >
              <span style={styles.navLinkIcon} aria-hidden="true">💡</span>
              <span>Features</span>
            </Link>

            <Link
              to="/roadmap"
              style={{
                ...styles.navLink,
                ...(isRoadmapActive ? styles.navLinkActive : {}),
              }}
            >
              <span style={styles.navLinkIcon} aria-hidden="true">🗺️</span>
              <span>Roadmap</span>
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                style={{
                  ...styles.navLink,
                  ...(isAdminActive ? styles.navLinkActive : {}),
                  ...styles.adminNavLink,
                }}
              >
                <span style={styles.navLinkIcon} aria-hidden="true">🛡️</span>
                <span>Admin</span>
                <Badge
                  variant="outline"
                  size="sm"
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '0.1rem 0.35rem',
                    backgroundColor: 'var(--status-review-bg)',
                    color: 'var(--status-review-text)',
                    borderColor: 'var(--status-review-border)',
                  }}
                >
                  Portal
                </Badge>
              </Link>
            )}
          </nav>
        </div>

        {/* Desktop Right: Theme Toggle + Session / Auth Controls */}
        <div className="desktop-nav-right" style={styles.desktopNavRight}>
          <ThemeToggle style={{ marginRight: '0.65rem' }} />

          {loading ? (
            <div style={{ width: '140px', height: '36px' }} />
          ) : isAuthenticated ? (
            <div style={styles.userSection}>
              <div style={styles.userInfo}>
                <Avatar style={{ width: '32px', height: '32px' }} aria-hidden="true">
                  <AvatarFallback
                    style={{
                      backgroundColor: avatarBg,
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                    }}
                  >
                    {authorInitial}
                  </AvatarFallback>
                </Avatar>
                <div style={styles.userMeta}>
                  <span style={styles.userName}>{user?.name}</span>
                  <Badge
                    variant="outline"
                    size="sm"
                    style={{
                      fontSize: '0.65rem',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      padding: '0.05rem 0.35rem',
                      borderRadius: 'var(--radius-xs)',
                      letterSpacing: '0.03em',
                      backgroundColor: isAdmin ? 'var(--status-review-bg)' : 'var(--bg-subtle)',
                      color: isAdmin ? 'var(--status-review-text)' : 'var(--text-secondary)',
                      borderColor: isAdmin ? 'var(--status-review-border)' : 'var(--border-medium)',
                      alignSelf: 'flex-start',
                    }}
                  >
                    {user?.role}
                  </Badge>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                style={styles.logoutButton}
                title="Sign out of your account"
              >
                Log Out
              </Button>
            </div>
          ) : (
            <div style={styles.authLinks}>
              <Link to="/login" style={styles.loginLink}>
                Log In
              </Link>
              <Link to="/signup" style={styles.signupLink}>
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          style={styles.hamburgerButton}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
        >
          <span style={styles.hamburgerIcon}>{mobileMenuOpen ? '✕' : '☰'}</span>
        </Button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div style={styles.mobileMenuDropdown} className="animate-slide-in-top">
          <nav style={styles.mobileNavLinks} aria-label="Mobile Navigation">
            <Link
              to="/"
              style={{
                ...styles.mobileNavLink,
                ...(isFeaturesActive ? styles.mobileNavLinkActive : {}),
              }}
              onClick={closeMobileMenu}
            >
              <span>💡 Features</span>
            </Link>

            <Link
              to="/roadmap"
              style={{
                ...styles.mobileNavLink,
                ...(isRoadmapActive ? styles.mobileNavLinkActive : {}),
              }}
              onClick={closeMobileMenu}
            >
              <span>🗺️ Roadmap</span>
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                style={{
                  ...styles.mobileNavLink,
                  ...(isAdminActive ? styles.mobileNavLinkActive : {}),
                }}
                onClick={closeMobileMenu}
              >
                <span>🛡️ Admin Portal</span>
              </Link>
            )}
          </nav>

          <div style={styles.mobileAuthSection}>
            {loading ? (
              <div style={{ height: '40px' }} />
            ) : isAuthenticated ? (
              <div style={styles.mobileUserBox}>
                <div style={styles.mobileUserInfo}>
                  <Avatar style={{ width: '32px', height: '32px' }} aria-hidden="true">
                    <AvatarFallback
                      style={{
                        backgroundColor: avatarBg,
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                      }}
                    >
                      {authorInitial}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div style={styles.userName}>{user?.name}</div>
                    <div style={styles.userEmail}>{user?.email}</div>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    closeMobileMenu();
                    logout();
                  }}
                  style={styles.mobileLogoutButton}
                >
                  Log Out
                </Button>
              </div>
            ) : (
              <div style={styles.mobileAuthButtons}>
                <Link to="/login" style={styles.mobileLoginLink} onClick={closeMobileMenu}>
                  Log In
                </Link>
                <Link to="/signup" style={styles.mobileSignupLink} onClick={closeMobileMenu}>
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

const styles = {
  header: {
    backgroundColor: 'var(--navbar-bg)',
    backdropFilter: 'blur(12px) saturate(160%)',
    WebkitBackdropFilter: 'blur(12px) saturate(160%)',
    borderBottom: '1px solid var(--navbar-border)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: 'var(--shadow-xs)',
    transition: 'background-color var(--transition-normal), border-color var(--transition-normal)',
  },
  navContainer: {
    maxWidth: '1280px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 1.5rem',
  },
  brandAndNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
  },
  brandLink: {
    display: 'flex',
    alignItems: 'center',
    textDecoration: 'none',
    color: 'var(--text-primary)',
  },
  primaryNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
  },
  navLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.45rem 0.85rem',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: 500,
    transition: 'all var(--transition-fast)',
  },
  navLinkActive: {
    color: 'var(--color-brand)',
    backgroundColor: 'var(--color-brand-subtle)',
    fontWeight: 600,
  },
  navLinkIcon: {
    fontSize: '0.95rem',
  },
  adminNavLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
  },
  desktopNavRight: {
    display: 'flex',
    alignItems: 'center',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  },
  userMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.1rem',
  },
  userName: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    lineHeight: 1.2,
  },
  userEmail: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  logoutButton: {
    padding: '0.35rem 0.8rem',
    backgroundColor: 'var(--bg-card)',
    color: 'var(--color-danger)',
    border: '1px solid var(--color-danger-border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.825rem',
    fontWeight: 600,
    transition: 'all var(--transition-fast)',
  },
  authLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  loginLink: {
    padding: '0.45rem 0.95rem',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: 500,
    borderRadius: 'var(--radius-md)',
    transition: 'color var(--transition-fast)',
  },
  signupLink: {
    padding: '0.45rem 1rem',
    backgroundColor: 'var(--color-brand)',
    color: '#ffffff',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: 600,
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-xs)',
    transition: 'background-color var(--transition-fast)',
  },
  hamburgerButton: {
    display: 'none',
    padding: '0.4rem',
    color: 'var(--text-primary)',
    fontSize: '1.25rem',
  },
  mobileMenuDropdown: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--bg-card)',
    borderTop: '1px solid var(--border-subtle)',
    padding: '1rem 1.5rem',
    boxShadow: 'var(--shadow-md)',
  },
  mobileNavLinks: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  mobileNavLink: {
    padding: '0.6rem 0.75rem',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
    fontWeight: 500,
    transition: 'all var(--transition-fast)',
  },
  mobileNavLinkActive: {
    backgroundColor: 'var(--color-brand-subtle)',
    color: 'var(--color-brand)',
    fontWeight: 600,
  },
  mobileAuthSection: {
    borderTop: '1px solid var(--border-subtle)',
    paddingTop: '1rem',
  },
  mobileUserBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  mobileUserInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  mobileLogoutButton: {
    width: '100%',
    padding: '0.5rem',
    borderRadius: 'var(--radius-md)',
    fontWeight: 600,
    fontSize: '0.875rem',
  },
  mobileAuthButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  mobileLoginLink: {
    textAlign: 'center',
    padding: '0.6rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-medium)',
    color: 'var(--text-primary)',
    fontWeight: 500,
    transition: 'all var(--transition-fast)',
  },
  mobileSignupLink: {
    textAlign: 'center',
    padding: '0.6rem',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-brand)',
    color: '#ffffff',
    fontWeight: 600,
  },
};

export default Navbar;
