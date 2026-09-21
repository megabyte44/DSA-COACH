import { useEffect, useState, useRef } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { Brain, CalendarDays, BarChart3, Settings2 } from 'lucide-react';
import './index.css';
import type { SessionState, ReflectionPayload, Settings } from './types';
import { DEFAULT_SESSION, DEFAULT_SETTINGS } from './services/storage';
import { cn } from './lib/utils';
import { CoachView } from './components/CoachView';
import { ReflectionView } from './components/ReflectionView';
import { PlanView } from './components/PlanView';
import { ProgressView } from './components/ProgressView';
import { SettingsView } from './components/SettingsView';
import { ColdStartView } from './components/ColdStartView';
import { Loading, StatusDot } from './components/ui/state';

type Tab = 'coach' | 'plan' | 'progress' | 'settings';

const TABS = [
  { id: 'coach' as const, label: 'Coach', icon: Brain },
  { id: 'plan' as const, label: 'Plan', icon: CalendarDays },
  { id: 'progress' as const, label: 'Progress', icon: BarChart3 },
  { id: 'settings' as const, label: 'Settings', icon: Settings2 },
];

function calcElapsed(session: SessionState): number {
  if (!session.timerStartedAt) return session.elapsedOnPause;
  if (session.timerState === 'PAUSED' || session.timerState === 'COMPLETED') {
    return session.elapsedOnPause;
  }
  return Math.floor((Date.now() - session.timerStartedAt) / 1000) + session.elapsedOnPause;
}

export default function App() {
  const [tab, setTab] = useState<Tab>('coach');
  const [isReflecting, setIsReflecting] = useState(false);
  const [session, setSession] = useState<SessionState>(DEFAULT_SESSION);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    chrome.storage.local.get(['session', 'settings'], result => {
      if (result.session) setSession(result.session as SessionState);
      setSettings({ ...DEFAULT_SETTINGS, ...(result.settings as Partial<Settings>) });
    });

    const listener = (changes: Record<string, chrome.storage.StorageChange>, ns: string) => {
      if (ns !== 'local') return;
      if (changes.session) setSession(changes.session.newValue as SessionState);
      if (changes.settings) {
        setSettings({ ...DEFAULT_SETTINGS, ...(changes.settings.newValue as Partial<Settings>) });
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (session.timerState === 'STARTED' || session.timerState === 'RESUMED') {
      timerRef.current = setInterval(() => setElapsed(calcElapsed(session)), 1000);
    } else {
      setElapsed(calcElapsed(session));
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session]);

  const handleCoachRequest = (
    requestType: 'hint' | 'approach' | 'solution',
    confirmSolution?: boolean,
  ) => {
    if (session.isTyping) return;
    chrome.runtime.sendMessage({
      type: 'COACH_REQUEST',
      payload: { request_type: requestType, confirm_solution: confirmSolution },
    });
  };

  const handlePause = () => chrome.runtime.sendMessage({ type: 'PAUSE_TIMER' });
  const handleResume = () => chrome.runtime.sendMessage({ type: 'RESUME_TIMER' });
  const handleReflect = () => setIsReflecting(true);
  const handleReflectionSubmit = (payload: ReflectionPayload) =>
    chrome.runtime.sendMessage({ type: 'REFLECTION', payload });
  const handleReflectionCancel = () => setIsReflecting(false);

  const handleRedoOnboarding = () => {
    if (!settings) return;
    chrome.storage.local.set({ settings: { ...settings, onboarded: false } });
  };

  if (!settings) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loading />
      </div>
    );
  }

  if (!settings.onboarded) return <ColdStartView />;

  const live = session.status === 'active' || session.status === 'submitted';

  return (
    <Tabs.Root
      value={tab}
      onValueChange={v => {
        setTab(v as Tab);
        if (v !== 'coach') setIsReflecting(false);
      }}
      className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground"
    >
      <header className="flex shrink-0 items-center justify-between border-b border-border-subtle bg-surface/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/30">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <div className="leading-tight">
            <h1 className="text-[13px] font-bold tracking-tight">DSA Coach</h1>
            <p className="text-[10px] text-faint">Adaptive practice</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-border-subtle bg-background px-2 py-1">
          <StatusDot tone={live ? 'success' : 'muted'} pulse={live} />
          <span className="text-[10px] font-medium text-subtle">{live ? 'Coaching' : 'Standby'}</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <Tabs.Content value="coach" className="flex min-h-full flex-col focus-visible:outline-none">
          {isReflecting ? (
            <ReflectionView
              session={session}
              onSubmit={handleReflectionSubmit}
              onCancel={handleReflectionCancel}
            />
          ) : (
            <CoachView
              session={session}
              elapsed={elapsed}
              onCoachRequest={handleCoachRequest}
              onReflect={handleReflect}
              onPause={handlePause}
              onResume={handleResume}
            />
          )}
        </Tabs.Content>
        <Tabs.Content value="plan" className="flex min-h-full flex-col focus-visible:outline-none">
          <PlanView />
        </Tabs.Content>
        <Tabs.Content value="progress" className="flex min-h-full flex-col focus-visible:outline-none">
          <ProgressView />
        </Tabs.Content>
        <Tabs.Content value="settings" className="flex min-h-full flex-col focus-visible:outline-none">
          <SettingsView onRedoOnboarding={handleRedoOnboarding} />
        </Tabs.Content>
      </main>

      <Tabs.List className="flex shrink-0 gap-1 border-t border-border-subtle bg-surface/80 px-2 py-1.5 backdrop-blur">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <Tabs.Trigger
              key={t.id}
              value={t.id}
              className={cn(
                'relative flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                active ? 'bg-primary/10 text-primary' : 'text-faint hover:bg-elevated hover:text-muted',
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="text-[10px] font-semibold tracking-wide">{t.label}</span>
              {t.id === 'coach' && session.status === 'active' && !active && (
                <span className="absolute right-1/2 top-1 h-1.5 w-1.5 translate-x-3 rounded-full bg-success" />
              )}
            </Tabs.Trigger>
          );
        })}
      </Tabs.List>
    </Tabs.Root>
  );
}
