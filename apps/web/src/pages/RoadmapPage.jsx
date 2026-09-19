/**
 * pages/RoadmapPage.jsx
 *
 * Public 3-Column Kanban Roadmap Portal using authentic Coss UI primitives:
 *  - 3 Primary Columns: Planned, In Progress, Completed ("Under Review" strictly excluded)
 *  - Coss UI Card for roadmap cards
 *  - Coss UI Badge for Category, Status, and Column counts
 *  - Coss UI Avatar for author representation
 *  - Coss UI Skeleton for column skeletons
 *  - Coss UI Button for Retry CTA
 *  - Interactive Atomic Voting on roadmap cards with optimistic updates
 *  - Admin status management integration (Coss Select via AdminStatusSelect)
 *  - Responsive Kanban columns (3 side-by-side on desktop, stacked on mobile)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import Navbar from '../components/layout/Navbar.jsx';
import VoteButton from '../components/posts/VoteButton.jsx';
import MarkdownRenderer from '../components/posts/MarkdownRenderer.jsx';
import AuthPromptModal from '../components/posts/AuthPromptModal.jsx';
import AdminStatusSelect from '../components/admin/AdminStatusSelect.jsx';
import { useToast } from '../components/posts/Toast.jsx';
import { Card } from '../components/ui/card.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Avatar, AvatarFallback } from '../components/ui/avatar.jsx';
import { Button } from '../components/ui/button.jsx';
import { Skeleton } from '../components/ui/skeleton.jsx';
import {
  ROADMAP_COLUMNS,
  CATEGORY_STYLES,
  getAvatarColor,
} from '../utils/statusStyles.js';

const RoadmapCard = ({
  post,
  isAuthenticated,
  isAdmin,
  onAuthRequired,
  onVoteChange,
  onStatusChange,
}) => {
  const navigate = useNavigate();

  const categoryStyle = CATEGORY_STYLES[post.category] || {
    bg: '#f1f5f9',
    color: '#475569',
  };

  const authorName = post.author?.name || 'Community Member';
  const authorInitial = authorName.charAt(0).toUpperCase();
  const avatarBg = getAvatarColor(authorName);

  const formattedDate = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : '';

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
      style={styles.card}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View roadmap item: ${post.title}`}
    >
      {/* Top Meta: Category & Date / Admin Control */}
      <div style={styles.cardTopRow}>
        <Badge
          variant="outline"
          size="sm"
          style={{
            backgroundColor: categoryStyle.bg,
            color: categoryStyle.color,
            fontSize: '0.725rem',
            fontWeight: 700,
            padding: '0.15rem 0.45rem',
            borderRadius: '4px',
          }}
        >
          {post.category}
        </Badge>

        {isAdmin ? (
          <AdminStatusSelect
            postId={post._id}
            currentStatus={post.status}
            onStatusChange={onStatusChange}
            compact={true}
          />
        ) : (
          <span style={styles.cardDate}>{formattedDate}</span>
        )}
      </div>

      {/* Title */}
      <h3 style={styles.cardTitle}>{post.title}</h3>

      {/* Description Excerpt */}
      <div style={styles.cardExcerpt}>
        <MarkdownRenderer
          content={post.descriptionMarkdown}
          previewMode={true}
          maxChars={120}
        />
      </div>

      {/* Author attribution */}
      <div style={styles.authorRow}>
        <Avatar style={{ width: '18px', height: '18px' }} aria-hidden="true">
          <AvatarFallback
            style={{
              backgroundColor: avatarBg,
              color: '#ffffff',
              fontSize: '0.65rem',
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

      {/* Footer: Vote Button & Comments */}
      <div
        style={styles.cardFooter}
        onClick={(e) => e.stopPropagation()} // Keep voting isolated from card navigation
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
          style={styles.commentCount}
          onClick={handleCardClick}
          title="Click to view discussion"
        >
          <span style={styles.commentIcon}>💬</span>
          <span style={styles.commentNumber}>{post.commentCount || 0}</span>
        </div>
      </div>
    </Card>
  );
};

const RoadmapColumnSkeleton = () => (
  <div style={styles.skeletonContainer}>
    {[1, 2, 3].map((item) => (
      <Card key={`roadmap-skel-${item}`} style={styles.skeletonCard}>
        <Skeleton style={styles.skeletonTop} />
        <Skeleton style={styles.skeletonTitle} />
        <Skeleton style={styles.skeletonText} />
        <Skeleton style={styles.skeletonFooter} />
      </Card>
    ))}
  </div>
);

