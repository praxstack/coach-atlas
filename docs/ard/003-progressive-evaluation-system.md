# ARD-003: Progressive Real-Time Evaluation System

## Problem Statement

Current evaluation approach has critical flaws:
1. **Token Explosion**: Full chat history sent at end → exceeds context limits
2. **Single Point of Failure**: One API call determines everything → timeout risk
3. **Lost Context**: Truncation loses valuable observations
4. **Poor UX**: User waits at end for slow evaluation

## Solution: Progressive Incremental Evaluation

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Interview Session                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [User Message] ──► [Interviewer Response]                          │
│        │                    │                                        │
│        ▼                    ▼                                        │
│  ┌──────────────────────────────────────┐                           │
│  │     Message Exchange Complete        │                           │
│  └──────────────────────────────────────┘                           │
│                    │                                                 │
│                    ▼                                                 │
│  ┌──────────────────────────────────────┐                           │
│  │   Background: Micro-Evaluation       │ (every 2-3 exchanges)     │
│  │   ─────────────────────────────────  │                           │
│  │   • Extract observations             │                           │
│  │   • Update running scores            │                           │
│  │   • Compact context summary          │                           │
│  └──────────────────────────────────────┘                           │
│                    │                                                 │
│                    ▼                                                 │
│  ┌──────────────────────────────────────┐                           │
│  │   Progressive Evaluation Store       │                           │
│  │   ─────────────────────────────────  │                           │
│  │   • observations: Observation[]      │                           │
│  │   • runningScores: DimensionScores   │                           │
│  │   • contextSummary: string           │                           │
│  │   • lastEvaluatedIndex: number       │                           │
│  └──────────────────────────────────────┘                           │
│                                                                      │
│                    │                                                 │
│                    ▼                                                 │
│  ┌──────────────────────────────────────┐                           │
│  │   On "Finish" Click                  │                           │
│  │   ─────────────────────────────────  │                           │
│  │   • Fast synthesis (pre-computed!)   │                           │
│  │   • ~2-3 second response             │                           │
│  │   • No full history processing       │                           │
│  └──────────────────────────────────────┘                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Observation Model

```typescript
interface Observation {
  id: string;
  type: 'strength' | 'weakness' | 'insight' | 'missed' | 'improvement';
  dimension: 'problemSolving' | 'coding' | 'communication' | 'verification' | 'timeManagement';
  content: string;
  messageIndex: number;  // Which exchange this came from
  confidence: number;    // 0-1 confidence score
  timestamp: number;
}
```

### 2. Progressive Evaluation State

```typescript
interface ProgressiveEvaluationState {
  // Running scores (updated incrementally)
  scores: {
    problemSolving: number;
    coding: number;
    communication: number;
    verification: number;
    timeManagement: number;
  };

  // Observations collected over time
  observations: Observation[];

  // Compacted context summary (NOT full history)
  contextSummary: string;

  // Tracking
  lastEvaluatedIndex: number;
  totalExchanges: number;
  evaluationCount: number;
}
```

### 3. Context Compactor

The key innovation: **summarize, don't truncate**.

```typescript
interface ContextCompactor {
  /**
   * Take last N messages and produce a summary
   * Preserves: key decisions, code snippets, identified issues
   * Discards: filler conversation, repeated explanations
   */
  compact(messages: Message[], previousSummary: string): Promise<CompactedContext>;
}

interface CompactedContext {
  summary: string;           // ~500 tokens max
  keyCodeSnippets: string[]; // Preserved code
  identifiedApproach: string;
  edgeCasesDiscussed: string[];
  complexityAnalysis?: string;
}
```

### 4. Micro-Evaluation Prompt

Small, focused prompt for incremental evaluation:

```
Given this recent interview exchange:

[Previous Summary]: {contextSummary}

[Recent Exchange (messages {N} to {M})]:
{recentMessages}

Extract observations. Output JSON:
{
  "observations": [
    {"type": "strength|weakness|insight|missed", "dimension": "...", "content": "..."}
  ],
  "scoreDeltas": {
    "problemSolving": -1 to +1,
    "coding": -1 to +1,
    ...
  },
  "updatedSummary": "Concise summary including new context"
}
```

## Implementation Plan

### Phase 1: Core Infrastructure
1. Create `ProgressiveEvaluator` service
2. Create `ContextCompactor` utility
3. Add `ProgressiveEvaluationState` to interview context
4. Background evaluation trigger (every 2-3 exchanges)

### Phase 2: Integration
1. Hook into message flow
2. Store observations in IndexedDB
3. Update UI with real-time score indicators
4. Fast final synthesis

### Phase 3: Optimization
1. Debounce evaluation calls
2. Queue management for concurrent calls
3. Fallback handling
4. Offline support

## Token Budget Analysis

| Approach | Tokens per Evaluation | Total for 20-msg Interview |
|----------|----------------------|---------------------------|
| **Current (Full History)** | ~8000 | 8000 (one shot) |
| **Progressive (Incremental)** | ~1500 | ~6000 (4 micro-evals) |
| **Final Synthesis** | ~800 | 800 |

**Result**: More reliable, faster, same or lower token cost.

## API Design

```typescript
// ProgressiveEvaluator.ts
class ProgressiveEvaluator {
  private state: ProgressiveEvaluationState;
  private evaluationQueue: Promise<void>;

  /**
   * Called after each message exchange
   * Decides if micro-evaluation is needed
   */
  async onMessageExchange(exchange: MessageExchange): Promise<void>;

  /**
   * Force immediate evaluation (e.g., on hint usage)
   */
  async forceEvaluation(): Promise<void>;

  /**
   * Fast final synthesis using pre-computed data
   */
  async synthesizeFinalReport(): Promise<EvaluationReport>;

  /**
   * Get current running scores (for UI)
   */
  getRunningScores(): DimensionScores;

  /**
   * Get observations (for debugging/display)
   */
  getObservations(): Observation[];
}
```

## Benefits

1. **No More Timeouts**: Small, focused API calls
2. **Rich Context Preserved**: Observations capture key insights
3. **Fast Final Evaluation**: ~2-3 seconds (synthesis only)
4. **Real-Time Feedback**: Could show live score updates
5. **Scalable**: Works for 5-minute or 60-minute interviews
6. **Resilient**: Partial evaluation if some calls fail

## Migration Path

1. Implement ProgressiveEvaluator alongside current system
2. Feature flag to switch between approaches
3. A/B test quality of evaluations
4. Deprecate old approach once validated

## Future Enhancements

1. **Live Score Display**: Show running scores during interview
2. **Interviewer Hints**: AI interviewer sees scores, adjusts difficulty
3. **Adaptive Difficulty**: If candidate struggling, offer easier hints
4. **Export Observations**: Detailed breakdown for review
