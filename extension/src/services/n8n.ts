import type { EventType, CoachResponse, DailyPlan, SkillProgress, ColdStartPayload } from '../types';
import {
  getSettings,
  setSession,
  enqueuePendingEvent,
  getPendingEvents,
  removePendingEvent,
  incrementRetry,
} from './storage';

const MAX_RETRIES = 3;

/** The extension only knows the Event webhook URL (Settings); the Plan and
 * Cold Start webhooks live at sibling paths on the same n8n host. */
function deriveUrl(eventUrl: string, suffix: 'plan' | 'cold-start'): string {
  return eventUrl.replace(/\/event\/?$/, `/${suffix}`);
}

async function postJson(url: string, body: unknown, timeoutMs = 15_000): Promise<any | null> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch (err) {
    console.warn('[n8n] Failed:', err);
    return null;
  }
}

/** Core function to POST to the Event webhook (problem_started, session_end,
 * submission, reflection, coach_requested — the events Validate Event accepts) */
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
  return (await postJson(settings.n8nUrl, body)) as CoachResponse | null;
}

/** Send event — with auto-queue on failure */
export async function sendEvent(
  event: EventType,
  payload: Record<string, unknown>,
): Promise<CoachResponse | null> {
  const settings = await getSettings();
  const result = await postToN8n(event, payload, settings.profile_id);

  if (result === null) {
    await enqueuePendingEvent({
      event,
      payload,
      timestamp: new Date().toISOString(),
    });
  } else {
    await setSession({ backendUnavailable: false });
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
      await setSession({ backendUnavailable: false });
    } else {
      await incrementRetry(evt.id);
    }
  }
}

/** Fetch today's plan from the dedicated Plan webhook (not the Event webhook) */
export async function fetchDailyPlan(): Promise<DailyPlan | null> {
  const settings = await getSettings();
  const url = deriveUrl(settings.n8nUrl, 'plan');
  const res = await postJson(url, { profile_id: settings.profile_id });
  return res?.plan ? (res.plan as DailyPlan) : null;
}

/** Skill progress is carried on the plan response's `skills` array — there is
 * no separate progress endpoint on the n8n workflow. */
export async function fetchProgress(): Promise<SkillProgress[] | null> {
  const plan = await fetchDailyPlan();
  return plan?.skills ?? null;
}

/** Submit cold-start onboarding (profile + self-rating priors) */
export async function submitColdStart(payload: ColdStartPayload): Promise<CoachResponse | null> {
  const settings = await getSettings();
  const url = deriveUrl(settings.n8nUrl, 'cold-start');
  return (await postJson(url, payload, 20_000)) as CoachResponse | null;
}
