# Feature Design: Interview Mode Simulator

**Status**: Draft v2 (Enhanced)
**Date**: December 22, 2025
**Priority**: P0 (User Request)
**Last Updated**: December 22, 2025 - Gap Analysis Complete

---

## 1. Overview
Transform Coach Atlas from a simple chat interface into a **Real-Time Interview Simulator**. This feature aims to replicate the pressure and structure of platforms like Pramp, interviewing.io, or HackerRank.

### Core Value Proposition
-   **Pressure**: A countdown timer forces time management.
-   **Focus**: A persistent problem statement ensures the user doesn't lose context.
-   **Feedback**: Structured, actionable evaluation maps to real-world rubrics (Google/Meta style).

---

## 2. User Experience (UX)

### 2.1 The Split Interface
When "Mock Interview" persona is active, the layout transforms:
-   **Left Panel (40%)**: Problem Statement & Constraints (Static/Scrollable).
-   **Right Panel (60%)**: Chat Interface (where code is written).
-   **Top Bar**: Persistent Countdown Timer (e.g., "43:12 remaining").

### 2.2 The Flow
1.  **Start**: User selects "Mock Interview" -> "Start Coding Round".
2.  **Setup**: Modal asks: "Topic?" (Arrays, DP, Graphs) & "Difficulty?" (Easy/Med/Hard).
3.  **Active**:
    -   Timer starts (45 mins).
    -   AI generates a structured problem in the Left Panel.
    -   User discusses approach & writes code in Right Panel.
4.  **Completion**:
    -   User clicks "End Interview" OR Timer expires.
    -   AI generates `EvaluationReport`.
5.  **Review**: A beautiful report card appears with granular scores.

---

## 3. Technical Architecture

### 3.1 Data Models (`src/services/types/interview.ts`)

```typescript
export type InterviewStatus = 'idle' | 'setup' | 'active' | 'paused' | 'submitted' | 'review';

export interface InterviewProblem {
  id: string;
  title: string;
  description: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  hints: string[]; // Progressive hints
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string[];
  testCases?: { input: string; expected: string; hidden: boolean }[];
}

export interface InterviewSession {
  id: string;
  type: 'coding' | 'system-design' | 'behavioral';
  startTime: number;
  pausedTime?: number; // Total time spent paused
  durationMinutes: number;
  status: InterviewStatus;
  currentProblemIndex: number;
  problems: InterviewProblem[];
  hintsUsed: number[];
  chatHistory: string[]; // Message IDs for reconstruction
  evaluation?: EvaluationReport;
  createdAt: number;
  updatedAt: number;
}

export interface EvaluationReport {
  overallScore: number; // 1-5 (Strong No Hire to Strong Hire)
  dimensions: {
    problemSolving: number;   // 1-5 (Approach, Algorithm Choice)
    coding: number;           // 1-5 (Syntax, Correctness, Edge Cases)
    communication: number;    // 1-5 (Explaining thoughts, Asking questions)
    verification: number;     // 1-5 (Testing, Debugging)
    timeManagement: number;   // 1-5 (NEW: Pacing, Prioritization)
  };
  feedback: {
    strengths: string[];
    weaknesses: string[];
    actionItems: string[];    // Specific practice recommendations
    followUpQuestions: string[]; // Questions interviewer would ask
  };
  comparison?: {
    percentile: number;       // "Top 30% of candidates"
    similarProblems: string[]; // Practice recommendations
  };
}
```

### 3.2 State Management (`src/features/interview/InterviewContext.tsx`)
New Context to manage the session state globally.

```typescript
interface InterviewContextValue {
  // State
  session: InterviewSession | null;
  status: InterviewStatus;
  timeRemaining: number;
  currentProblem: InterviewProblem | null;

  // Actions
  startInterview: (config: InterviewConfig) => Promise<void>;
  pauseInterview: () => void;
  resumeInterview: () => void;
  endInterview: () => Promise<void>;
  submitForReview: () => Promise<EvaluationReport>;
  requestHint: () => string | null;
  nextProblem: () => Promise<void>;

  // Utilities
  isInterviewActive: boolean;
  canRequestHint: boolean;
  hintsRemaining: number;
}
```

### 3.3 New Components (`src/features/interview/`)
1.  **`InterviewLayout.tsx`**: Wrapper that handles the split-pane logic.
2.  **`TimerDisplay.tsx`**: Visual countdown with urgent colors (< 5 min = red).
3.  **`ProblemPanel.tsx`**: Renders markdown content of the problem.
4.  **`EvaluationCard.tsx`**: Complex UI to visualize the JSON score report.
5.  **`HintButton.tsx`**: Progressive hint system (costs points).
6.  **`InterviewControls.tsx`**: Pause/Resume/End buttons.
7.  **`TestCaseRunner.tsx`**: (Future) Run code against visible test cases.

### 3.4 Interview State Machine (The "Logic" Brain)
To ensure the AI "sticks" to the question and doesn't drift, we use a formal State Machine in `InterviewContext`, not just chat history.

