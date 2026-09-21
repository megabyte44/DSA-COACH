# PRD — Personal DSA Coach

**Version:** 1.0
**Status:** Product Definition
**Primary User:** One student — personal use
**Primary Platform:** Chrome Extension + n8n
**Initial Data Source:** LeetCode
**Primary Goal:** Turn DSA practice into an adaptive coaching loop based on actual solving behavior.

---

# 1. Product Vision

Build a personal DSA coach that continuously learns:

> **What I know → what I don't know → how I struggle → what I forget → what I should practice next.**

The system should not optimize for the number of problems solved.

It should optimize for:

> **Pattern recognition + independent solving + correctness + appropriate speed + retention.**

The coach should behave differently from a normal LeetCode tracker.

A normal tracker says:

> "You solved 150 problems."

The DSA Coach should say:

> "Your Sliding Window knowledge is strong, but variable-window recognition is weak. You haven't practiced it for 14 days, and your last two attempts required hints. Today's session should therefore include a recognition exercise followed by one Medium problem."

---

# 2. Product Goals

## Primary goals

### G1 — Build a personal knowledge model

Track skill at the **pattern level**, not merely topic level.

Example:

```text
Graphs
 ├── BFS             82%
 ├── DFS             71%
 ├── Grid traversal  64%
 ├── Topological     32%
 └── Union Find      41%
```

### G2 — Understand actual solving behavior

Record:

* problem
* attempt
* time
* result
* hints
* solution viewing
* retries
* confidence
* error type
* pattern
* review history

### G3 — Automatically decide what to practice

The coach selects activities based on:

```text
Target requirements
×
Skill gaps
×
Forgetting
×
Difficulty
×
Recent performance
```

### G4 — Coach during solving

The extension should provide:

* contextual hints
* pattern recognition help
* timers
* reflection
* progressive assistance
* interview-style explanation prompts

### G5 — Create a continuous feedback loop

```text
Observe
 ↓
Attempt
 ↓
Measure
 ↓
Diagnose
 ↓
Update skill
 ↓
Choose next activity
 ↓
Repeat
```

---

# 3. Non-Goals for V1

Do **not** build these initially:

* public SaaS
* multi-user scaling
* mobile application
* complex backend service
* company interview prediction
* automated interview outcome prediction
* advanced ML model for skill prediction
* large-scale scraping infrastructure
* elaborate analytics dashboard
* social/community features
* gamification/streak system
* support for every coding platform

The first objective is:

> **Make the coach genuinely useful to one person.**

---

# 4. High-Level Architecture

```text
                     ┌───────────────────────┐
                     │     CHROME USER       │
                     └───────────┬───────────┘
                                 │
                                 ↓
              ┌────────────────────────────────┐
              │       CHROME EXTENSION         │
              │                                │
              │  LeetCode Observer             │
              │  Session Tracker               │
              │  Submission Tracker            │
              │  Hint Tracker                  │
              │  Coach Side Panel               │
              │  Reflection UI                 │
              └──────────────┬─────────────────┘
                             │
                         HTTPS/Webhook
                             │
                             ↓
              ┌────────────────────────────────┐
              │              n8n                │
              │                                │
              │  Event Processing              │
              │  Coach Engine                  │
              │  Priority Engine               │
              │  Review Engine                 │
              │  AI Integration                │
              │  Daily Planning                │
              │  Weekly Reports                │
              └──────────────┬─────────────────┘
                             │
                             ↓
                    ┌─────────────────┐
                    │    PostgreSQL   │
                    │                 │
                    │ Profile         │
                    │ Problems        │
                    │ Patterns        │
                    │ Skills          │
                    │ Attempts        │
                    │ Sessions        │
                    │ Reviews         │
                    └─────────────────┘
                             │
                             ↓
                    Email / Notifications
```

---

# 5. Core Components

## Component A — Chrome Extension

The extension is the **eyes, ears and interface** of the coach.

It observes the current LeetCode session and gives the user real-time coaching.

### Responsibilities

* identify current problem
* detect problem metadata
* track session start
* track session duration
* detect submissions
* detect result
* track hints
* track solution/editorial usage where technically detectable
* provide timer
* provide reflection UI
* provide coach side panel
* request hints
* display recommendations
* send events to n8n

---

# 6. Extension Structure

Initial repository:

```text
dsa-coach-extension/
│
├── manifest.json
├── background/
│   └── service-worker.js
│
├── content/
│   └── leetcode.js
│
├── sidepanel/
│   ├── index.html
│   ├── app.js
│   └── styles.css
│
├── popup/
│   ├── index.html
│   └── app.js
│
├── services/
│   ├── n8n.js
│   └── storage.js
│
└── utils/
    └── helpers.js
```

