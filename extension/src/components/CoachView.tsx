import { useState } from 'react';
import {
  Lightbulb, Compass, Unlock, NotebookPen, Pause, Play,
  Target, AlertTriangle, CheckCircle2, RotateCw, Sparkles, ExternalLink,
} from 'lucide-react';
import type { SessionState } from '../types';
import { cn, formatTime, masteryTone } from '../lib/utils';
import { Button } from './ui/button';
import { Card, CardBody, CardHeader } from './ui/card';
import { DifficultyBadge } from './ui/badge';
import { Meter } from './ui/meter';
import { EmptyState, Notice, StatusDot } from './ui/state';

interface Props {
  session: SessionState;
  elapsed: number;
  onCoachRequest: (requestType: 'hint' | 'approach' | 'solution', confirmSolution?: boolean) => void;
  onReflect: () => void;
  onPause: () => void;
  onResume: () => void;
}

export function CoachView({ session, elapsed, onCoachRequest, onReflect, onPause, onResume }: Props) {
  const {
    currentProblem, coachMessage, coachPattern, skillMastery, lastPracticed,
    feedbackMessage, feedbackType, hintMessage, isTyping, timerState, status,
    backendUnavailable, backendError, attempt_id, hintLevel,
  } = session;
  const [confirmingReveal, setConfirmingReveal] = useState(false);

  const isCompleted = status === 'completed';
  const isPaused = timerState === 'PAUSED';
  const running = timerState === 'STARTED' || timerState === 'RESUMED';

  if (status === 'idle') {
    return (
      <EmptyState
        icon={Target}
        title="Ready when you are"
        description="Open a LeetCode problem and the coach will pick up the session automatically."
        action={
          <a
            href="https://leetcode.com/problemset/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-white
              shadow-lg shadow-primary/20 transition-colors hover:bg-primary-hover"
          >
            Go to LeetCode
            <ExternalLink className="h-3 w-3" />
          </a>
        }
      />
    );
  }

  const handleReveal = () => {
    if (!confirmingReveal) return setConfirmingReveal(true);
    setConfirmingReveal(false);
    onCoachRequest('solution', true);
  };

  const tone = skillMastery !== null ? masteryTone(skillMastery) : null;

  return (
    <div className="flex flex-col gap-2.5 px-4 py-3">
      {backendUnavailable && (
        <Notice tone="warning" icon={AlertTriangle} title="Coach offline">
          Your session is still being tracked and will sync when the connection returns.
          {backendError && (
            <p className="mt-1.5 break-words font-mono text-[10px] leading-relaxed text-warning/80">{backendError}</p>
          )}
        </Notice>
      )}

      {/* Problem */}
      <Card>
        <CardBody className="pt-4">
          <div className="mb-3 flex items-start justify-between gap-2">
            <h2 className="text-[15px] font-bold capitalize leading-snug tracking-tight">
              {currentProblem?.title || currentProblem?.slug?.replace(/-/g, ' ')}
            </h2>
            <DifficultyBadge difficulty={currentProblem?.difficulty} />
          </div>

          {coachPattern && (
            <div className="mb-3 flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-subtle">Pattern</span>
              <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary ring-1 ring-primary/25">
                {coachPattern}
              </span>
            </div>
          )}

          {skillMastery !== null && tone && (
            <Meter
              value={skillMastery}
              label="Mastery"
              valueLabel={`${Math.round(skillMastery)}% · ${tone.label}`}
              color={tone.hex}
            />
          )}

          {lastPracticed && (
            <p className="mt-2.5 flex items-center gap-1.5 text-[10px] text-faint">
              <RotateCw className="h-3 w-3" />
              Last practiced {lastPracticed}
            </p>
          )}
        </CardBody>
      </Card>

      {/* Coach */}
      {(coachMessage || isTyping) && (
        <Notice tone="primary" icon={Sparkles} title="Coach">
          {isTyping ? (
            <span className="flex items-center gap-1.5 text-muted">
              Thinking
              <span className="flex gap-0.5">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="h-1 w-1 animate-bounce rounded-full bg-primary"
                    style={{ animationDelay: `${i * 0.12}s` }}
                  />
                ))}
              </span>
            </span>
          ) : (
            coachMessage
          )}
        </Notice>
      )}

      {hintMessage && !coachMessage?.includes(hintMessage) && (
        <Notice tone="warning" icon={Lightbulb} title={`Hint ${hintLevel || ''}`.trim()}>
          {hintMessage}
        </Notice>
      )}

      {feedbackMessage && (
        <Notice
          tone={feedbackType === 'success' ? 'success' : feedbackType === 'error' ? 'danger' : 'warning'}
          icon={feedbackType === 'success' ? CheckCircle2 : AlertTriangle}
          title={feedbackType === 'success' ? 'Accepted' : feedbackType === 'error' ? 'Error' : 'Keep going'}
        >
          {feedbackMessage}
        </Notice>
      )}

      {/* Session */}
      <Card>
        <CardHeader
          title="Session"
          action={
            <div className="flex items-center gap-1.5">
              <StatusDot tone={running ? 'success' : isPaused ? 'warning' : 'muted'} pulse={running} />
              <span className="text-[10px] capitalize text-faint">{timerState.toLowerCase()}</span>
            </div>
          }
        />
        <CardBody>
          <div className={cn(
            'mb-3 text-center font-mono text-[40px] font-bold leading-none tracking-tight tabular-nums',
            isPaused ? 'text-subtle' : 'text-foreground',
          )}>
            {formatTime(elapsed)}
          </div>

          <div className="flex flex-col gap-1.5">
            {(running || isPaused) && (
              <Button variant="secondary" size="sm" block onClick={isPaused ? onResume : onPause}>
                {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
            )}

            <div className="flex gap-1.5">
              <Button
                className="flex-1"
                disabled={isTyping || isCompleted}
                onClick={() => onCoachRequest('hint')}
              >
                <Lightbulb className="h-3.5 w-3.5" />
                {hintLevel === 0 ? 'Hint' : `Hint ${hintLevel + 1}`}
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                disabled={isTyping || isCompleted}
                onClick={() => onCoachRequest('approach')}
              >
                <Compass className="h-3.5 w-3.5" />
                Approach
              </Button>
            </div>

            <Button
              variant={confirmingReveal ? 'danger' : 'outline'}
              size="sm"
              block
              disabled={isTyping || isCompleted}
              onClick={handleReveal}
              onBlur={() => setConfirmingReveal(false)}
            >
              <Unlock className="h-3 w-3" />
              {confirmingReveal ? 'Tap again to reveal solution' : 'Reveal solution'}
            </Button>

            <Button
              variant="secondary"
              block
              disabled={isCompleted || !attempt_id}
              title={!attempt_id ? 'Submit a solution first' : undefined}
              onClick={onReflect}
            >
              <NotebookPen className="h-3.5 w-3.5" />
              Reflect & finish
            </Button>
            {!attempt_id && !isCompleted && (
              <p className="text-center text-[10px] text-faint">Submit once to unlock reflection</p>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
