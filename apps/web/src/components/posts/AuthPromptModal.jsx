/**
 * components/posts/AuthPromptModal.jsx
 *
 * Modal dialog displayed when an unauthenticated visitor attempts an
 * action that requires an active session using Coss UI Dialog & Button primitives.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog.jsx';
import { Button } from '../ui/button.jsx';

export const AuthPromptModal = ({ isOpen, onClose, actionName = 'vote on feature requests' }) => {
  const navigate = useNavigate();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPopup style={{ maxWidth: '440px', textAlign: 'center' }}>
        <div style={{ paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={styles.iconCircle}>
            <span style={{ fontSize: '1.75rem' }}>💡</span>
          </div>
          <DialogHeader style={{ borderBottom: 'none', padding: '0.75rem 1.5rem 0.5rem', textAlign: 'center' }}>
            <DialogTitle style={{ textAlign: 'center', fontSize: '1.25rem' }}>Join the FeatureFlow Community</DialogTitle>
            <DialogDescription style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              You must be logged in to {actionName}. Create a free account or log in to help shape
              the product roadmap!
            </DialogDescription>
          </DialogHeader>
        </div>

        <DialogFooter style={{ justifyContent: 'center', padding: '1.25rem 1.5rem', gap: '0.75rem', borderTop: 'none', background: 'transparent' }}>
          <Button
            type="button"
            variant="outline"
            style={{ flex: 1 }}
            onClick={() => {
              onClose();
              navigate('/login');
            }}
          >
            Log In
          </Button>
          <Button
            type="button"
            variant="default"
            style={{ flex: 1 }}
            onClick={() => {
              onClose();
              navigate('/signup');
            }}
          >
            Create Account
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
};

const styles = {
  iconCircle: {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-brand-subtle)',
    border: '1px solid var(--color-brand-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
  },
};

export default AuthPromptModal;
