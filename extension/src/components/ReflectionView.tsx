import { useState } from 'react';
import type { ReflectionPayload, SessionState } from '../types';

interface Props {
  session: SessionState;
  onSubmit: (payload: ReflectionPayload) => void;
  onCancel: () => void;
}

const HOW_OPTIONS = [
  { value: 'independent', label: '✅ Solved independently', emoji: '✅' },
  { value: 'small_hint', label: '💡 Needed a small hint', emoji: '💡' },
  { value: 'several_hints', label: '🔦 Needed several hints', emoji: '🔦' },
  { value: 'viewed_solution', label: '👀 Viewed the solution', emoji: '👀' },
  { value: 'couldnt_solve', label: "❌ Couldn't solve it", emoji: '❌' },
];

const DIFFICULTY_OPTIONS = [
  { value: 'PATTERN_NOT_RECOGNIZED', label: "Didn't recognize pattern" },
  { value: 'WRONG_APPROACH', label: 'Wrong approach' },
  { value: 'IMPLEMENTATION_BUG', label: 'Implementation bug' },
  { value: 'EDGE_CASE', label: 'Edge case miss' },
  { value: 'COMPLEXITY_TLE', label: 'Complexity / TLE' },
  { value: 'TIME_PRESSURE', label: 'Time pressure' },
  { value: 'PROBLEM_NOT_UNDERSTOOD', label: "Didn't understand problem" },
  { value: 'OTHER', label: 'Other' },
];

export function ReflectionView({ session, onSubmit, onCancel }: Props) {
  const [confidence, setConfidence] = useState(3);
  const [howItWent, setHowItWent] = useState('');
  const [errorTypes, setErrorTypes] = useState<string[]>([]);
  const [reflection, setReflection] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const toggleError = (val: string) => {
    setErrorTypes(prev =>
      prev.includes(val) ? prev.filter(e => e !== val) : [...prev, val]
    );
  };

  const handleSubmit = () => {
    if (!howItWent) return;
    setSubmitted(true);

    const payload: ReflectionPayload = {
      confidence,
      how_it_went: howItWent,
      main_difficulty: errorTypes[0],
      reflection: reflection.trim() || undefined,
      hints_used: session.hintLevel,
      solution_viewed: howItWent === 'viewed_solution',
      error_types: errorTypes,
    };
    onSubmit(payload);
  };

  if (submitted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
        <div className="w-16 h-16 rounded-full bg-emerald-900/40 border border-emerald-500/30 flex items-center justify-center">
          <span className="text-2xl">🧠</span>
        </div>
        <div className="text-center">
          <p className="text-emerald-400 font-bold text-lg">Reflection saved!</p>
          <p className="text-slate-400 text-sm mt-1">Your coach has updated your skill profile.</p>
        </div>
        <button
          onClick={onCancel}
          className="text-sm px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
        >
          Back to Coach →
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto">
      <h2 className="text-base font-bold text-white">How did it go?</h2>

      {/* How it went */}
      <div className="flex flex-col gap-1.5">
        {HOW_OPTIONS.map(opt => (
          <button
            key={opt.value}
            id={`how-${opt.value}`}
            onClick={() => setHowItWent(opt.value)}
            className={`text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
              howItWent === opt.value
                ? 'bg-indigo-600/30 border-indigo-500 text-white'
                : 'bg-slate-800/60 border-slate-700/50 text-slate-300 hover:bg-slate-700/60'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Confidence */}
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-2">
          Confidence Level
        </p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              id={`conf-${n}`}
              onClick={() => setConfidence(n)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all border ${
                confidence === n
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-slate-600 mt-1 px-1">
          <span>Guessed</span>
          <span>Very confident</span>
        </div>
      </div>

      {/* Error types */}
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-2">
          What was difficult? <span className="text-slate-600 normal-case">(optional)</span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {DIFFICULTY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => toggleError(opt.value)}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                errorTypes.includes(opt.value)
                  ? 'bg-amber-600/30 border-amber-500/60 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs text-slate-400 uppercase tracking-wider font-bold block mb-2">
          What did you learn? <span className="text-slate-600 normal-case">(optional)</span>
        </label>
        <textarea
          id="reflection-text"
          value={reflection}
          onChange={e => setReflection(e.target.value)}
          placeholder="e.g. I didn't recognize the hash map approach…"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 resize-none outline-none focus:border-indigo-500 transition-colors"
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition-colors"
        >
          Cancel
        </button>
        <button
          id="submit-reflection-btn"
          onClick={handleSubmit}
          disabled={!howItWent}
          className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 active:scale-95 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-900/30"
        >
          Submit Reflection
        </button>
      </div>
    </div>
  );
}
