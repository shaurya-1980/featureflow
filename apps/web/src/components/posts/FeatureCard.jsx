/**
 * components/posts/FeatureCard.jsx
 *
 * Polished SaaS Feature Request Card using authentic Coss UI primitives:
 *  - Coss UI Card, CardHeader, CardTitle, CardPanel, CardFooter
 *  - Coss UI Badge for Category and Status indicators
 *  - Coss UI Avatar for author representation
 *  - Optimistic VoteButton interaction isolated from card navigation
 *  - Keyboard navigation (tabIndex 0, Enter/Space key triggers)
 *  - Micro-hover elevation (saas-card class)
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import VoteButton from './VoteButton.jsx';
import MarkdownRenderer from './MarkdownRenderer.jsx';
import { STATUS_STYLES, CATEGORY_STYLES, getAvatarColor } from '../../utils/statusStyles.js';
import { Card, CardHeader, CardTitle, CardPanel, CardFooter } from '../ui/card.jsx';
import { Badge } from '../ui/badge.jsx';
import { Avatar, AvatarFallback } from '../ui/avatar.jsx';

export const FeatureCard = ({
  post,
  isAuthenticated = false,
  onAuthRequired,
  onVoteChange,
}) => {
  const navigate = useNavigate();

  const statusStyle = STATUS_STYLES[post.status] || {
    bg: '#f1f5f9',
    color: '#475569',
    border: '#e2e8f0',
    dot: '#64748b',
  };

  const categoryStyle = CATEGORY_STYLES[post.category] || {
    bg: '#f1f5f9',
    color: '#475569',
    border: '#e2e8f0',
  };

  const formattedDate = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  const authorName = post.author?.name || 'Community Member';
  const authorInitial = authorName.charAt(0).toUpperCase();
  const avatarBg = getAvatarColor(authorName);

  const handleCardClick = () => {
    navigate(`/posts/${post._id}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  return (
    <Card
      className="saas-card"
      style={styles.card}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View feature request: ${post.title}`}
    >
      {/* Top Meta Row: Category badge & Status indicator */}
      <CardHeader style={styles.topRow}>
        <div style={styles.badgeGroup}>
          <Badge
            variant="outline"
            size="sm"
            style={{
              ...styles.categoryBadge,
              backgroundColor: categoryStyle.bg,
              color: categoryStyle.color,
              borderColor: categoryStyle.border,
            }}
          >
            {post.category}
          </Badge>

          <Badge
            variant="outline"
            size="sm"
            style={{
              ...styles.statusBadge,
              backgroundColor: statusStyle.bg,
              color: statusStyle.color,
              borderColor: statusStyle.border,
            }}
          >
            <span
              style={{
                ...styles.statusDot,
                backgroundColor: statusStyle.dot,
              }}
              aria-hidden="true"
            />
            {post.status}
          </Badge>
        </div>

        <time dateTime={post.createdAt} style={styles.dateText}>
          {formattedDate}
        </time>
      </CardHeader>

      {/* Feature Title */}
      <CardTitle style={styles.title}>{post.title}</CardTitle>

      {/* Description Excerpt */}
      <CardPanel style={styles.description}>
        <MarkdownRenderer
          content={post.descriptionMarkdown}
          previewMode={true}
          maxChars={180}
        />
      </CardPanel>

      {/* Author & Footer Action Row */}
      <CardFooter style={styles.footerRow}>
        <div style={styles.authorGroup}>
          <Avatar style={{ width: '24px', height: '24px' }} aria-hidden="true">
            <AvatarFallback
              style={{
                backgroundColor: avatarBg,
                color: '#ffffff',
                fontSize: '0.725rem',
                fontWeight: 700,
              }}
            >
              {authorInitial}
            </AvatarFallback>
          </Avatar>
          <span style={styles.authorText}>
            by <strong>{authorName}</strong>
          </span>
        </div>

        <div
          style={styles.engagementGroup}
          onClick={(e) => e.stopPropagation()} // Keep vote & comment clicks distinct from card link
        >
          <VoteButton
            postId={post._id}
            initialVoteCount={post.voteCount || 0}
            initialHasVoted={post.hasVoted || false}
            isAuthenticated={isAuthenticated}
            onAuthRequired={onAuthRequired}
            onVoteChange={onVoteChange}
          />

          <div
            style={styles.commentChip}
            onClick={handleCardClick}
            title="View discussion thread"
          >
            <span style={styles.commentIcon} aria-hidden="true">💬</span>
            <span style={styles.commentCount}>{post.commentCount || 0}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

const styles = {
  card: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-subtle)',
    padding: '1.25rem 1.5rem',
    boxShadow: 'var(--shadow-xs)',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    cursor: 'pointer',
    outline: 'none',
    marginBottom: '1rem',
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.65rem',
    padding: 0,
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  badgeGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  categoryBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.2rem 0.6rem',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.75rem',
    fontWeight: 600,
    border: '1px solid',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.2rem 0.6rem',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.75rem',
    fontWeight: 600,
    border: '1px solid',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  dateText: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  title: {
    fontSize: '1.15rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: '0 0 0.5rem 0',
    lineHeight: 1.35,
    letterSpacing: '-0.015em',
  },
  description: {
    color: 'var(--text-secondary)',
    fontSize: '0.925rem',
    lineHeight: 1.55,
    marginBottom: '1rem',
    padding: 0,
    flex: 1,
  },
  footerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    paddingTop: '0.75rem',
    borderTop: '1px solid var(--border-subtle)',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  authorGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.825rem',
    color: 'var(--text-muted)',
  },
  authorText: {
    color: 'var(--text-secondary)',
  },
  engagementGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  commentChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.4rem 0.65rem',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--bg-subtle)',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  commentIcon: {
    fontSize: '0.9rem',
  },
  commentCount: {
    color: 'var(--text-primary)',
    fontWeight: 700,
  },
};

export default FeatureCard;
