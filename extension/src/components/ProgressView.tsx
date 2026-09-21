import { useEffect, useState } from 'react';
import type { SkillProgress } from '../../types';

// ─── Mock data so the view always shows something useful even if n8n is unavailable ─
const MOCK_SKILLS: SkillProgress[] = [
  { pattern: 'Arrays / Hash Map', topic: 'Arrays', mastery: 78 },
  { pattern: 'Two Pointers', topic: 'Arrays', mastery: 64 },
  { pattern: 'Sliding Window', topic: 'Arrays', mastery: 43 },
  { pattern: 'Binary Search', topic: 'Search', mastery: 55 },
  { pattern: 'Tree DFS/BFS', topic: 'Trees', mastery: 61 },
  { pattern: 'Graph BFS/DFS', topic: 'Graphs', mastery: 38 },
  { pattern: 'Dynamic Programming', topic: 'DP', mastery: 29 },
  { pattern: 'Backtracking', topic: 'Recursion', mastery: 35 },
];

function getMasteryColor(m: number): string {
  if (m >= 70) return '#34d399';
  if (m >= 40) return '#fbbf24';
  return '#f87171';
}

function getMasteryLabel(m: number): string {
  if (m >= 80) return 'Strong';
  if (m >= 60) return 'Good';
  if (m >= 40) return 'Growing';
  if (m >= 20) return 'Weak';
  return 'New';
}

export function ProgressView() {
  const [skills, setSkills] = useState<SkillProgress[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'PROGRESS_REQUEST' }, (res) => {
      setLoading(false);
      if (res?.success && res.skills?.length) {
        setSkills(res.skills);
      } else {
        setSkills(MOCK_SKILLS); // Fall back to mock
      }
    });
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const skillList = skills || MOCK_SKILLS;
  const avgMastery = skillList.length
    ? Math.round(skillList.reduce((s, k) => s + k.mastery, 0) / skillList.length)
    : 0;

  // Group by topic
  const groups = skillList.reduce<Record<string, SkillProgress[]>>((acc, s) => {
    const key = s.topic || 'General';
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Overall */}
      <div className="bg-slate-800/80 rounded-xl border border-slate-700/60 p-4">
        <div className="flex items-end gap-3 mb-3">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Overall Mastery</p>
            <div className="text-4xl font-bold mt-0.5" style={{ color: getMasteryColor(avgMastery) }}>
              {avgMastery}<span className="text-xl text-slate-500">%</span>
            </div>
          </div>
          <div className="flex-1 pb-1">
            <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${avgMastery}%`, backgroundColor: getMasteryColor(avgMastery) }}
              />
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-400">{skillList.length} patterns tracked</p>
      </div>

      {/* By group */}
      {Object.entries(groups).map(([topic, items]) => (
        <div key={topic} className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-700/50">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{topic}</p>
          </div>
          <div className="divide-y divide-slate-700/30">
            {items.map((skill) => {
              const color = getMasteryColor(skill.mastery);
              const pct = Math.min(100, Math.max(0, skill.mastery));
              return (
                <div key={skill.pattern} className="px-4 py-3">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm text-slate-200 font-medium">{skill.pattern}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold" style={{ color }}>
                        {getMasteryLabel(pct)}
                      </span>
                      <span className="text-xs font-bold tabular-nums" style={{ color }}>{pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                  {skill.last_practiced && (
                    <p className="text-[10px] text-slate-600 mt-1">Last: {skill.last_practiced}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <p className="text-center text-[10px] text-slate-600 pb-2">
        Data from Supabase via n8n · {skills === MOCK_SKILLS ? 'Preview data' : 'Live'}
      </p>
    </div>
  );
}
