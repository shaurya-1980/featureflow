/**
 * components/comments/CommentComposer.jsx
 *
 * Markdown-enabled comment composer for root comments and inline replies using Coss UI primitives:
 *  - Coss UI Tabs (Write & Live Markdown preview)
 *  - Coss UI Textarea
 *  - Coss UI Button
 *  - Character guidance counter (max 5000)
 *  - Unauthenticated prompt interceptor
 *  - Keyboard submission shortcut (Ctrl/Cmd + Enter)
 *  - Inline reply header with Cancel option
 */

import React, { useState, useRef } from 'react';
import MarkdownRenderer from '../posts/MarkdownRenderer.jsx';
import { Button } from '../ui/button.jsx';
import { Textarea } from '../ui/textarea.jsx';
import { Tabs, TabsList, TabsTab, TabsPanel } from '../ui/tabs.jsx';

export const CommentComposer = ({
  onSubmit,
  submitting = false,
  isAuthenticated = false,
  onAuthRequired,
  placeholder = 'Write a comment... (Markdown formatting supported)',
  submitLabel = 'Post Comment',
  isReply = false,
  replyingToName = '',
  onCancelReply,
  parentCommentId = null,
}) => {
  const [content, setContent] = useState('');
  const [activeTab, setActiveTab] = useState('write');
  const [error, setError] = useState('');
  const textareaRef = useRef(null);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!isAuthenticated) {
      if (onAuthRequired) {
        onAuthRequired();
      }
      return;
    }

    const trimmed = content.trim();
    if (!trimmed) {
      setError('Comment cannot be empty.');
      return;
    }

    if (trimmed.length > 5000) {
      setError('Comment cannot exceed 5000 characters.');
      return;
    }

    setError('');
    const success = await onSubmit(trimmed, parentCommentId);
    if (success) {
      setContent('');
      setActiveTab('write');
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  if (!isAuthenticated && !isReply) {
    return (
      <div style={styles.unauthBox}>
        <div style={styles.unauthContent}>
          <span style={styles.unauthIcon}>💬</span>
          <div>
            <h4 style={styles.unauthTitle}>Join the discussion</h4>
            <p style={styles.unauthText}>
              Sign in or create an account to share your feedback and participate in the roadmap.
            </p>
          </div>
        </div>
        <Button
          type="button"
          onClick={onAuthRequired}
          variant="default"
        >
          Sign In to Comment
        </Button>
      </div>
    );
  }

  return (
    <div style={{ ...styles.composerCard, ...(isReply ? styles.replyComposerCard : {}) }}>
      {isReply && (
        <div style={styles.replyHeader}>
          <span style={styles.replyingToText}>
            Replying to <strong>{replyingToName}</strong>
          </span>
          {onCancelReply && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancelReply}
              style={styles.cancelReplyBtn}
              title="Cancel reply"
            >
              ✕ Cancel
            </Button>
          )}
        </div>
      )}

      {/* Tabs & Controls */}
      <div style={styles.tabRow}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTab value="write">Write</TabsTab>
            <TabsTab value="preview">Preview</TabsTab>
          </TabsList>
        </Tabs>

        <span
          style={{
            ...styles.charCount,
            color: content.length > 5000 ? '#dc2626' : '#94a3b8',
          }}
        >
          {content.length}/5000
        </span>
      </div>

      {/* Write Tab vs Preview Tab */}
      {activeTab === 'write' ? (
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (error) setError('');
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={isReply ? 3 : 4}
          disabled={submitting}
          style={{
            borderColor: error ? '#ef4444' : undefined,
          }}
        />
      ) : (
        <div style={{ ...styles.previewBox, minHeight: isReply ? '80px' : '110px' }}>
          {content.trim() ? (
            <MarkdownRenderer content={content} />
          ) : (
            <span style={styles.emptyPreview}>Nothing to preview yet.</span>
          )}
        </div>
      )}

      {error && <span style={styles.errorMsg}>{error}</span>}

      {/* Footer / Submit */}
      <div style={styles.footerRow}>
        <span style={styles.shortcutHint}>
          Tip: Press <kbd style={styles.kbd}>Ctrl</kbd> + <kbd style={styles.kbd}>Enter</kbd> to submit
        </span>

        <div style={styles.actionButtons}>
          {isReply && onCancelReply && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancelReply}
              disabled={submitting}
            >
              Cancel
            </Button>
          )}

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleSubmit}
            disabled={submitting || !content.trim()}
          >
            {submitting ? 'Posting...' : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  composerCard: {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '10px',
    padding: '1.25rem',
    boxShadow: 'var(--shadow-xs)',
    marginBottom: '1.5rem',
  },
  replyComposerCard: {
    backgroundColor: 'var(--bg-subtle)',
    border: '1px solid var(--border-medium)',
    marginTop: '0.75rem',
    marginBottom: '0.75rem',
    padding: '1rem',
  },
  replyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.65rem',
    paddingBottom: '0.4rem',
    borderBottom: '1px solid var(--border-subtle)',
  },
  replyingToText: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  cancelReplyBtn: {
    height: 'auto',
    padding: '0.2rem 0.5rem',
  },
  tabRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  charCount: {
    fontSize: '0.75rem',
    fontWeight: 500,
  },
  previewBox: {
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px solid var(--border-subtle)',
    backgroundColor: 'var(--bg-subtle)',
    overflowY: 'auto',
  },
  emptyPreview: {
    color: 'var(--text-muted)',
    fontSize: '0.875rem',
    fontStyle: 'italic',
  },
  errorMsg: {
    display: 'block',
    color: 'var(--color-danger)',
    fontSize: '0.825rem',
    marginTop: '0.35rem',
  },
  footerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '0.75rem',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  shortcutHint: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  kbd: {
    backgroundColor: 'var(--bg-subtle)',
    border: '1px solid var(--border-medium)',
    borderRadius: '3px',
    padding: '0.1rem 0.35rem',
    fontSize: '0.7rem',
    fontFamily: 'monospace',
    color: 'var(--text-secondary)',
  },
  actionButtons: {
    display: 'flex',
    gap: '0.5rem',
  },
  unauthBox: {
    backgroundColor: 'var(--bg-subtle)',
    border: '1px dashed var(--border-medium)',
    borderRadius: '10px',
    padding: '1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  unauthContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  unauthIcon: {
    fontSize: '1.75rem',
  },
  unauthTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: '0 0 0.25rem 0',
  },
  unauthText: {
    fontSize: '0.875rem',
    color: 'var(--text-muted)',
    margin: 0,
  },
};

export default CommentComposer;
