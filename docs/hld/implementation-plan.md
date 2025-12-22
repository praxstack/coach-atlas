# Coach Atlas - Implementation Plan

**Document Version**: 1.0
**Date**: 2024-12-22
**Status**: Active
**Estimated Duration**: 6 Weeks

---

## Executive Summary

This document outlines the detailed implementation plan for Coach Atlas, transforming the current prototype into a production-ready AI interview mentor application. The plan is structured in 6 phases, each with specific deliverables, acceptance criteria, and dependencies.

---

## Current State Analysis

### What Exists ✅
- Basic React/TypeScript project structure
- Landing page with Hero, Features, ModeShowcase sections
- Settings page with provider/model selection
- Basic chat page with API integration (no streaming)
- 40+ shadcn/ui components installed
- Dark theme implemented
- React Router navigation

### What's Missing ❌
- Markdown rendering in chat
- Streaming responses
- Chat persistence
- Error boundaries
- Interview/Tutorial modes
- WebView compatibility layer
- Testing infrastructure
- Accessibility implementation

---

## Phase 1: Foundation (Days 1-5)

### Objectives
- Establish proper project infrastructure
- Fix TypeScript configuration
- Add error handling boundaries
- Set up testing framework

### Tasks

#### 1.1 Project Infrastructure
| Task | Priority | Est. Hours | Owner |
|------|----------|------------|-------|
| Install missing npm dependencies | P0 | 1 | Dev |
| Fix TypeScript strict mode | P0 | 4 | Dev |
| Set up Vitest configuration | P0 | 2 | Dev |
| Add Husky + lint-staged | P1 | 1 | Dev |
| Create .env.example | P1 | 0.5 | Dev |
| Update index.html metadata | P2 | 0.5 | Dev |

#### 1.2 Error Handling
| Task | Priority | Est. Hours | Owner |
|------|----------|------------|-------|
| Create ErrorBoundary component | P0 | 2 | Dev |
| Add route-level error boundaries | P0 | 1 | Dev |
| Create error types/utilities | P1 | 2 | Dev |
| Add fallback UI components | P1 | 2 | Dev |

#### 1.3 Loading States
| Task | Priority | Est. Hours | Owner |
|------|----------|------------|-------|
| Create LoadingSkeleton component | P0 | 2 | Dev |
| Add skeleton to Chat page | P0 | 1 | Dev |
| Add skeleton to Settings page | P1 | 1 | Dev |

### Deliverables
- [ ] All npm dependencies installed
- [ ] TypeScript strict mode enabled with no errors
- [ ] Vitest configured and running
- [ ] ErrorBoundary wrapping all routes
- [ ] Loading skeletons in place

### Acceptance Criteria
- `npm run dev` works without errors
- `npm run build` produces optimized bundle
- `npm run test` runs (empty test suite OK)
- Application catches render errors gracefully
- Loading states visible during data fetch

---

## Phase 2: Core Chat Enhancement (Days 6-12)

### Objectives
- Implement markdown rendering
- Add streaming responses
- Add chat persistence
- Improve message UX

### Tasks

#### 2.1 Markdown Rendering
| Task | Priority | Est. Hours | Owner |
|------|----------|------------|-------|
| Install marked, dompurify, prismjs | P0 | 0.5 | Dev |
| Create MarkdownRenderer component | P0 | 4 | Dev |
| Create CodeBlock component | P0 | 3 | Dev |
| Add syntax highlighting (20+ langs) | P0 | 2 | Dev |
| Create copy button for code blocks | P1 | 2 | Dev |
| Style markdown output (Tailwind) | P0 | 3 | Dev |

#### 2.2 Streaming Responses
| Task | Priority | Est. Hours | Owner |
|------|----------|------------|-------|
| Implement OpenAI streaming | P0 | 4 | Dev |
| Implement Anthropic streaming | P0 | 4 | Dev |
| Implement Google streaming | P1 | 4 | Dev |
| Create useStreaming hook | P0 | 3 | Dev |
| Progressive markdown rendering | P1 | 4 | Dev |
| Streaming cursor animation | P2 | 1 | Dev |

