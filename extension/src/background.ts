import { sendEvent, retryPendingEvents, submitColdStart } from './services/n8n';
import { getSession, setSession, clearSession, saveSettings, getSettings, setPlanItemDone } from './services/storage';
import type { Problem, ReflectionPayload, ColdStartPayload, CoachResponse } from './types';

/** n8n answers a rejected or degraded request with success:false plus a reason.
 * Turn that into something worth reading in the panel. */
function coachErrorText(res: CoachResponse): string {
  switch (res.error) {
    case 'profile_not_onboarded':
      return 'Finish setup first — open Settings and run onboarding to create your coach profile.';
    case 'skill_update_unavailable':
      return res.coach?.message
        || 'Attempt recorded, but the skill update could not run. It will be re-derived on the next sync.';
    case 'backend_temporarily_unavailable':
      return 'The coach database is unreachable right now. Your session is still being tracked.';
    default:
      return res.hint || res.detail || 'The coach could not process that request.';
  }
}

// ─── Side Panel behaviour ──────────────────────────────────────────────────────
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch(console.error);

// ─── Retry queue every 2 minutes ──────────────────────────────────────────────
chrome.alarms.create('retryQueue', { periodInMinutes: 2 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'retryQueue') retryPendingEvents();
});

// ─── Message handler ──────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message).then(sendResponse).catch((err) => {
    console.error('[bg] handler error', err);
    sendResponse({ success: false, error: String(err) });
  });
  return true; // keep channel open for async
});

