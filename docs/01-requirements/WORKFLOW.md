# Project Workflow - Coach Atlas

## Overview

This document defines the development workflow for Coach Atlas. It ensures consistency, quality, and maintainability across all contributions.

---

## Development Cycle

```
┌─────────────────────────────────────────────────────────────────┐
│                      Development Cycle                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Plan → Implement → Test → Review → Commit → Deploy            │
│     ↑                                               │           │
│     └───────────── Iterate ─────────────────────────┘           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Task Management

### Task Definition
Every task should include:
1. **Clear objective** - What needs to be accomplished
2. **Acceptance criteria** - How we know it's done
3. **Scope boundaries** - What's in/out of scope
4. **Dependencies** - What needs to exist first

### Task Tracking
```markdown
## Task: [Task Name]

**Status:** Not Started | In Progress | Review | Complete
**Priority:** Critical | High | Medium | Low

### Objective
[Clear description of what needs to be done]

### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

### Notes
[Any relevant context or decisions]
```

---

## Code Quality Standards

### Test Coverage Targets

| Category | Minimum Coverage |
|----------|------------------|
| **Overall** | ≥ 70% |
| **Services** | ≥ 90% |
| **Utilities** | ≥ 95% |
| **Components** | ≥ 60% |

### Required Before Commit
- [ ] Code compiles without errors (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] Existing tests pass (`npm run test`)
- [ ] New code has appropriate tests
- [ ] No TypeScript `any` types without justification

### Code Review Checklist
- [ ] Follows code style guides (TypeScript, React, Tailwind)
- [ ] No obvious bugs or edge cases missed
- [ ] Performance considerations addressed
- [ ] Accessibility requirements met
- [ ] Error handling is comprehensive
- [ ] Documentation updated if needed

---

## Git Workflow

### Branch Strategy (Trunk-Based)

```
main ────────────────────────────────────────────────────►
       │               │                │
       └──feature-x────┘                │
                       └──fix-y─────────┘
```

**Note:** For this project, we typically commit directly to `main` for rapid iteration. Feature branches are optional for larger changes.

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
| Type | When to Use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style (formatting, semicolons) |
| `refactor` | Code change that doesn't fix bug or add feature |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Build process, dependencies, etc. |

**Emoji Prefixes (Optional):**
```
✨ feat:     New feature
🐛 fix:      Bug fix
📝 docs:     Documentation
💄 style:    Styling/formatting
♻️ refactor: Code refactoring
⚡ perf:     Performance
✅ test:     Tests
🔧 chore:    Maintenance
🔒 security: Security fix
```

### Commit After Every Task
- Each logical task = one commit
- Commit message describes what was accomplished
- Build must pass before committing
- Include task summary in commit body for complex changes

---

## Continuous Integration

### Pre-Commit Checks
```bash
# Before every commit
npm run build    # Must pass
npm run lint     # Must pass
npm run test     # Must pass
```

### Build Pipeline (Vercel)
- Auto-deploy on push to `main`
- Preview deploys for pull requests
- Build must succeed before deploy

---

## Documentation Requirements

### When to Document

| Change Type | Documentation Required |
|-------------|------------------------|
| New feature | Feature spec + README update |
| API change | Type definitions + JSDoc |
| Architecture change | ARD (Architecture Decision Record) |
| Bug fix | Inline comments if non-obvious |
| Performance optimization | Before/after metrics |

### Documentation Location

```
docs/
├── 01-requirements/    # Product specs, guidelines
├── 02-architecture/    # ARDs, system design
├── 03-database/        # Data models, schemas
├── 04-ui-ux/          # Design specs, mockups
├── 05-implementation/ # How-to guides
├── 06-security/       # Security considerations
├── 07-validation/     # Test plans, QA
├── 08-deployment/     # Deploy guides, runbooks
└── 09-temp/           # WIP, scratch files
```

---

## Memory Bank Updates

### When to Update Memory Bank

Update memory bank files when:
- Major architectural decisions are made
- New patterns or conventions are introduced
- Significant milestones are reached
- Critical bugs are discovered or resolved
- Project scope changes

### Memory Bank Files

| File | Purpose | Update Frequency |
|------|---------|------------------|
| `projectbrief.md` | Core mission, goals | Rarely (scope changes) |
| `productContext.md` | User needs, UX goals | On feature changes |
| `systemPatterns.md` | Architecture, patterns | On design changes |
| `techContext.md` | Tech stack, tools | On dependency changes |
| `activeContext.md` | Current work focus | Every session |
| `progress.md` | Milestones, history | On major completions |

---

## Release Process

### Version Numbering (Semantic Versioning)

```
MAJOR.MINOR.PATCH

MAJOR: Breaking changes
MINOR: New features (backward compatible)
PATCH: Bug fixes (backward compatible)
```

### Release Checklist
- [ ] All tests pass
- [ ] Build succeeds
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] Version bumped in package.json
- [ ] Tagged in git
- [ ] Deployed successfully

---

## Security Practices

### API Key Handling
- Never commit API keys
- Keys stored in browser localStorage only
- Keys never sent to any server except the LLM provider
- Validate key format before storage

### Dependency Security
- Regular `npm audit` checks
- Update dependencies for security patches
- Pin major versions, allow patch updates

### Code Security
- Sanitize all user input (DOMPurify for markdown)
- No `eval()` or `innerHTML` with untrusted content
- Validate all external data

---

## Performance Guidelines

### Bundle Size Monitoring
- Check bundle size after adding dependencies
- Lazy load heavy features (Mermaid, KaTeX)
- Target < 1MB gzipped total

### Runtime Performance
- Profile before optimizing
- Use React DevTools Profiler
- Avoid unnecessary re-renders
- Memoize expensive computations

---

## Communication

### Progress Updates
- Update `activeContext.md` at session start/end
- Commit messages serve as progress log
- Use task progress lists in tools

### Issue Reporting
- Include reproduction steps
- Include expected vs actual behavior
- Include environment details
- Include relevant console logs/errors

---

## Quick Reference

### Common Commands
```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run lint             # Run linter
npm run test             # Run tests
npm run test -- --coverage  # Run tests with coverage

# Git
git add -A && git commit -m "type: message"
git push origin main
```

### Key Files to Know
```
src/
├── app/                 # App shell, routing, context
├── features/            # Feature modules
├── services/            # Business logic, API adapters
├── shared/              # Reusable components, hooks
└── lib/                 # Utilities, third-party wrappers
