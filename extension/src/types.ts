// ─── Problem ──────────────────────────────────────────────────────────────────
export interface Problem {
  slug: string;
  title: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  url: string;
  topics?: string[];
}

// ─── Coach Response ───────────────────────────────────────────────────────────
export interface CoachResponse {
  session_id?: string;
  problem?: Partial<Problem>;
  coach?: {
    message: string;
    pattern?: string;
  };
  skill?: {
    mastery?: number;
    confidence?: number;
    last_practiced?: string;
    next_review?: string;
  };
  hint?: {
    level: number;
    message: string;
  };
  feedback?: {
    message: string;
    type?: 'success' | 'warning' | 'error';
  };
}

// ─── Session State ────────────────────────────────────────────────────────────
export type SessionStatus = 'idle' | 'active' | 'paused' | 'submitted' | 'completed';
export type TimerState = 'IDLE' | 'STARTED' | 'PAUSED' | 'RESUMED' | 'SUBMITTED' | 'COMPLETED';

export interface SessionState {
  currentProblem: Problem | null;
  session_id: string | null;
  coachMessage: string | null;
  coachPattern: string | null;
  skillMastery: number | null;
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
}

// ─── Events ──────────────────────────────────────────────────────────────────
export type EventType = 
  | 'problem_started'
  | 'submission'
  | 'hint_request'
  | 'reflection'
  | 'session_closed'
  | 'coach_request'
  | 'plan_request';

export interface PendingEvent {
  id: string;
  event: EventType;
  payload: Record<string, unknown>;
  timestamp: string;
  retries: number;
}

// ─── Plan ─────────────────────────────────────────────────────────────────────
export interface PlanItem {
  pattern: string;
  activity: 'Practice' | 'Review' | 'Mock';
  duration_minutes: number;
  done?: boolean;
}

export interface DailyPlan {
  date: string;
  total_minutes: number;
  items: PlanItem[];
}

// ─── Progress ─────────────────────────────────────────────────────────────────
export interface SkillProgress {
  pattern: string;
  topic?: string;
  mastery: number; // 0–100
  confidence?: number;
  problems_solved?: number;
  last_practiced?: string;
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export interface Settings {
  n8nUrl: string;
  profile_id: string;
  daily_goal_minutes: number;
  notifications_enabled: boolean;
}

// ─── Messages (content script ↔ background) ───────────────────────────────────
export type BgMessage =
  | { type: 'PROBLEM_STARTED'; payload: Problem }
  | { type: 'SUBMISSION'; payload: { slug: string; result: string; elapsed_seconds: number } }
  | { type: 'HINT_REQUEST' }
  | { type: 'REFLECTION'; payload: ReflectionPayload }
  | { type: 'SESSION_CLOSED' }
  | { type: 'PLAN_REQUEST' }
  | { type: 'PROGRESS_REQUEST' };

export interface ReflectionPayload {
  confidence: number;       // 1-5
  how_it_went: string;      // 'independent' | 'small_hint' | 'several_hints' | 'viewed_solution' | 'couldnt_solve'
  main_difficulty?: string;
  reflection?: string;
  hints_used: number;
  solution_viewed: boolean;
  error_types: string[];
}
