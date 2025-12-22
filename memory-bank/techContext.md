# Coach Atlas - Technical Context

## Technology Stack

### Core Technologies

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Build Tool | Vite | 5.4.19 | Fast dev server, HMR, bundling |
| Framework | React | 18.3.1 | UI component library |
| Language | TypeScript | 5.8.3 | Type safety |
| Styling | Tailwind CSS | 3.4.17 | Utility-first CSS |
| UI Library | shadcn/ui | Latest | Pre-built accessible components |
| Routing | React Router | 6.30.1 | Client-side routing |
| State | TanStack Query | 5.83.0 | Server state management |

### Dependencies Analysis

#### Production Dependencies (Critical)
```json
{
  "@tanstack/react-query": "^5.83.0",  // ✅ Latest, well-maintained
  "react": "^18.3.1",                   // ✅ Current stable
  "react-router-dom": "^6.30.1",        // ✅ Latest v6
  "lucide-react": "^0.462.0",           // ✅ Icon library
  "sonner": "^1.7.4",                   // ✅ Toast notifications
  "class-variance-authority": "^0.7.1", // ✅ Variant management
  "clsx": "^2.1.1",                     // ✅ Class merging
  "tailwind-merge": "^2.6.0"            // ✅ Tailwind class merging
}
```

#### Radix UI Components (40+ components)
```json
{
  "@radix-ui/react-dialog": "^1.1.14",
  "@radix-ui/react-dropdown-menu": "^2.1.15",
  "@radix-ui/react-popover": "^1.1.14",
  "@radix-ui/react-tabs": "^1.1.12",
  "@radix-ui/react-toast": "^1.2.14",
  "@radix-ui/react-tooltip": "^1.2.7"
  // ... and 30+ more
}
```

#### Missing Dependencies (TO ADD)
```json
{
  "marked": "^12.0.0",           // Markdown parsing
  "dompurify": "^3.0.0",         // XSS protection
  "prismjs": "^1.29.0",          // Syntax highlighting
  "mermaid": "^10.0.0",          // Diagram rendering
  "katex": "^0.16.0",            // Math rendering
  "react-markdown": "^9.0.0"     // Alternative: React Markdown
}
```

### Development Dependencies

```json
{
  "@vitejs/plugin-react-swc": "^3.11.0",  // ✅ Fast React compilation
  "typescript": "^5.8.3",                  // ✅ Latest TS
  "eslint": "^9.32.0",                     // ✅ Linting
  "autoprefixer": "^10.4.21",              // ✅ CSS prefixes
  "postcss": "^8.5.6",                     // ✅ CSS processing
  "tailwindcss": "^3.4.17"                 // ✅ Styling
}
```

#### Missing Dev Dependencies (TO ADD)
```json
{
  "vitest": "^1.0.0",           // Unit testing
  "@testing-library/react": "^14.0.0",  // Component testing
  "@testing-library/jest-dom": "^6.0.0",
  "cypress": "^13.0.0",         // E2E testing
  "@types/dompurify": "^3.0.0",
  "@types/prismjs": "^1.26.0"
}
```

## Build Configuration

### Vite Configuration (Current)
```typescript
// vite.config.ts
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
```

### Recommended Vite Enhancements
```typescript
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    cors: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'markdown': ['marked', 'prismjs', 'mermaid'],
        }
      }
    },
    sourcemap: mode === 'development',
  },
  plugins: [
    react(),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
```

### TypeScript Configuration

#### Current Issues
```json
// tsconfig.json - PROBLEMATIC settings
{
  "noImplicitAny": false,        // ⚠️ Should be true
  "noUnusedParameters": false,   // ⚠️ Should be true
  "noUnusedLocals": false,       // ⚠️ Should be true
  "strictNullChecks": false      // ⚠️ Should be true
}
```

#### Recommended Fix
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "strictNullChecks": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

## Environment Configuration

### Current State
- No `.env` file structure
- No environment variable handling
- Hardcoded API endpoints

### Recommended Structure
```
.env.example          # Template for required vars
.env.local            # Local development (gitignored)
.env.production       # Production values (gitignored)
```

```bash
# .env.example
VITE_APP_NAME=Coach Atlas
VITE_APP_VERSION=$npm_package_version
VITE_ENABLE_ANALYTICS=false
VITE_SENTRY_DSN=
```

## Testing Strategy

### Current State
- **No tests exist** ❌
- No test configuration
- No CI/CD pipeline

### Recommended Setup

#### Unit Testing (Vitest)
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      threshold: {
        global: { lines: 85, branches: 85, functions: 85 }
      }
    }
  }
})
```

#### E2E Testing (Cypress)
```typescript
// cypress.config.ts
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8080',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}'
  }
})
```

## CI/CD Configuration

### GitHub Actions (Recommended)
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

## Deployment Architecture

### Static Hosting Options
1. **Vercel** - Zero config, automatic HTTPS
2. **Netlify** - Similar features
3. **GitHub Pages** - Free, simple
4. **Cloudflare Pages** - Edge network

### WebView Deployment
```
Build static assets → Host on CDN → Load in WebView
                                         ↓
                              Native App Container
                              (React Native, Flutter, etc.)
```

## Observability

### Logging Strategy
```typescript
// src/lib/logger.ts
const logger = {
  info: (msg: string, data?: object) => {
    console.log(`[INFO] ${msg}`, data);
    // Future: Send to monitoring service
  },
  error: (msg: string, error?: Error) => {
    console.error(`[ERROR] ${msg}`, error);
    // Future: Send to error tracking (Sentry)
  },
  debug: (msg: string, data?: object) => {
    if (import.meta.env.DEV) {
      console.debug(`[DEBUG] ${msg}`, data);
    }
  }
};
```

### Performance Monitoring
- Web Vitals tracking
- Bundle size monitoring
- API response time tracking

## Security Tools

### Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  connect-src 'self' https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com;
  img-src 'self' data: blob:;
">
```

### Dependency Auditing
```bash
npm audit              # Check for vulnerabilities
npm audit fix          # Auto-fix where possible
npx depcheck           # Find unused dependencies
```

## Development Tooling

### Current Setup
- ESLint 9.x with flat config
- No Prettier configured
- No pre-commit hooks

### Recommended Additions
```json
// package.json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "prepare": "husky install",
    "pre-commit": "lint-staged"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

## Performance Profiling

### Tools
- React DevTools Profiler
- Chrome DevTools Performance tab
- Lighthouse CI
- Bundle analyzer (`npx vite-bundle-visualizer`)

### Key Metrics Targets
| Metric | Target |
|--------|--------|
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |
| TTI | < 3.5s |
| Bundle Size | < 500KB gzip |