#### 2.3 Chat Persistence
| Task | Priority | Est. Hours | Owner |
|------|----------|------------|-------|
| Create storage utility (localStorage) | P0 | 2 | Dev |
| Save messages on send/receive | P0 | 2 | Dev |
| Restore messages on page load | P0 | 2 | Dev |
| Add clear conversation button | P1 | 1 | Dev |
| Handle storage quota errors | P1 | 2 | Dev |

#### 2.4 Message UX
| Task | Priority | Est. Hours | Owner |
|------|----------|------------|-------|
| Copy entire message button | P1 | 1 | Dev |
| Regenerate response button | P2 | 2 | Dev |
| Message timestamps | P2 | 1 | Dev |
| Scroll behavior improvements | P1 | 2 | Dev |

### Deliverables
- [ ] Markdown renders correctly in messages
- [ ] Code blocks highlighted with Prism
- [ ] Responses stream in real-time
- [ ] Chat survives page refresh
- [ ] Copy functionality works

### Acceptance Criteria
- Code blocks have syntax highlighting
- First token appears < 3 seconds
- Chat history loads on refresh
- No XSS vulnerabilities (DOMPurify working)
- Copy button copies correct content

---

## Phase 3: Advanced Rendering (Days 13-19)

### Objectives
- Add Mermaid diagram support
- Add KaTeX math support
- Integrate Markdown Viewer Pro themes

### Tasks

#### 3.1 Mermaid Diagrams
| Task | Priority | Est. Hours | Owner |
|------|----------|------------|-------|
| Install mermaid package | P1 | 0.5 | Dev |
| Create MermaidDiagram component | P1 | 4 | Dev |
| Add lazy loading for mermaid | P1 | 2 | Dev |
| Handle mermaid errors gracefully | P1 | 2 | Dev |
| Add diagram zoom/pan (mobile) | P2 | 3 | Dev |

#### 3.2 Math Rendering
| Task | Priority | Est. Hours | Owner |
|------|----------|------------|-------|
| Install katex package | P2 | 0.5 | Dev |
| Create MathBlock component | P2 | 3 | Dev |
| Support inline and block math | P2 | 2 | Dev |
| Style math output | P2 | 1 | Dev |

#### 3.3 Theme Integration
| Task | Priority | Est. Hours | Owner |
|------|----------|------------|-------|
| Port themes from Markdown Viewer Pro | P2 | 4 | Dev |
| Create theme switcher component | P3 | 3 | Dev |
| Persist theme preference | P3 | 1 | Dev |
| Create Nebula dark theme variant | P2 | 2 | Dev |

### Deliverables
- [ ] Mermaid diagrams render in chat
- [ ] Math formulas render correctly
- [ ] At least 3 themes available
- [ ] Theme persists across sessions

### Acceptance Criteria
- System design diagrams render (flowchart, sequence)
- LaTeX math displays correctly
- Themes switch without reload
- No performance degradation with complex diagrams

---

## Phase 4: Modes & Features (Days 20-26)

### Objectives
- Implement Interview Coach mode
- Implement Tutorial Creator mode
- Add export functionality

### Tasks

#### 4.1 Interview Mode
| Task | Priority | Est. Hours | Owner |
|------|----------|------------|-------|
| Create mode toggle UI | P1 | 2 | Dev |
| Adjust system prompt for mode | P1 | 2 | Dev |
| Create hint escalation logic | P1 | 4 | Dev |
| Add timer component (optional) | P3 | 3 | Dev |
| Create post-problem summary | P2 | 3 | Dev |

#### 4.2 Tutorial Mode
| Task | Priority | Est. Hours | Owner |
|------|----------|------------|-------|
| Detect TUTORIAL: prefix | P1 | 1 | Dev |
| Create TutorialView component | P1 | 4 | Dev |
| Generate Table of Contents | P2 | 3 | Dev |
| Create full-screen view (Zen mode) | P2 | 3 | Dev |
| Style tutorial output | P1 | 2 | Dev |

#### 4.3 Export Functionality
| Task | Priority | Est. Hours | Owner |
|------|----------|------------|-------|
| Export to Markdown file | P2 | 3 | Dev |
| Export to HTML (styled) | P3 | 4 | Dev |
| Copy as Markdown | P2 | 1 | Dev |
| Share button (native) | P2 | 2 | Dev |

