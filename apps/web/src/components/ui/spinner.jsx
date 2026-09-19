import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export function Spinner({ className, ...props }) {
  return (
    <Loader2
      aria-label="Loading"
      className={cn('animate-spin', className)}
      role="status"
      {...props}
    />
  );
}

export default Spinner;
