/**
 * components/posts/FeatureFeed.jsx
 *
 * Primary container for the Feature Request Feed using authentic Coss UI primitives:
 *  - Orchestrates feed state: posts, pagination, category/status filtering, search, sorting
 *  - Coss UI Button for CTAs, pagination, and filter actions
 *  - Loading skeletons (SkeletonFeed using Coss Skeleton)
 *  - Contextual empty states (filter-mismatch vs no-posts-yet)
 *  - Pagination controls (Previous, page indicator, Next)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axiosClient from '../../api/axiosClient.js';
import FeatureCard from './FeatureCard.jsx';
import SkeletonFeed from './SkeletonCard.jsx';
import FeedFilters from './FeedFilters.jsx';
import SearchInput from './SearchInput.jsx';
import { useToast } from './Toast.jsx';
import { Button } from '../ui/button.jsx';

export const FeatureFeed = ({
  isAuthenticated = false,
  onAuthRequired,
  onOpenCreateModal,
  refreshTrigger = 0,
}) => {
  const { addToast } = useToast();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Query state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Request counter to discard stale out-of-order responses
  const activeRequestId = useRef(0);

  const fetchPosts = useCallback(async () => {
    const requestId = ++activeRequestId.current;
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        limit: 10,
        sort,
      };

      if (category) params.category = category;
      if (status) params.status = status;
      if (search.trim()) params.search = search.trim();

      const { data } = await axiosClient.get('/posts', { params });

      // Guard against stale async responses
      if (requestId === activeRequestId.current) {
        setPosts(data.posts || []);
        setPagination(
          data.pagination || {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          }
        );
      }
    } catch (err) {
      if (requestId === activeRequestId.current) {
        const msg = err.response?.data?.error || 'Failed to load features';
        setError(msg);
        addToast(msg, 'error');
      }
    } finally {
      if (requestId === activeRequestId.current) {
        setLoading(false);
      }
    }
  }, [page, category, status, sort, search, addToast]);

  // Fetch when filters, search, sort, page, or external trigger changes
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts, refreshTrigger]);

  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    setPage(1);
  };

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    setPage(1);
  };

  const handleSortChange = (newSort) => {
    setSort(newSort);
    setPage(1);
  };

  const handleSearchChange = (newSearch) => {
    setSearch(newSearch);
    setPage(1);
  };

  const handlePostVoteChange = (postId, newVoteCount, newHasVoted) => {
    setPosts((prevPosts) =>
      prevPosts.map((p) =>
        p._id === postId ? { ...p, voteCount: newVoteCount, hasVoted: newHasVoted } : p
      )
    );
  };

  const isFiltered = Boolean(category || status || search.trim());

  return (
    <div style={styles.container}>
      {/* Top action & search bar */}
      <div style={styles.topBar}>
        <SearchInput value={search} onChange={handleSearchChange} />

        <Button
          type="button"
          onClick={onOpenCreateModal}
          variant="default"
        >
          + Submit Feature Request
        </Button>
      </div>

      {/* Filter and Sort bar */}
      <FeedFilters
        category={category}
        status={status}
        sort={sort}
        onCategoryChange={handleCategoryChange}
        onStatusChange={handleStatusChange}
        onSortChange={handleSortChange}
      />

      {/* Feed Content */}
      {loading ? (
        <SkeletonFeed count={4} />
      ) : error ? (
        <div style={styles.errorBox}>
          <p style={styles.errorMsg}>{error}</p>
          <Button onClick={fetchPosts} variant="destructive">
            Retry Loading
          </Button>
        </div>
      ) : posts.length > 0 ? (
        <div style={styles.postsList}>
          {posts.map((post) => (
            <FeatureCard
              key={post._id}
              post={post}
              isAuthenticated={isAuthenticated}
              onAuthRequired={onAuthRequired}
              onVoteChange={handlePostVoteChange}
            />
          ))}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div style={styles.paginationRow}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                ← Previous
              </Button>

              <span style={styles.pageInfo}>
                Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong>{' '}
                <span style={styles.totalItems}>({pagination.total} total)</span>
              </span>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
              >
                Next →
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Empty states */
        <div style={styles.emptyState}>
          {isFiltered ? (
            <>
              <div style={styles.emptyIcon} aria-hidden="true">🔍</div>
              <h3 style={styles.emptyTitle}>No feature requests found</h3>
              <p style={styles.emptyText}>
                No requests matched your active filters or search terms. Try adjusting them or clear your filters.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCategory('');
                  setStatus('');
                  setSearch('');
                  setPage(1);
                }}
              >
                Clear all filters
              </Button>
            </>
          ) : (
            <>
              <div style={styles.emptyIcon} aria-hidden="true">💡</div>
              <h3 style={styles.emptyTitle}>No feature requests yet</h3>
              <p style={styles.emptyText}>
                Be the first to submit a feature idea and start a discussion with the community!
              </p>
              <Button
                type="button"
                onClick={onOpenCreateModal}
                variant="default"
              >
                + Submit the First Request
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.25rem',
    flexWrap: 'wrap',
  },
  postsList: {
    display: 'flex',
    flexDirection: 'column',
  },
  paginationRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '1.5rem',
    paddingTop: '1rem',
    borderTop: '1px solid var(--border-subtle)',
  },
  pageInfo: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
  totalItems: {
    color: 'var(--text-muted)',
    marginLeft: '0.25rem',
  },
  errorBox: {
    backgroundColor: 'var(--color-danger-bg)',
    border: '1px solid var(--color-danger-border)',
    padding: '2rem',
    borderRadius: 'var(--radius-lg)',
    textAlign: 'center',
  },
  errorMsg: {
    color: 'var(--color-danger)',
    marginBottom: '1rem',
    fontSize: '0.925rem',
    fontWeight: 500,
  },
  emptyState: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--border-subtle)',
    padding: '3.5rem 1.5rem',
    textAlign: 'center',
    boxShadow: 'var(--shadow-xs)',
  },
  emptyIcon: {
    fontSize: '2.5rem',
    marginBottom: '0.75rem',
  },
  emptyTitle: {
    fontSize: '1.2rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '0.4rem',
  },
  emptyText: {
    color: 'var(--text-muted)',
    fontSize: '0.925rem',
    maxWidth: '420px',
    margin: '0 auto 1.5rem auto',
    lineHeight: 1.55,
  },
};

export default FeatureFeed;
