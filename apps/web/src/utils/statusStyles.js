export const STATUS_OPTIONS = [
  'Under Review',
  'Planned',
  'In Progress',
  'Completed',
];

export const ROADMAP_COLUMNS = [
  {
    key: 'Planned',
    label: 'Planned',
    icon: '📋',
    description: 'Prioritized ideas scheduled for upcoming development.',
    emptyMessage: 'No features planned yet',
    emptySubtext: 'Feature requests will appear here once prioritized by the team.',
    headerBg: 'var(--status-planned-bg)',
    headerColor: 'var(--status-planned-text)',
    borderColor: 'var(--status-planned-border)',
    dotColor: 'var(--status-planned-dot)',
  },
  {
    key: 'In Progress',
    label: 'In Progress',
    icon: '🚀',
    description: 'Features currently being actively developed and tested.',
    emptyMessage: 'No features in progress',
    emptySubtext: 'Work in progress will appear here as engineering begins.',
    headerBg: 'var(--status-progress-bg)',
    headerColor: 'var(--status-progress-text)',
    borderColor: 'var(--status-progress-border)',
    dotColor: 'var(--status-progress-dot)',
  },
  {
    key: 'Completed',
    label: 'Completed',
    icon: '✅',
    description: 'Features shipped and live in production.',
    emptyMessage: 'No features completed yet',
    emptySubtext: 'Shipped features will be celebrated here.',
    headerBg: 'var(--status-completed-bg)',
    headerColor: 'var(--status-completed-text)',
    borderColor: 'var(--status-completed-border)',
    dotColor: 'var(--status-completed-dot)',
  },
];

export const STATUS_STYLES = {
  'Under Review': {
    bg: 'var(--status-review-bg)',
    color: 'var(--status-review-text)',
    border: 'var(--status-review-border)',
    dot: 'var(--status-review-dot)',
  },
  'Planned': {
    bg: 'var(--status-planned-bg)',
    color: 'var(--status-planned-text)',
    border: 'var(--status-planned-border)',
    dot: 'var(--status-planned-dot)',
  },
  'In Progress': {
    bg: 'var(--status-progress-bg)',
    color: 'var(--status-progress-text)',
    border: 'var(--status-progress-border)',
    dot: 'var(--status-progress-dot)',
  },
  'Completed': {
    bg: 'var(--status-completed-bg)',
    color: 'var(--status-completed-text)',
    border: 'var(--status-completed-border)',
    dot: 'var(--status-completed-dot)',
  },
};

export const CATEGORY_STYLES = {
  'UI/UX':         { bg: 'var(--color-brand-subtle)',  color: 'var(--color-brand)',   border: 'var(--color-brand-border)' },
  'Integrations':  { bg: 'var(--color-info-bg)',       color: 'var(--color-info)',    border: 'var(--color-info-border)' },
  'Performance':   { bg: 'var(--color-danger-bg)',     color: 'var(--color-danger)',  border: 'var(--color-danger-border)' },
  'General':       { bg: 'var(--bg-subtle)',           color: 'var(--text-secondary)', border: 'var(--border-medium)' },
};

export const getAvatarColor = (name = '') => {
  const colors = [
    '#2563eb',
    '#7c3aed',
    '#db2777',
    '#d97706',
    '#059669',
    '#0891b2',
    '#4f46e5',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};
