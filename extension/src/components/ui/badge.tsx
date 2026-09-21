import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

const badge = cva(
  'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold leading-none',
  {
    variants: {
      tone: {
        neutral: 'border-border-strong bg-elevated text-muted',
        primary: 'border-primary/40 bg-primary/15 text-primary',
        success: 'border-success/30 bg-success/10 text-success',
        warning: 'border-warning/30 bg-warning/10 text-warning',
        danger: 'border-danger/30 bg-danger/10 text-danger',
        info: 'border-info/30 bg-info/10 text-info',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badge> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badge({ tone }), className)} {...props} />;
}

const DIFFICULTY_TONE = { Easy: 'success', Medium: 'warning', Hard: 'danger' } as const;

export function DifficultyBadge({ difficulty }: { difficulty?: string }) {
  if (!difficulty) return null;
  const tone = DIFFICULTY_TONE[difficulty as keyof typeof DIFFICULTY_TONE] ?? 'neutral';
  return <Badge tone={tone}>{difficulty}</Badge>;
}
