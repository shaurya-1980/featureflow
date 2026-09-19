/**
 * components/comments/DeleteConfirmModal.jsx
 *
 * Accessible confirmation dialog for deleting comments using Coss UI Dialog & Button primitives.
 */

import React from 'react';
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog.jsx';
import { Button } from '../ui/button.jsx';

export const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, deleting = false }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !deleting && onClose()}>
      <DialogPopup style={{ maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={styles.iconWrapper}>
            <span style={styles.warningIcon}>🗑️</span>
          </div>

          <DialogHeader style={{ borderBottom: 'none', padding: '0 1.5rem 0.5rem', textAlign: 'center' }}>
            <DialogTitle style={{ textAlign: 'center', fontSize: '1.2rem' }}>Delete comment?</DialogTitle>
            <DialogDescription style={{ textAlign: 'center', marginTop: '0.4rem' }}>
              This comment will be removed from the discussion. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
        </div>

        <DialogFooter style={{ justifyContent: 'center', padding: '1.25rem 1.5rem', gap: '0.75rem', borderTop: 'none', background: 'transparent' }}>
          <Button
            type="button"
            variant="outline"
            style={{ flex: 1 }}
            onClick={onClose}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            style={{ flex: 1 }}
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
};

const styles = {
  iconWrapper: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-danger-bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1rem auto',
  },
  warningIcon: {
    fontSize: '1.4rem',
  },
};

export default DeleteConfirmModal;
