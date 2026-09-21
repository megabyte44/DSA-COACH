import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Loading({ label }: { label?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      {label && <p className="text-xs text-subtle">{label}</p>}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = 'neutral',
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: 'neutral' | 'warning';
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <div
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-xl border',
          tone === 'warning'
            ? 'border-warning/30 bg-warning/10 text-warning'
            : 'border-border-subtle bg-elevated text-subtle',
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && <p className="max-w-[16rem] text-xs leading-relaxed text-subtle">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatusDot({ tone, pulse }: { tone: 'success' | 'warning' | 'muted'; pulse?: boolean }) {
  const color =
    tone === 'success' ? 'bg-success' : tone === 'warning' ? 'bg-warning' : 'bg-faint';
  return (
    <span className="relative flex h-1.5 w-1.5">
      {pulse && <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-60', color)} />}
      <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', color)} />
    </span>
  );
}

/** Inline notice used for coach messages, hints, feedback and errors. */
export function Notice({
  tone,
  icon: Icon,
  title,
  children,
}: {
  tone: 'primary' | 'warning' | 'success' | 'danger';
  icon?: LucideIcon;
  title?: string;
  children: ReactNode;
}) {
  const tones = {
    primary: 'border-primary/30 bg-primary/10',
    warning: 'border-warning/25 bg-warning/10',
    success: 'border-success/25 bg-success/10',
    danger: 'border-danger/25 bg-danger/10',
  };
  const titleTones = {
    primary: 'text-primary',
    warning: 'text-warning',
    success: 'text-success',
    danger: 'text-danger',
  };
  return (
    <div className={cn('rounded-xl border p-3', tones[tone])}>
      {title && (
        <div className={cn('mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em]', titleTones[tone])}>
          {Icon && <Icon className="h-3 w-3" />}
          {title}
        </div>
      )}
      <div className="text-[13px] leading-relaxed text-foreground/90">{children}</div>
    </div>
  );
}