The exact structure can change during implementation.

---

# 7. Extension Features

## F1 — Problem Detection

When a LeetCode problem is opened, detect:

```text
problem_id
title
slug
difficulty
URL
topics/patterns where available
```

Send:

```json
{
  "event": "problem_started",
  "problem_id": "...",
  "title": "...",
  "difficulty": "Medium",
  "timestamp": "..."
}
```

---

## F2 — Session Tracking

When the problem is opened:

```text
START
 ↓
Timer
 ↓
Interaction
 ↓
Submit
 ↓
END
```

Track:

```text
started_at
ended_at
duration
active_time if possible
```

---

## F3 — Submission Tracking

Every submission becomes an attempt.

Example:

```text
Attempt 1 → Wrong Answer
Attempt 2 → Time Limit
Attempt 3 → Accepted
```

Record each separately.

Never overwrite the attempt history.

---

# 8. F4 — Hint Tracking

Track:

```text
hints_used
solution_viewed
editorial_viewed
```

This is essential because:

> Accepted ≠ Mastered.

---

# 9. F5 — Confidence

After solving:

```text
How confident were you?

1 — I guessed / needed solution
2 — Needed significant help
3 — Could solve with some difficulty
4 — Mostly comfortable
5 — Very confident
```

This becomes part of the skill model.

---

# 10. F6 — Error Classification

After a failed/struggled attempt:

```text
Why did you struggle?

□ Didn't recognize pattern
□ Wrong approach
□ Implementation bug
□ Edge case
□ Complexity / TLE
□ Time pressure
□ Didn't understand problem
□ Needed hint
□ Other
```

Store one or multiple errors.

---

# 11. F7 — Coach Side Panel

The extension should provide a persistent coach interface.

Example:

```text
┌──────────────────────────────┐
│ 🧠 DSA COACH                 │
├──────────────────────────────┤
│                              │
│ Current Problem              │
│ Longest Substring...         │
│                              │
│ Likely Pattern               │
│ Sliding Window               │
│                              │
│ Your Mastery                 │
│ ██████░░░░ 61%               │
│                              │
│ 🔄 Review                    │
│ Last practiced: 12 days ago  │
│                              │
│ [ Start Timer ]              │
│ [ Give Hint ]                │
│ [ Explain Approach ]         │
│                              │
└──────────────────────────────┘
```

---

# 12. Progressive Hint System

Hints should have levels.

### Level 0

No hint.

### Level 1 — Recognition

> What property of the problem suggests maintaining a contiguous window?

### Level 2 — Direction

> Consider maintaining information about the elements inside the current window.

### Level 3 — Approach

> Use two pointers and adjust the left boundary when the window becomes invalid.

### Level 4 — Detailed approach

Provide algorithm explanation.

### Level 5 — Solution

Only when explicitly requested.

The coach should prefer **minimal assistance**.

---

# 13. Explain-Out-Loud Mode

Before final submission, the coach can ask:

```text
Pattern?
Why?
Time complexity?
Space complexity?
```

Example:

```text
Pattern: Sliding Window
Reason: Maintain a valid contiguous range
Time: O(n)
Space: O(k)
```

This trains interview communication.

---

# 14. Reflection

After each meaningful session:

```text
Difficulty:
Easy / Okay / Hard / Very Hard

Confidence:
1–5

Pattern recognized?
Yes / Partially / No

Needed help?
Yes / No

Main problem:
...
```

---

# 15. Pattern Map

The pattern map is the foundation of the coach.

Initial version: approximately **40 patterns**.

### Tier A — Must Master

* Frequency Map
* Prefix Sum
* Two Pointers
* Fixed Sliding Window
* Variable Sliding Window
* Binary Search
* Binary Search on Answer
* Tree DFS
* Tree BFS
* BST
* LCA
* Graph BFS
* Graph DFS
* Grid BFS/DFS
* Topological Sort
* Union Find
* 1D DP
* 2D/Grid DP
* Knapsack
* LCS/LIS
* Heap / Top-K
* Merge K
* Backtracking
* Subsets
* Permutations
* Combinations
* Monotonic Stack
* Parentheses/Stack

### Tier B

* Linked List Fast/Slow
* Reverse Linked List
* Intervals
* Greedy
* Trie
* Dijkstra
* Bit Manipulation

### Tier C

* Segment Tree
* Advanced DP
* KMP/String Algorithms

The actual pattern catalogue should remain editable.

