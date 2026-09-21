import { useState } from 'react';
import type { ColdStartPayload } from '../types';

// Best-effort match to the pattern topics described in Main-PRD.MD §15/§35.
// Self-ratings join against `patterns.topic` in the database (case-insensitive) —
// if your seed data uses different topic names, adjust this list to match.
const TOPICS = [
  'Arrays', 'Strings', 'Two Pointers', 'Sliding Window', 'Binary Search',
  'Trees', 'Graphs', 'Dynamic Programming', 'Backtracking',
  'Stacks & Queues', 'Linked Lists', 'Heaps', 'Greedy', 'Bit Manipulation',
];

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

export function ColdStartView() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [leetcodeUsername, setLeetcodeUsername] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [targetRole, setTargetRole] = useState('SWE');
  const [targetDate, setTargetDate] = useState('');
  const [hoursPerWeek, setHoursPerWeek] = useState(7);
  const [dailyMinutes, setDailyMinutes] = useState(45);
  const [level, setLevel] = useState('Intermediate');
  const [targetSets, setTargetSets] = useState('starter');
  const [ratings, setRatings] = useState<Record<string, number>>(
    Object.fromEntries(TOPICS.map(t => [t, 3]))
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    setSubmitting(true);
    setError(null);

    const payload: ColdStartPayload = {
      name: name.trim() || 'Me',
      email: email.trim() || undefined,
      leetcode_username: leetcodeUsername.trim() || undefined,
      target_company: targetCompany.trim() || undefined,
      target_role: targetRole.trim() || 'SWE',
      target_date: targetDate || undefined,
      hours_per_week: hoursPerWeek,
      daily_minutes: dailyMinutes,
      level,
      target_sets: targetSets.split(',').map(s => s.trim()).filter(Boolean),
      self_ratings: ratings,
    };

    chrome.runtime.sendMessage({ type: 'COLD_START', payload }, (res) => {
      setSubmitting(false);
      if (!res?.success) {
        setError(res?.error || 'Could not reach the coach backend.');
      }
      // On success, background.ts flips settings.onboarded = true and App.tsx
      // picks it up via the storage listener — nothing else to do here.
    });
  };

  return (
    <div className="flex flex-col w-full h-screen bg-[#0d1117] text-slate-100 overflow-y-auto">
      <header className="flex-shrink-0 px-4 pt-5 pb-4 bg-[#161b22] border-b border-[#30363d]">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-lg">
            🧠
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-none">Welcome to DSA Coach</h1>
            <p className="text-[10px] text-slate-500 leading-none mt-0.5">Let's calibrate your starting point</p>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-4 p-4">
        <section className="bg-slate-800/80 rounded-xl border border-slate-700/60 p-4 flex flex-col gap-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">About you</p>
          <input
            id="cs-name" type="text" placeholder="Name" value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500"
          />
          <input
            id="cs-email" type="email" placeholder="Email (for daily plan / weekly report)" value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500"
          />
          <input
            id="cs-leetcode" type="text" placeholder="LeetCode username" value={leetcodeUsername}
            onChange={e => setLeetcodeUsername(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500"
          />
        </section>

        <section className="bg-slate-800/80 rounded-xl border border-slate-700/60 p-4 flex flex-col gap-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target</p>
          <input
            id="cs-company" type="text" placeholder="Target company (optional)" value={targetCompany}
            onChange={e => setTargetCompany(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500"
          />
          <div className="flex gap-2">
            <input
              id="cs-role" type="text" placeholder="Role, e.g. SWE" value={targetRole}
              onChange={e => setTargetRole(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500"
            />
            <input
              id="cs-date" type="date" value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500"
            />
          </div>
          <label className="text-[10px] text-slate-500">Level</label>
          <div className="flex gap-2">
            {LEVELS.map(l => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  level === l ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </section>

        <section className="bg-slate-800/80 rounded-xl border border-slate-700/60 p-4 flex flex-col gap-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Practice time</p>
          <div>
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>Hours / week</span><span className="font-bold text-indigo-400">{hoursPerWeek}h</span>
            </div>
            <input
              id="cs-hours" type="range" min={1} max={40} value={hoursPerWeek}
              onChange={e => setHoursPerWeek(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>
          <div>
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>Daily minutes</span><span className="font-bold text-indigo-400">{dailyMinutes}m</span>
            </div>
            <input
              id="cs-daily" type="range" min={15} max={180} step={15} value={dailyMinutes}
              onChange={e => setDailyMinutes(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>
          <input
            id="cs-target-sets" type="text" placeholder="Target sets (comma separated)" value={targetSets}
            onChange={e => setTargetSets(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500 font-mono"
          />
        </section>

        <section className="bg-slate-800/80 rounded-xl border border-slate-700/60 p-4 flex flex-col gap-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Confidence by topic</p>
          {TOPICS.map(topic => (
            <div key={topic}>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>{topic}</span><span className="font-bold text-indigo-400">{ratings[topic]}</span>
              </div>
              <input
                type="range" min={1} max={5} value={ratings[topic]}
                onChange={e => setRatings(r => ({ ...r, [topic]: Number(e.target.value) }))}
                className="w-full accent-indigo-500"
              />
            </div>
          ))}
        </section>

        {error && (
          <div className="bg-red-950/40 border border-red-600/30 rounded-xl p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        <button
          id="cs-submit"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 active:scale-95 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-900/30"
        >
          {submitting ? 'Setting up your coach…' : 'Start Coaching →'}
        </button>
      </div>
    </div>
  );
}
