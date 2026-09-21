# PRD — DSA Coach Chrome Extension

**Product:** DSA Coach
**Version:** Extension MVP v1
**Platform:** Chrome Extension (Manifest V3)
**Primary website:** LeetCode
**Backend/Brain:** Existing n8n workflows
**Database:** Supabase — source of truth

---

## 1. Product Goal

Build a Chrome Extension that acts as the **user-facing interface** for the DSA Coach.

The extension should observe what the user is doing on LeetCode, collect evidence, communicate with the existing n8n coach engine, and display personalized guidance.

### Core principle

> **Extension = eyes + hands + UI**
> **n8n = brain / decision engine**
> **Supabase = permanent memory**

The extension should **not duplicate the coaching logic** already implemented in n8n.

---

# 2. MVP User Flow

```text
User opens LeetCode problem
        ↓
Extension detects problem
        ↓
problem_started → n8n
        ↓
n8n gets skill context
        ↓
Extension receives coach context
        ↓
User solves problem
        ↓
Timer tracks session
        ↓
User submits
        ↓
Extension detects result
        ↓
submission → n8n
        ↓
n8n updates skill
        ↓
Extension shows feedback
        ↓
User can request hint
        ↓
hint → n8n
        ↓
User reflects
        ↓
reflection → n8n
```

---

# 3. Target User

### Primary user

A student preparing for:

* Software Engineering internships
* SDE interviews
* Coding OAs
* LeetCode-style interviews

The initial version is **single-user/personal MVP**, but the architecture should not prevent future multi-user support.

---

# 4. Extension Responsibilities

The extension is responsible for:

### A. LeetCode observation

Detect:

* Current problem
* Problem slug
* Problem title
* Difficulty
* Problem URL

### B. Session tracking

Track:

* Problem opened
* Start time
* Elapsed time
* Submission
* Session completion

### C. User interaction

Provide:

* Coach panel
* Hint button
* Timer
* Submit status
* Reflection form
* Daily plan
* Feedback

### D. Event communication

Send events to n8n:

```text
problem_started
submission
reflection
coach_request
hint_request
session_closed
```

### E. Display n8n decisions

The extension should **not decide**:

* Which problem the user should solve
* Skill mastery
* Review schedule
* Priority
* Pattern weakness
* Hint strategy

Those belong to n8n + Supabase.

---

# 5. Main UI

The extension should use a **side panel**, rather than constantly modifying the LeetCode page.

Example:

```text
┌──────────────────────────────┐
│       🧠 DSA COACH           │
├──────────────────────────────┤
│                              │
│ Two Sum                      │
│ Easy                         │
│                              │
│ Pattern: Hash Map            │
│                              │
│ ──────────────────────────── │
│                              │
│ Session                       │
│ 18:42                        │
│                              │
│        [ 💡 Hint ]           │
│                              │
│        [ 📝 Reflect ]         │
│                              │
├──────────────────────────────┤
│ Today's Plan                 │
│                              │
│ ✓ Arrays                     │
│ → Two Pointers               │
│ ○ Sliding Window             │
│                              │
└──────────────────────────────┘
```

---

# 6. Extension Components

## 6.1 Content Script

Runs on LeetCode pages.

Responsibilities:

* Detect problem page
* Extract problem metadata
* Detect submission result
* Observe relevant DOM changes
* Communicate with background service

It should **not contain coaching logic**.

---

## 6.2 Background Service Worker

Responsible for:

* API communication with n8n
* Session state
* Authentication/configuration
* Message routing
* Retry handling
* Extension lifecycle

Example:

```text
Content Script
      ↓
Background Worker
      ↓
n8n Webhook
```

---

## 6.3 Side Panel

Main user interface.

Contains:

### Header

```text
🧠 DSA Coach
```

### Current Problem

```text
Two Sum
Easy

Patterns:
Hash Map
Arrays
```

### Session

```text
Time: 18:42

Started: 10:42 PM
```

### Actions

```text
[ Hint ]
[ Submit Reflection ]
[ End Session ]
```

---

# 7. Problem Detection

When user navigates to:

