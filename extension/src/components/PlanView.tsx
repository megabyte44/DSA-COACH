import { useEffect, useState } from 'react';
import type { DailyPlan, PlanItem } from '../types';
import { getPlanCompletions } from '../services/storage';

const TYPE_META: Record<PlanItem['type'], { label: string; color: string }> = {
  new: { label: 'New', color: 'text-emerald-400 bg-emerald-900/30 border-emerald-600/30' },
  calibration: { label: 'Calibrate', color: 'text-cyan-400 bg-cyan-900/30 border-cyan-600/30' },
  review: { label: 'Review', color: 'text-blue-400 bg-blue-900/30 border-blue-600/30' },
  recognition: { label: 'Recognize', color: 'text-violet-400 bg-violet-900/30 border-violet-600/30' },
  explain: { label: 'Explain', color: 'text-amber-400 bg-amber-900/30 border-amber-600/30' },
  mock: { label: 'Mock', color: 'text-rose-400 bg-rose-900/30 border-rose-600/30' },
  restart_easy: { label: 'Easy win', color: 'text-emerald-400 bg-emerald-900/30 border-emerald-600/30' },
  decay_review: { label: 'Refresh', color: 'text-blue-400 bg-blue-900/30 border-blue-600/30' },
};

export function PlanView() {
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    chrome.runtime.sendMessage({ type: 'PLAN_REQUEST' }, async (res) => {
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
    if (willBeDone) next.add(order); else next.delete(order);
    setDone(next);
    chrome.runtime.sendMessage({
      type: 'PLAN_ITEM_COMPLETE',
      payload: { plan_date: plan.plan_date, order, done: willBeDone },
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading today's plan…</p>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
        <span className="text-4xl">📡</span>
        <p className="text-slate-400 text-sm text-center">
          Couldn't load today's plan.<br />Check your n8n connection.
        </p>
        <button
          onClick={load}
          className="text-sm px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const donePct = plan.items.length
    ? Math.round((plan.items.filter(i => done.has(i.order)).length / plan.items.length) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="bg-slate-800/80 rounded-xl border border-slate-700/60 p-4">
        <div className="flex justify-between items-center mb-2">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold capitalize">{plan.mode}</p>
            <p className="text-base font-bold text-white">{plan.plan_date}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-indigo-400">{plan.total_minutes}<span className="text-sm text-slate-500 ml-1">min</span></p>
            <p className="text-[10px] text-slate-500">goal</p>
          </div>
        </div>
        {plan.message && <p className="text-xs text-slate-400 mb-2">{plan.message}</p>}

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
            style={{ width: `${donePct}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-500 mt-1">{donePct}% complete</p>
      </div>

      {/* Plan items */}
      <div className="flex flex-col gap-2">
        {plan.items.map((item) => {
          const isDone = done.has(item.order);
          const meta = TYPE_META[item.type] || { label: item.type, color: 'text-slate-400 bg-slate-700/30 border-slate-600/30' };
          return (
            <button
              key={item.order}
              onClick={() => toggleDone(item.order)}
              className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                isDone ? 'bg-slate-800/30 border-slate-700/30 opacity-60' : 'bg-slate-800/80 border-slate-700/60'
              }`}
            >
              <div className={`w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center text-sm font-bold ${
                isDone ? 'bg-emerald-900/50 text-emerald-400' : 'bg-slate-700 text-slate-400'
              }`}>
                {isDone ? '✓' : item.order}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${isDone ? 'line-through text-slate-500' : 'text-white'}`}>
                  {item.problem ? item.problem.title : item.pattern}
                </p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${meta.color}`}>
                    {meta.label}
                  </span>
                  <span className="text-[10px] text-slate-500">{item.pattern}</span>
                  <span className="text-[10px] text-slate-500">{item.minutes} min{item.timed ? ' (timed)' : ''}</span>
                </div>
                {item.detail && <p className="text-[10px] text-slate-500 mt-1">{item.detail}</p>}
                {item.note && <p className="text-[10px] text-amber-500/80 mt-1">{item.note}</p>}
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={load}
        className="w-full py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 text-xs font-semibold transition-all"
      >
        ↻ Refresh Plan
      </button>
    </div>
  );
}
