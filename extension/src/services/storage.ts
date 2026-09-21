import type { SessionState, Settings, PendingEvent } from '../types';

// ─── Default Values ────────────────────────────────────────────────────────────
// Production path. n8n's /webhook-test/ URLs only fire once, and only while the
// editor is listening, so they are for debugging in the n8n UI — not for daily use.
export const DEFAULT_N8N_URL = 'https://punithnaidu2006.app.n8n.cloud/webhook/dsa-coach/event';

export const DEFAULT_SETTINGS: Settings = {
  n8nUrl: DEFAULT_N8N_URL,
  profile_id: 'default',
  daily_goal_minutes: 60,
  notifications_enabled: true,
  onboarded: false,
};

export const DEFAULT_SESSION: SessionState = {
  currentProblem: null,
  session_id: null,
  attempt_id: null,
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
  backendUnavailable: false,
  backendError: null,
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
  const settings = { ...DEFAULT_SETTINGS, ...(result.settings as Partial<Settings>) };
  // Saved settings shadow the default forever, so an endpoint that can never
  // resolve would otherwise keep failing silently after the default was fixed.
  if (!settings.n8nUrl || settings.n8nUrl.includes('YOUR-N8N-HOST')) {
    settings.n8nUrl = DEFAULT_N8N_URL;
  }
  return settings;
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

// ─── Local plan-item completion (n8n's `plans` rows have no per-item state) ────
export async function getPlanCompletions(plan_date: string): Promise<number[]> {
  const result = await chrome.storage.local.get('planCompletions');
  const all = (result.planCompletions as Record<string, number[]>) || {};
  return all[plan_date] || [];
}

export async function setPlanItemDone(plan_date: string, order: number, done: boolean): Promise<void> {
  const result = await chrome.storage.local.get('planCompletions');
  const all = (result.planCompletions as Record<string, number[]>) || {};
  const current = new Set(all[plan_date] || []);
  if (done) current.add(order); else current.delete(order);
  all[plan_date] = Array.from(current);
  await chrome.storage.local.set({ planCompletions: all });
}
