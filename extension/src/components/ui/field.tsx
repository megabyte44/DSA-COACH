import * as SliderPrimitive from '@radix-ui/react-slider';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label className="text-[10px] font-semibold uppercase tracking-[0.08em] text-subtle">{label}</label>
      {children}
      {hint && <p className="text-[10px] leading-relaxed text-faint">{hint}</p>}
    </div>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-9 w-full rounded-lg border border-border-subtle bg-background px-3 text-sm text-foreground',
        'placeholder:text-faint',
        'transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40',
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full resize-none rounded-lg border border-border-subtle bg-background p-3 text-sm text-foreground',
        'placeholder:text-faint',
        'transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40',
        className,
      )}
      {...props}
    />
  );
}

export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  className,
}: {
  value: number;
  onValueChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}) {
  return (
    <SliderPrimitive.Root
      value={[value]}
      onValueChange={v => onValueChange(v[0])}
      min={min}
      max={max}
      step={step}
      className={cn('relative flex h-5 w-full touch-none select-none items-center', className)}
    >
      <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-elevated">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className="block h-3.5 w-3.5 rounded-full border-2 border-primary bg-background shadow transition-transform
          hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      />
    </SliderPrimitive.Root>
  );
}

export function Switch({
  checked,
  onCheckedChange,
  id,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  id?: string;
}) {
  return (
    <SwitchPrimitive.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={cn(
        'relative h-5 w-9 shrink-0 rounded-full border border-transparent transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
        checked ? 'bg-primary' : 'bg-elevated border-border-strong',
      )}
    >
      <SwitchPrimitive.Thumb
        className="block h-3.5 w-3.5 translate-x-[3px] rounded-full bg-white shadow transition-transform
          data-[state=checked]:translate-x-[19px]"
      />
    </SwitchPrimitive.Root>
  );
}

/** Row of mutually exclusive choices — used for level, confidence and ratings. */
export function ChoiceRow<T extends string | number>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex gap-1.5', className)}>
      {options.map(opt => (
        <button
          key={String(opt.value)}
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex-1 rounded-lg border py-2 text-xs font-semibold transition-all active:scale-[0.98]',
            value === opt.value
              ? 'border-primary bg-primary/15 text-foreground'
              : 'border-border-subtle bg-background text-muted hover:border-border-strong hover:text-foreground',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
