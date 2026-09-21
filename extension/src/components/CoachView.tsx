import { useState } from 'react';
import type { SessionState } from '../types';

interface Props {
  session: SessionState;
  elapsed: number;
  onCoachRequest: (requestType: 'hint' | 'approach' | 'solution', confirmSolution?: boolean) => void;
  onReflect: () => void;
  onPause: () => void;
  onResume: () => void;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function DifficultyBadge({ difficulty }: { difficulty?: string }) {
  const colors: Record<string, string> = {
    Easy: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    Medium: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    Hard: 'text-red-400 bg-red-400/10 border-red-400/30',
  };
  if (!difficulty) return null;
  return (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${colors[difficulty] || 'text-slate-400 bg-slate-700'}`}>
      {difficulty}
    </span>
  );
}

function MasteryBar({ mastery }: { mastery: number }) {
  const pct = Math.min(100, Math.max(0, mastery));
  const color = pct >= 70 ? '#34d399' : pct >= 40 ? '#fbbf24' : '#f87171';
  return (
    <div className="mt-2">
      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
        <span>Pattern Mastery</span>
        <span className="font-bold" style={{ color }}>{Math.round(pct)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function CoachView({ session, elapsed, onCoachRequest, onReflect, onPause, onResume }: Props) {
  const { currentProblem, coachMessage, coachPattern, skillMastery, lastPracticed,
    feedbackMessage, feedbackType, hintMessage, isTyping, timerState, status,
    backendUnavailable, attempt_id } = session;
  const [confirmingReveal, setConfirmingReveal] = useState(false);

  const isIdle = status === 'idle';
  const isCompleted = status === 'completed';
  const isPaused = timerState === 'PAUSED';

  if (isIdle) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-4 py-8">
        <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shadow-xl">
          <span className="text-3xl">🎯</span>
        </div>
        <div className="text-center">
          <p className="text-slate-300 font-medium">Ready to coach you</p>
          <p className="text-slate-500 text-sm mt-1">Open a LeetCode problem to begin</p>
        </div>
        <a
          href="https://leetcode.com/problemset/"
          target="_blank"
          rel="noreferrer"
          className="text-xs px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors text-white font-semibold"
        >
          Go to LeetCode →
        </a>
      </div>
    );
  }

  const handleReveal = () => {
    if (!confirmingReveal) {
      setConfirmingReveal(true);
      return;
    }
    setConfirmingReveal(false);
    onCoachRequest('solution', true);
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      {backendUnavailable && (
        <div className="bg-amber-950/50 rounded-xl border border-amber-600/40 p-3">
          <p className="text-sm text-amber-200 leading-relaxed">
            ⚠️ Coach temporarily unavailable. Your session is still being tracked.
            We'll sync your activity when connection returns.
          </p>
        </div>
      )}

      {/* Problem card */}
      <div className="bg-slate-800/80 rounded-xl border border-slate-700/60 p-4 shadow-lg">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h2 className="text-base font-bold text-white leading-tight capitalize">
            {currentProblem?.title || currentProblem?.slug?.replace(/-/g, ' ')}
          </h2>
          <DifficultyBadge difficulty={currentProblem?.difficulty} />
        </div>

        {coachPattern && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Pattern</span>
            <span className="text-xs font-semibold text-indigo-300 bg-indigo-900/40 px-2 py-0.5 rounded-md">
              {coachPattern}
            </span>
          </div>
        )}

        {skillMastery !== null && <MasteryBar mastery={skillMastery} />}

        {lastPracticed && (
          <p className="text-[10px] text-slate-500 mt-2">🔄 Last practiced: {lastPracticed}</p>
        )}
      </div>

      {/* Coach message */}
      {(coachMessage || isTyping) && (
        <div className="bg-indigo-950/60 rounded-xl border border-indigo-700/40 p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-indigo-400 text-xs font-bold uppercase tracking-wider">Coach</span>
            {isTyping && (
              <div className="flex gap-0.5">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            )}
          </div>
          <p className="text-sm text-slate-200 leading-relaxed">
            {isTyping ? 'Analyzing problem…' : coachMessage}
          </p>
        </div>
      )}

      {/* Hint */}
      {hintMessage && !coachMessage?.includes(hintMessage) && (
        <div className="bg-amber-950/40 rounded-xl border border-amber-600/30 p-3">
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            💡 Hint {session.hintLevel}
          </div>
          <p className="text-sm text-slate-200 leading-relaxed">{hintMessage}</p>
        </div>
      )}

      {/* Feedback */}
      {feedbackMessage && (
        <div className={`rounded-xl border p-3 ${
          feedbackType === 'success'
            ? 'bg-emerald-950/40 border-emerald-600/30'
            : feedbackType === 'error'
            ? 'bg-red-950/40 border-red-600/30'
            : 'bg-amber-950/40 border-amber-600/30'
        }`}>
          <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${
            feedbackType === 'success' ? 'text-emerald-400' :
            feedbackType === 'error' ? 'text-red-400' : 'text-amber-400'
          }`}>
            {feedbackType === 'success' ? '🎉 Accepted!' : feedbackType === 'error' ? '❌ Error' : '🔄 Try again'}
          </div>
          <p className="text-sm text-slate-200 leading-relaxed">{feedbackMessage}</p>
        </div>
      )}

      {/* Timer */}
      <div className="bg-slate-800/80 rounded-xl border border-slate-700/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Session</span>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${
              timerState === 'STARTED' || timerState === 'RESUMED'
                ? 'bg-emerald-400 animate-pulse'
                : timerState === 'SUBMITTED'
                ? 'bg-amber-400'
                : timerState === 'COMPLETED'
                ? 'bg-slate-500'
                : 'bg-slate-600'
            }`} />
            <span className="text-[10px] text-slate-500 capitalize">{timerState.toLowerCase()}</span>
          </div>
        </div>
        <div className="text-4xl font-mono font-bold tracking-wider text-white tabular-nums text-center mb-4">
          {formatTime(elapsed)}
        </div>

        <div className="flex flex-col gap-2">
          {(timerState === 'STARTED' || timerState === 'RESUMED' || isPaused) && (
            <button
              id="pause-resume-btn"
              onClick={isPaused ? onResume : onPause}
              className="w-full py-2 rounded-xl bg-slate-700 hover:bg-slate-600 active:scale-95 transition-all font-semibold text-xs text-white"
            >
              {isPaused ? '▶ Resume' : '⏸ Pause'}
            </button>
          )}

          <div className="flex gap-2">
            <button
              id="hint-btn"
              onClick={() => onCoachRequest('hint')}
              disabled={isTyping || isCompleted}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-40 transition-all font-semibold text-sm text-white shadow-lg shadow-indigo-900/30"
            >
              💡 {session.hintLevel === 0 ? 'Hint' : `More (${session.hintLevel + 1})`}
            </button>
            <button
              id="approach-btn"
              onClick={() => onCoachRequest('approach')}
              disabled={isTyping || isCompleted}
              className="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 active:scale-95 disabled:opacity-40 transition-all font-semibold text-sm text-white"
            >
              🧭 Approach
            </button>
          </div>

          <button
            id="reveal-solution-btn"
            onClick={handleReveal}
            disabled={isTyping || isCompleted}
            className={`w-full py-2 rounded-xl border active:scale-95 disabled:opacity-40 transition-all font-semibold text-xs ${
              confirmingReveal
                ? 'bg-red-900/40 border-red-600/50 text-red-300'
                : 'bg-transparent border-slate-700 text-slate-500 hover:text-slate-300'
            }`}
          >
            {confirmingReveal ? 'Tap again to reveal the full solution' : '🔓 Reveal Solution'}
          </button>

          <button
            id="reflect-btn"
            onClick={onReflect}
            disabled={isCompleted || !attempt_id}
            title={!attempt_id ? 'Submit a solution first' : undefined}
            className="w-full py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 active:scale-95 disabled:opacity-40 transition-all font-semibold text-sm text-white"
          >
            📝 Reflect & Finish
          </button>
        </div>
      </div>
    </div>
  );
}