```
┌─────────────────────────────────────────────────────────────────┐
│                     INTERVIEW STATE MACHINE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────┐    startInterview()    ┌───────┐                    │
│   │ IDLE │ ─────────────────────► │ SETUP │                    │
│   └──────┘                        └───┬───┘                    │
│       ▲                               │                         │
│       │ cancel()                      │ confirmSetup()          │
│       │                               ▼                         │
│       │                         ┌─────────┐                     │
│       └─────────────────────────┤  ACTIVE │◄──┐                │
│                                 └────┬────┘   │                │
│                                      │        │                │
│                      pause()         │        │ resume()       │
│                         ┌────────────┼────────┤                │
│                         ▼            │        │                │
│                    ┌────────┐        │        │                │
│                    │ PAUSED │────────┘        │                │
│                    └────────┘                 │                │
│                                               │                │
│          timeout() OR endInterview()          │                │
│                         │                     │                │
│                         ▼                     │                │
│                   ┌───────────┐               │                │
│                   │ SUBMITTED │               │                │
│                   └─────┬─────┘               │                │
│                         │                     │                │
│                         │ evaluationComplete  │                │
│                         ▼                     │                │
│                    ┌────────┐    nextProblem()│                │
│                    │ REVIEW │─────────────────┘                │
│                    └────────┘                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**States:**
1.  `IDLE`: No interview active.
2.  `SETUP`: Choosing difficulty/topic.
3.  `ACTIVE`: Timer running, chatting allowed.
    -   *Guardrail*: AI System Prompt is injected with: `"CURRENT_PROBLEM: [Problem Title]. Refuse to change topics."`
4.  `PAUSED`: Timer frozen, input disabled, session preserved. *(NEW)*
5.  `SUBMITTED`: Input disabled, generating report.
6.  `REVIEW`: Report card shown. "Next Problem" button enabled.

**Transitions:**
-   `ACTIVE` -> `PAUSED`: Triggered by "Pause" button. Max 2 pauses per session.
-   `PAUSED` -> `ACTIVE`: Triggered by "Resume" button.
-   `ACTIVE` -> `SUBMITTED`: Triggered by Timer hitting 00:00 OR "Finish" button.
-   `REVIEW` -> `ACTIVE`: Triggered by "Next Question" button (clears chat, loads new problem).

---

## 4. AI Prompt Engineering

### 4.1 Problem Generation Prompt (System)
```text
You are generating a coding interview problem.
Topic: {topic}
Difficulty: {difficulty}
OUTPUT JSON ONLY:
{
  "title": "Problem Name",
  "description": "Clear description...",
  "examples": [{"input": "X", "output": "Y", "explanation": "..."}],
  "constraints": ["O(n) time", "O(1) space"],
  "hints": ["Consider using a hashmap", "Think about edge cases"],
  "testCases": [{"input": "...", "expected": "...", "hidden": false}]
}
```

### 4.2 The Guarded Interviewer Prompt
The `systemPrompt` updates dynamically based on the state:

**When State = ACTIVE:**
```text
You are a technical interviewer at a top tech company.

## CURRENT PROBLEM
Title: {problem.title}
Description: {problem.description}

## YOUR ROLE
1. Review the user's approach and code against THIS problem ONLY.
2. If the user asks to change topics, politely decline: "Let's focus on the current problem first."
3. Ask clarifying follow-up questions like a real interviewer would.
4. Don't give away the solution - guide with hints.
5. Track their progress mentally (approach → code → testing).

## GUARDRAILS
- Never reveal the optimal solution directly.
- If they're stuck for >3 exchanges, offer a gentle hint.
- If they ask about time/space complexity, help them analyze.
```

### 4.3 Evaluation Prompt (System)
```text
Analyze the complete interview session.
Consider:
1. Did they clarify requirements?
2. Was their approach sound?
3. Is the code syntactically correct?
4. Did they handle edge cases?
5. Did they test their solution?
6. How was their communication?
7. Did they manage time well?

