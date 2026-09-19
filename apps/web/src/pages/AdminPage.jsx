/**
 * pages/AdminPage.jsx
 *
 * Admin Moderation Dashboard — /admin (admin role required)
 * Using authentic Coss UI primitives:
 *  - Coss UI Card for StatCards
 *  - Coss UI Badge for Admin badge & category tags
 *  - Coss UI Input for Search
 *  - Coss UI Select for Status filter (and AdminStatusSelect in rows)
 *  - Coss UI Button for Clear, Retry, and Pagination controls
 *  - Coss UI Skeleton for table row loading skeletons
 *  - Coss UI ToastProvider for toast notifications
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient.js';
import Navbar from '../components/layout/Navbar.jsx';
import AdminStatusSelect from '../components/admin/AdminStatusSelect.jsx';
import { useToast } from '../components/posts/Toast.jsx';
import { CATEGORY_STYLES } from '../utils/statusStyles.js';
import { Card } from '../components/ui/card.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Input } from '../components/ui/input.jsx';
import { Button } from '../components/ui/button.jsx';
import { Skeleton } from '../components/ui/skeleton.jsx';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectItem,
} from '../components/ui/select.jsx';
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog.jsx';

/* ─── Stat Card ──────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, icon, bg, color, border }) => (
  <Card
    style={{
      ...styles.statCard,
      backgroundColor: bg,
      borderColor: border,
    }}
  >
    <span style={styles.statIcon}>{icon}</span>
    <div>
      <div style={{ ...styles.statValue, color }}>{value ?? '—'}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  </Card>
);

/* ─── Row Skeleton ───────────────────────────────────────────────────────── */
const RowSkeleton = () => (
  <>
    {[1, 2, 3, 4, 5].map((i) => (
      <tr key={`admin-skel-row-${i}`} style={styles.skeletonRow}>
        <td style={styles.td}>
          <Skeleton style={styles.skeletonTitle} />
        </td>
        <td style={styles.td}>
          <Skeleton style={styles.skeletonBadge} />
        </td>
        <td style={styles.td}>
          <Skeleton style={styles.skeletonBadge} />
        </td>
        <td style={styles.td}>
          <Skeleton style={styles.skeletonSmall} />
        </td>
        <td style={styles.td}>
          <Skeleton style={styles.skeletonSmall} />
        </td>
        <td style={styles.td}>
          <Skeleton style={styles.skeletonSmall} />
        </td>
        <td style={styles.td}>
          <Skeleton style={styles.skeletonSmall} />
        </td>
      </tr>
    ))}
  </>
);

