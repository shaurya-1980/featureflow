/**
 * components/posts/VoteButton.jsx
 *
 * Polished SaaS Upvote Button using authentic Coss UI Button primitive:
 *  - Optimistic vote toggling with immediate UI feedback
 *  - Fast rollback on API rejection
 *  - In-flight request locking to prevent race conditions & spam
 *  - Micro-bounce animation on upvote
 *  - Accessible aria-pressed & aria-label attributes
 *  - Guest prompt redirection for unauthenticated clicks
 */

import React, { useState, useEffect, useRef } from 'react';
import axiosClient from '../../api/axiosClient.js';
import { useToast } from './Toast.jsx';
import { Button } from '../ui/button.jsx';

export const VoteButton = ({
  postId,
  initialVoteCount = 0,
  initialHasVoted = false,
  isAuthenticated = false,
  onAuthRequired,
  onVoteChange,
}) => {
  const { addToast } = useToast();

  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [hasVoted, setHasVoted] = useState(initialHasVoted);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justVotedAnim, setJustVotedAnim] = useState(false);

  // Sync state if initial props change from parent feed revalidation
  useEffect(() => {
    setVoteCount(initialVoteCount);
    setHasVoted(initialHasVoted);
  }, [initialVoteCount, initialHasVoted]);

  // Track latest request ID to ignore stale responses
  const latestRequestId = useRef(0);

  const handleVoteToggle = async (e) => {
    e.stopPropagation();

    // 1. Guard against unauthenticated action
    if (!isAuthenticated) {
      if (onAuthRequired) {
        onAuthRequired();
      }
      return;
    }

    // 2. Prevent concurrent clicks while request is in progress
    if (isSubmitting) {
      return;
    }

    // 3. Capture previous state for rollback
    const previousVoteCount = voteCount;
    const previousHasVoted = hasVoted;

    // 4. Optimistically update local UI immediately
    const nextHasVoted = !previousHasVoted;
    const nextVoteCount = nextHasVoted
      ? previousVoteCount + 1
      : Math.max(0, previousVoteCount - 1);

    setHasVoted(nextHasVoted);
    setVoteCount(nextVoteCount);
    setIsSubmitting(true);

    if (nextHasVoted) {
      setJustVotedAnim(true);
      setTimeout(() => setJustVotedAnim(false), 300);
    }

    if (onVoteChange) {
      onVoteChange(postId, nextVoteCount, nextHasVoted);
    }

    const currentRequestId = ++latestRequestId.current;

    try {
      let res;
      if (nextHasVoted) {
        res = await axiosClient.post(`/posts/${postId}/vote`);
        addToast('Vote added', 'success');
      } else {
        res = await axiosClient.delete(`/posts/${postId}/vote`);
        addToast('Vote removed', 'info');
      }

      // 5. Reconcile with server response if this is still the latest request
      if (currentRequestId === latestRequestId.current && res.data) {
        const serverVoteCount = res.data.voteCount ?? nextVoteCount;
        const serverHasVoted = res.data.hasVoted ?? nextHasVoted;
        setVoteCount(serverVoteCount);
        setHasVoted(serverHasVoted);
        if (onVoteChange) {
          onVoteChange(postId, serverVoteCount, serverHasVoted);
        }
      }
    } catch (err) {
      // 6. Roll back to prior state on failure
      if (currentRequestId === latestRequestId.current) {
        setVoteCount(previousVoteCount);
        setHasVoted(previousHasVoted);
        if (onVoteChange) {
          onVoteChange(postId, previousVoteCount, previousHasVoted);
        }
      }

      const errMsg =
        err.response?.data?.error || (nextHasVoted ? 'Failed to vote' : 'Failed to remove vote');
      addToast(errMsg, 'error');
    } finally {
      if (currentRequestId === latestRequestId.current) {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Button
      variant={hasVoted ? 'default' : 'outline'}
      size="sm"
      onClick={handleVoteToggle}
      disabled={isSubmitting}
      className={justVotedAnim ? 'animate-vote-bounce' : ''}
      style={{
        ...styles.button,
        ...(hasVoted ? styles.votedButton : styles.unvotedButton),
        ...(isSubmitting ? styles.loadingState : {}),
      }}
      aria-label={hasVoted ? 'Remove upvote' : 'Upvote feature request'}
      aria-pressed={hasVoted}
      title={hasVoted ? 'Click to remove upvote' : 'Upvote this request'}
    >
      <span
        style={{
          ...styles.arrowIcon,
          color: hasVoted ? 'var(--color-brand)' : 'var(--text-muted)',
        }}
        aria-hidden="true"
      >
        ▲
      </span>
      <span
        style={{
          ...styles.count,
          color: hasVoted ? 'var(--color-brand-active)' : 'var(--text-primary)',
        }}
      >
        {voteCount}
      </span>
    </Button>
  );
};

const styles = {
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.45rem',
    padding: '0.35rem 0.75rem',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    userSelect: 'none',
  },
  unvotedButton: {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-medium)',
    color: 'var(--text-secondary)',
    boxShadow: 'var(--shadow-xs)',
  },
  votedButton: {
    backgroundColor: 'var(--color-brand-subtle)',
    border: '1px solid var(--color-brand)',
    boxShadow: '0 0 0 1px var(--color-brand)',
    color: 'var(--color-brand-active)',
  },
  loadingState: {
    opacity: 0.7,
    cursor: 'wait',
  },
  arrowIcon: {
    fontSize: '0.75rem',
    lineHeight: 1,
    transition: 'transform var(--transition-fast)',
  },
  count: {
    fontSize: '0.9rem',
    fontWeight: 700,
  },
};

export default VoteButton;
