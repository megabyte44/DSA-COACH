import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('overflow-hidden rounded-xl border border-border-subtle bg-surface', className)}
      {...props}
    />
  );
}

/** A section title. The rule underneath is load-bearing: without it this sits
 * too close to the first field label and the two read as one collided line. */
export function CardHeader({
  title,
  action,
  icon,
  className,
}: {
  title: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 border-b border-border-subtle bg-elevated/40 px-4 py-2.5',
        className,
      )}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-muted">
        {icon}
        {title}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4', className)} {...props} />;
}
