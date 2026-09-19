/**
 * components/ui/ThemeToggle.jsx
 *
 * Compact dark/light mode toggle button using Coss UI Button primitive.
 * Uses inline SVG sun/moon icons — no external icon library needed.
 * Includes smooth icon swap animation, tooltip, and accessible aria-label.
 */

import React from 'react';
import { useTheme } from '../../context/ThemeContext.jsx';
import { Button } from './button.jsx';

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
    <path
      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ThemeToggle = ({ style = {} }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        width: '34px',
        height: '34px',
        borderRadius: '8px',
        border: '1px solid var(--border-medium)',
        backgroundColor: 'var(--bg-card)',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        transition: 'background-color 200ms ease, border-color 200ms ease, color 200ms ease, transform 150ms ease',
        flexShrink: 0,
        ...style,
      }}
      className="hover:scale-105"
    >
      <span
        style={{
          display: 'flex',
          transition: 'transform 200ms ease, opacity 200ms ease',
          transform: isDark ? 'rotate(-20deg)' : 'rotate(0deg)',
        }}
      >
        {isDark ? <SunIcon /> : <MoonIcon />}
      </span>
    </Button>
  );
};

export default ThemeToggle;
