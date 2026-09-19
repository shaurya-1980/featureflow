/**
 * components/posts/FeedFilters.jsx
 *
 * Polished filter and sorting controls for Feature Feed using authentic Coss UI primitives:
 *  - Category pills (Coss Button)
 *  - Semantic status dropdown (Coss Select)
 *  - Sort options (Coss Select): Newest, Most Upvoted, Trending, Most Discussed
 *  - Mobile responsive wrap
 */

import React from 'react';
import { Button } from '../ui/button.jsx';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectItem,
} from '../ui/select.jsx';

const CATEGORIES = ['All', 'UI/UX', 'Integrations', 'Performance', 'General'];
const STATUSES = ['All', 'Under Review', 'Planned', 'In Progress', 'Completed'];

const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Most Upvoted', value: 'upvoted' },
  { label: 'Trending', value: 'trending' },
  { label: 'Most Discussed', value: 'discussed' },
];

export const FeedFilters = ({
  category = '',
  status = '',
  sort = 'newest',
  onCategoryChange,
  onStatusChange,
  onSortChange,
}) => {
  return (
    <div style={styles.container}>
      {/* Category Filter Pills */}
      <div style={styles.categorySection}>
        <div style={styles.pillGroup} role="tablist" aria-label="Filter by category">
          {CATEGORIES.map((cat) => {
            const isSelected = (!category && cat === 'All') || category === cat;
            return (
              <Button
                key={cat}
                type="button"
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                role="tab"
                aria-selected={isSelected}
                onClick={() => onCategoryChange(cat === 'All' ? '' : cat)}
                style={{
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.825rem',
                  padding: '0.35rem 0.75rem',
                  height: 'auto',
                }}
              >
                {cat}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Status & Sort Controls */}
      <div style={styles.rightControls}>
        {/* Status Dropdown */}
        <div style={styles.dropdownGroup}>
          <label htmlFor="status-select" style={styles.selectLabel}>
            Status:
          </label>
          <div style={{ minWidth: '130px' }}>
            <Select
              value={status || 'All'}
              onValueChange={(val) => onStatusChange(val === 'All' ? '' : val)}
            >
              <SelectTrigger id="status-select" size="sm">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectPopup>
                {STATUSES.map((st) => (
                  <SelectItem key={st} value={st}>
                    {st}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
          </div>
        </div>

        {/* Sort Dropdown */}
        <div style={styles.dropdownGroup}>
          <label htmlFor="sort-select" style={styles.selectLabel}>
            Sort:
          </label>
          <div style={{ minWidth: '150px' }}>
            <Select
              value={sort}
              onValueChange={(val) => onSortChange(val)}
            >
              <SelectTrigger id="sort-select" size="sm">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectPopup>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.85rem 0',
    borderBottom: '1px solid var(--border-subtle)',
    marginBottom: '1.25rem',
  },
  categorySection: {
    display: 'flex',
    alignItems: 'center',
  },
  pillGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.35rem',
  },
  rightControls: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  dropdownGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  selectLabel: {
    fontSize: '0.825rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
  },
};

export default FeedFilters;