/* ─── Main Dashboard Content ─────────────────────────────────────────────── */
export const AdminPage = () => {
  const { addToast } = useToast();

  /* Stats */
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  /* Feed */
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState(null);

  /* Filters */
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const searchTimer = useRef(null);

  /* Deletion State */
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /* ── Fetch Stats ─────────────────────────────────────────────────── */
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const { data } = await axiosClient.get('/posts/admin/stats');
      setStats(data.stats);
    } catch {
      // Non-fatal – stats are supplemental
    } finally {
      setStatsLoading(false);
    }
  }, []);

  /* ── Fetch Posts ─────────────────────────────────────────────────── */
  const fetchPosts = useCallback(async () => {
    setFeedLoading(true);
    setFeedError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 15,
        sort: 'newest',
      });
      if (filterStatus) params.set('status', filterStatus);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const { data } = await axiosClient.get(`/posts?${params.toString()}`);
      setPosts(data.posts || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setFeedError(err.response?.data?.error || 'Failed to load feature requests.');
    } finally {
      setFeedLoading(false);
    }
  }, [currentPage, filterStatus, searchQuery]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  useEffect(() => { setCurrentPage(1); }, [filterStatus, searchQuery]);

  const handleSearchInput = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearchQuery(val);
    }, 350);
  };

  const handleStatusChange = (postId, newStatus) => {
    setPosts((prev) =>
      prev.map((p) => (p._id === postId ? { ...p, status: newStatus } : p))
    );
    fetchStats();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await axiosClient.delete(`/posts/${deleteTarget._id}`);
      setPosts((prev) => prev.filter((p) => p._id !== deleteTarget._id));
      setPagination((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }));
      addToast({
        title: 'Feature deleted',
        description: `"${deleteTarget.title}" was removed successfully.`,
        type: 'success',
      });
      setDeleteTarget(null);
      fetchStats();
    } catch (err) {
      addToast({
        title: 'Failed to delete feature',
        description: err.response?.data?.error || 'Failed to delete feature request.',
        type: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const statCards = [
    { label: 'Total Requests', value: stats?.total,       icon: '📊', bg: 'var(--bg-subtle)', color: 'var(--text-primary)', border: 'var(--border-subtle)' },
    { label: 'Under Review',   value: stats?.underReview, icon: '🔍', bg: 'var(--status-review-bg)', color: 'var(--status-review-text)', border: 'var(--status-review-border)' },
    { label: 'Planned',        value: stats?.planned,     icon: '📋', bg: 'var(--status-planned-bg)', color: 'var(--status-planned-text)', border: 'var(--status-planned-border)' },
    { label: 'In Progress',    value: stats?.inProgress,  icon: '🚀', bg: 'var(--status-progress-bg)', color: 'var(--status-progress-text)', border: 'var(--status-progress-border)' },
    { label: 'Completed',      value: stats?.completed,   icon: '✅', bg: 'var(--status-completed-bg)', color: 'var(--status-completed-text)', border: 'var(--status-completed-border)' },
  ];

  const formattedDate = (iso) =>
    iso
      ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '—';

  return (
    <div style={styles.container}>
      <Navbar />

      {/* Page Header */}
      <div style={styles.pageHeader}>
        <div style={styles.pageHeaderInner}>
          <div>
            <Badge
              variant="outline"
              size="sm"
              style={{
                backgroundColor: 'var(--status-review-bg)',
                color: 'var(--status-review-text)',
                borderColor: 'var(--status-review-border)',
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: '0.6rem',
              }}
            >
              <span>🛡️</span>
              <span>Administrator Portal</span>
            </Badge>
            <h1 style={styles.pageTitle}>Feature Request Management</h1>
            <p style={styles.pageSubtitle}>
              Review, prioritize, and manage status transitions for all feature requests.
            </p>
          </div>
        </div>
      </div>

      <main style={styles.main}>
        {/* Stats Overview */}
        <section style={styles.statsGrid} aria-label="Summary statistics">
          {statCards.map((card) => (
            <StatCard key={card.label} {...card} value={statsLoading ? '…' : card.value} />
          ))}
        </section>

        {/* Filter Controls */}
        <div style={styles.controls}>
          <div style={styles.searchWrapper}>
            <span style={styles.searchIcon} aria-hidden="true">🔍</span>
            <Input
              type="search"
              placeholder="Search feature requests…"
              value={searchInput}
              onChange={handleSearchInput}
              style={{ paddingLeft: '2.2rem' }}
              aria-label="Search feature requests"
              id="admin-search"
            />
          </div>

          <div style={styles.filterGroup}>
            <label htmlFor="admin-status-filter" style={styles.filterLabel}>
              Filter by status:
            </label>
            <div style={{ minWidth: '150px' }}>
              <Select
                value={filterStatus || 'all'}
                onValueChange={(val) => setFilterStatus(val === 'all' ? '' : val)}
              >
                <SelectTrigger id="admin-status-filter" size="sm">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectPopup>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Under Review">Under Review</SelectItem>
                  <SelectItem value="Planned">Planned</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectPopup>
              </Select>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => { setFilterStatus(''); setSearchInput(''); setSearchQuery(''); }}
              title="Clear all filters"
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Results summary */}
        {!feedLoading && !feedError && (
          <div style={styles.resultsSummary}>
            <span>
              Showing <strong>{posts.length}</strong> of <strong>{pagination.total}</strong> feature requests
              {filterStatus && <> · Status: <strong>{filterStatus}</strong></>}
              {searchQuery && <> · Search: <strong>"{searchQuery}"</strong></>}
            </span>
          </div>
        )}

        {/* Feature Table */}
        <div style={styles.tableWrapper}>
          {feedError ? (
            <div style={styles.errorState}>
              <span style={styles.errorIcon}>⚠️</span>
              <p style={styles.errorMsg}>{feedError}</p>
              <Button type="button" onClick={fetchPosts} variant="destructive">
                Retry
              </Button>
            </div>
          ) : (
            <table style={styles.table} aria-label="Feature requests moderation table">
              <thead>
                <tr>
                  <th style={{ ...styles.th, width: '32%' }}>Feature Request</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Votes</th>
                  <th style={styles.th}>Comments</th>
                  <th style={styles.th}>Submitted</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {feedLoading ? (
                  <RowSkeleton />
                ) : posts.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={styles.emptyCell}>
                      <div style={styles.emptyState}>
                        <span style={styles.emptyIcon}>🗂️</span>
                        <p style={styles.emptyTitle}>No feature requests found</p>
                        <p style={styles.emptySubtext}>
                          {filterStatus || searchQuery
                            ? 'Try adjusting your filters or search query.'
                            : 'Feature requests will appear here once users submit them.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => {
                    const catStyle = CATEGORY_STYLES[post.category] || { bg: '#f1f5f9', color: '#334155' };
                    return (
                      <tr key={post._id} style={styles.row}>
                        <td style={{ ...styles.td, ...styles.titleCell }}>
                          <Link
                            to={`/posts/${post._id}`}
                            style={styles.postLink}
                            title={`View: ${post.title}`}
                          >
                            {post.title}
                          </Link>
                          <div style={styles.authorMeta}>
                            by {post.author?.name || 'Unknown'}
                          </div>
                        </td>
                        <td style={styles.td}>
                          <Badge
                            variant="outline"
                            size="sm"
                            style={{
                              backgroundColor: catStyle.bg,
                              color: catStyle.color,
                              fontWeight: 700,
                              padding: '0.2rem 0.55rem',
                              borderRadius: '4px',
                            }}
                          >
                            {post.category}
                          </Badge>
                        </td>
                        <td style={styles.td}>
                          <AdminStatusSelect
                            postId={post._id}
                            currentStatus={post.status}
                            onStatusChange={(newStatus) => handleStatusChange(post._id, newStatus)}
                          />
                        </td>
                        <td style={{ ...styles.td, ...styles.numCell }}>
                          <span style={styles.voteChip}>▲ {post.voteCount || 0}</span>
                        </td>
                        <td style={{ ...styles.td, ...styles.numCell }}>
                          💬 {post.commentCount || 0}
                        </td>
                        <td style={{ ...styles.td, ...styles.dateCell }}>
                          {formattedDate(post.createdAt)}
                        </td>
                        <td style={{ ...styles.td, textAlign: 'right' }}>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteTarget(post)}
                            style={{
                              padding: '0.35rem 0.65rem',
                              fontSize: '0.775rem',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              borderRadius: '6px',
                            }}
                            title={`Delete "${post.title}"`}
                            aria-label={`Delete feature request ${post.title}`}
                          >
                            <span>🗑️</span>
                            <span>Delete</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!feedLoading && !feedError && pagination.totalPages > 1 && (
          <div style={styles.pagination}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              aria-label="Previous page"
            >
              ← Prev
            </Button>

            <span style={styles.pageInfo}>
              Page <strong>{currentPage}</strong> of <strong>{pagination.totalPages}</strong>
            </span>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={currentPage >= pagination.totalPages}
              aria-label="Next page"
            >
              Next →
            </Button>
          </div>
        )}

        {/* Delete Confirmation Modal using Coss Dialog */}
        <Dialog
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => !open && !isDeleting && setDeleteTarget(null)}
        >
          <DialogPopup style={{ maxWidth: '420px', textAlign: 'center' }}>
            <div style={{ paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-danger-bg, #fee2e2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto',
                  fontSize: '1.5rem',
                }}
              >
                🗑️
              </div>

              <DialogHeader style={{ borderBottom: 'none', padding: '0 1.5rem 0.5rem', textAlign: 'center' }}>
                <DialogTitle style={{ textAlign: 'center', fontSize: '1.25rem' }}>
                  Delete Feature Request?
                </DialogTitle>
                <DialogDescription style={{ textAlign: 'center', marginTop: '0.5rem', lineHeight: 1.5 }}>
                  Are you sure you want to delete <strong>"{deleteTarget?.title}"</strong>? All votes and associated comments will be permanently removed. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
            </div>

            <DialogFooter
              style={{
                justifyContent: 'center',
                padding: '1.25rem 1.5rem',
                gap: '0.75rem',
                borderTop: 'none',
                background: 'transparent',
              }}
            >
              <Button
                type="button"
                variant="outline"
                style={{ flex: 1 }}
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                style={{ flex: 1 }}
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Feature'}
              </Button>
            </DialogFooter>
          </DialogPopup>
        </Dialog>
      </main>
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
  pageHeader: {
    backgroundColor: 'var(--bg-card)',
    borderBottom: '1px solid var(--border-subtle)',
    padding: '2rem 1.5rem 1.75rem',
  },
  pageHeaderInner: {
    maxWidth: '1280px',
    margin: '0 auto',
  },
  pageTitle: {
    fontSize: '1.75rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    margin: '0 0 0.35rem 0',
    letterSpacing: '-0.025em',
  },
  pageSubtitle: {
    fontSize: '0.95rem',
    color: 'var(--text-muted)',
    margin: 0,
  },
  main: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '2rem 1.5rem 4rem',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '1rem',
    padding: '1.25rem 1.5rem',
    borderRadius: '12px',
    border: '1px solid',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  },
  statIcon: {
    fontSize: '1.75rem',
    flexShrink: 0,
  },
  statValue: {
    fontSize: '1.75rem',
    fontWeight: 800,
    lineHeight: 1,
    marginBottom: '0.2rem',
  },
  statLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    fontWeight: 600,
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem',
    flexWrap: 'wrap',
  },
  searchWrapper: {
    position: 'relative',
    flex: '1 1 260px',
  },
  searchIcon: {
    position: 'absolute',
    left: '0.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '0.9rem',
    pointerEvents: 'none',
    zIndex: 1,
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  filterLabel: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
  resultsSummary: {
    fontSize: '0.85rem',
    color: '#64748b',
    marginBottom: '0.75rem',
  },
  tableWrapper: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '12px',
    border: '1px solid var(--border-subtle)',
    boxShadow: 'var(--shadow-sm)',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  table: {
    width: '100%',
    minWidth: '680px',
    borderCollapse: 'collapse',
    fontSize: '0.875rem',
  },
  th: {
    padding: '0.85rem 1rem',
    backgroundColor: 'var(--bg-subtle)',
    textAlign: 'left',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid var(--border-subtle)',
  },
  td: {
    padding: '0.9rem 1rem',
    borderBottom: '1px solid var(--border-subtle)',
    verticalAlign: 'middle',
  },
  row: {
    transition: 'background-color 0.1s ease',
  },
  titleCell: {
    maxWidth: '360px',
  },
  postLink: {
    color: 'var(--text-primary)',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '0.9rem',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    lineHeight: 1.4,
  },
  authorMeta: {
    fontSize: '0.775rem',
    color: 'var(--text-muted)',
    marginTop: '0.2rem',
  },
  numCell: {
    textAlign: 'center',
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
    fontWeight: 600,
  },
  voteChip: {
    color: 'var(--color-brand)',
    fontWeight: 700,
  },
  dateCell: {
    color: 'var(--text-muted)',
    fontSize: '0.8rem',
    whiteSpace: 'nowrap',
  },
  skeletonRow: {},
  skeletonTitle: {
    height: '16px',
    width: '80%',
    borderRadius: '4px',
  },
  skeletonBadge: {
    height: '22px',
    width: '70px',
    borderRadius: '4px',
  },
  skeletonSmall: {
    height: '14px',
    width: '48px',
    borderRadius: '4px',
  },
  emptyCell: {
    padding: '3rem 1rem',
  },
  emptyState: {
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: '2.5rem',
    display: 'block',
    marginBottom: '0.75rem',
  },
  emptyTitle: {
    fontWeight: 700,
    fontSize: '1rem',
    color: 'var(--text-primary)',
    margin: '0 0 0.35rem 0',
  },
  emptySubtext: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    margin: 0,
  },
  errorState: {
    padding: '3rem',
    textAlign: 'center',
  },
  errorMsg: {
    color: 'var(--text-secondary)',
    marginBottom: '1rem',
    fontSize: '0.95rem',
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    marginTop: '1.5rem',
  },
  pageInfo: {
    fontSize: '0.875rem',
    color: 'var(--text-muted)',
  },
};

export default AdminPage;
