/**
 * components/comments/CommentItem.jsx
 *
 * Polished SaaS Threaded Comment Item using authentic Coss UI primitives:
 *  - Coss UI Avatar for author initials
 *  - Coss UI Badge for Author / Admin tags
 *  - Coss UI Button for Reply / Delete actions
 *  - Relative timestamp formatting
 *  - Safe Markdown rendering
 *  - 1-level nested replies container with clean border-left guide
 *  - Inline reply composer toggle
 *  - Authorized deletion triggering DeleteConfirmModal
 */

import React, { useState } from 'react';
import MarkdownRenderer from '../posts/MarkdownRenderer.jsx';
import CommentComposer from './CommentComposer.jsx';
import { getAvatarColor } from '../../utils/statusStyles.js';
import { Avatar, AvatarFallback } from '../ui/avatar.jsx';
import { Badge } from '../ui/badge.jsx';
import { Button } from '../ui/button.jsx';

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const past = new Date(dateStr);
  const diffSec = Math.floor((now - past) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDays = Math.floor(diffHour / 24);
  if (diffDays < 30) return `${diffDays}d ago`;

  return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const CommentItem = ({
  comment,
  currentUser,
  postAuthorId,
  isAuthenticated,
  onAuthRequired,
  onAddReply,
  onDeleteRequest,
  isReply = false,
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  const authorName = comment.author?.name || 'Community Member';
  const authorInitial = authorName.charAt(0).toUpperCase();
  const avatarBg = getAvatarColor(authorName);

  const isPostAuthor =
    postAuthorId &&
    comment.author?._id &&
    postAuthorId.toString() === comment.author._id.toString();
  const isAdmin = comment.author?.role === 'admin';

  const canDelete =
    !comment.isDeleted &&
    currentUser &&
    (currentUser.id === comment.author?._id?.toString() || currentUser.role === 'admin');

  const handleReplySubmit = async (contentMarkdown, parentCommentId) => {
    setSubmittingReply(true);
    const success = await onAddReply(contentMarkdown, parentCommentId);
    setSubmittingReply(false);
    if (success) {
      setIsReplying(false);
    }
    return success;
  };

  return (
    <div style={{ ...styles.wrapper, ...(isReply ? styles.replyWrapper : {}) }}>
      <div style={styles.header}>
        {/* Avatar */}
        <Avatar style={{ width: '30px', height: '30px' }} aria-hidden="true">
          <AvatarFallback
            style={{
              backgroundColor: comment.isDeleted ? '#94a3b8' : avatarBg,
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.8rem',
            }}
          >
            {comment.isDeleted ? '?' : authorInitial}
          </AvatarFallback>
        </Avatar>

        {/* User Info & Badges */}
        <div style={styles.meta}>
          <div style={styles.nameRow}>
            <span
              style={{
                ...styles.authorName,
                color: comment.isDeleted ? 'var(--text-muted)' : 'var(--text-primary)',
                fontStyle: comment.isDeleted ? 'italic' : 'normal',
              }}
            >
              {comment.isDeleted ? 'Deleted User' : authorName}
            </span>

            {/* Badges */}
            {!comment.isDeleted && isPostAuthor && (
              <Badge
                variant="outline"
                size="sm"
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  backgroundColor: 'rgba(168, 85, 247, 0.12)',
                  color: '#c084fc',
                  borderColor: 'rgba(168, 85, 247, 0.25)',
                  padding: '0.05rem 0.35rem',
                  textTransform: 'uppercase',
                }}
                title="Author of this feature request"
              >
                Author
              </Badge>
            )}
            {!comment.isDeleted && isAdmin && (
              <Badge
                variant="outline"
                size="sm"
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  color: '#fbbf24',
                  borderColor: 'rgba(245, 158, 11, 0.25)',
                  padding: '0.05rem 0.35rem',
                  textTransform: 'uppercase',
                }}
                title="Platform Administrator"
              >
                Admin
              </Badge>
            )}

            <time dateTime={comment.createdAt} style={styles.timestamp}>
              {formatRelativeTime(comment.createdAt)}
            </time>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {comment.isDeleted ? (
          <p style={styles.deletedText}>
            <span style={styles.deletedIcon} aria-hidden="true">🛡️</span> [Comment deleted]
          </p>
        ) : (
          <MarkdownRenderer content={comment.contentMarkdown} />
        )}
      </div>

      {/* Actions */}
      {!comment.isDeleted && (
        <div style={styles.actions}>
          {!isReply && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (!isAuthenticated) {
                  onAuthRequired();
                  return;
                }
                setIsReplying((prev) => !prev);
              }}
              style={styles.actionBtn}
            >
              💬 Reply
            </Button>
          )}

          {canDelete && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onDeleteRequest(comment._id)}
              style={styles.deleteActionBtn}
            >
              🗑️ Delete
            </Button>
          )}
        </div>
      )}

      {/* Inline Reply Composer */}
      {isReplying && (
        <CommentComposer
          onSubmit={handleReplySubmit}
          submitting={submittingReply}
          isAuthenticated={isAuthenticated}
          onAuthRequired={onAuthRequired}
          isReply={true}
          replyingToName={authorName}
          parentCommentId={comment._id}
          onCancelReply={() => setIsReplying(false)}
          submitLabel="Reply"
          placeholder={`Reply to ${authorName}...`}
        />
      )}

      {/* Child Replies (Strict 1 level nesting) */}
      {!isReply && comment.replies && comment.replies.length > 0 && (
        <div style={styles.repliesList}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              currentUser={currentUser}
              postAuthorId={postAuthorId}
              isAuthenticated={isAuthenticated}
              onAuthRequired={onAuthRequired}
              onAddReply={onAddReply}
              onDeleteRequest={onDeleteRequest}
              isReply={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  wrapper: {
    padding: '1.25rem',
    backgroundColor: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-subtle)',
    marginBottom: '0.85rem',
    boxShadow: 'var(--shadow-xs)',
    transition: 'border-color var(--transition-fast)',
  },
  replyWrapper: {
    padding: '1rem',
    backgroundColor: 'var(--bg-app)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-subtle)',
    marginTop: '0.65rem',
    marginBottom: '0.65rem',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    marginBottom: '0.65rem',
  },
  meta: {
    flex: 1,
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.45rem',
  },
  authorName: {
    fontSize: '0.875rem',
    fontWeight: 700,
  },
  timestamp: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginLeft: 'auto',
  },
  content: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.55,
    marginBottom: '0.65rem',
  },
  deletedText: {
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    margin: 0,
    fontSize: '0.875rem',
  },
  deletedIcon: {
    fontSize: '0.85rem',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    paddingTop: '0.5rem',
    borderTop: '1px solid var(--border-subtle)',
  },
  actionBtn: {
    height: 'auto',
    padding: '0.2rem 0.4rem',
    color: 'var(--text-muted)',
  },
  deleteActionBtn: {
    height: 'auto',
    padding: '0.2rem 0.4rem',
    color: '#dc2626',
  },
  repliesList: {
    marginTop: '0.75rem',
    paddingLeft: '1rem',
    borderLeft: '2px solid var(--border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
};

export default CommentItem;
