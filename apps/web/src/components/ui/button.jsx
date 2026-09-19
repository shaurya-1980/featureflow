import React from 'react';
import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils.js';
import { Spinner } from './spinner.jsx';

export const buttonVariants = cva(
  'relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg border font-medium text-base outline-none transition-all disabled:pointer-events-none disabled:opacity-50 sm:text-sm [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
    variants: {
      size: {
        default: 'h-9 px-3.5 sm:h-8.5',
        icon: 'size-9 sm:size-8.5',
        'icon-lg': 'size-10 sm:size-9',
        'icon-sm': 'size-8 sm:size-7',
        'icon-xs': 'size-7 rounded-md sm:size-6',
        lg: 'h-10 px-4 sm:h-9',
        sm: 'h-8 gap-1.5 px-2.5 sm:h-7.5',
        xl: 'h-11 px-5 text-lg sm:h-10 sm:text-base',
        xs: 'h-7 gap-1 rounded-md px-2 text-sm sm:h-6 sm:text-xs',
      },
      variant: {
        default:
          'border-transparent bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)] active:bg-[var(--color-brand-active)] shadow-xs',
        destructive:
          'border-transparent bg-[var(--color-danger)] text-white hover:opacity-90 active:opacity-95 shadow-xs',
        'destructive-outline':
          'border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)]/80',
        ghost:
          'border-transparent text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] active:bg-[var(--bg-muted)]',
        link: 'border-transparent text-[var(--color-brand)] underline-offset-4 hover:underline',
        outline:
          'border-[var(--border-medium)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] active:bg-[var(--bg-muted)] shadow-xs',
        secondary:
          'border-transparent bg-[var(--bg-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)] active:opacity-80',
      },
    },
  }
);

export function Button({
  className,
  variant,
  size,
  render,
  children,
  loading = false,
  disabled: disabledProp,
  type,
  ...props
}) {
  const isDisabled = Boolean(loading || disabledProp);
  const typeValue = type || (render ? undefined : 'button');

  const defaultProps = {
    children: (
      <>
        {children}
        {loading && (
          <Spinner
            className="pointer-events-none absolute size-4"
            data-slot="button-loading-indicator"
          />
        )}
      </>
    ),
    className: cn(buttonVariants({ className, size, variant })),
    'aria-disabled': loading || undefined,
    'data-loading': loading ? '' : undefined,
    'data-slot': 'button',
    'data-variant': variant || 'default',
    'data-size': size || 'default',
    disabled: isDisabled,
    type: typeValue,
  };

  return useRender({
    defaultTagName: 'button',
    props: mergeProps(defaultProps, props),
    render,
  });
}

export default Button;