OUTPUT JSON ONLY (strict schema):
{
  "overallScore": 3,
  "dimensions": {
    "problemSolving": 3,
    "coding": 4,
    "communication": 3,
    "verification": 2,
    "timeManagement": 4
  },
  "feedback": {
    "strengths": ["Clear communication", "Good approach"],
    "weaknesses": ["Missed edge case", "No testing"],
    "actionItems": ["Practice boundary conditions"],
    "followUpQuestions": ["What if the input was empty?"]
  }
}
```

---

## 5. Gap Analysis & Enhancements

### 5.1 Identified Gaps (v1 → v2)

| Gap | Severity | Solution |
|-----|----------|----------|
| **Session Persistence** | High | Save session to IndexedDB every 30s. Auto-restore on page load. |
| **Pause/Resume** | Medium | Add PAUSED state. Max 2 pauses, 5 min each. |
| **Hints System** | Medium | Progressive hints array. Each hint costs -0.2 on evaluation. |
| **Follow-up Questions** | Low | Include in EvaluationReport.feedback.followUpQuestions |
| **Code Execution** | Future | Monaco editor + WASM sandbox (Phase 4). |
| **Multi-problem Sessions** | Medium | Support 1-3 problems per session. Aggregate scoring. |
| **Network Disconnect** | High | Offline detection + auto-save. Resume when reconnected. |
| **Mobile Experience** | Medium | Stack panels vertically. Collapsible problem panel. |
| **Interview History** | Medium | Store completed sessions in IndexedDB. Progress dashboard. |
| **Timer Cheating** | Low | Use server-relative time if available. Client-only for MVP. |

### 5.2 Enhancements Added in v2

1. **Pause/Resume Flow**
   - Max 2 pauses per interview
   - 5-minute pause limit (auto-resumes)
   - Visual indicator showing pause count

2. **Progressive Hints**
   - 3 hints per problem
   - Each hint costs -0.2 on coding dimension
   - Hints revealed in order (can't skip)

3. **Session Persistence** (NEW)
   ```typescript
   // Auto-save every 30 seconds
   useEffect(() => {
     const interval = setInterval(() => {
       if (session && status === 'active') {
         storageService.saveInterviewSession(session);
       }
     }, 30000);
     return () => clearInterval(interval);
   }, [session, status]);
   ```

4. **Offline Handling** (NEW)
   ```typescript
   // Detect offline and pause timer
   window.addEventListener('offline', () => {
     if (status === 'active') {
       pauseInterview();
       showToast('Connection lost. Interview paused.');
     }
   });
   ```

5. **Time Management Dimension** (NEW)
   - Added to evaluation rubric
   - Tracks: time-to-first-approach, time-per-section
   - Penalizes: spending 30min on clarification, rushing code

---

## 6. Edge Case Handling

### 6.1 JSON Parsing Failures
```typescript
async function parseAIJson<T>(response: string, maxRetries = 2): Promise<T> {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      // Try direct parse
      const json = JSON.parse(response);
      return validateSchema(json);
    } catch (e) {
      if (i === maxRetries) throw new Error('JSON parsing failed');

      // Ask AI to fix its own JSON
      response = await aiService.sendMessage({
        messages: [{
          role: 'user',
          content: `Fix this invalid JSON:\n${response}\n\nReturn ONLY valid JSON.`
        }]
      });
    }
  }
}
```

### 6.2 Empty Submission
```typescript
if (!userCode.trim()) {
  return {
    overallScore: 1,
    feedback: {
      weaknesses: ['No solution submitted'],
      actionItems: ['Always attempt a solution, even if incomplete']
    }
  };
}
```

### 6.3 Browser Tab Inactive
```typescript
document.addEventListener('visibilitychange', () => {
  if (document.hidden && status === 'active') {
    // Timer continues but we log the hidden duration
    session.tabHiddenDuration += calculateHiddenTime();
  }
});
```

---

## 7. Implementation Plan

### Phase 1: Context & Basic UI (3 days)
1.  Create `InterviewContext` with state machine.
2.  Create `TimerDisplay` (handles countdown and auto-submit).
3.  Create `InterviewLayout` (split-pane).
4.  Update `App.tsx` to conditionally render interview mode.

### Phase 2: Problem Generation & Persistence (3 days)
1.  Create `ProblemPanel` (The "Sticky" UI).
2.  Wire up AI to generate problem JSON.
3.  Implement IndexedDB persistence.
4.  Add pause/resume functionality.

### Phase 3: Evaluation & Reporting (3 days)
1.  Implement "End Interview" logic.
2.  Create `EvaluationCard` component.
3.  Add hints system with scoring penalty.
4.  Build interview history storage.

### Phase 4: Polish & Mobile (2 days)
1.  Responsive design for mobile.
2.  Keyboard shortcuts (Ctrl+Enter to submit).
3.  Accessibility audit.
4.  Performance optimization.

---

## 8. Constraints & Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Context Window Overflow | Medium | High | Summarize chat every 20 messages |
| JSON Parsing Failures | Medium | Medium | Retry logic + repair prompt |
| Timer Cheating | Low | Low | Server-time validation (future) |
| AI Wandering Off-Topic | Medium | High | Strong guardrail prompts + state machine |
| Mobile Usability | High | Medium | Stack panels + collapsible sections |

---

## 9. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Interview Completion Rate | >80% | Sessions completed / started |
| Time-to-First-Approach | <5 min | Avg time before coding starts |
| Hint Usage Rate | <30% | Interviews using hints |
| User Return Rate | >60% | Users doing 2+ interviews |
| Evaluation Accuracy | TBD | Human review sample |

---

## 10. Open Questions

1. **Should we support real code execution?**
   - Pro: More realistic, can run test cases
   - Con: Complex (WASM sandbox, security)
   - Decision: Phase 4 enhancement

2. **Should hints be free?**
   - Pro: Better learning experience
   - Con: Less realistic interview pressure
   - Decision: Hints cost points but don't block progress

3. **Multi-language support?**
   - Decision: Start with JavaScript/Python. Add more in Phase 5.

---

*Document Version: 2.0*
*Author: Coach Atlas Team*
*Review Status: Ready for Implementation*
