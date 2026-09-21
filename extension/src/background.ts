import { sendEvent, retryPendingEvents } from './services/n8n';
import { getSession, setSession, clearSession } from './services/storage';
import type { Problem, ReflectionPayload } from './types';

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

      if (response) {
        await setSession({
          session_id: response.session_id || null,
          coachMessage: response.coach?.message || null,
          coachPattern: response.coach?.pattern || null,
          skillMastery: response.skill?.mastery ?? null,
          skillConfidence: response.skill?.confidence ?? null,
          lastPracticed: (response as any).skill?.last_practiced || null,
          isTyping: false,
        });
      } else {
        await setSession({ isTyping: false });
      }

      return { success: true };
    }

    // ── Hint request from side panel ─────────────────────────────────────────
    case 'HINT_REQUEST': {
      const session = await getSession();
      await setSession({ isTyping: true });

      const response = await sendEvent('hint_request', {
        session_id: session.session_id,
        problem_slug: session.currentProblem?.slug,
        hint_level: session.hintLevel,
      });

      const newLevel = session.hintLevel + 1;
      if (response) {
        const hintMsg =
          response.hint?.message ||
          response.coach?.message ||
          null;
        await setSession({
          isTyping: false,
          hintLevel: newLevel,
          hintMessage: hintMsg,
          coachMessage: hintMsg,
        });
      } else {
        await setSession({ isTyping: false, hintLevel: newLevel });
      }
      return { success: true };
    }

    // ── Submission detected by content script ─────────────────────────────────
    case 'SUBMISSION': {
      const session = await getSession();
      const { slug, result, elapsed_seconds } = message.payload as {
        slug: string;
        result: string;
        elapsed_seconds: number;
      };

      await setSession({ isTyping: true, timerState: 'SUBMITTED', status: 'submitted' });

      const response = await sendEvent('submission', {
        session_id: session.session_id,
        problem_slug: slug,
        result,
        elapsed_seconds,
      });

      if (response) {
        const feedbackMsg =
          response.feedback?.message || response.coach?.message || null;
        const feedbackType = response.feedback?.type || (result === 'accepted' ? 'success' : 'warning');
        await setSession({
          isTyping: false,
          feedbackMessage: feedbackMsg,
          feedbackType: feedbackType as any,
        });
      } else {
        await setSession({ isTyping: false });
      }
      return { success: true };
    }

    // ── Reflection submitted from side panel ──────────────────────────────────
    case 'REFLECTION': {
      const session = await getSession();
      const payload = message.payload as ReflectionPayload;

      await sendEvent('reflection', {
        session_id: session.session_id,
        problem_slug: session.currentProblem?.slug,
        ...payload,
      });

      await setSession({ timerState: 'COMPLETED', status: 'completed' });
      return { success: true };
    }

    // ── Session closed (tab closed / navigated away) ───────────────────────────
    case 'SESSION_CLOSED': {
      const session = await getSession();
      if (session.currentProblem) {
        const timerStartedAt = session.timerStartedAt || Date.now();
        const elapsed = Math.floor((Date.now() - timerStartedAt) / 1000) + session.elapsedOnPause;

        await sendEvent('session_closed', {
          session_id: session.session_id,
          problem_slug: session.currentProblem.slug,
          elapsed_seconds: elapsed,
        });
      }
      await clearSession();
      return { success: true };
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

    default:
      return { success: false, error: 'Unknown message type' };
  }
}
