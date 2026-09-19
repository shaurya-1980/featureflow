/**
 * components/brand/FeatureFlowLogo.jsx
 *
 * Original, hand-authored SVG brand mark for FeatureFlow.
 *
 * Design concept: An abstract "F" formed by three connected nodes with
 * flowing bezier paths — visually communicating "ideas flowing forward
 * through a feedback loop into product." The mark works at 16px favicon
 * size and scales cleanly to full wordmark lockup.
 *
 * Variants:
 *  - "icon"     → square mark only (default 32px)
 *  - "wordmark" → icon + "FeatureFlow" text side-by-side
 *  - "stacked"  → icon above text (auth page header)
 *
 * The gradient is indigo → electric blue → violet, restrained to 3 stops.
 * All markup is original vector art — not sourced from any icon pack.
 */

import React from 'react';

// Deterministic gradient ID avoids SSR/multi-instance collisions
const GRAD_ID = 'ff-brand-gradient';
const GRAD_GLOW_ID = 'ff-brand-glow';

export const FeatureFlowLogo = ({
  variant = 'wordmark',
  size = 32,
  className = '',
  style = {},
  textColor,
}) => {
  // Icon SVG: three connected nodes with bezier "flow" arcs forming abstract F
  // Node positions: top-left (A), mid-right (B), mid-left (C)
  // Paths: A→B (upper arc, horizontal), A→C (vertical stem), C→B (short horizontal)
  const iconSvg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={GRAD_ID} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4f46e5" />   {/* indigo */}
          <stop offset="50%" stopColor="#2563eb" />   {/* electric blue */}
          <stop offset="100%" stopColor="#7c3aed" />  {/* violet */}
        </linearGradient>
        <filter id={GRAD_GLOW_ID} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Rounded background square */}
      <rect
        x="0" y="0" width="32" height="32"
        rx="8" ry="8"
        fill={`url(#${GRAD_ID})`}
        opacity="0.12"
      />

      {/* Flow path: upper arm (top node → upper-right junction) */}
      <path
        d="M 7 8 Q 16 6 22 10"
        stroke={`url(#${GRAD_ID})`}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
        filter={`url(#${GRAD_GLOW_ID})`}
      />

      {/* Flow path: mid crossbar (stem → mid-right) */}
      <path
        d="M 7 16 Q 14 14 19 16"
        stroke={`url(#${GRAD_ID})`}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Vertical stem */}
      <path
        d="M 7 8 L 7 25"
        stroke={`url(#${GRAD_ID})`}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Node: top-left anchor */}
      <circle cx="7" cy="8" r="2.5" fill={`url(#${GRAD_ID})`} />

      {/* Node: upper-right junction */}
      <circle cx="22" cy="10" r="2" fill="#2563eb" opacity="0.85" />

      {/* Node: mid-left crossbar anchor */}
      <circle cx="7" cy="16" r="2" fill={`url(#${GRAD_ID})`} />

      {/* Node: mid-right crossbar end */}
      <circle cx="19" cy="16" r="1.8" fill="#7c3aed" opacity="0.8" />

      {/* Node: bottom anchor */}
      <circle cx="7" cy="25" r="2.5" fill={`url(#${GRAD_ID})`} />

      {/* Small directional arrow-dot at upper-right to imply forward motion */}
      <circle cx="25" cy="10" r="1.2" fill="#4f46e5" opacity="0.5" />
    </svg>
  );

  const tc = textColor || 'currentColor';

  if (variant === 'icon') {
    return (
      <span
        className={className}
        style={{ display: 'inline-flex', alignItems: 'center', ...style }}
        aria-label="FeatureFlow"
      >
        {iconSvg}
      </span>
    );
  }

  if (variant === 'stacked') {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
          ...style,
        }}
        aria-label="FeatureFlow"
      >
        {React.cloneElement(iconSvg, { width: size * 1.5, height: size * 1.5 })}
        <span
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 800,
            fontSize: size * 0.6 + 'px',
            letterSpacing: '-0.03em',
            color: tc,
            background: 'linear-gradient(135deg, #4f46e5, #2563eb, #7c3aed)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          FeatureFlow
        </span>
      </div>
    );
  }

  // Default: wordmark (icon + text side-by-side)
  const fontSize = Math.max(14, size * 0.5);
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.45rem',
        ...style,
      }}
      aria-label="FeatureFlow"
    >
      {iconSvg}
      <span
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 800,
          fontSize: fontSize + 'px',
          letterSpacing: '-0.03em',
          color: tc,
        }}
      >
        FeatureFlow
      </span>
    </span>
  );
};

export default FeatureFlowLogo;
