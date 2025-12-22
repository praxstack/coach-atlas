# Product Guide - Coach Atlas

## Product Vision

Coach Atlas is an **AI-powered technical interview coaching platform** that helps software engineers prepare for technical interviews through guided discovery, Socratic questioning, and honest feedback. Unlike human coaches ($100-500/hour), it provides **24/7 personalized coaching** using your own LLM API key (BYOK - Bring Your Own Key).

> **"Your AI technical mentor that builds problem solvers through guided discovery and brutally honest feedback."**

## The Problem We Solve

Software engineers preparing for technical interviews face critical challenges:

1. **Memorization Over Understanding** - Most resources focus on memorizing solutions rather than building problem-solving skills
2. **No Real Feedback** - Self-study provides no honest assessment of skill gaps
3. **Fragmented Resources** - Interview prep is scattered across LeetCode, YouTube, blogs, and books
4. **Expensive Coaching** - Human interview coaches cost $100-500/hour
5. **No Guided Learning Path** - Random problem solving without structured progression

## Target Audience

### Primary: "Anxious Alex"
- **Role**: Software Engineer (2-5 years experience)
- **Goal**: Land a job at FAANG/top-tier tech company
- **Pain**: Failed interviews due to poor problem-solving approach, not lack of knowledge
- **Behavior**: Studies 2-3 hours daily, feels stuck on hard problems
- **Needs**: Guided approach that builds confidence and skill simultaneously

### Secondary: "Teaching Taylor"
- **Role**: Bootcamp Instructor / University TA
- **Goal**: Create high-quality learning materials efficiently
- **Needs**: Fast tutorial generation with modern, correct code

### Tertiary: "Self-Learner Sam"
- **Role**: Career Changer / Student
- **Goal**: Learn technical concepts deeply without expensive courses
- **Needs**: Patient AI mentor who adapts to their level

## Core Value Proposition

| For Interview Candidates | For Educators |
|--------------------------|---------------|
| Personalized coaching at any time, any topic | Create tutorials with minimal effort |
| Build real problem-solving skills, not memorization | Get production-ready code examples instantly |
| Honest assessment with specific improvement paths | Generate visual aids (diagrams, flowcharts) |
| Practice system design with visual diagrams | Export content for student distribution |
| Generate study materials tailored to your gaps | |

## Key Features

### 1. **AI Chat Mode**
- Interactive conversation with AI mentor
- Guided Socratic questioning (leads to discovery, not answers)
- Beautiful markdown rendering (code, math, diagrams)
- Conversation history persisted locally

### 2. **Interview Practice Mode**
- Timed mock interview sessions
- AI generates DSA/algorithm problems based on difficulty
- Socratic interviewer persona (hints escalate from subtle to direct)
- **Progressive Real-Time Evaluation** - AI evaluates in background during interview
- Detailed post-interview evaluation with actionable feedback

### 3. **Tutorial Generation**
- Generate structured tutorials with concept → examples → practice → interview tips
- Progressive complexity (Beginner → Intermediate → Advanced)
- Mermaid diagrams for visual learning
- Exportable as markdown

### 4. **System Design Practice**
- Requirements gathering → Capacity estimation → API design → Architecture
- Visual diagrams auto-generated
- Trade-offs and scaling considerations discussed

## Brand Identity & Tone

Coach Atlas maintains three core pillars:

| Pillar | Description |
|--------|-------------|
| **Honest & Direct** | Brutally honest feedback - constructive but never falsely encouraging |
| **Guided Discovery** | Socratic method - questions lead to understanding, not spoon-fed answers |
| **Always Available** | 24/7 coaching whenever you need it, at your own pace |

## Technical Model

```
┌─────────────────────────────────────────────────────────────┐
│                     Coach Atlas                              │
├─────────────────────────────────────────────────────────────┤
│  BYOK (Bring Your Own Key)                                  │
│  ├─ OpenAI (GPT-4, GPT-3.5)                                 │
│  ├─ Anthropic (Claude 3.5, 3 Opus, Sonnet, Haiku)           │
│  ├─ Google (Gemini Pro, Gemini Flash)                       │
│  └─ AWS Bedrock (Claude via Bearer Token)                   │
├─────────────────────────────────────────────────────────────┤
│  Client-Side Only                                           │
│  ├─ No backend servers                                      │
│  ├─ API keys stay in your browser (localStorage)            │
│  └─ Conversations stored locally (IndexedDB)                │
├─────────────────────────────────────────────────────────────┤
│  WebView Ready                                              │
│  └─ Can be embedded in mobile apps without app store        │
└─────────────────────────────────────────────────────────────┘
```

## User Experience Principles

1. **Immediate Value** - First AI response provides actionable insight
2. **Beautiful Rendering** - Code syntax highlighting, Mermaid diagrams, KaTeX math
3. **Guided Flow** - Questions lead user to discovery, not direct answers
4. **Responsive** - Works on mobile, tablet, and desktop
5. **Persistent** - Conversations saved locally, resumable anytime

## Privacy & Ethics

| Principle | Implementation |
|-----------|----------------|
| **No Data Collection** | No telemetry, no analytics that identify users |
| **Keys Never Leave Browser** | API keys stored in localStorage only |
| **AI Transparency** | AI clearly identifies as AI, not human coach |
| **Honest Limitations** | Acknowledges AI can make mistakes, no guarantees |
| **Free Access** | BYOK model means no paywalled features |

## Differentiation

| Competitor | Their Strength | Their Weakness | Coach Atlas Edge |
|------------|----------------|----------------|------------------|
| ChatGPT | General purpose | No interview focus | Specialized prompts, guided discovery |
| LeetCode Premium | Problem library | No coaching | Personalized AI guidance |
| Pramp | Peer practice | Human availability | Available 24/7, consistent quality |
| InterviewCake | Structured content | Static, not adaptive | Dynamic, conversational AI |
| Human Coaches | Deep expertise | $100-500/hour | Free (you pay LLM directly) |
