import { useState } from 'react';
import { CheckCircle2, ArrowLeft, Send } from 'lucide-react';
import type { ReflectionPayload, SessionState } from '../types';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Card, CardBody, CardHeader } from './ui/card';
import { Field, Textarea, ChoiceRow } from './ui/field';
import { EmptyState } from './ui/state';

interface Props {
  session: SessionState;
  onSubmit: (payload: ReflectionPayload) => void;
  onCancel: () => void;
}

const HOW_OPTIONS = [
  { value: 'independent', label: 'Solved it on my own' },
  { value: 'small_hint', label: 'Needed a small hint' },
  { value: 'several_hints', label: 'Needed several hints' },
  { value: 'viewed_solution', label: 'Viewed the solution' },
  { value: 'couldnt_solve', label: "Couldn't solve it" },
];

const DIFFICULTY_OPTIONS = [
  { value: 'PATTERN_NOT_RECOGNIZED', label: "Didn't spot the pattern" },
  { value: 'WRONG_APPROACH', label: 'Wrong approach' },
  { value: 'IMPLEMENTATION_BUG', label: 'Implementation bug' },
  { value: 'EDGE_CASE', label: 'Edge case' },
  { value: 'COMPLEXITY_TLE', label: 'Complexity / TLE' },
  { value: 'TIME_PRESSURE', label: 'Time pressure' },
  { value: 'PROBLEM_NOT_UNDERSTOOD', label: "Didn't understand it" },
  { value: 'OTHER', label: 'Other' },
];

export function ReflectionView({ session, onSubmit, onCancel }: Props) {
  const [confidence, setConfidence] = useState(3);
  const [howItWent, setHowItWent] = useState('');
  const [errorTypes, setErrorTypes] = useState<string[]>([]);
  const [reflection, setReflection] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const toggleError = (val: string) =>
    setErrorTypes(prev => (prev.includes(val) ? prev.filter(e => e !== val) : [...prev, val]));

  const handleSubmit = () => {
    if (!howItWent) return;
    setSubmitted(true);
    onSubmit({
      confidence,
      how_it_went: howItWent,
      main_difficulty: errorTypes[0],
      reflection: reflection.trim() || undefined,
      hints_used: session.hintLevel,
      solution_viewed: howItWent === 'viewed_solution',
      error_types: errorTypes,
    });
  };

  if (submitted) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="Reflection saved"
        description="Your skill profile has been re-scored, and tomorrow's plan will use it."
        action={
          <Button variant="secondary" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to coach
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-2.5 px-4 py-3">
      <div className="px-1">
        <h2 className="text-[15px] font-bold tracking-tight">How did it go?</h2>
        <p className="mt-0.5 text-xs text-subtle">This is what tunes tomorrow's plan.</p>
      </div>

      <Card>
        <CardHeader title="Outcome" />
        <CardBody className="flex flex-col gap-1.5 pt-1">
          {HOW_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setHowItWent(opt.value)}
              className={cn(
                'rounded-lg border px-3 py-2.5 text-left text-[13px] font-medium transition-all active:scale-[0.99]',
                howItWent === opt.value
                  ? 'border-primary bg-primary/15 text-foreground'
                  : 'border-border-subtle bg-background text-muted hover:border-border-strong hover:text-foreground',
              )}
            >
              {opt.label}
            </button>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Confidence" />
        <CardBody className="pt-1">
          <ChoiceRow
            options={[1, 2, 3, 4, 5].map(n => ({ value: n, label: String(n) }))}
            value={confidence}
            onChange={setConfidence}
          />
          <div className="mt-1.5 flex justify-between text-[10px] text-faint">
            <span>Guessed</span>
            <span>Very confident</span>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="What was hard" />
        <CardBody className="pt-1">
          <div className="flex flex-wrap gap-1.5">
            {DIFFICULTY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => toggleError(opt.value)}
                className={cn(
                  'rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all active:scale-95',
                  errorTypes.includes(opt.value)
                    ? 'border-warning/60 bg-warning/15 text-warning'
                    : 'border-border-subtle bg-background text-subtle hover:border-border-strong hover:text-muted',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="pt-4">
          <Field label="What did you learn? (optional)">
            <Textarea
              rows={3}
              value={reflection}
              onChange={e => setReflection(e.target.value)}
              placeholder="e.g. I didn't see that the window only had to shrink on invalid state…"
            />
          </Field>
        </CardBody>
      </Card>

      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button className="flex-1" disabled={!howItWent} onClick={handleSubmit}>
          <Send className="h-3.5 w-3.5" />
          Submit
        </Button>
      </div>
    </div>
  );
}
