import React from 'react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils.js';
import { Button } from './button.jsx';

export const DialogCreateHandle = DialogPrimitive.createHandle;
export const Dialog = DialogPrimitive.Root;
export const DialogPortal = DialogPrimitive.Portal;

export function DialogTrigger(props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

export function DialogClose(props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

export function DialogBackdrop({ className, style, ...props }) {
  return (
    <DialogPrimitive.Backdrop
      className={cn('ff-dialog-backdrop', className)}
      data-slot="dialog-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        ...style,
      }}
      {...props}
    />
  );
}

export function DialogViewport({ className, style, ...props }) {
  return (
    <DialogPrimitive.Viewport
      className={cn('ff-dialog-viewport', className)}
      data-slot="dialog-viewport"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto',
        ...style,
      }}
      {...props}
    />
  );
}

export function DialogPopup({
  className,
  children,
  showCloseButton = true,
  closeProps,
  portalProps,
  style,
  ...props
}) {
  return (
    <DialogPortal {...portalProps}>
      <DialogBackdrop />
      <DialogViewport>
        <DialogPrimitive.Popup
          className={cn('ff-dialog-popup', className)}
          data-slot="dialog-popup"
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            margin: 'auto',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-modal)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            outline: 'none',
            ...style,
          }}
          {...props}
        >
          {children}
          {showCloseButton && (
            <DialogPrimitive.Close
              aria-label="Close"
              data-slot="dialog-close"
              style={{
                position: 'absolute',
                top: '1.15rem',
                right: '1.15rem',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                color: 'var(--text-muted)',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
              }}
              {...closeProps}
            >
              <X style={{ width: '16px', height: '16px' }} />
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Popup>
      </DialogViewport>
    </DialogPortal>
  );
}

export function DialogHeader({ className, render, ...props }) {
  const defaultProps = {
    className: cn('flex flex-col gap-1.5 p-6 pb-4 border-b border-[var(--border-subtle)]', className),
    'data-slot': 'dialog-header',
  };

  return useRender({
    defaultTagName: 'div',
    props: mergeProps(defaultProps, props),
    render,
  });
}

export function DialogFooter({
  className,
  variant = 'default',
  render,
  ...props
}) {
  const defaultProps = {
    className: cn(
      'flex flex-col-reverse gap-2 p-6 pt-4 sm:flex-row sm:justify-end border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)]/50',
      variant === 'bare' && 'border-t-0 bg-transparent',
      className
    ),
    'data-slot': 'dialog-footer',
  };

  return useRender({
    defaultTagName: 'div',
    props: mergeProps(defaultProps, props),
    render,
  });
}

export function DialogTitle({ className, ...props }) {
  return (
    <DialogPrimitive.Title
      className={cn('font-bold text-xl text-[var(--text-primary)] tracking-tight', className)}
      data-slot="dialog-title"
      {...props}
    />
  );
}

export function DialogDescription({ className, ...props }) {
  return (
    <DialogPrimitive.Description
      className={cn('text-sm text-[var(--text-muted)] leading-relaxed', className)}
      data-slot="dialog-description"
      {...props}
    />
  );
}

export function DialogPanel({ className, render, ...props }) {
  const defaultProps = {
    className: cn('p-6 overflow-y-auto flex-1', className),
    'data-slot': 'dialog-panel',
  };

  return useRender({
    defaultTagName: 'div',
    props: mergeProps(defaultProps, props),
    render,
  });
}

export {
  DialogPrimitive,
  DialogBackdrop as DialogOverlay,
  DialogPopup as DialogContent,
};

export default Dialog;
