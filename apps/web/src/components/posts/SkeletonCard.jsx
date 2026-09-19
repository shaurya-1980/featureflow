/**
 * components/posts/SkeletonCard.jsx
 *
 * Loading skeleton component matching the FeatureCard layout using authentic Coss UI Skeleton.
 * Provides shimmering placeholders while feed data is being fetched.
 */

import React from 'react';
import { Skeleton } from '../ui/skeleton.jsx';
import { Card } from '../ui/card.jsx';

export const SkeletonCard = () => {
  return (
    <Card style={styles.card}>
      <div style={styles.topRow}>
        <Skeleton style={styles.badgeSkeleton} />
        <Skeleton style={styles.badgeSkeleton} />
      </div>

      <Skeleton style={styles.titleSkeleton} />
      <Skeleton style={styles.descSkeletonLine1} />
      <Skeleton style={styles.descSkeletonLine2} />

      <div style={styles.bottomRow}>
        <Skeleton style={styles.voteBtnSkeleton} />
        <Skeleton style={styles.metaSkeleton} />
      </div>
    </Card>
  );
};

export const SkeletonFeed = ({ count = 4 }) => {
  return (
    <div style={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={`skel-feed-item-${i}`} />
      ))}
    </div>
  );
};

export const SkeletonPostDetail = () => {
  return (
    <Card style={styles.detailCard}>
      <div style={styles.detailBadgeRow}>
        <Skeleton style={styles.badgeSkeleton} />
        <Skeleton style={styles.badgeSkeleton} />
      </div>
      <Skeleton style={{ ...styles.titleSkeleton, width: '80%', height: '36px' }} />
      <Skeleton style={{ ...styles.descSkeletonLine1, width: '220px', height: '24px', marginBottom: '1.5rem' }} />
      <Skeleton style={{ ...styles.descSkeletonLine1, height: '18px' }} />
      <Skeleton style={{ ...styles.descSkeletonLine1, width: '92%', height: '18px' }} />
      <Skeleton style={{ ...styles.descSkeletonLine2, width: '85%', height: '18px' }} />
    </Card>
  );
};

const styles = {
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  card: {
    backgroundColor: 'var(--bg-card)',
    padding: '1.5rem',
    borderRadius: '8px',
    border: '1px solid var(--border-subtle)',
    boxShadow: 'var(--shadow-xs)',
  },
  detailCard: {
    backgroundColor: 'var(--bg-card)',
    padding: '2rem',
    borderRadius: '12px',
    border: '1px solid var(--border-subtle)',
    boxShadow: 'var(--shadow-xs)',
  },
  detailBadgeRow: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  topRow: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '0.85rem',
  },
  badgeSkeleton: {
    width: '75px',
    height: '22px',
    borderRadius: '4px',
  },
  titleSkeleton: {
    width: '65%',
    height: '24px',
    borderRadius: '4px',
    marginBottom: '0.75rem',
  },
  descSkeletonLine1: {
    width: '95%',
    height: '16px',
    borderRadius: '4px',
    marginBottom: '0.4rem',
  },
  descSkeletonLine2: {
    width: '80%',
    height: '16px',
    borderRadius: '4px',
    marginBottom: '1.25rem',
  },
  bottomRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '0.75rem',
    borderTop: '1px solid var(--border-subtle)',
  },
  voteBtnSkeleton: {
    width: '65px',
    height: '32px',
    borderRadius: '6px',
  },
  metaSkeleton: {
    width: '120px',
    height: '16px',
    borderRadius: '4px',
  },
};

export default SkeletonCard;
