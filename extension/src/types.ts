// ─── Problem ──────────────────────────────────────────────────────────────────
export interface Problem {
  slug: string;
  title: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  url: string;
  topics?: string[];
}

// ─── Coach Response (matches dsa_coach_workflow.json's actual response shapes) ─
export interface PatternMastery {
  pattern: string;
  mastery_pct: number; // 0-100
  days_since?: number | null;
  review_due?: boolean;
  recognition_signals?: string;
}

export interface SkillUpdate {
  pattern: string;
  mastery_pct: number; // 0-100
  problems_solved?: number;
  review_interval_days?: number;
  next_review?: string | null;
}

export interface CoachResponse {
  success?: boolean;
  session_id?: string;
  attempt_id?: string | null;
  event?: string;
  problem?: Partial<Problem>;
  mode?: string;
  plan?: DailyPlan;
  coach?: {
    message?: string;
    likely_pattern?: string | null;
    pattern?: string | null;
    patterns?: PatternMastery[];
    hint?: string;
    source?: 'template' | 'ai';
    next_level?: number;
    reveal_solution?: boolean;
    next_action?: string;
    ask_reflection?: boolean;
    ask_error_types?: boolean;
  };
  skills_updated?: SkillUpdate[];
  hint_level?: number;
  result?: string;
  performance?: 'strong' | 'assisted' | 'failed' | null;
  attempt_number?: number | null;
  profile_id?: string;
  priors_saved?: number;
  next?: string;
}

// ─── Session State ────────────────────────────────────────────────────────────
export type SessionStatus = 'idle' | 'active' | 'paused' | 'submitted' | 'completed';
export type TimerState = 'IDLE' | 'STARTED' | 'PAUSED' | 'RESUMED' | 'SUBMITTED' | 'COMPLETED';

export interface SessionState {
  currentProblem: Problem | null;
  session_id: string | null;
  attempt_id: string | null;
  coachMessage: string | null;
  coachPattern: string | null;
  skillMastery: number | null; // 0-100
  skillConfidence: number | null;
  lastPracticed: string | null;
  feedbackMessage: string | null;
  feedbackType: 'success' | 'warning' | 'error' | null;
  hintLevel: number;
  hintMessage: string | null;
  isTyping: boolean;
  timerStartedAt: number | null;
  elapsedOnPause: number;
  timerState: TimerState;
  status: SessionStatus;
  backendUnavailable: boolean;
}

// ─── Events (must match Validate Event's whitelist in dsa_coach_workflow.json) ─
export type EventType =
  | 'problem_started'
  | 'session_end'
  | 'submission'
  | 'reflection'
  | 'coach_requested';

export interface PendingEvent {
  id: string;
  event: EventType;
  payload: Record<string, unknown>;
  timestamp: string;
  retries: number;
}

// ─── Plan (matches Priority Engine's actual returned `plan` object) ───────────
export interface PlanItem {
  order: number;
  type: 'new' | 'calibration' | 'review' | 'recognition' | 'explain' | 'mock' | 'restart_easy' | 'decay_review';
  pattern: string;
  minutes: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  problem?: { slug: string; title: string; difficulty: string; url: string } | null;
  note?: string | null;
  detail?: string;
  reason?: string;
  timed?: boolean;
}

export interface PlanPriority {
  pattern: string;
  tier?: string;
  mastery: number; // 0-1 fraction
  priority: number;
  days_since: number | null;
  review_due: boolean;
}

export interface DailyPlan {
  plan_date: string;
  mode: string;
  restart_step: number;
  days_to_target: number | null;
  budget_minutes: number;
  total_minutes: number;
  message: string;
  difficulty_trend: number;
  items: PlanItem[];
  priorities: PlanPriority[];
  skills?: SkillProgress[];
}

// ─── Progress ─────────────────────────────────────────────────────────────────
export interface SkillProgress {
  pattern: string;
  topic?: string;
  mastery: number; // 0–100
  confidence?: number;
  problems_solved?: number;
  last_practiced?: string | null;
}

// ─── Cold start ───────────────────────────────────────────────────────────────
export interface ColdStartPayload {
  profile_id?: string;
  name: string;
  email?: string;
  leetcode_username?: string;
  target_company?: string;
  target_role: string;
  target_date?: string; // YYYY-MM-DD
  hours_per_week: number;
  daily_minutes: number;
  level: string;
  target_sets: string[];
  self_ratings: Record<string, number>; // topic -> 1-5
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export interface Settings {
  n8nUrl: string;
  profile_id: string;
  daily_goal_minutes: number;
  notifications_enabled: boolean;
  onboarded: boolean;
}

// ─── Messages (content script / side panel ↔ background) ─────────────────────
export type BgMessage =
  | { type: 'PROBLEM_STARTED'; payload: Problem }
  | { type: 'SUBMISSION'; payload: { slug: string; result: string; duration_seconds: number } }
  | { type: 'COACH_REQUEST'; payload: { request_type: 'hint' | 'approach' | 'solution'; confirm_solution?: boolean } }
  | { type: 'REFLECTION'; payload: ReflectionPayload }
  | { type: 'SESSION_CLOSED' }
  | { type: 'PAUSE_TIMER' }
  | { type: 'RESUME_TIMER' }
  | { type: 'PLAN_REQUEST' }
  | { type: 'PROGRESS_REQUEST' }
  | { type: 'PLAN_ITEM_COMPLETE'; payload: { plan_date: string; order: number; done: boolean } }
  | { type: 'COLD_START'; payload: ColdStartPayload };

export interface ReflectionPayload {
  confidence: number;       // 1-5
  how_it_went: string;      // 'independent' | 'small_hint' | 'several_hints' | 'viewed_solution' | 'couldnt_solve'
  main_difficulty?: string;
  reflection?: string;
  hints_used: number;
  solution_viewed: boolean;
  error_types: string[];
}
