/**
 * components/comments/CommentSection.jsx
 *
 * Primary discussion container on the Feature Detail page using Coss UI primitives:
 *  - Coss UI Badge for count
 *  - Coss UI Skeleton for comment skeletons
 *  - Coss UI Button for Retry / CTA actions
 *  - Fetching threaded comments from GET /api/posts/:id/comments
 *  - Submitting root comments & replies to POST /api/posts/:id/comments
 *  - Soft-deleting comments via DELETE /api/comments/:id
 *  - Synchronizing Post.commentCount with parent page
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axiosClient from '../../api/axiosClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import CommentComposer from './CommentComposer.jsx';
import CommentItem from './CommentItem.jsx';
import DeleteConfirmModal from './DeleteConfirmModal.jsx';
import { useToast } from '../posts/Toast.jsx';
import { Badge } from '../ui/badge.jsx';
import { Skeleton } from '../ui/skeleton.jsx';
import { Button } from '../ui/button.jsx';

export const CommentSection = ({
  postId,
  postAuthorId,
  commentCount = 0,
  onCommentCountChange,
  onAuthRequired,
}) => {
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submittingRoot, setSubmittingRoot] = useState(false);

  // Deletion modal state
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const composerSectionRef = useRef(null);

  const fetchComments = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    setError(null);

    try {
      const { data } = await axiosClient.get(`/posts/${postId}/comments`);
      setComments(data.comments || []);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to load comments';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Handle Root Comment Submission
  const handleCreateRootComment = async (contentMarkdown) => {
    setSubmittingRoot(true);
    try {
      const { data } = await axiosClient.post(`/posts/${postId}/comments`, {
        contentMarkdown,
        parentComment: null,
      });

      const newComment = {
        ...data.comment,
        replies: [],
      };

      setComments((prev) => [...prev, newComment]);
      if (onCommentCountChange) {
        onCommentCountChange((prev) => prev + 1);
      }
      addToast('Comment posted successfully', 'success');
      return true;
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to post comment';
      addToast(msg, 'error');
      return false;
    } finally {
      setSubmittingRoot(false);
    }
  };

  // Handle Reply Submission
  const handleCreateReply = async (contentMarkdown, parentCommentId) => {
    try {
      const { data } = await axiosClient.post(`/posts/${postId}/comments`, {
        contentMarkdown,
        parentComment: parentCommentId,
      });

      const newReply = data.comment;

      // Attach new reply into target root comment
      setComments((prev) =>
        prev.map((c) => {
          if (c._id === parentCommentId) {
            return {
              ...c,
              replies: [...(c.replies || []), newReply],
            };
          }
          return c;
        })
      );

      if (onCommentCountChange) {
        onCommentCountChange((prev) => prev + 1);
      }
      addToast('Reply posted successfully', 'success');
      return true;
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to post reply';
      addToast(msg, 'error');
      return false;
    }
  };

  // Open Delete Confirmation Modal
  const handleRequestDelete = (commentId) => {
    setDeleteTargetId(commentId);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);

    try {
      await axiosClient.delete(`/comments/${deleteTargetId}`);

      // Update in local state to soft-deleted placeholder
      setComments((prev) =>
        prev.map((c) => {
          if (c._id === deleteTargetId) {
            return {
              ...c,
              isDeleted: true,
              contentMarkdown: '[Comment deleted]',
            };
          }
          if (c.replies && c.replies.some((r) => r._id === deleteTargetId)) {
            return {
              ...c,
              replies: c.replies.map((r) =>
                r._id === deleteTargetId
                  ? { ...r, isDeleted: true, contentMarkdown: '[Comment deleted]' }
                  : r
              ),
            };
          }
          return c;
        })
      );

      if (onCommentCountChange) {
        onCommentCountChange((prev) => Math.max(0, prev - 1));
      }
      addToast('Comment deleted', 'info');
      setDeleteTargetId(null);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to delete comment';
      addToast(msg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFocusComposer = () => {
    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }
    composerSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    const textarea = composerSectionRef.current?.querySelector('textarea');
    if (textarea) textarea.focus();
  };

  return (
    <div style={styles.container}>
      {/* Section Header */}
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <h2 style={styles.title}>Discussion</h2>
          <Badge variant="secondary" size="sm">
            {commentCount}
          </Badge>
        </div>
      </div>

      {/* Root Comment Composer */}
      <div ref={composerSectionRef}>
        <CommentComposer
          onSubmit={handleCreateRootComment}
          submitting={submittingRoot}
          isAuthenticated={isAuthenticated}
          onAuthRequired={onAuthRequired}
          placeholder="Share your thoughts, ask questions, or provide technical feedback..."
          submitLabel="Post Comment"
        />
      </div>

      {/* Discussion List / Skeletons / Empty State */}
      {loading ? (
        <div style={styles.skeletonContainer}>
          <Skeleton style={{ height: '110px', borderRadius: '10px' }} />
          <Skeleton style={{ height: '110px', borderRadius: '10px' }} />
        </div>
      ) : error ? (
        <div style={styles.errorBox}>
          <p style={styles.errorMsg}>{error}</p>
          <Button onClick={fetchComments} variant="destructive" size="sm">
            Try Again
          </Button>
        </div>
      ) : comments.length > 0 ? (
        <div style={styles.commentsList}>
          {comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              currentUser={user}
              postAuthorId={postAuthorId}
              isAuthenticated={isAuthenticated}
              onAuthRequired={onAuthRequired}
              onAddReply={handleCreateReply}
              onDeleteRequest={handleRequestDelete}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>💬</div>
          <h3 style={styles.emptyTitle}>No discussion yet</h3>
          <p style={styles.emptyText}>
            Be the first to share your thoughts, use cases, or feedback about this feature request.
          </p>
          <Button
            type="button"
            onClick={handleFocusComposer}
            variant="default"
          >
            Start the discussion
          </Button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        deleting={isDeleting}
      />
    </div>
  );
};

const styles = {
  container: {
    marginTop: '2rem',
    paddingTop: '2rem',
    borderTop: '1px solid var(--border-subtle)',
  },
  header: {
    marginBottom: '1.25rem',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  },
  title: {
    fontSize: '1.4rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  commentsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  skeletonContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  errorBox: {
    backgroundColor: 'var(--color-danger-bg)',
    border: '1px solid var(--color-danger-border)',
    padding: '1.5rem',
    borderRadius: '8px',
    textAlign: 'center',
    margin: '1rem 0',
  },
  errorMsg: {
    color: 'var(--color-danger)',
    marginBottom: '0.75rem',
    fontSize: '0.925rem',
  },
  emptyState: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '10px',
    border: '1px dashed var(--border-medium)',
    padding: '3rem 1.5rem',
    textAlign: 'center',
    marginTop: '1rem',
  },
  emptyIcon: {
    fontSize: '2.5rem',
    marginBottom: '0.5rem',
  },
  emptyTitle: {
    fontSize: '1.15rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '0.35rem',
  },
  emptyText: {
    color: 'var(--text-muted)',
    fontSize: '0.925rem',
    maxWidth: '420px',
    margin: '0 auto 1.25rem auto',
    lineHeight: 1.5,
  },
};

export default CommentSection;
