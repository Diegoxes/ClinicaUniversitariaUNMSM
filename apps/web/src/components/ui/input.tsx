import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        'flex h-11 w-full rounded-lg border border-pearl-300 bg-white px-3 py-2 text-sm text-ink',
        'placeholder:text-ink-muted/60',
        'focus:border-marcos-red focus:outline-none focus:ring-2 focus:ring-marcos-red/20',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
