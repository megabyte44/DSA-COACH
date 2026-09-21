import { useEffect, useState } from 'react';
import {
  Check, RefreshCw, WifiOff, ExternalLink, Timer,
  Sparkles, Target, Repeat, Eye, MessageSquare, Trophy, Sunrise,
} from 'lucide-react';
import type { DailyPlan, PlanItem } from '../types';
import { getPlanCompletions } from '../services/storage';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Card, CardBody } from './ui/card';
import { Badge } from './ui/badge';
import { Meter } from './ui/meter';
import { EmptyState, Loading } from './ui/state';

const TYPE_META: Record<PlanItem['type'], { label: string; tone: 'success' | 'info' | 'primary' | 'warning' | 'danger' | 'neutral'; icon: typeof Target }> = {
  new: { label: 'New', tone: 'success', icon: Sparkles },
  calibration: { label: 'Calibrate', tone: 'info', icon: Target },
  review: { label: 'Review', tone: 'info', icon: Repeat },
  recognition: { label: 'Recognise', tone: 'primary', icon: Eye },
  explain: { label: 'Explain', tone: 'warning', icon: MessageSquare },
  mock: { label: 'Mock', tone: 'danger', icon: Trophy },
  restart_easy: { label: 'Easy win', tone: 'success', icon: Sunrise },
  decay_review: { label: 'Refresh', tone: 'info', icon: Repeat },
};

export function PlanView() {
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    chrome.runtime.sendMessage({ type: 'PLAN_REQUEST' }, async res => {
      if (res?.success && res.plan) {
        setPlan(res.plan);
        setDone(new Set(await getPlanCompletions(res.plan.plan_date)));
      } else {
        setError(true);
      }
      setLoading(false);
    });
  };

  useEffect(load, []);

  const toggleDone = (order: number) => {
    if (!plan) return;
    const willBeDone = !done.has(order);
    const next = new Set(done);
    if (willBeDone) next.add(order);
    else next.delete(order);
    setDone(next);
    chrome.runtime.sendMessage({
      type: 'PLAN_ITEM_COMPLETE',
      payload: { plan_date: plan.plan_date, order, done: willBeDone },
    });
  };

  if (loading) return <Loading label="Loading today's plan…" />;

  if (error || !plan) {
    return (
      <EmptyState
        icon={WifiOff}
        tone="warning"
        title="Couldn't load today's plan"
        description="The coach backend didn't answer. Check the endpoint in Settings."
        action={
          <Button variant="secondary" size="sm" onClick={load}>
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        }
      />
    );
  }

  const completed = plan.items.filter(i => done.has(i.order)).length;
  const donePct = plan.items.length ? Math.round((completed / plan.items.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-2.5 p-3">
      <Card>
        <CardBody className="pt-4">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <Badge tone="primary" className="mb-1.5 capitalize">{plan.mode}</Badge>
              <p className="font-mono text-[13px] font-semibold text-foreground">{plan.plan_date}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold leading-none text-primary">
                {plan.total_minutes}
                <span className="ml-1 text-xs font-medium text-faint">min</span>
              </p>
              {plan.days_to_target !== null && (
                <p className="mt-1 text-[10px] text-faint">{plan.days_to_target}d to target</p>
              )}
            </div>
          </div>

          {plan.message && (
            <p className="mb-3 text-xs leading-relaxed text-muted">{plan.message}</p>
          )}

          <Meter value={donePct} label="Progress" valueLabel={`${completed}/${plan.items.length}`} />
        </CardBody>
      </Card>

      {plan.items.length === 0 ? (
        <Card>
          <CardBody className="py-6 text-center">
            <p className="text-xs text-subtle">Nothing scheduled today.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="flex flex-col gap-1.5">
          {plan.items.map(item => {
            const isDone = done.has(item.order);
            const meta = TYPE_META[item.type] ?? { label: item.type, tone: 'neutral' as const, icon: Target };
            const Icon = meta.icon;
            return (
              <Card
                key={item.order}
                className={cn('overflow-hidden transition-opacity', isDone && 'opacity-55')}
              >
                <div className="flex gap-2.5 p-3">
                  <button
                    onClick={() => toggleDone(item.order)}
                    aria-label={isDone ? 'Mark as not done' : 'Mark as done'}
                    className={cn(
                      'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all active:scale-90',
                      isDone
                        ? 'border-success bg-success text-background'
                        : 'border-border-strong text-transparent hover:border-primary hover:text-primary/40',
                    )}
                  >
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn(
                        'truncate text-[13px] font-semibold',
                        isDone ? 'text-subtle line-through' : 'text-foreground',
                      )}>
                        {item.problem ? item.problem.title : item.pattern}
                      </p>
                      <span className="flex shrink-0 items-center gap-1 text-[10px] font-medium text-faint">
                        <Timer className="h-3 w-3" />
                        {item.minutes}m{item.timed ? ' ⏱' : ''}
                      </span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge tone={meta.tone}>
                        <Icon className="h-2.5 w-2.5" />
                        {meta.label}
                      </Badge>
                      <span className="text-[10px] text-subtle">{item.pattern}</span>
                      {item.problem && (
                        <a
                          href={item.problem.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-0.5 text-[10px] font-medium text-primary hover:underline"
                        >
                          Open
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>

                    {item.detail && <p className="mt-1.5 text-[10px] leading-relaxed text-subtle">{item.detail}</p>}
                    {item.note && <p className="mt-1.5 text-[10px] leading-relaxed text-warning/80">{item.note}</p>}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Button variant="ghost" size="sm" block onClick={load}>
        <RefreshCw className="h-3.5 w-3.5" />
        Refresh plan
      </Button>
    </div>
  );
}
