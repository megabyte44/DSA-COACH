import type { EventType, CoachResponse, DailyPlan, SkillProgress } from '../types';
import {
  getSettings,
  enqueuePendingEvent,
  getPendingEvents,
  removePendingEvent,
  incrementRetry,
} from './storage';

const MAX_RETRIES = 3;

/** Core function to POST to n8n */
export async function postToN8n(
  event: EventType,
  payload: Record<string, unknown>,
  profile_id: string,
): Promise<CoachResponse | null> {
  const settings = await getSettings();
  const body = {
    event,
    timestamp: new Date().toISOString(),
    profile_id,
    ...payload,
  };

  try {
    const res = await fetch(settings.n8nUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text) as CoachResponse;
  } catch (err) {
    console.warn('[n8n] Failed:', err);
    return null;
  }
}

/** Send event — with auto-queue on failure */
export async function sendEvent(
  event: EventType,
  payload: Record<string, unknown>,
): Promise<CoachResponse | null> {
  const settings = await getSettings();
  const result = await postToN8n(event, payload, settings.profile_id);

  if (result === null) {
    // Queue for retry
    await enqueuePendingEvent({
      event,
      payload,
      timestamp: new Date().toISOString(),
    });
  }

  return result;
}

/** Retry all queued pending events */
export async function retryPendingEvents(): Promise<void> {
  const settings = await getSettings();
  const pending = await getPendingEvents();
  if (!pending.length) return;

  for (const evt of pending) {
    if (evt.retries >= MAX_RETRIES) {
      await removePendingEvent(evt.id);
      continue;
    }

    const result = await postToN8n(evt.event, evt.payload, settings.profile_id);
    if (result !== null) {
      await removePendingEvent(evt.id);
    } else {
      await incrementRetry(evt.id);
    }
  }
}

/** Fetch daily plan */
export async function fetchDailyPlan(): Promise<DailyPlan | null> {
  const settings = await getSettings();
  try {
    const res = await sendEvent('plan_request', { profile_id: settings.profile_id });
    if (res && (res as any).plan) return (res as any).plan as DailyPlan;
    return null;
  } catch {
    return null;
  }
}

/** Fetch skill progress */
export async function fetchProgress(): Promise<SkillProgress[] | null> {
  const settings = await getSettings();
  try {
    const settings2 = await getSettings();
    const url = settings2.n8nUrl.replace('/event', '/progress');
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_id: settings.profile_id }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.skills || data as SkillProgress[];
  } catch {
    return null;
  }
}
