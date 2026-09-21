import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** Mastery lives on a 0-100 scale everywhere the coach reports it. */
export function masteryTone(pct: number) {
  if (pct >= 70) return { label: 'Strong', text: 'text-success', bg: 'bg-success', hex: '#34d399' };
  if (pct >= 40) return { label: 'Growing', text: 'text-warning', bg: 'bg-warning', hex: '#fbbf24' };
  return { label: 'Weak', text: 'text-danger', bg: 'bg-danger', hex: '#f87171' };
}
