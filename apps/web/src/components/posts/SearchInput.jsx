/**
 * components/posts/SearchInput.jsx
 *
 * Polished Search input field with a 400ms debounce using Coss UI Input:
 *  - SVG search icon
 *  - Quick-clear (x) button when text is present
 *  - Preserves debounce logic & stale response guard
 *  - Visible focus ring
 */

import React, { useState, useEffect } from 'react';
import { Input } from '../ui/input.jsx';

export const SearchInput = ({ value = '', onChange, placeholder = 'Search features by keyword or tag...' }) => {
  const [localValue, setLocalValue] = useState(value);

  // Synchronize local input if parent resets it
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounce notification to parent
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [localValue, value, onChange]);

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <div style={styles.wrapper}>
      <svg
        style={styles.searchIcon}
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>

      <Input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        style={styles.input}
        aria-label="Search feature requests"
      />

      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          style={styles.clearBtn}
          aria-label="Clear search query"
          title="Clear search"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
};

const styles = {
  wrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    maxWidth: '420px',
  },
  searchIcon: {
    position: 'absolute',
    left: '0.85rem',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
    zIndex: 1,
  },
  input: {
    paddingLeft: '2.5rem',
    paddingRight: '2.25rem',
  },
  clearBtn: {
    position: 'absolute',
    right: '0.65rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-subtle)',
    border: 'none',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: 0,
    zIndex: 1,
    transition: 'all var(--transition-fast)',
  },
};

export default SearchInput;