```text
leetcode.com/problems/two-sum/
```

Extension extracts:

```json
{
  "slug": "two-sum",
  "title": "Two Sum",
  "url": "https://leetcode.com/problems/two-sum/",
  "difficulty": "Easy"
}
```

Then sends:

```json
{
  "event": "problem_started",
  "problem": {
    "slug": "two-sum",
    "title": "Two Sum",
    "difficulty": "Easy",
    "url": "..."
  }
}
```

to the existing n8n event webhook.

---

# 8. Problem Started Response

n8n may return:

```json
{
  "session_id": "...",
  "problem": {
    "slug": "two-sum",
    "title": "Two Sum"
  },
  "coach": {
    "message": "Focus on recognizing the frequency-map pattern.",
    "pattern": "frequency_map"
  },
  "skill": {
    "mastery": 0.42,
    "confidence": 3
  }
}
```

Extension displays the relevant information.

**Important:** Don't expose unnecessary internal database information.

---

# 9. Timer

The extension maintains a local session timer.

Example:

```text
00:18:42
```

Timer states:

```text
IDLE
 ↓
STARTED
 ↓
PAUSED
 ↓
RESUMED
 ↓
SUBMITTED
 ↓
COMPLETED
```

For MVP, timer state can primarily live locally in the extension.

The authoritative attempt/session record remains in Supabase through n8n.

---

# 10. Submission Detection

The extension detects when the user submits code.

Possible states:

```text
Accepted
Wrong Answer
Time Limit Exceeded
Runtime Error
Compile Error
```

Extension sends:

```json
{
  "event": "submission",
  "session_id": "...",
  "problem_slug": "two-sum",
  "result": "accepted",
  "elapsed_seconds": 1120
}
```

n8n handles the actual skill update.

---

# 11. Submission Feedback

Example:

### Accepted

```text
🎉 Accepted

Time: 18m 40s

Good work.

Your Hash Map skill has been updated.
```

### Wrong Answer

```text
Not quite.

Don't immediately look at the solution.

Try checking:
• duplicate values
• index handling
• empty input

[ Get Hint ]
```

The actual feedback should come from n8n.

---

# 12. Hint System

User clicks:

```text
💡 Hint
```

Extension sends:

```json
{
  "event": "hint_request",
  "session_id": "...",
  "problem_slug": "two-sum"
}
```

n8n decides:

* Whether hint is appropriate
* Hint level
* Whether AI is required
* What hint to return

Extension displays:

```text
💡 Hint 1

Think about what information
you need to remember while
scanning the array.
```

Repeated requests can progressively reveal stronger hints.

---

# 13. Reflection

After solving, extension asks:

```text
How did this problem go?

○ Solved independently
○ Needed a small hint
○ Needed several hints
○ Viewed the solution
○ Couldn't solve
```

Additional:

```text
What was the main difficulty?

○ Didn't recognize the pattern
○ Wrong approach
○ Implementation error
○ Edge case
○ Complexity
○ Time pressure
○ Other
```

Optional:

```text
What did you learn?
________________________
```

Send to n8n:

```json
{
  "event": "reflection",
  "session_id": "...",
  "confidence": 3,
  "hints_used": 1,
  "solution_viewed": false,
  "error_types": [
    "PATTERN_NOT_RECOGNIZED"
  ],
  "reflection": "I didn't recognize the hash map approach."
}
```

---

# 14. Daily Plan

Extension should provide a simple daily-plan screen.

Example:

```text
📅 Today's Plan

45 minutes

1. Two Pointers
   Practice — 20 min

2. Sliding Window
   Practice — 15 min

3. Hash Map
   Review — 10 min
```

The plan comes from the existing n8n `/plan` endpoint.

The extension **does not calculate the plan**.

---

# 15. Progress View

Basic MVP progress:

```text
Your Progress

Arrays       ████████░░  78%
Hash Map     ██████░░░░  61%
Two Pointer  ████░░░░░░  43%
Sliding Win  ███░░░░░░░  31%
Graphs       ██░░░░░░░░  22%
```

This is a visualization of Supabase-derived data returned by n8n.