---

# 16. Pattern Metadata

Each pattern contains:

```text
pattern_id
topic
name
tier
interview_weight
prerequisites
recognition_signals
common_mistakes
template
example_problems
```

Example:

```text
pattern:
Variable Sliding Window

topic:
Arrays

weight:
0.85

prerequisites:
Two Pointers

recognition_signals:
- contiguous subarray/substring
- maintain condition
- expand/shrink range
```

---

# 17. Skill Model

Each user-pattern combination stores:

```text
pattern_id
mastery
confidence
problems_solved
easy_solved
medium_solved
hard_solved
avg_time
hint_rate
failure_rate
last_practiced
next_review
error_profile
```

Example:

```text
Sliding Window

Mastery: 61
Confidence: 3
Solved: 14
Avg time: 24 min
Hint rate: 21%
Last practiced: 12 days ago
Primary error: Pattern recognition
Next review: Tomorrow
```

---

# 18. Priority Engine

The first version uses:

```text
Priority =
Interview Weight
×
Skill Gap
×
Forgetting Factor
×
Difficulty Fit
```

Where:

### Interview Weight

Importance of the pattern for the selected target.

### Skill Gap

Difference between current mastery and desired mastery.

### Forgetting Factor

Increases as time passes since practice.

### Difficulty Fit

Prevents the coach from giving problems that are too difficult or too easy.

---

# 19. Difficulty Controller

The coach should adapt difficulty.

Example:

```text
Easy → successful
Easy → successful
Medium → successful
Medium → successful
        ↓
Increase difficulty
```

But:

```text
Medium → failed
Medium → failed
        ↓
Reduce difficulty
        ↓
Review pattern
```

The system should respond to **recent evidence**, not just total solved count.

---

# 20. Spaced Repetition

Each pattern/problem can have:

```text
last_review
next_review
review_interval
retention_signal
```

Initial intervals can be simple:

```text
1 day
3 days
7 days
14 days
30 days
60 days
```

Failure reduces the interval.

---

# 21. Target Profile

The user creates:

```text
Target Company
Target Role
Target Date
Hours / Week
Daily Practice Time
Current Level
```

Example:

```text
Target:
SWE

Date:
8 weeks

Practice:
7 hours/week

Level:
Intermediate
```

The target determines the competency priorities.

---

# 22. Coach Modes

The coach automatically chooses a mode based on time and progress.

### Build

More new patterns.

### Consolidate

More mixed practice and review.

### Mock

Timed interview sets.

### Taper

Light review, no major new learning.

### Restart

Triggered after a significant inactivity period.

---

# 23. Restart Mode

If no meaningful practice occurs for approximately 5–7 days:

### Day 1

One easy problem from a strong pattern.

### Day 2

Two problems from patterns with significant decay.

### Day 3+

Return toward normal workload.

No streak-shaming.

The coach says:

> "Welcome back. Let's rebuild momentum."

---

# 24. Problem Selection

Problems should be selected from:

1. Weak patterns
2. Due reviews
3. Target-important patterns
4. Appropriate difficulty
5. Recent error patterns
6. Curated target sets
7. Previously failed problems

Avoid repeatedly selecting problems already mastered.

---

# 25. Curated Target Sets

Because company-specific information may be incomplete or unavailable, use manually curated datasets initially.

Examples:

```text
NeetCode 150
Blind 75
Personal target list
Custom company list
```

The system should associate:

```text
problem → patterns → target set
```

---

# 26. Daily Plan

The coach generates a plan.

Example:

```text
TODAY — 50 MINUTES

5 min
Pattern recognition:
Sliding Window

20 min
Medium:
Problem A

15 min
Review:
Graph BFS

10 min
Explain-out-loud:
Problem A
```

The plan is stored.

---

# 27. Weekly Mock

Once per week:

```text
45 minutes
│
├── Medium problem
└── Medium/Hard problem
```

Measure:

* recognition
* approach
* correctness
* time
* complexity
* hints
* communication
* errors

The result updates the skill model.

---

# 28. Weekly Report

Example:

```text
WEEKLY DSA REPORT

Problems:
12

Independent:
9

Hint-dependent:
2

Solution-dependent:
1

Strongest:
Arrays

Weakest:
Graphs

Most common error:
Pattern recognition

Patterns reviewed:
8

Patterns improved:
5

Patterns needing attention:
3

Next week:
Graphs + DP
```

---

# 29. n8n Workflow Design

Instead of one giant workflow, use separate workflows.