async function handleMessage(message: any) {
  switch (message.type) {
    // ── Problem arrived from content script ──────────────────────────────────
    case 'PROBLEM_STARTED': {
      const problem = message.payload as Problem;

      await setSession({
        currentProblem: problem,
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
        isTyping: true,
        timerStartedAt: Date.now(),
        elapsedOnPause: 0,
        timerState: 'STARTED',
        status: 'active',
      });

      const response = await sendEvent('problem_started', { problem });

      if (response && response.success !== false) {
        await setSession({
          session_id: response.session_id || null,
          coachMessage: response.coach?.message || null,
          coachPattern: response.coach?.likely_pattern || null,
          skillMastery: response.coach?.patterns?.[0]?.mastery_pct ?? null,
          lastPracticed: response.coach?.patterns?.[0]?.days_since != null
            ? `${response.coach.patterns[0].days_since} days ago`
            : null,
          isTyping: false,
          backendUnavailable: false,
        });
      } else if (response) {
        await setSession({ isTyping: false, coachMessage: coachErrorText(response), backendUnavailable: false });
      } else {
        await setSession({ isTyping: false, backendUnavailable: true });
      }

      return { success: true };
    }

    // ── Coach request from side panel (hint / approach / reveal solution) ─────
    case 'COACH_REQUEST': {
      const session = await getSession();
      const { request_type, confirm_solution } = message.payload as {
        request_type: 'hint' | 'approach' | 'solution';
        confirm_solution?: boolean;
      };
      await setSession({ isTyping: true });

      const nextLevel = request_type === 'hint' ? session.hintLevel + 1 : undefined;

      const response = await sendEvent('coach_requested', {
        session_id: session.session_id,
        problem_slug: session.currentProblem?.slug,
        request_type,
        hint_level: nextLevel,
        hints_used: session.hintLevel,
        confirm_solution: confirm_solution === true,
      });

      if (response && response.success !== false) {
        const hintMsg = response.coach?.hint || null;
        await setSession({
          isTyping: false,
          hintLevel: response.hint_level ?? nextLevel ?? session.hintLevel,
          hintMessage: hintMsg,
          coachMessage: hintMsg || session.coachMessage,
        });
      } else if (response) {
        await setSession({ isTyping: false, coachMessage: coachErrorText(response) });
      } else {
        await setSession({ isTyping: false });
      }
      return { success: true };
    }

    // ── Submission detected by content script ─────────────────────────────────
    case 'SUBMISSION': {
      const session = await getSession();
      const { slug, result, duration_seconds } = message.payload as {
        slug: string;
        result: string;
        duration_seconds: number;
      };

      await setSession({ isTyping: true, timerState: 'SUBMITTED', status: 'submitted' });

      const response = await sendEvent('submission', {
        session_id: session.session_id,
        problem_slug: slug,
        result,
        duration_seconds,
      });

      if (response) {
        const degraded = response.success === false;
        // Even a degraded reply carries the attempt id, so reflection still works.
        const feedbackMsg = degraded ? coachErrorText(response) : (response.coach?.message || null);
        const feedbackType = degraded
          ? 'warning'
          : (response.result === 'accepted' || result === 'accepted' ? 'success' : 'warning');
        await setSession({
          isTyping: false,
          attempt_id: response.attempt_id || session.attempt_id,
          feedbackMessage: feedbackMsg,
          feedbackType,
        });
      } else {
        await setSession({ isTyping: false });
      }
      return { success: true };
    }

    // ── Reflection submitted from side panel ──────────────────────────────────
    case 'REFLECTION': {
      const session = await getSession();
      if (!session.attempt_id) {
        return { success: false, error: 'No attempt to reflect on yet — submit a solution first.' };
      }
      const payload = message.payload as ReflectionPayload;

      await sendEvent('reflection', {
        session_id: session.session_id,
        attempt_id: session.attempt_id,
        problem_slug: session.currentProblem?.slug,
        confidence: payload.confidence,
        hints_used: payload.hints_used,
        solution_viewed: payload.solution_viewed,
        error_types: payload.error_types,
        reflection: {
          notes: payload.reflection,
          how_it_went: payload.how_it_went,
          main_difficulty: payload.main_difficulty,
        },
      });

      await setSession({ timerState: 'COMPLETED', status: 'completed' });
      return { success: true };
    }

    // ── Session closed (tab closed / navigated away) ───────────────────────────
    case 'SESSION_CLOSED': {
      const session = await getSession();
      if (session.currentProblem && session.session_id) {
        const timerStartedAt = session.timerStartedAt || Date.now();
        const elapsed = Math.floor((Date.now() - timerStartedAt) / 1000) + session.elapsedOnPause;

        await sendEvent('session_end', {
          session_id: session.session_id,
          duration_seconds: elapsed,
        });
      }
      await clearSession();
      return { success: true };
    }

    // ── Local-only timer pause/resume ──────────────────────────────────────────
    case 'PAUSE_TIMER': {
      const session = await getSession();
      if (session.timerState !== 'STARTED' && session.timerState !== 'RESUMED') {
        return { success: false, error: 'Timer is not running' };
      }
      const startedAt = session.timerStartedAt || Date.now();
      const elapsedOnPause = Math.floor((Date.now() - startedAt) / 1000) + session.elapsedOnPause;
      await setSession({ timerState: 'PAUSED', timerStartedAt: null, elapsedOnPause });
      return { success: true };
    }

    case 'RESUME_TIMER': {
      const session = await getSession();
      if (session.timerState !== 'PAUSED') {
        return { success: false, error: 'Timer is not paused' };
      }
      await setSession({ timerState: 'RESUMED', timerStartedAt: Date.now() });
      return { success: true };
    }

    // ── Cold-start onboarding ───────────────────────────────────────────────────
    case 'COLD_START': {
      const payload = message.payload as ColdStartPayload;
      const response = await submitColdStart(payload);
      if (!response?.profile_id) {
        return {
          success: false,
          error: response
            ? coachErrorText(response)
            : 'Could not reach the coach backend. Check your n8n URL in Settings.',
        };
      }
      const settings = await getSettings();
      await saveSettings({ ...settings, profile_id: response.profile_id, onboarded: true });
      return { success: true, profile_id: response.profile_id, priors_saved: response.priors_saved };
    }

    // ── Load daily plan ────────────────────────────────────────────────────────
    case 'PLAN_REQUEST': {
      const { fetchDailyPlan } = await import('./services/n8n');
      const plan = await fetchDailyPlan();
      return { success: true, plan };
    }

    // ── Load skill progress ────────────────────────────────────────────────────
    case 'PROGRESS_REQUEST': {
      const { fetchProgress } = await import('./services/n8n');
      const skills = await fetchProgress();
      return { success: true, skills };
    }

    // ── Mark a plan item done/undone (local only — n8n has no per-item update) ─
    case 'PLAN_ITEM_COMPLETE': {
      const { plan_date, order, done } = message.payload as { plan_date: string; order: number; done: boolean };
      await setPlanItemDone(plan_date, order, done);
      return { success: true };
    }

    default:
      return { success: false, error: 'Unknown message type' };
  }
}
