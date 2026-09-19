import React from 'react';
import { Input as InputPrimitive } from '@base-ui/react/input';
import { cn } from '../../lib/utils.js';

export function Input({
  className,
  size = 'default',
  unstyled = false,
  nativeInput = false,
  style,
  ...props
}) {
  const inputClassName = cn(
    'h-9 w-full min-w-0 rounded-[inherit] px-3 text-[var(--text-primary)] leading-9 outline-none placeholder:text-[var(--text-placeholder)] sm:h-8.5 sm:leading-8.5 bg-transparent border-0',
    size === 'sm' && 'h-8 px-2.5 leading-8 sm:h-7.5 sm:leading-7.5 text-sm',
    size === 'lg' && 'h-10 leading-10 sm:h-9.5 sm:leading-9.5 text-base',
    props.type === 'search' &&
      '[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none',
    props.type === 'file' &&
      'text-[var(--text-muted)] file:me-3 file:bg-transparent file:font-medium file:text-[var(--text-primary)] file:text-sm'
  );

  return (
    <span
      className={
        cn(
          !unstyled &&
            'relative inline-flex w-full items-center rounded-lg border border-[var(--border-medium)] bg-[var(--bg-card)] text-base transition-all focus-within:border-[var(--color-brand)] focus-within:ring-2 focus-within:ring-[var(--color-brand)]/20 sm:text-sm',
          className
        ) || undefined
      }
      data-size={size}
      data-slot="input-control"
    >
      {nativeInput ? (
        <input
          className={inputClassName}
          data-slot="input"
          size={typeof size === 'number' ? size : undefined}
          style={typeof style === 'function' ? undefined : style}
          {...props}
        />
      ) : (
        <InputPrimitive
          className={inputClassName}
          data-slot="input"
          size={typeof size === 'number' ? size : undefined}
          style={style}
          {...props}
        />
      )}
    </span>
  );
}

export { InputPrimitive };
export default Input;
