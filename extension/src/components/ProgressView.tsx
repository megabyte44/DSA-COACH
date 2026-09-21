import { useEffect, useState } from 'react';
import { WifiOff, Sprout, TrendingUp } from 'lucide-react';
import type { SkillProgress } from '../types';
import { masteryTone } from '../lib/utils';
import { Card, CardBody, CardHeader } from './ui/card';
import { Meter } from './ui/meter';
import { EmptyState, Loading } from './ui/state';

export function ProgressView() {
  const [skills, setSkills] = useState<SkillProgress[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'PROGRESS_REQUEST' }, res => {
      setLoading(false);
      if (res?.success && Array.isArray(res.skills)) setSkills(res.skills);
      else setFailed(true);
    });
  }, []);

  if (loading) return <Loading label="Loading your skill profile…" />;

  if (failed || !skills) {
    return (
      <EmptyState
        icon={WifiOff}
        tone="warning"
        title="Couldn't load progress"
        description="The coach backend didn't answer. Check the endpoint in Settings."
      />
    );
  }

  if (skills.length === 0) {
    return (
      <EmptyState
        icon={Sprout}
        title="No data yet"
        description="Solve a problem or finish onboarding and your skill profile starts building itself."
      />
    );
  }

  const avg = Math.round(skills.reduce((s, k) => s + k.mastery, 0) / skills.length);
  const avgTone = masteryTone(avg);

  const groups = skills.reduce<Record<string, SkillProgress[]>>((acc, s) => {
    const key = s.topic || 'General';
    (acc[key] = acc[key] || []).push(s);
    return acc;
  }, {});

  const sortedGroups = Object.entries(groups).sort(
    (a, b) =>
      b[1].reduce((s, k) => s + k.mastery, 0) / b[1].length -
      a[1].reduce((s, k) => s + k.mastery, 0) / a[1].length,
  );

  return (
    <div className="flex flex-col gap-2.5 px-4 py-3">
      <Card>
        <CardBody className="pt-4">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-subtle">Overall mastery</p>
              <p className="mt-1 text-4xl font-bold leading-none" style={{ color: avgTone.hex }}>
                {avg}
                <span className="ml-0.5 text-lg text-faint">%</span>
              </p>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-border-subtle bg-background px-2 py-1">
              <TrendingUp className="h-3 w-3 text-subtle" />
              <span className="text-[10px] text-subtle">{skills.length} patterns</span>
            </div>
          </div>
          <Meter value={avg} color={avgTone.hex} />
        </CardBody>
      </Card>

      {sortedGroups.map(([topic, items]) => (
        <Card key={topic}>
          <CardHeader title={topic} />
          <CardBody className="flex flex-col gap-3 pt-1">
            {items
              .slice()
              .sort((a, b) => b.mastery - a.mastery)
              .map(skill => {
                const tone = masteryTone(skill.mastery);
                return (
                  <div key={skill.pattern}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-2">
                      <span className="truncate text-[13px] font-medium text-foreground">{skill.pattern}</span>
                      <span className="shrink-0 font-mono text-[11px] font-bold tabular-nums" style={{ color: tone.hex }}>
                        {Math.round(skill.mastery)}%
                      </span>
                    </div>
                    <Meter value={skill.mastery} color={tone.hex} size="sm" />
                    {(skill.problems_solved ?? 0) > 0 && (
                      <p className="mt-1 text-[10px] text-faint">{skill.problems_solved} solved</p>
                    )}
                  </div>
                );
              })}
          </CardBody>
        </Card>
      ))}

      <p className="pb-1 text-center text-[10px] text-faint">Derived from your attempt history</p>
    </div>
  );
}
