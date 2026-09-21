console.log('[DSA Coach] Content script loaded');

// ─── State ─────────────────────────────────────────────────────────────────────
let lastSlug = '';
let sessionActive = false;
let timerStartedAt = 0;
let submissionObserver: MutationObserver | null = null;

// ─── Problem Extraction ────────────────────────────────────────────────────────
function extractProblemMeta(): { slug: string; title: string; difficulty: string; url: string } | null {
  const parts = window.location.pathname.split('/').filter(Boolean);
  const idx = parts.indexOf('problems');
  if (idx === -1 || parts.length <= idx + 1) return null;

  const slug = parts[idx + 1];
  if (!slug || slug === '') return null;

  // Try to get title from the page
  const titleEl =
    document.querySelector('[data-cy="question-title"]') ||
    document.querySelector('div[class*="title__"] .text-title-large') ||
    document.querySelector('a[href^="/problems/' + slug + '/"]') ||
    document.querySelector('h4');

  const title = titleEl?.textContent?.trim() || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  // Difficulty
  const diffEl =
    document.querySelector('[data-degree]') ||
    document.querySelector('span[class*="difficulty"]') ||
    document.querySelector('.difficulty-label');

  let difficulty = diffEl?.textContent?.trim() || '';
  if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) difficulty = '';

  return { slug, title, difficulty, url: window.location.href };
}

// ─── Problem Detection ─────────────────────────────────────────────────────────
function onProblemDetected() {
  const meta = extractProblemMeta();
  if (!meta) return;
  if (meta.slug === lastSlug) return;

  // Previous session cleanup
  if (lastSlug && sessionActive) {
    chrome.runtime.sendMessage({ type: 'SESSION_CLOSED' });
  }

  lastSlug = meta.slug;
  sessionActive = true;
  timerStartedAt = Date.now();

  chrome.runtime.sendMessage({
    type: 'PROBLEM_STARTED',
    payload: {
      slug: meta.slug,
      title: meta.title,
      difficulty: meta.difficulty || undefined,
      url: meta.url,
    },
  });

  // Start observing for submission
  startSubmissionObserver();
}

// ─── Submission Detection ──────────────────────────────────────────────────────
const SUBMISSION_RESULT_MAP: Record<string, string> = {
  'accepted': 'accepted',
  'wrong answer': 'wrong_answer',
  'time limit exceeded': 'time_limit_exceeded',
  'runtime error': 'runtime_error',
  'compile error': 'compile_error',
  'memory limit exceeded': 'memory_limit_exceeded',
  'output limit exceeded': 'output_limit_exceeded',
};

function detectSubmissionResult(): string | null {
  // Try multiple selectors — LeetCode changes their class names frequently
  const selectors = [
    '[data-e2e-locator="submission-result"]',
    'span[class*="result-icon"]',
    'div[class*="ResultStatus"]',
    'div[data-key="status-container"] span',
    '.submission-status__message',
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      const text = el.textContent?.trim().toLowerCase() || '';
      for (const [key, val] of Object.entries(SUBMISSION_RESULT_MAP)) {
        if (text.includes(key)) return val;
      }
    }
  }

  // Also check page title / heading for result
  const headings = document.querySelectorAll('h4, h5, .text-[#00b8a3], .text-red-s');
  for (const h of headings) {
    const text = h.textContent?.trim().toLowerCase() || '';
    for (const [key, val] of Object.entries(SUBMISSION_RESULT_MAP)) {
      if (text.includes(key)) return val;
    }
  }

  return null;
}

let lastSubmissionResult = '';

function startSubmissionObserver() {
  if (submissionObserver) {
    submissionObserver.disconnect();
    submissionObserver = null;
  }

  submissionObserver = new MutationObserver(() => {
    const result = detectSubmissionResult();
    if (result && result !== lastSubmissionResult) {
      lastSubmissionResult = result;
      const elapsed = Math.floor((Date.now() - timerStartedAt) / 1000);
      chrome.runtime.sendMessage({
        type: 'SUBMISSION',
        payload: { slug: lastSlug, result, duration_seconds: elapsed },
      });
    }
  });

  submissionObserver.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

// ─── SPA Navigation (LeetCode is a React app) ─────────────────────────────────
function checkNavigation() {
  const meta = extractProblemMeta();
  if (meta && meta.slug !== lastSlug) {
    setTimeout(onProblemDetected, 800);
  }
}

// Initial detection — wait for page to render
setTimeout(onProblemDetected, 2500);

// Poll for navigation changes
setInterval(checkNavigation, 1500);

// Listen to popstate / pushstate
window.addEventListener('popstate', () => setTimeout(onProblemDetected, 1000));

// Intercept pushState / replaceState to detect SPA navigation
const originalPushState = history.pushState.bind(history);
history.pushState = function (...args) {
  originalPushState(...args);
  setTimeout(checkNavigation, 500);
};

const originalReplaceState = history.replaceState.bind(history);
history.replaceState = function (...args) {
  originalReplaceState(...args);
  setTimeout(checkNavigation, 500);
};

// ─── Cleanup on unload ─────────────────────────────────────────────────────────
window.addEventListener('beforeunload', () => {
  if (sessionActive && lastSlug) {
    chrome.runtime.sendMessage({ type: 'SESSION_CLOSED' });
  }
  submissionObserver?.disconnect();
});
