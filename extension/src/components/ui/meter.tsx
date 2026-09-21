import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '../../lib/utils';

/** A labelled progress bar. `color` overrides the default primary fill, which is
 * how mastery bars carry their strong/growing/weak meaning. */
export function Meter({
  value,
  label,
  valueLabel,
  color,
  className,
  size = 'md',
}: {
  value: number;
  label?: string;
  valueLabel?: string;
  color?: string;
  className?: string;
  size?: 'sm' | 'md';
}) {
  const pct = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
  return (
    <div className={cn('w-full', className)}>
      {(label || valueLabel) && (
        <div className="mb-1.5 flex items-baseline justify-between">
          {label && <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-subtle">{label}</span>}
          {valueLabel && (
            <span className="font-mono text-[11px] font-bold tabular-nums" style={color ? { color } : undefined}>
              {valueLabel}
            </span>
          )}
        </div>
      )}
      <ProgressPrimitive.Root
        value={pct}
        className={cn(
          'relative w-full overflow-hidden rounded-full bg-elevated',
          size === 'sm' ? 'h-1' : 'h-1.5',
        )}
      >
        <ProgressPrimitive.Indicator
          className="h-full rounded-full transition-transform duration-700 ease-out"
          style={{
            transform: `translateX(-${100 - pct}%)`,
            backgroundColor: color ?? 'var(--color-primary)',
            width: '100%',
          }}
        />
      </ProgressPrimitive.Root>
    </div>
  );
}