```text
01-cold-start
02-problem-started
03-session-event
04-submission
05-reflection
06-coach-hint
07-daily-plan
08-spaced-review
09-restart-mode
10-weekly-report
11-mock-interview
12-skill-recalculation
```

This keeps the system understandable.

---

# 30. Database

For the personal version:

**PostgreSQL/Supabase** is the recommended persistent store.

Core tables:

```text
profiles
patterns
problems
skills
attempts
sessions
reviews
plans
```

Optional later:

```text
error_log
mock_results
coach_messages
target_requirements
```

---

# 31. Important Data Principle

Never overwrite attempts.

Bad:

```text
Problem A
attempts = 3
```

Better:

```text
attempt 1 → WA
attempt 2 → TLE
attempt 3 → AC
```

Then derive statistics from the history.

This gives the coach a genuine history of behavior.

---

# 32. n8n's Role

n8n should handle:

* webhook endpoints
* database reads/writes
* decision workflows
* scoring
* scheduling
* AI calls
* email
* reports
* notifications
* periodic recalculation

It should **not** handle:

* real-time timer UI
* DOM interaction
* every keystroke
* local extension state
* visual rendering

---

# 33. Chrome Extension's Role

The extension should handle:

* browser interaction
* LeetCode observation
* real-time session state
* timer
* side panel
* buttons
* local caching
* user feedback
* event transmission

---

# 34. AI's Role

AI should assist the coach rather than become the coach's entire brain.

Use deterministic logic for:

* mastery calculations
* priority
* forgetting
* review dates
* difficulty adjustment
* target gap calculations

Use AI for:

* explanations
* hints
* error interpretation
* personalized teaching
* weekly summaries
* natural-language coaching
* analyzing solution explanations

This keeps the system predictable.

---

# 35. Cold Start

For an existing LeetCode user:

### Phase 1

Import available solved/problem/topic information.

### Phase 2

Ask the user for confidence:

```text
Arrays       1–5
Strings      1–5
Trees        1–5
Graphs       1–5
DP           1–5
...
```

### Phase 3

Run calibration problems.

The system then replaces the initial estimate with **observed evidence**.

This is better than trusting either solved counts or self-rating alone.

---

# 36. Key User Journey

```text
Install extension
       ↓
Connect coach
       ↓
Set target
       ↓
Import existing history
       ↓
Initial skill calibration
       ↓
Coach generates today's plan
       ↓
Open LeetCode
       ↓
Extension detects problem
       ↓
Coach provides contextual guidance
       ↓
User solves
       ↓
Extension records behavior
       ↓
Reflection
       ↓
n8n updates skill
       ↓
Review scheduled
       ↓
Tomorrow's plan adapts
```

---

# 37. MVP Definition

The first usable version should contain only:

### Extension

* LeetCode problem detection
* timer
* submission detection
* session tracking
* side panel
* reflection
* n8n communication

### n8n

* problem-start workflow
* submission workflow
* skill update workflow
* daily plan workflow
* priority engine

### Database

```text
profile
patterns
problems
skills
attempts
```

That is the **true MVP**.

---

# 38. V1.5

Add:

* hints
* solution tracking
* spaced repetition
* error classification
* adaptive difficulty
* restart mode
* weekly reports

---

# 39. V2

Add:

* AI coach
* progressive hints
* explain-out-loud
* mock interview mode
* richer target competency maps
* advanced analytics

---

# 40. Success Criteria

The project is successful when, after several weeks of use, the system can answer these questions accurately:

### "What am I weak at?"

Not just:

> Graphs.

But:

> Topological Sort and Union Find.

### "Why am I weak?"

> Low recognition + high hint dependency.

### "What should I practice today?"

> Topological Sort Medium.

### "Why this problem?"

> High target weight + low mastery + review overdue.

### "Am I improving?"

> Independent solve time decreased and hint dependency decreased.

### "What did I forget?"

> BFS hasn't been practiced in 18 days and recent review performance declined.

### "What should I do tomorrow?"

> Automatically determined from today's evidence.

If the system can answer those questions, **you have built a coach rather than a LeetCode tracker.**

---

# 41. Product Principle

The central product rule should be:

> **Every interaction should either collect evidence about the learner or use existing evidence to make a better coaching decision.**

That keeps the project focused.

---

## Final system in one sentence

**A Chrome extension observes and assists the user's real-time DSA practice; n8n processes those events and runs the coaching logic; PostgreSQL remembers the learner; and the coach continuously adapts future practice based on demonstrated skill, mistakes, forgetting, target requirements, and solving behavior.**

This is the PRD I'd use as the baseline before writing the extension repository or n8n workflows.
