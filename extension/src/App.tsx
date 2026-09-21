import { useEffect, useState, useRef } from 'react';
import './index.css';
import type { SessionState, ReflectionPayload, Settings } from './types';
import { DEFAULT_SESSION, DEFAULT_SETTINGS } from './services/storage';
import { CoachView } from './components/CoachView';
import { ReflectionView } from './components/ReflectionView';
import { PlanView } from './components/PlanView';
import { ProgressView } from './components/ProgressView';
import { SettingsView } from './components/SettingsView';
import { ColdStartView } from './components/ColdStartView';

// ─── Nav tabs ──────────────────────────────────────────────────────────────────
type Tab = 'coach' | 'plan' | 'progress' | 'settings';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'coach', label: 'Coach', icon: '🧠' },
  { id: 'plan', label: 'Plan', icon: '📅' },
  { id: 'progress', label: 'Progress', icon: '📊' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

// ─── Elapsed time calculation ──────────────────────────────────────────────────
function calcElapsed(session: SessionState): number {
  if (!session.timerStartedAt) return session.elapsedOnPause;
  if (session.timerState === 'PAUSED' || session.timerState === 'COMPLETED') {
    return session.elapsedOnPause;
  }
  return Math.floor((Date.now() - session.timerStartedAt) / 1000) + session.elapsedOnPause;
}

// ─── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState<Tab>('coach');
  const [isReflecting, setIsReflecting] = useState(false);
  const [session, setSession] = useState<SessionState>(DEFAULT_SESSION);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load session + settings from storage ─────────────────────────────────────
  useEffect(() => {
    chrome.storage.local.get(['session', 'settings'], (result) => {
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

  // ── Tick timer ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (
      session.timerState === 'STARTED' ||
      session.timerState === 'RESUMED'
    ) {
      timerRef.current = setInterval(() => {
        setElapsed(calcElapsed(session));
      }, 1000);
    } else {
      setElapsed(calcElapsed(session));
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleCoachRequest = (requestType: 'hint' | 'approach' | 'solution', confirmSolution?: boolean) => {
    if (session.isTyping) return;
    chrome.runtime.sendMessage({
      type: 'COACH_REQUEST',
      payload: { request_type: requestType, confirm_solution: confirmSolution },
    });
  };

  const handlePause = () => chrome.runtime.sendMessage({ type: 'PAUSE_TIMER' });
  const handleResume = () => chrome.runtime.sendMessage({ type: 'RESUME_TIMER' });

  const handleReflect = () => {
    setIsReflecting(true);
  };

  const handleReflectionSubmit = (payload: ReflectionPayload) => {
    chrome.runtime.sendMessage({ type: 'REFLECTION', payload });
    // Stay on reflection screen (it shows success state)
  };

  const handleReflectionCancel = () => {
    setIsReflecting(false);
  };

  const handleRedoOnboarding = () => {
    if (!settings) return;
    chrome.storage.local.set({ settings: { ...settings, onboarded: false } });
  };

  // ── Connection indicator ──────────────────────────────────────────────────────
  const isConnected = session.status === 'active' || session.status === 'submitted';

  if (!settings) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-[#0d1117]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!settings.onboarded) {
    return <ColdStartView />;
  }

  return (
    <div className="flex flex-col w-full h-screen bg-[#0d1117] text-slate-100 select-none overflow-hidden">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 px-4 pt-4 pb-3 bg-[#161b22] border-b border-[#30363d]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-lg">
              🧠
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-none">DSA Coach</h1>
              <p className="text-[10px] text-slate-500 leading-none mt-0.5">Powered by n8n</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            <span className="text-[10px] text-slate-500">{isConnected ? 'Coaching' : 'Standby'}</span>
          </div>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700">
        {tab === 'coach' && !isReflecting && (
          <CoachView
            session={session}
            elapsed={elapsed}
            onCoachRequest={handleCoachRequest}
            onReflect={handleReflect}
            onPause={handlePause}
            onResume={handleResume}
          />
        )}
        {tab === 'coach' && isReflecting && (
          <ReflectionView
            session={session}
            onSubmit={handleReflectionSubmit}
            onCancel={handleReflectionCancel}
          />
        )}
        {tab === 'plan' && <PlanView />}
        {tab === 'progress' && <ProgressView />}
        {tab === 'settings' && <SettingsView onRedoOnboarding={handleRedoOnboarding} />}
      </main>

      {/* ── Bottom nav ──────────────────────────────────────────────────────── */}
      <nav className="flex-shrink-0 bg-[#161b22] border-t border-[#30363d] px-2 py-2">
        <div className="flex">
          {TABS.map(t => (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              onClick={() => {
                setTab(t.id);
                if (t.id !== 'coach') setIsReflecting(false);
              }}
              className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-lg transition-all ${
                tab === t.id
                  ? 'bg-indigo-600/20 text-indigo-300'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="text-base leading-none">{t.icon}</span>
              <span className={`text-[10px] font-semibold tracking-wide ${tab === t.id ? 'text-indigo-300' : 'text-slate-500'}`}>
                {t.label}
              </span>
              {t.id === 'coach' && session.status === 'active' && (
                <span className="absolute w-1 h-1 bg-emerald-400 rounded-full -mt-1 ml-5" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
