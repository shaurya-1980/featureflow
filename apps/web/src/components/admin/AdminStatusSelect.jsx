/**
 * components/admin/AdminStatusSelect.jsx
 *
 * Polished admin status dropdown selector using authentic Coss UI Select primitive:
 *  - Renders the current status badge with color coding
 *  - Allows selecting from 'Under Review', 'Planned', 'In Progress', 'Completed'
 *  - Sends PATCH /api/posts/:id/status
 *  - Shows loading state and toast feedback
 *  - Calls onStatusChange(newStatus, updatedPost) on success
 */

import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient.js';
import { useToast } from '../posts/Toast.jsx';
import { STATUS_OPTIONS, STATUS_STYLES } from '../../utils/statusStyles.js';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectItem,
} from '../ui/select.jsx';

export const AdminStatusSelect = ({
  postId,
  currentStatus,
  onStatusChange,
  compact = false,
}) => {
  const { addToast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setSelectedStatus(currentStatus);
  }, [currentStatus]);

  const style = STATUS_STYLES[selectedStatus] || {
    bg: '#f1f5f9',
    color: '#475569',
    border: '#e2e8f0',
    dot: '#64748b',
  };

  const handleStatusChange = async (newStatus) => {
    if (!newStatus || newStatus === selectedStatus || isUpdating) return;

    const previousStatus = selectedStatus;
    setSelectedStatus(newStatus);
    setIsUpdating(true);

    try {
      const { data } = await axiosClient.patch(`/posts/${postId}/status`, {
        status: newStatus,
      });

      addToast(`Status updated to "${newStatus}"`, 'success');
      if (onStatusChange) {
        onStatusChange(newStatus, data.post);
      }
    } catch (err) {
      setSelectedStatus(previousStatus);
      const errMsg = err.response?.data?.error || 'Failed to update feature status.';
      addToast(errMsg, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      style={{
        ...styles.wrapper,
        opacity: isUpdating ? 0.7 : 1,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Select
        value={selectedStatus}
        onValueChange={handleStatusChange}
        disabled={isUpdating}
      >
        <SelectTrigger
          size={compact ? 'sm' : 'default'}
          style={{
            backgroundColor: style.bg,
            borderColor: style.border,
            color: style.color,
            fontWeight: 700,
            padding: compact ? '0.2rem 0.5rem' : '0.35rem 0.75rem',
            height: 'auto',
          }}
          title="Click to update status as Admin"
        >
          <div className="flex items-center gap-1.5">
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: style.dot,
                display: 'inline-block',
                flexShrink: 0,
              }}
              aria-hidden="true"
            />
            <SelectValue placeholder={selectedStatus} />
          </div>
        </SelectTrigger>
        <SelectPopup>
          {STATUS_OPTIONS.map((status) => {
            const itemStyle = STATUS_STYLES[status] || {};
            return (
              <SelectItem key={status} value={status}>
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: itemStyle.dot || '#64748b',
                      display: 'inline-block',
                    }}
                  />
                  <span>{status}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectPopup>
      </Select>
    </div>
  );
};

const styles = {
  wrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    position: 'relative',
    transition: 'opacity 0.15s ease',
    minWidth: '140px',
  },
};

export default AdminStatusSelect;
