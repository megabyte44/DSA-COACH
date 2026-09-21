import type { SessionState, Settings, PendingEvent } from '../types';

// ─── Default Values ────────────────────────────────────────────────────────────
export const DEFAULT_SETTINGS: Settings = {
  n8nUrl: 'https://punithnaidu2006.app.n8n.cloud/webhook-test/dsa-coach/event',
  profile_id: 'default',
  daily_goal_minutes: 60,
  notifications_enabled: true,
};

export const DEFAULT_SESSION: SessionState = {
  currentProblem: null,
  session_id: null,
  coachMessage: null,
  coachPattern: null,
  skillMastery: null,
  skillConfidence: null,
  lastPracticed: null,
  feedbackMessage: null,
  feedbackType: null,
  hintLevel: 0,
  hintMessage: null,
  isTyping: false,
  timerStartedAt: null,
  elapsedOnPause: 0,
  timerState: 'IDLE',
  status: 'idle',
};

// ─── Session ──────────────────────────────────────────────────────────────────
export async function getSession(): Promise<SessionState> {
  const result = await chrome.storage.local.get('session');
  return (result.session as SessionState) || DEFAULT_SESSION;
}

export async function setSession(partial: Partial<SessionState>): Promise<void> {
  const current = await getSession();
  await chrome.storage.local.set({ session: { ...current, ...partial } });
}

export async function clearSession(): Promise<void> {
  await chrome.storage.local.set({ session: DEFAULT_SESSION });
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.local.get('settings');
  return { ...DEFAULT_SETTINGS, ...(result.settings as Partial<Settings>) };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ settings });
}

// ─── Pending Event Queue ───────────────────────────────────────────────────────
export async function getPendingEvents(): Promise<PendingEvent[]> {
  const result = await chrome.storage.local.get('pendingEvents');
  return (result.pendingEvents as PendingEvent[]) || [];
}

export async function enqueuePendingEvent(event: Omit<PendingEvent, 'id' | 'retries'>): Promise<void> {
  const pending = await getPendingEvents();
  const newEvent: PendingEvent = {
    ...event,
    id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
    retries: 0,
  };
  pending.push(newEvent);
  await chrome.storage.local.set({ pendingEvents: pending });
}

export async function removePendingEvent(id: string): Promise<void> {
  const pending = await getPendingEvents();
  const filtered = pending.filter(e => e.id !== id);
  await chrome.storage.local.set({ pendingEvents: filtered });
}

export async function incrementRetry(id: string): Promise<void> {
  const pending = await getPendingEvents();
  const updated = pending.map(e => e.id === id ? { ...e, retries: e.retries + 1 } : e);
  await chrome.storage.local.set({ pendingEvents: updated });
}
