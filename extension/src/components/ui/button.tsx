import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

const button = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap ' +
    'transition-all duration-150 active:scale-[0.98] ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background ' +
    'disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20',
        secondary: 'bg-elevated text-foreground border border-border-subtle hover:border-border-strong hover:bg-border-subtle',
        ghost: 'text-muted hover:text-foreground hover:bg-elevated',
        outline: 'border border-border-subtle text-muted hover:text-foreground hover:border-border-strong',
        danger: 'bg-danger/15 text-danger border border-danger/40 hover:bg-danger/25',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-11 px-5 text-sm',
        icon: 'h-8 w-8',
      },
      block: { true: 'w-full', false: '' },
    },
    defaultVariants: { variant: 'primary', size: 'md', block: false },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {}

export function Button({ className, variant, size, block, ...props }: ButtonProps) {
  return <button className={cn(button({ variant, size, block }), className)} {...props} />;
}
