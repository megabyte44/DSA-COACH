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

export interface N8nResult<T> {
  data: T | null;
  error: string | null;
}

/** Turn a failed call into something that names the actual problem. "Could not
 * reach the backend" sends you hunting; the status and n8n's own message do not. */
function describeFailure(url: string, status: number, bodyText: string): string {
  let body: any = null;
  try { body = JSON.parse(bodyText); } catch { /* not JSON */ }
  const n8nMessage = body?.message ? String(body.message) : '';

  if (status === 404) {
    if (url.includes('/webhook-test/')) {
      return `404 from ${url} — n8n test URLs only work for a single call right after you click "Execute workflow" in the editor. Switch the URL in Settings to the /webhook/ path.`;
    }
    return `404 from ${url} — n8n has no webhook registered there. Check the workflow is Active and the path matches.${n8nMessage ? ` n8n said: ${n8nMessage}` : ''}`;
  }
  if (status === 500) {
    return `n8n hit an error running the workflow (500).${n8nMessage ? ` It said: ${n8nMessage}` : ''} Check the execution log in n8n.`;
  }
  if (status) {
    return `HTTP ${status} from ${url}.${n8nMessage ? ` n8n said: ${n8nMessage}` : ''}`;
  }
  return '';
}

async function postJson(url: string, body: unknown, timeoutMs = 15_000): Promise<N8nResult<any>> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    const name = (err as Error)?.name;
    const detail = name === 'TimeoutError' || name === 'AbortError'
      ? `No response from ${url} within ${Math.round(timeoutMs / 1000)}s.`
      : `Could not reach ${url}. Check the host is correct and you are online.`;
    console.warn('[n8n] Network failure:', err);
    return { data: null, error: detail };
  }

  const text = await res.text().catch(() => '');
  if (!res.ok) {
    const error = describeFailure(url, res.status, text);
    console.warn('[n8n]', error);
    return { data: null, error };
  }

  try {
    return { data: text ? JSON.parse(text) : null, error: null };
  } catch {
    return { data: null, error: `n8n replied with something that is not JSON: ${text.slice(0, 120)}` };
  }
}

/** Probe the configured endpoint and report precisely what happened. */
export async function testConnection(url: string): Promise<string> {
  // Deliberately invalid profile_id: the workflow rejects it at validation, so
  // this proves the round trip without writing anything to the database.
  const res = await postJson(url, { event: 'problem_started', profile_id: 'connection-test', problem: { slug: 'two-sum', title: 'Two Sum' } }, 20_000);
  if (res.error) return res.error;
  if (res.data?.error === 'profile_not_onboarded') return 'Connected. The coach is reachable and answering — finish onboarding to start a profile.';
  if (res.data) return 'Connected. The coach is reachable and answering.';
  return 'Reached the endpoint, but it returned an empty response.';
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
  const res = await postJson(settings.n8nUrl, body);
  if (res.error) await setSession({ backendError: res.error });
  return res.data as CoachResponse | null;
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
    await setSession({ backendUnavailable: false, backendError: null });
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
      await setSession({ backendUnavailable: false, backendError: null });
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
  if (res.error) await setSession({ backendError: res.error });
  return res.data?.plan ? (res.data.plan as DailyPlan) : null;
}

/** Skill progress is carried on the plan response's `skills` array — there is
 * no separate progress endpoint on the n8n workflow. */
export async function fetchProgress(): Promise<SkillProgress[] | null> {
  const plan = await fetchDailyPlan();
  return plan?.skills ?? null;
}

/** Submit cold-start onboarding (profile + self-rating priors) */
export async function submitColdStart(payload: ColdStartPayload): Promise<N8nResult<CoachResponse>> {
  const settings = await getSettings();
  const url = deriveUrl(settings.n8nUrl, 'cold-start');
  const res = await postJson(url, payload, 20_000);
  return { data: res.data as CoachResponse | null, error: res.error };
}