export const RoadmapPage = () => {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { addToast } = useToast();

  const [postsByStatus, setPostsByStatus] = useState({
    Planned: [],
    'In Progress': [],
    Completed: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authActionName, setAuthActionName] = useState('vote on roadmap features');

  // Fetch all Planned, In Progress, and Completed posts
  const fetchRoadmapData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [plannedRes, inProgressRes, completedRes] = await Promise.all([
        axiosClient.get('/posts?status=Planned&limit=50&sort=upvoted'),
        axiosClient.get('/posts?status=In Progress&limit=50&sort=upvoted'),
        axiosClient.get('/posts?status=Completed&limit=50&sort=newest'),
      ]);

      setPostsByStatus({
        Planned: plannedRes.data.posts || [],
        'In Progress': inProgressRes.data.posts || [],
        Completed: completedRes.data.posts || [],
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load public roadmap.');
      addToast('Could not load roadmap features. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchRoadmapData();
  }, [fetchRoadmapData]);

  const handleVoteChange = (postId, newVoteCount, newHasVoted) => {
    setPostsByStatus((prev) => {
      const updated = { ...prev };
      for (const columnKey of Object.keys(updated)) {
        updated[columnKey] = updated[columnKey].map((post) =>
          post._id === postId
            ? { ...post, voteCount: newVoteCount, hasVoted: newHasVoted }
            : post
        );
      }
      return updated;
    });
  };

  const handleStatusChange = (newStatus, updatedPost) => {
    fetchRoadmapData();
  };

  const handleAuthRequired = () => {
    setAuthActionName('vote on roadmap features');
    setIsAuthModalOpen(true);
  };

  const totalFeatures =
    postsByStatus.Planned.length +
    postsByStatus['In Progress'].length +
    postsByStatus.Completed.length;

  return (
    <div style={styles.container}>
      {/* Global Navigation */}
      <Navbar />

      {/* Hero Banner */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.heroBadge}>
            <span style={styles.heroBadgeIcon}>🚀</span>
            <span>Public Roadmap</span>
          </div>
          <h1 style={styles.heroTitle}>Product Roadmap & Live Milestones</h1>
          <p style={styles.heroSubtitle}>
            Follow what we are actively designing, building, and launching. Vote on scheduled
            features to help us prioritize what matters most to you.
          </p>
          {!loading && (
            <div style={styles.heroMetrics}>
              <Badge variant="secondary" size="lg" style={{ fontWeight: 600 }}>
                {totalFeatures} active roadmap items
              </Badge>
            </div>
          )}
        </div>
      </section>

      {/* Main Roadmap Kanban */}
      <main style={styles.main}>
        {error ? (
          <Card style={styles.errorContainer}>
            <span style={styles.errorIcon}>⚠️</span>
            <h2 style={styles.errorTitle}>Unable to Load Roadmap</h2>
            <p style={styles.errorSubtitle}>{error}</p>
            <Button
              type="button"
              onClick={fetchRoadmapData}
              variant="default"
            >
              Retry Loading Roadmap
            </Button>
          </Card>
        ) : (
          <div style={styles.kanbanGrid}>
            {ROADMAP_COLUMNS.map((col) => {
              const columnPosts = postsByStatus[col.key] || [];

              return (
                <section
                  key={col.key}
                  style={{
                    ...styles.column,
                    borderColor: col.borderColor,
                  }}
                  aria-labelledby={`col-header-${col.key}`}
                >
                  {/* Column Header */}
                  <div
                    style={{
                      ...styles.columnHeader,
                      backgroundColor: col.headerBg,
                      borderBottomColor: col.borderColor,
                    }}
                  >
                    <div style={styles.columnHeaderTop}>
                      <div style={styles.columnHeaderLeft}>
                        <span style={styles.columnIcon} aria-hidden="true">
                          {col.icon}
                        </span>
                        <h2
                          id={`col-header-${col.key}`}
                          style={{
                            ...styles.columnTitle,
                            color: col.headerColor,
                          }}
                        >
                          {col.label}
                        </h2>
                      </div>
                      <Badge
                        variant="outline"
                        size="sm"
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          color: col.headerColor,
                          borderColor: col.borderColor,
                          fontWeight: 700,
                        }}
                      >
                        {loading ? '...' : columnPosts.length}
                      </Badge>
                    </div>
                    <p style={styles.columnDescription}>{col.description}</p>
                  </div>

                  {/* Column Body / Cards */}
                  <div style={styles.columnCardsList}>
                    {loading ? (
                      <RoadmapColumnSkeleton />
                    ) : columnPosts.length === 0 ? (
                      <div style={styles.emptyState}>
                        <span style={styles.emptyIcon}>✨</span>
                        <h4 style={styles.emptyTitle}>{col.emptyMessage}</h4>
                        <p style={styles.emptySubtext}>{col.emptySubtext}</p>
                      </div>
                    ) : (
                      columnPosts.map((post) => (
                        <RoadmapCard
                          key={post._id}
                          post={post}
                          isAuthenticated={isAuthenticated}
                          isAdmin={isAdmin}
                          onAuthRequired={handleAuthRequired}
                          onVoteChange={handleVoteChange}
                          onStatusChange={handleStatusChange}
                        />
                      ))
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      {/* Auth Prompt Modal */}
      <AuthPromptModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        actionName={authActionName}
      />
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: 'var(--bg-app)',
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-primary)',
  },
  hero: {
    backgroundColor: 'var(--bg-card)',
    borderBottom: '1px solid var(--border-subtle)',
    padding: '2.5rem 1.5rem',
    textAlign: 'center',
  },
  heroContent: {
    maxWidth: '720px',
    margin: '0 auto',
  },
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.25rem 0.75rem',
    backgroundColor: 'var(--color-brand-subtle)',
    color: 'var(--color-brand)',
    borderRadius: '9999px',
    fontSize: '0.8rem',
    fontWeight: 700,
    marginBottom: '1rem',
    border: '1px solid var(--color-brand-border)',
  },
  heroBadgeIcon: {
    fontSize: '0.9rem',
  },
  heroTitle: {
    fontSize: '2.15rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    letterSpacing: '-0.025em',
    marginBottom: '0.75rem',
  },
  heroSubtitle: {
    fontSize: '1.05rem',
    color: 'var(--text-muted)',
    lineHeight: 1.6,
  },
  heroMetrics: {
    marginTop: '1rem',
  },
  main: {
    maxWidth: '1380px',
    margin: '2rem auto',
    padding: '0 1.5rem 4rem 1.5rem',
  },
  kanbanGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '1.5rem',
    alignItems: 'flex-start',
  },
  column: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '12px',
    border: '1px solid var(--border-subtle)',
    boxShadow: 'var(--shadow-xs)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '480px',
  },
  columnHeader: {
    padding: '1.25rem',
    borderBottom: '1px solid',
  },
  columnHeaderTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.35rem',
  },
  columnHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  columnIcon: {
    fontSize: '1.2rem',
  },
  columnTitle: {
    fontSize: '1.15rem',
    fontWeight: 700,
    margin: 0,
    letterSpacing: '-0.01em',
  },
  columnDescription: {
    fontSize: '0.825rem',
    color: 'var(--text-muted)',
    margin: 0,
    lineHeight: 1.4,
  },
  columnCardsList: {
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    flex: 1,
  },
  card: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '8px',
    border: '1px solid var(--border-subtle)',
    padding: '1.15rem',
    boxShadow: 'var(--shadow-xs)',
    cursor: 'pointer',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
    outline: 'none',
    display: 'flex',
    flexDirection: 'column',
  },
  cardTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.65rem',
    gap: '0.5rem',
  },
  cardDate: {
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
  cardTitle: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: '0 0 0.4rem 0',
    lineHeight: 1.35,
  },
  cardExcerpt: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    marginBottom: '0.85rem',
  },
  authorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    marginBottom: '0.85rem',
  },
  authorText: {
    color: 'var(--text-muted)',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '0.75rem',
    borderTop: '1px solid var(--border-subtle)',
  },
  commentCount: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    color: 'var(--text-secondary)',
    fontSize: '0.8rem',
    fontWeight: 600,
    padding: '0.2rem 0.4rem',
    borderRadius: '4px',
  },
  commentIcon: {
    fontSize: '0.85rem',
  },
  commentNumber: {
    color: 'var(--text-primary)',
  },
  emptyState: {
    padding: '3rem 1rem',
    textAlign: 'center',
    backgroundColor: 'var(--bg-subtle)',
    borderRadius: '8px',
    border: '1px dashed var(--border-medium)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: '2rem',
    marginBottom: '0.5rem',
  },
  emptyTitle: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: '0 0 0.25rem 0',
  },
  emptySubtext: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    maxWidth: '220px',
    lineHeight: 1.4,
    margin: 0,
  },
  skeletonContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
  },
  skeletonCard: {
    backgroundColor: 'var(--bg-subtle)',
    borderRadius: '8px',
    padding: '1rem',
    border: '1px solid var(--border-subtle)',
  },
  skeletonTop: {
    width: '70px',
    height: '16px',
    borderRadius: '4px',
    marginBottom: '0.65rem',
  },
  skeletonTitle: {
    width: '85%',
    height: '20px',
    borderRadius: '4px',
    marginBottom: '0.5rem',
  },
  skeletonText: {
    width: '100%',
    height: '14px',
    borderRadius: '4px',
    marginBottom: '0.85rem',
  },
  skeletonFooter: {
    width: '50px',
    height: '22px',
    borderRadius: '4px',
  },
  errorContainer: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '12px',
    border: '1px solid var(--border-subtle)',
    padding: '3.5rem 1.5rem',
    textAlign: 'center',
    maxWidth: '600px',
    margin: '0 auto',
  },
  errorIcon: {
    fontSize: '3rem',
    display: 'block',
    marginBottom: '1rem',
  },
  errorTitle: {
    fontSize: '1.4rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '0.5rem',
  },
  errorSubtitle: {
    color: 'var(--text-muted)',
    fontSize: '0.95rem',
    marginBottom: '1.5rem',
  },
};

export default RoadmapPage;