### Deliverables
- [ ] Interview mode toggleable
- [ ] Tutorial mode auto-detected
- [ ] Export to MD works
- [ ] Full-screen tutorial view

### Acceptance Criteria
- Mode switch changes AI behavior
- Tutorials have clear structure
- Exported MD is valid
- Full-screen mode is distraction-free

---

## Phase 5: WebView & Polish (Days 27-32)

### Objectives
- Ensure WebView compatibility
- Add native bridge
- Accessibility audit
- Performance optimization

### Tasks

#### 5.1 WebView Compatibility
| Task | Priority | Est. Hours | Owner |
|------|----------|------------|-------|
| Test in iOS WKWebView | P1 | 4 | Dev |
| Test in Android WebView | P1 | 4 | Dev |
| Fix any CORS issues | P0 | 2 | Dev |
| Handle safe area insets | P1 | 2 | Dev |
| Add viewport meta tags | P1 | 1 | Dev |

#### 5.2 Native Bridge
| Task | Priority | Est. Hours | Owner |
|------|----------|------------|-------|
| Create WebViewBridge utility | P1 | 3 | Dev |
| Implement share function | P1 | 2 | Dev |
| Implement clipboard function | P1 | 1 | Dev |
| Add bridge detection | P1 | 1 | Dev |
| Document bridge API | P1 | 2 | Dev |

#### 5.3 Accessibility
| Task | Priority | Est. Hours | Owner |
|------|----------|------------|-------|
| Run Lighthouse accessibility audit | P1 | 1 | Dev |
| Add ARIA labels | P1 | 3 | Dev |
| Ensure keyboard navigation | P1 | 3 | Dev |
| Add focus indicators | P1 | 2 | Dev |
| Test with screen reader | P1 | 2 | Dev |

#### 5.4 Performance
| Task | Priority | Est. Hours | Owner |
|------|----------|------------|-------|
| Add code splitting | P1 | 3 | Dev |
| Lazy load Mermaid/KaTeX | P1 | 2 | Dev |
| Optimize bundle size | P1 | 3 | Dev |
| Add performance monitoring | P2 | 2 | Dev |
| Lighthouse performance audit | P1 | 2 | Dev |

### Deliverables
- [ ] Works in iOS WebView
- [ ] Works in Android WebView
- [ ] Native share functional
- [ ] WCAG 2.1 AA compliance
- [ ] Lighthouse Performance > 90

### Acceptance Criteria
- No functional differences in WebView
- Share sheet appears on button press
- Keyboard-only navigation possible
- Color contrast passes WCAG AA
- Bundle < 500KB gzipped

---

## Phase 6: Testing & Launch (Days 33-40)

### Objectives
- Achieve 85%+ test coverage
- Complete documentation
- Deploy to production

### Tasks

#### 6.1 Unit Testing
| Task | Priority | Est. Hours | Owner |
|------|----------|------------|-------|
| Test MarkdownRenderer | P1 | 3 | Dev |
| Test CodeBlock | P1 | 2 | Dev |
| Test useStreaming hook | P1 | 3 | Dev |
| Test storage utilities | P1 | 2 | Dev |
| Test provider implementations | P1 | 4 | Dev |

#### 6.2 Integration Testing
| Task | Priority | Est. Hours | Owner |
|------|----------|------------|-------|
| Test chat flow end-to-end | P1 | 4 | Dev |
| Test settings persistence | P1 | 2 | Dev |
| Test error handling | P1 | 3 | Dev |
| Test WebView bridge | P1 | 3 | Dev |

#### 6.3 E2E Testing
| Task | Priority | Est. Hours | Owner |
|------|----------|------------|-------|
| Set up Cypress | P1 | 2 | Dev |
| Test critical user journeys | P1 | 4 | Dev |
| Test on mobile viewport | P1 | 2 | Dev |
| Visual regression tests | P2 | 3 | Dev |

#### 6.4 Documentation
| Task | Priority | Est. Hours | Owner |
|------|----------|------------|-------|
| Update README | P1 | 2 | Dev |
| Create user guide | P2 | 4 | Dev |
| Document WebView integration | P1 | 3 | Dev |
| API reference for bridge | P1 | 2 | Dev |