Do not implement a second skill engine inside the extension.

---

# 16. Settings

Minimal settings:

```text
DSA Coach Settings

n8n Endpoint
[________________________]

Profile
[ Default Profile ]

Daily Goal
[ 60 minutes ]

Notifications
[ ✓ ]

Save
```

For the MVP, avoid complicated authentication.

---

# 17. Communication Contract

All extension → n8n requests should use a consistent structure.

Example:

```json
{
  "event": "problem_started",
  "timestamp": "2026-09-21T22:30:00+05:30",
  "profile_id": "...",
  "session_id": "...",
  "problem": {
    "slug": "two-sum",
    "title": "Two Sum",
    "difficulty": "Easy",
    "url": "..."
  }
}
```

Common events:

| Event             | Purpose                  |
| ----------------- | ------------------------ |
| `problem_started` | Start coaching session   |
| `submission`      | Record submission        |
| `hint_request`    | Request hint             |
| `reflection`      | Record learning evidence |
| `session_closed`  | Close session            |
| `coach_request`   | Ask coach a question     |
| `plan_request`    | Load daily plan          |

---

# 18. Error Handling

If n8n is unavailable:

```text
⚠️ Coach temporarily unavailable.

Your session is still being tracked.
We'll sync your activity when connection returns.
```

The extension should avoid losing basic session information.

For MVP, store unsent events locally:

```text
Chrome Storage
      ↓
Pending Events
      ↓
Retry
      ↓
n8n
```

---

# 19. Security

Do **not** put:

* Supabase service key
* Database password
* OpenAI API key
* n8n credentials

inside the extension.

The extension communicates with the exposed n8n webhook/API.

Secrets remain server-side.

---

# 20. Technical Stack

Recommended:

```text
Chrome Extension
├── Manifest V3
├── TypeScript
├── React
├── Chrome Side Panel API
├── Content Script
├── Background Service Worker
└── chrome.storage

Backend
└── Existing n8n

Database
└── Supabase/PostgreSQL
```

For UI, Tailwind CSS is fine if you want to reuse your existing React experience.

---

# 21. MVP Scope

### Phase 1 — Foundation

* [ ] Create Manifest V3 extension
* [ ] Create content script
* [ ] Create background worker
* [ ] Create side panel
* [ ] Detect LeetCode problem
* [ ] Connect to n8n

### Phase 2 — Coaching Loop

* [ ] `problem_started`
* [ ] Display coach context
* [ ] Timer
* [ ] Submission detection
* [ ] Submission feedback
* [ ] Hint button
* [ ] Reflection

### Phase 3 — Planning

* [ ] Daily plan
* [ ] Progress
* [ ] Review information

### Phase 4 — Reliability

* [ ] Offline event queue
* [ ] Retry mechanism
* [ ] Error states
* [ ] Loading states
* [ ] Session recovery

---

# 22. Explicitly OUT of MVP

Don't build these yet:

* ❌ Mobile app
* ❌ Separate backend
* ❌ NestJS server
* ❌ Complex authentication
* ❌ AI model inside extension
* ❌ Local skill engine
* ❌ Automatic code analysis
* ❌ Support for every coding platform
* ❌ Social features
* ❌ Leaderboards
* ❌ Gamification
* ❌ Advanced analytics dashboard

---

# 23. MVP Success Criteria

The extension is considered working when this complete loop succeeds:

```text
Open Two Sum
      ↓
Extension detects it
      ↓
problem_started
      ↓
n8n responds
      ↓
Coach appears
      ↓
Timer starts
      ↓
Submit solution
      ↓
Extension detects Accepted/WA
      ↓
submission → n8n
      ↓
Skill updated in Supabase
      ↓
Feedback appears
      ↓
User requests hint
      ↓
Hint appears
      ↓
User reflects
      ↓
reflection → n8n
      ↓
Supabase contains complete evidence
```

### The key rule for development

**Don't try to build the whole extension at once.**

Build this first:

> **LeetCode problem detection → n8n `problem_started` → display response**

Once that works, add the timer, then submission detection, then hints, then reflection. This gives you a working vertical slice very quickly.
