# Coach Atlas - Project Brief

## Executive Summary

Coach Atlas is an AI-powered technical interview mentor and comprehensive tutorial creator. The platform combines guided discovery teaching with brutally honest feedback to build problem solvers, not solution memorizers.

## Core Mission

**"Build real problem solvers through guided discovery and honest feedback."**

Transform how engineers prepare for technical interviews by providing:
1. Socratic method-based interview coaching
2. Production-ready tutorial generation
3. Real-time AI conversation with formatted markdown display
4. Multi-provider AI support (BYOK model)

## Strategic Objectives

### Primary Goals
1. **Interview Excellence** - Help engineers ace coding, system design, and behavioral interviews
2. **Deep Understanding** - Teach concepts through guided discovery, not rote memorization
3. **Production Readiness** - All code and examples are job-ready, not academic abstractions
4. **Honest Assessment** - Provide brutally honest skill gap analysis with realistic timelines

### Secondary Goals
1. **Multi-Platform Access** - Web, WebView (mobile integration), standalone desktop
2. **Provider Flexibility** - Support multiple AI providers without vendor lock-in
3. **Beautiful Content Display** - Rich markdown rendering with syntax highlighting, diagrams, and math
4. **Tutorial Export** - Generate shareable, professional tutorials

## Acceptance Criteria for "Done"

### MVP Completion Criteria
- [ ] Fully functional chat with all 4 AI providers (OpenAI, Anthropic, Google, Bedrock)
- [ ] Markdown rendering with syntax highlighting in chat
- [ ] Mermaid diagram support for system design
- [ ] Tutorial mode with structured output
- [ ] Interview mode with guided discovery flow
- [ ] Settings persistence and validation
- [ ] Responsive design for all screen sizes
- [ ] WebView-compatible for mobile app integration
- [ ] Error handling with graceful degradation
- [ ] Loading states and optimistic UI

### Production Criteria
- [ ] Test coverage ≥ 85%
- [ ] Lighthouse performance score ≥ 90
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Security audit passed (no exposed secrets, XSS protection)
- [ ] Zero known bugs in critical paths
- [ ] Documentation complete (user guide, API docs, architecture)

## Project Scope

### In Scope
1. Chat interface with AI providers
2. Markdown content rendering (via Markdown Viewer Pro integration)
3. Interview coaching mode
4. Tutorial creation mode
5. Settings/configuration management
6. Local storage persistence
7. WebView compatibility layer
8. Export functionality (tutorials)

### Out of Scope (Future Phases)
1. User authentication/accounts
2. Cloud sync of conversations
3. Team/enterprise features
4. Custom AI model fine-tuning
5. Voice/audio interactions
6. Native mobile apps (using WebView instead)

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Chat Response Time | < 3s perceived | First token to render |
| Tutorial Generation | < 30s | Complete structured output |
| User Session Duration | > 15 min | Analytics |
| Error Rate | < 0.1% | Error logging |
| Mobile WebView Compat | 100% | Cross-device testing |

## Non-Functional Requirements

### Performance
- Initial load: < 2s on 3G
- Chat response streaming: immediate (first token)
- Markdown render: < 100ms
- Bundle size: < 500KB gzipped

### Security
- API keys stored locally only (never transmitted to backend)
- Direct client-to-provider communication
- CSP headers configured
- No sensitive data in URL parameters

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatible
- High contrast mode support

### Scalability
- Stateless architecture (client-side only)
- CDN-deployable static assets
- No backend scaling concerns (BYOK model)

## Key Stakeholders

- **Primary Users**: Software engineers preparing for technical interviews
- **Secondary Users**: Educators, bootcamp instructors, self-learners
- **Technical Owner**: Development team
- **Product Owner**: PrakharMNNIT

## Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1: Foundation | 1 week | Memory bank, BRD, architecture |
| Phase 2: Core Chat | 1 week | All providers, markdown rendering |
| Phase 3: Modes | 1 week | Interview + Tutorial modes |
| Phase 4: Polish | 1 week | Testing, accessibility, optimization |
| Phase 5: WebView | 3 days | Mobile integration, export |

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-22 | Cline | Initial creation |
