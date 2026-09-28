import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef, isValidElement, cloneElement, ReactElement } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
  asChild?: boolean;
}

const buttonClasses = (
  variant: ButtonProps['variant'],
  size: ButtonProps['size'],
  className?: string,
) =>
  cn(
    'inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marcos-red',
    variant === 'default' && 'bg-marcos-red text-white shadow-sm hover:bg-marcos-red-dark',
    variant === 'outline' &&
      'border border-marcos-red/25 bg-white text-marcos-red hover:border-marcos-red hover:bg-marcos-red-light',
    variant === 'ghost' && 'text-ink hover:bg-marcos-red-light hover:text-marcos-red',
    variant === 'destructive' && 'bg-marcos-red-dark text-white hover:bg-marcos-red',
    size === 'default' && 'h-10 px-4 py-2 text-sm',
    size === 'sm' && 'h-8 px-3 text-xs',
    size === 'lg' && 'h-11 px-6 text-base',
    className,
  );

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild, children, ...props }, ref) => {
    const classes = buttonClasses(variant, size, className);

    if (asChild && isValidElement(children)) {
      return cloneElement(children as ReactElement<{ className?: string }>, {
        className: cn(classes, (children as ReactElement<{ className?: string }>).props.className),
      });
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';
