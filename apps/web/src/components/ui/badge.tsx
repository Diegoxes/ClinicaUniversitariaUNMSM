import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-marcos-red-light px-2.5 py-0.5 text-xs font-medium text-marcos-red',
        className,
      )}
      {...props}
    />
  );
}
