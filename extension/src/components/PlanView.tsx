import { useEffect, useState } from 'react';
import type { DailyPlan, PlanItem } from '../../types';

const ACTIVITY_COLORS: Record<PlanItem['activity'], string> = {
  Practice: 'text-indigo-400 bg-indigo-900/30 border-indigo-600/30',
  Review: 'text-amber-400 bg-amber-900/30 border-amber-600/30',
  Mock: 'text-rose-400 bg-rose-900/30 border-rose-600/30',
};

export function PlanView() {
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    chrome.runtime.sendMessage({ type: 'PLAN_REQUEST' }, (res) => {
      setLoading(false);
      if (res?.success && res.plan) {
        setPlan(res.plan);
      } else {
        setError(true);
      }
    });
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setError(false);
    chrome.runtime.sendMessage({ type: 'PLAN_REQUEST' }, (res) => {
      setLoading(false);
      if (res?.success && res.plan) {
        setPlan(res.plan);
      } else {
        setError(true);
      }
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
          onClick={handleRefresh}
          className="text-sm px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const donePct = plan.items.length
    ? Math.round((plan.items.filter(i => i.done).length / plan.items.length) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="bg-slate-800/80 rounded-xl border border-slate-700/60 p-4">
        <div className="flex justify-between items-center mb-2">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Today</p>
            <p className="text-base font-bold text-white">{plan.date}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-indigo-400">{plan.total_minutes}<span className="text-sm text-slate-500 ml-1">min</span></p>
            <p className="text-[10px] text-slate-500">goal</p>
          </div>
        </div>

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
        {plan.items.map((item, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
              item.done
                ? 'bg-slate-800/30 border-slate-700/30 opacity-60'
                : 'bg-slate-800/80 border-slate-700/60'
            }`}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
              item.done ? 'bg-emerald-900/50 text-emerald-400' : 'bg-slate-700 text-slate-400'
            }`}>
              {item.done ? '✓' : idx + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${item.done ? 'line-through text-slate-500' : 'text-white'}`}>
                {item.pattern}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${ACTIVITY_COLORS[item.activity]}`}>
                  {item.activity}
                </span>
                <span className="text-[10px] text-slate-500">{item.duration_minutes} min</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleRefresh}
        className="w-full py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 text-xs font-semibold transition-all"
      >
        ↻ Refresh Plan
      </button>
    </div>
  );
}