#### 6.5 Deployment
| Task | Priority | Est. Hours | Owner |
|------|----------|------------|-------|
| Set up Vercel project | P0 | 1 | Dev |
| Configure domain | P1 | 1 | Dev |
| Set up CI/CD pipeline | P1 | 3 | Dev |
| Production deployment | P0 | 1 | Dev |
| Monitoring setup | P2 | 2 | Dev |

### Deliverables
- [ ] 85%+ test coverage
- [ ] All E2E tests passing
- [ ] Documentation complete
- [ ] Production deployment live
- [ ] CI/CD pipeline operational

### Acceptance Criteria
- All tests pass in CI
- No critical/high bugs
- Documentation reviewed
- Production site accessible
- Monitoring showing metrics

---

## Risk Mitigation

### Technical Risks

| Risk | Mitigation | Contingency |
|------|------------|-------------|
| Mermaid bundle size | Lazy load, dynamic import | Render as image server-side |
| Streaming compatibility | Test all providers early | Fallback to non-streaming |
| WebView bugs | Test on real devices | Document limitations |
| localStorage limits | Check quota, rotate data | IndexedDB migration |

### Schedule Risks

| Risk | Mitigation | Contingency |
|------|------------|-------------|
| TypeScript migration slow | Start early, parallel work | Accept `any` in edge cases |
| Testing delays | Write tests alongside features | Reduce coverage target |
| Integration issues | Daily integration builds | Isolate problematic code |

---

## Dependencies

### External Dependencies
- AI Provider APIs (OpenAI, Anthropic, Google)
- npm packages (marked, prismjs, mermaid, katex)
- Vercel deployment platform

### Internal Dependencies
```
Phase 1 → Phase 2 (Foundation needed for chat)
Phase 2 → Phase 3 (Markdown needed for diagrams)
Phase 3 → Phase 4 (Rendering needed for modes)
Phase 4 → Phase 5 (Features needed for polish)
Phase 5 → Phase 6 (Polish needed for testing)
```

---

## Resource Requirements

### Development
- 1 Full-stack Developer (primary)
- Access to all AI provider APIs for testing
- iOS and Android devices for WebView testing

### Infrastructure
- Vercel account (deployment)
- GitHub repository (source control)
- npm registry access

### Budget
- AI API costs for testing: ~$50
- Vercel Pro (if needed): $20/month
- Total: < $100 for MVP

---

## Success Criteria

### MVP Success
- [ ] All P0 requirements implemented
- [ ] No critical bugs
- [ ] Works in Chrome, Safari, Firefox
- [ ] Works in iOS/Android WebView
- [ ] Documentation complete

### Launch Success
- [ ] 85%+ test coverage
- [ ] Lighthouse scores > 90
- [ ] Zero known security vulnerabilities
- [ ] User feedback incorporated

---

## Appendix: File Creation Order

```bash
# Phase 1
src/components/layout/ErrorBoundary.tsx
src/components/layout/LoadingSkeleton.tsx
src/types/errors.ts
src/lib/errors.ts

# Phase 2
src/lib/markdown/parser.ts
src/lib/markdown/sanitizer.ts
src/components/markdown/MarkdownRenderer.tsx
src/components/markdown/CodeBlock.tsx
src/hooks/useStreaming.ts
src/lib/storage.ts
src/hooks/usePersistence.ts

# Phase 3
src/components/markdown/MermaidDiagram.tsx
src/components/markdown/MathBlock.tsx
src/styles/markdown-themes/*.css

# Phase 4
src/components/chat/ModeToggle.tsx
src/components/tutorial/TutorialView.tsx
src/components/tutorial/TableOfContents.tsx
src/components/tutorial/TutorialExport.tsx
src/pages/Tutorial.tsx

# Phase 5
src/hooks/useWebViewBridge.ts
src/lib/webview.ts
src/types/webview.ts

# Phase 6
src/__tests__/**/*.test.ts
cypress/e2e/**/*.cy.ts
docs/user-guide.md
docs/webview-integration.md
```

---

**Document History**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-22 | Cline | Initial creation |
