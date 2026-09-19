import React from 'react';
import { Field as FieldPrimitive } from '@base-ui/react/field';
import { mergeProps } from '@base-ui/react/merge-props';
import { cn } from '../../lib/utils.js';

export function Textarea({
  className,
  size = 'default',
  unstyled = false,
  ref,
  ...props
}) {
  return (
    <span
      className={
        cn(
          !unstyled &&
            'relative inline-flex w-full rounded-lg border border-[var(--border-medium)] bg-[var(--bg-card)] text-base transition-all focus-within:border-[var(--color-brand)] focus-within:ring-2 focus-within:ring-[var(--color-brand)]/20 sm:text-sm',
          className
        ) || undefined
      }
      data-size={size}
      data-slot="textarea-control"
    >
      <FieldPrimitive.Control
        ref={ref}
        value={props.value}
        defaultValue={props.defaultValue}
        disabled={props.disabled}
        id={props.id}
        name={props.name}
        render={(defaultProps) => (
          <textarea
            className={cn(
              'min-h-[90px] w-full rounded-[inherit] p-3 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-placeholder)] bg-transparent border-0 resize-y',
              size === 'sm' && 'min-h-[70px] p-2 text-sm',
              size === 'lg' && 'min-h-[120px] p-4 text-base'
            )}
            data-slot="textarea"
            {...mergeProps(defaultProps, props)}
          />
        )}
      />
    </span>
  );
}

export { FieldPrimitive };
export default Textarea;
