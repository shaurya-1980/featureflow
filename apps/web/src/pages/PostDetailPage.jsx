/**
 * pages/PostDetailPage.jsx
 *
 * Feature Request Detail View using authentic Coss UI primitives:
 *  - Shared Navbar (auth controls, nav links)
 *  - Breadcrumb / Back navigation to feed
 *  - Two-column layout on desktop (Content + Sticky Action Sidebar)
 *  - Feature Title, Category & Status badges (Coss Badge)
 *  - Admin: inline status management via AdminStatusSelect (Coss Select)
 *  - Author attribution with Coss Avatar
 *  - Full Markdown description rendered safely
 *  - Interactive VoteButton with optimistic voting (Coss Button)
 *  - Full Threaded Discussion Section (CommentSection with Coss primitives)
 *  - Loading skeleton (Coss Skeleton) & 404 Error handling
 *  - Toast notification system (Coss Toast)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import Navbar from '../components/layout/Navbar.jsx';
import MarkdownRenderer from '../components/posts/MarkdownRenderer.jsx';
import VoteButton from '../components/posts/VoteButton.jsx';
import CommentSection from '../components/comments/CommentSection.jsx';
import AuthPromptModal from '../components/posts/AuthPromptModal.jsx';
import AdminStatusSelect from '../components/admin/AdminStatusSelect.jsx';
import { useToast } from '../components/posts/Toast.jsx';
import { STATUS_STYLES, CATEGORY_STYLES, getAvatarColor } from '../utils/statusStyles.js';
import { Card } from '../components/ui/card.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Avatar, AvatarFallback } from '../components/ui/avatar.jsx';
import { Button } from '../components/ui/button.jsx';
import { Skeleton } from '../components/ui/skeleton.jsx';

export const PostDetailPage = () => {
  const { id: postId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const isAdmin = user?.role === 'admin';

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authActionName, setAuthActionName] = useState('participate in feature discussions');

  const fetchPost = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axiosClient.get(`/posts/${postId}`);
      setPost(data.post);
    } catch (err) {
      const status = err.response?.status;
      if (status === 404) {
        setError('Feature request not found.');
      } else {
        setError(err.response?.data?.error || 'Failed to load feature request.');
      }
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleAuthRequired = (action = 'vote on feature requests') => {
    setAuthActionName(action);
    setIsAuthModalOpen(true);
  };

  const handleVoteChange = (targetPostId, newVoteCount, newHasVoted) => {
    setPost((prev) => (prev ? { ...prev, voteCount: newVoteCount, hasVoted: newHasVoted } : prev));
  };

  const handleCommentCountChange = (updater) => {
    setPost((prev) => {
      if (!prev) return prev;
      const nextCount = typeof updater === 'function' ? updater(prev.commentCount || 0) : updater;
      return { ...prev, commentCount: Math.max(0, nextCount) };
    });
  };

  const handleStatusChange = (newStatus, updatedPost) => {
    setPost((prev) => (prev ? { ...prev, status: newStatus } : prev));
  };

  const authorName = post?.author?.name || 'Community Member';
  const authorInitial = authorName.charAt(0).toUpperCase();
  const avatarBg = getAvatarColor(authorName);

  const statusStyle = (post && STATUS_STYLES[post.status]) || {
    bg: '#f1f5f9',
    color: '#475569',
    border: '#e2e8f0',
    dot: '#64748b',
  };

  const categoryStyle = (post && CATEGORY_STYLES[post.category]) || {
    bg: '#f1f5f9',
    color: '#475569',
    border: '#e2e8f0',
  };

  const formattedDate = post?.createdAt
    ? new Date(post.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <div style={styles.container}>
      {/* Global Navigation */}
      <Navbar />

      {/* Main Content */}
      <main style={styles.main}>
        {/* Breadcrumb Navigation */}
        <div style={styles.breadcrumbRow}>
          <Link to="/" style={styles.backLink}>
            ← Back to all features
          </Link>
        </div>

        {loading ? (
          <Card style={styles.skeletonCard}>
            <Skeleton style={styles.skeletonBadges} />
            <Skeleton style={styles.skeletonTitle} />
            <Skeleton style={styles.skeletonAuthor} />
            <Skeleton style={styles.skeletonDesc1} />
            <Skeleton style={styles.skeletonDesc2} />
          </Card>
        ) : error ? (
          <Card style={styles.errorCard}>
            <span style={styles.errorIcon}>⚠️</span>
            <h2 style={styles.errorTitle}>{error}</h2>
            <p style={styles.errorSubtitle}>
              The feature request you are looking for may have been removed or does not exist.
            </p>
            <Button
              type="button"
              onClick={() => navigate('/')}
              variant="default"
            >
              Back to Feature Requests
            </Button>
          </Card>
        ) : post ? (
          <div className="detail-grid" style={styles.detailGrid}>
            {/* Primary Column (Left) */}
            <article style={styles.articleCard}>
              {/* Badges Row */}
              <div style={styles.badgeRow}>
                <div style={styles.badgeLeft}>
                  <Badge
                    variant="outline"
                    size="sm"
                    style={{
                      backgroundColor: categoryStyle.bg,
                      color: categoryStyle.color,
                      borderColor: categoryStyle.border,
                      padding: '0.2rem 0.65rem',
                      borderRadius: 'var(--radius-full)',
                    }}
                  >
                    {post.category}
                  </Badge>

                  <Badge
                    variant="outline"
                    size="sm"
                    style={{
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.color,
                      borderColor: statusStyle.border,
                      padding: '0.2rem 0.65rem',
                      borderRadius: 'var(--radius-full)',
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

                <span style={styles.dateText}>Submitted on {formattedDate}</span>
              </div>

              {/* Feature Title */}
              <h1 style={styles.title}>{post.title}</h1>

              {/* Author Attribution */}
              <div style={styles.authorRow}>
                <Avatar style={{ width: '32px', height: '32px' }} aria-hidden="true">
                  <AvatarFallback
                    style={{
                      backgroundColor: avatarBg,
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                    }}
                  >
                    {authorInitial}
                  </AvatarFallback>
                </Avatar>
                <div style={styles.authorMeta}>
                  <span style={styles.authorName}>{authorName}</span>
                  {post.author?.role === 'admin' && (
                    <Badge
                      variant="outline"
                      size="sm"
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        color: '#fbbf24',
                        borderColor: 'rgba(245, 158, 11, 0.3)',
                        textTransform: 'uppercase',
                      }}
                    >
                      Admin
                    </Badge>
                  )}
                </div>
              </div>

              {/* Markdown Description */}
              <div style={styles.descriptionContainer}>
                <MarkdownRenderer content={post.descriptionMarkdown} />
              </div>

              {/* Threaded Discussion */}
              <CommentSection
                postId={post._id}
                postAuthorId={post.author?._id}
                commentCount={post.commentCount || 0}
                onCommentCountChange={handleCommentCountChange}
                onAuthRequired={() => handleAuthRequired('participate in feature discussions')}
              />
            </article>

            {/* Sidebar Column (Right) */}
            <aside style={styles.sidebar}>
              {/* Vote Widget Card */}
              <Card style={styles.sidebarCard}>
                <h3 style={styles.sidebarCardTitle}>Support this Idea</h3>
                <p style={styles.sidebarCardText}>
                  Upvote to help our product team prioritize this request on the roadmap.
                </p>
                <div style={styles.sidebarVoteRow}>
                  <VoteButton
                    postId={post._id}
                    initialVoteCount={post.voteCount || 0}
                    initialHasVoted={post.hasVoted || false}
                    isAuthenticated={isAuthenticated}
                    onAuthRequired={() => handleAuthRequired('vote on feature requests')}
                    onVoteChange={handleVoteChange}
                  />
                  <span style={styles.sidebarVoteCountText}>
                    <strong>{post.voteCount || 0}</strong> {post.voteCount === 1 ? 'upvote' : 'upvotes'}
                  </span>
                </div>
              </Card>

              {/* Admin Moderation Card (Admin Only) */}
              {isAdmin && (
                <Card style={{ ...styles.sidebarCard, borderLeft: '3px solid var(--color-brand)' }}>
                  <h3 style={styles.sidebarCardTitle}>Admin Moderation</h3>
                  <p style={styles.sidebarCardText}>
                    Update the workflow state of this request:
                  </p>
                  <div style={styles.adminSelectWrapper}>
                    <AdminStatusSelect
                      postId={post._id}
                      currentStatus={post.status}
                      onStatusChange={handleStatusChange}
                    />
                  </div>
                </Card>
              )}

              {/* Request Metadata Card */}
              <Card style={styles.sidebarCard}>
                <h3 style={styles.sidebarCardTitle}>Information</h3>
                <dl style={styles.metaList}>
                  <div style={styles.metaItem}>
                    <dt style={styles.metaLabel}>Status</dt>
                    <dd style={styles.metaValue}>{post.status}</dd>
                  </div>
                  <div style={styles.metaItem}>
                    <dt style={styles.metaLabel}>Category</dt>
                    <dd style={styles.metaValue}>{post.category}</dd>
                  </div>
                  <div style={styles.metaItem}>
                    <dt style={styles.metaLabel}>Submitted</dt>
                    <dd style={styles.metaValue}>{formattedDate}</dd>
                  </div>
                  <div style={styles.metaItem}>
                    <dt style={styles.metaLabel}>Comments</dt>
                    <dd style={styles.metaValue}>{post.commentCount || 0}</dd>
                  </div>
                </dl>
              </Card>
            </aside>
          </div>
        ) : null}
      </main>

      {/* Auth Modal */}
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
    color: 'var(--text-primary)',
  },
  main: {
    maxWidth: '1100px',
    margin: '1.5rem auto',
    padding: '0 1.25rem 4rem 1.25rem',
  },
  breadcrumbRow: {
    marginBottom: '1.25rem',
  },
  backLink: {
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.35rem 0.75rem',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    boxShadow: 'var(--shadow-xs)',
    transition: 'all var(--transition-fast)',
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 300px',
    gap: '1.75rem',
    alignItems: 'start',
  },
  articleCard: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--border-subtle)',
    padding: '2rem',
    boxShadow: 'var(--shadow-xs)',
  },
  badgeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  badgeLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap',
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
    fontSize: '1.75rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    margin: '0 0 1rem 0',
    lineHeight: 1.3,
    letterSpacing: '-0.025em',
  },
  authorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    marginBottom: '1.5rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid var(--border-subtle)',
  },
  authorMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  authorName: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  descriptionContainer: {
    fontSize: '1rem',
    lineHeight: 1.65,
    color: 'var(--text-secondary)',
    marginBottom: '2rem',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    position: 'sticky',
    top: '5rem',
  },
  sidebarCard: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-subtle)',
    padding: '1.25rem',
    boxShadow: 'var(--shadow-xs)',
  },
  sidebarCardTitle: {
    fontSize: '0.925rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: '0 0 0.4rem 0',
  },
  sidebarCardText: {
    fontSize: '0.825rem',
    color: 'var(--text-muted)',
    lineHeight: 1.45,
    margin: '0 0 1rem 0',
  },
  sidebarVoteRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
  },
  sidebarVoteCountText: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  adminSelectWrapper: {
    marginTop: '0.5rem',
  },
  metaList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.65rem',
    margin: 0,
  },
  metaItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.825rem',
  },
  metaLabel: {
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  metaValue: {
    color: 'var(--text-primary)',
    fontWeight: 600,
    margin: 0,
  },
  skeletonCard: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--border-subtle)',
    padding: '2rem',
  },
  skeletonBadges: {
    width: '160px',
    height: '24px',
    marginBottom: '1rem',
  },
  skeletonTitle: {
    width: '75%',
    height: '36px',
    marginBottom: '1rem',
  },
  skeletonAuthor: {
    width: '180px',
    height: '20px',
    marginBottom: '2rem',
  },
  skeletonDesc1: {
    width: '100%',
    height: '18px',
    marginBottom: '0.75rem',
  },
  skeletonDesc2: {
    width: '85%',
    height: '18px',
  },
  errorCard: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--border-subtle)',
    padding: '3.5rem 1.5rem',
    textAlign: 'center',
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

export default PostDetailPage;
