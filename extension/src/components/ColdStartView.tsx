import { useState } from 'react';
import { Brain, ArrowRight, AlertTriangle, Loader2, User, Target, Clock3, Gauge } from 'lucide-react';
import type { ColdStartPayload } from '../types';
import { Button } from './ui/button';
import { Card, CardBody, CardHeader } from './ui/card';
import { Field, Input, Slider, ChoiceRow } from './ui/field';

// Best-effort match to the pattern topics in Main-PRD.MD §15/§35. Self-ratings
// join against patterns.topic (case-insensitive) — adjust if your seed differs.
const TOPICS = [
  'Arrays', 'Strings', 'Two Pointers', 'Sliding Window', 'Binary Search',
  'Trees', 'Graphs', 'Dynamic Programming', 'Backtracking',
  'Stacks & Queues', 'Linked Lists', 'Heaps', 'Greedy', 'Bit Manipulation',
];

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const RATING_HINT = ['Never done it', 'Seen it', 'Can do with help', 'Comfortable', 'Confident'];

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
    Object.fromEntries(TOPICS.map(t => [t, 3])),
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

    chrome.runtime.sendMessage({ type: 'COLD_START', payload }, res => {
      setSubmitting(false);
      if (!res?.success) setError(res?.error || 'Could not reach the coach backend.');
      // On success background.ts flips settings.onboarded and App swaps the view.
    });
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-y-auto bg-background text-foreground">
      <header className="shrink-0 border-b border-border-subtle bg-surface/80 px-4 py-4 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/30">
            <Brain className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h1 className="text-[14px] font-bold tracking-tight">Welcome to DSA Coach</h1>
            <p className="text-[10px] text-faint">Two minutes to calibrate your starting point</p>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-2.5 px-4 py-3">
        <Card>
          <CardHeader title="About you" icon={<User className="h-3 w-3" />} />
          <CardBody className="flex flex-col gap-3 pt-1">
            <Field label="Name">
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
            </Field>
            <Field label="Email" hint="Where the daily plan and weekly report are sent.">
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </Field>
            <Field label="LeetCode username" hint="Used to import your recent solves overnight.">
              <Input value={leetcodeUsername} onChange={e => setLeetcodeUsername(e.target.value)} placeholder="username" />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Target" icon={<Target className="h-3 w-3" />} />
          <CardBody className="flex flex-col gap-3 pt-1">
            <Field label="Company (optional)">
              <Input value={targetCompany} onChange={e => setTargetCompany(e.target.value)} placeholder="e.g. Google" />
            </Field>
            <div className="flex gap-2">
              <Field label="Role" className="flex-1">
                <Input value={targetRole} onChange={e => setTargetRole(e.target.value)} />
              </Field>
              <Field label="Target date" className="flex-1">
                <Input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
              </Field>
            </div>
            <Field label="Current level">
              <ChoiceRow
                options={LEVELS.map(l => ({ value: l, label: l }))}
                value={level}
                onChange={setLevel}
              />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Practice time" icon={<Clock3 className="h-3 w-3" />} />
          <CardBody className="flex flex-col gap-3 pt-1">
            <Field label={`Hours per week · ${hoursPerWeek}h`}>
              <Slider value={hoursPerWeek} onValueChange={setHoursPerWeek} min={1} max={40} />
            </Field>
            <Field label={`Daily minutes · ${dailyMinutes}m`}>
              <Slider value={dailyMinutes} onValueChange={setDailyMinutes} min={15} max={180} step={15} />
            </Field>
            <Field label="Target sets" hint="Curated problem lists to draw from, comma separated.">
              <Input
                value={targetSets}
                onChange={e => setTargetSets(e.target.value)}
                className="font-mono text-[11px]"
              />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Confidence by topic" icon={<Gauge className="h-3 w-3" />} />
          <CardBody className="flex flex-col gap-3.5 pt-1">
            <p className="text-[10px] leading-relaxed text-faint">
              A rough starting guess only — real attempts overwrite it quickly.
            </p>
            {TOPICS.map(topic => (
              <div key={topic}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="text-[12px] font-medium text-foreground">{topic}</span>
                  <span className="text-[10px] text-subtle">{RATING_HINT[ratings[topic] - 1]}</span>
                </div>
                <Slider
                  value={ratings[topic]}
                  onValueChange={v => setRatings(r => ({ ...r, [topic]: v }))}
                  min={1}
                  max={5}
                />
              </div>
            ))}
          </CardBody>
        </Card>

        {error && (
          <div className="flex gap-2 rounded-xl border border-danger/25 bg-danger/10 p-3">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" />
            <p className="break-words text-[11px] leading-relaxed text-danger/90">{error}</p>
          </div>
        )}

        <Button block size="lg" disabled={submitting} onClick={handleSubmit}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {submitting ? 'Setting up your coach…' : 'Start coaching'}
          {!submitting && <ArrowRight className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
