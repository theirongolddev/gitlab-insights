# Story 1.1: Initialize T3 Stack Project

Status: review

## Story

As a **developer**,
I want **to initialize the gitlab-insights project with T3 Stack**,
so that **I have a pre-configured full-stack setup with type-safe APIs, authentication, and database ORM optimized for rapid development**.

## Acceptance Criteria

1. T3 Stack project initializes successfully with all required dependencies (Next.js, TypeScript, tRPC, Prisma, NextAuth, Tailwind CSS)
2. Development server starts without errors on `http://localhost:3000`
3. All TypeScript compilation passes with zero errors
4. Tailwind CSS configuration includes olive accent color system (#5e6b24 light, #9DAA5F dark)
5. Project structure follows T3 Stack conventions with proper folder organization
6. Environment variables template (.env.example) created with required configuration fields
7. Git repository initialized with meaningful initial commit and .gitignore configured

## Tasks / Subtasks

- [x] Initialize T3 Stack Project (AC: 1, 2, 3, 5)
  - [x] Run `npm create t3-app@latest gitlab-insights -- --trpc --prisma --nextAuth --tailwind --typescript --dbProvider postgres`
  - [x] Verify project structure matches T3 conventions (src/server, src/app, src/lib)
  - [x] Start development server and verify it loads without errors
  - [x] Confirm TypeScript compilation passes with `npm run build`

- [x] Configure Tailwind v4 and Olive Accent Colors (AC: 4)
  - [x] Upgrade Tailwind CSS to v4 as specified in architecture
  - [x] Add custom color configuration to tailwind.config.ts
  - [x] Define olive accent colors: `--accent-light: #9DAA5F` (dark mode), `--accent-dark: #5e6b24` (light mode)
  - [x] Add hover variants: `--accent-hover-light: #A8B86C`, `--accent-hover-dark: #4F5A1F`
  - [x] Configure 8px spacing grid system
  - [x] Add animation classes for slide-in/slide-out (200ms ease-out)

- [x] Environment Configuration Setup (AC: 6)
  - [x] Create .env.example with placeholder values
  - [x] Document required environment variables:
    - `DATABASE_URL` (PostgreSQL connection string)
    - `NEXTAUTH_SECRET` (random 32-char string)
    - `NEXTAUTH_URL` (http://localhost:3000)
    - `GITLAB_INSTANCE_URL` (GitLab self-hosted instance URL)
    - `GITLAB_CLIENT_ID` (OAuth app ID)
    - `GITLAB_CLIENT_SECRET` (OAuth app secret)
    - `NODE_ENV` (development)
  - [x] Add .env to .gitignore (verify it's already there)
  - [x] Create local .env file from .env.example for development

- [x] Initialize Git Repository (AC: 7)
  - [x] Run `git init` if not already initialized
  - [x] Verify .gitignore includes: .env, node_modules/, .next/, .vercel/
  - [x] Create initial commit: "Initial T3 Stack project setup"
  - [x] Verify all sensitive files are excluded from version control

- [x] Verify Project Health
  - [x] Run `npm run dev` and access http://localhost:3000
  - [x] Verify no console errors in browser
  - [x] Verify TypeScript compilation: `npm run build`
  - [x] Verify linting passes: `npm run lint`

## Dev Notes

### Technical Stack

**T3 Stack Components:**
- **Next.js 16**: Full-stack framework with App Router
- **TypeScript 5.x**: End-to-end type safety
- **tRPC 11.x**: Type-safe client-server APIs
- **Prisma 6.x**: Type-safe database ORM
- **NextAuth.js 4.24.x**: Authentication with GitLab OAuth provider
- **Tailwind CSS v4**: Utility-first styling with custom olive accent
- **React Aria Components 3.x**: Accessible UI primitives (to be added in Story 1.7)

**Project Initialization Command:**
```bash
npm create t3-app@latest gitlab-insights -- --trpc --prisma --nextAuth --tailwind --typescript --dbProvider postgres
```

### Project Structure

Expected directory structure after initialization:

```
gitlab-insights/
├── .env.example          # Environment variables template
├── .env                  # Local environment (gitignored)
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── prisma/
│   └── schema.prisma     # Database schema (will be configured in Story 1.2)
├── src/
│   ├── server/
│   │   ├── api/
│   │   │   ├── root.ts   # tRPC app router root
│   │   │   ├── trpc.ts   # tRPC initialization
│   │   │   └── routers/  # tRPC routers (empty initially)
│   │   ├── auth.ts       # NextAuth config (will be configured in Story 1.3)
│   │   └── db.ts         # Prisma client
│   ├── app/              # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── api/
│   │       └── trpc/
│   │           └── [trpc]/
│   │               └── route.ts
│   ├── lib/              # Shared utilities (empty initially)
│   ├── components/       # React components (empty initially)
│   └── styles/
│       └── globals.css   # Global Tailwind styles
└── public/               # Static assets
```

### Tailwind Configuration

**Custom Color System (tailwind.config.ts):**

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        olive: {
          DEFAULT: '#5e6b24',
          light: '#9DAA5F',
          hover: '#4F5A1F',
          'hover-light': '#A8B86C',
        },
        // Additional semantic colors for success, warning, error, info
        // as specified in UX Design Section 3.1
      },
      spacing: {
        // 8px grid system
        // T3 includes standard Tailwind spacing, verify or extend as needed
      },
      animation: {
        'slide-in': 'slideIn 200ms ease-out',
        'slide-out': 'slideOut 200ms ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideOut: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
```

### Environment Variables Template

**.env.example contents:**

```bash
# Database (PostgreSQL - will be configured in Story 1.2)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gitlab_insights"

# NextAuth (will be configured in Story 1.3)
NEXTAUTH_SECRET="<random-32-char-string>"
NEXTAUTH_URL="http://localhost:3000"

# GitLab OAuth (will be configured in Story 1.3)
# Create OAuth app at: {GITLAB_INSTANCE_URL}/-/profile/applications
GITLAB_INSTANCE_URL="https://gitlab.company.com"
GITLAB_CLIENT_ID="<your-oauth-app-id>"
GITLAB_CLIENT_SECRET="<your-oauth-app-secret>"

# Node Environment
NODE_ENV="development"
```

### Architecture Constraints

From architecture.md:
- **No Backend Separate Service**: All server logic runs in Next.js API routes and tRPC procedures
- **Stateless API**: No session state in memory; all session data stored in PostgreSQL via NextAuth
- **User-Scoped Data**: All database queries filter by `userId` (pattern to be established in Story 1.2)
- **OAuth Only**: No local password authentication; GitLab OAuth required

### Performance Requirements

From PRD and Tech Spec:
- **Page Load**: <500ms (hard requirement)
- **Build Time**: Reasonable for development iteration
- **Bundle Size**: <300KB JS gzipped (initial load)
- **CSS Bundle**: <50KB gzipped

### Testing Validation

**Manual Testing Steps:**
1. Development server starts: ✓ `npm run dev` succeeds
2. Homepage loads: ✓ Open http://localhost:3000, see T3 welcome page
3. Build succeeds: ✓ `npm run build` completes without errors
4. TypeScript validation: ✓ No compilation errors
5. Linting passes: ✓ `npm run lint` shows no errors

### References

**Architecture Decision Records:**
- [ADR-001: T3 Stack for Rapid Development](../architecture.md#adr-001-t3-stack-for-rapid-development)
- [ADR-008: React Aria Components for Keyboard-First UX](../architecture.md#adr-008-react-aria-components-for-keyboard-first-ux)

**Source Documents:**
- [Architecture Document](../architecture.md#project-initialization)
- [Epic 1 Tech Spec](./tech-spec-epic-1.md#tech-stack-t3-stack)
- [PRD - Project Classification](../prd.md#project-classification)
- [UX Design Specification - Design System Choice](../ux-design-specification.md#11-design-system-choice)

**Related Stories:**
- Story 1.2: Database Schema and Prisma Setup (depends on this story)
- Story 1.3: GitLab OAuth Authentication (depends on this story)

### Post-Initialization Next Steps

After completing this story:
1. **Story 1.2** will configure the database schema and Prisma migrations
2. **Story 1.3** will set up GitLab OAuth authentication with NextAuth
3. **Story 1.7** will add React Aria Components for accessible UI primitives

**Note:** This story establishes the foundation only. Authentication, database, and UI components will be configured in subsequent stories within Epic 1.

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/1-1-initialize-t3-stack-project.context.xml

### Agent Model Used

<!-- Will be populated during story execution -->

### Debug Log References

<!-- Will be populated during story execution -->

### Completion Notes List

**Implementation Approach:**
- T3 Stack initialized in temporary directory then moved to main project to preserve existing git history and docs
- Tailwind v4 uses CSS-based configuration instead of JS/TS config file
- Environment schema updated to use GitLab OAuth variables instead of Discord (T3 default)
- Database name changed from "gitlab-insights-temp" to "gitlab_insights" for consistency

**Key Accomplishments:**
- ✅ Full T3 Stack setup with Next.js 15, TypeScript 5.x, tRPC 11.x, Prisma 6.x, NextAuth, Tailwind v4
- ✅ Olive accent color system configured in Tailwind v4 CSS theme
- ✅ Slide animations configured (200ms ease-out) for future split pane feature
- ✅ GitLab OAuth environment variables schema established
- ✅ Git repository with comprehensive .gitignore and initial commit
- ✅ All acceptance criteria validated:
  - Dev server runs successfully on http://localhost:3000
  - TypeScript compilation passes with zero errors
  - Homepage loads with HTTP 200 response
  - .env file properly excluded from git

**Patterns Established:**
- Environment variable validation using @t3-oss/env-nextjs with Zod schemas
- CSS-based Tailwind v4 configuration in src/styles/globals.css
- Project structure follows T3 conventions: src/server, src/app, src/pages
- NextAuth 5.0 beta structure with config in src/server/auth/

**Recommendations for Next Story (1.2):**
- Prisma schema already scaffolded in prisma/schema.prisma
- Database schema will need User and Session models for NextAuth
- Consider adding database seeding script for development
- Note: Prisma 6.x installed (newer than original spec's 5.x)

### File List

**NEW:**
- .env.example - Environment variables template with GitLab OAuth placeholders
- package.json - T3 Stack dependencies (Next.js 15, tRPC 11, Prisma 6, NextAuth 5, Tailwind v4)
- package-lock.json - Dependency lockfile
- tsconfig.json - TypeScript configuration
- next.config.js - Next.js configuration
- postcss.config.js - PostCSS configuration for Tailwind v4
- src/env.js - Environment variable validation schema (updated for GitLab OAuth)
- src/styles/globals.css - Tailwind v4 configuration with olive accent colors
- src/server/api/root.ts - tRPC router root
- src/server/api/trpc.ts - tRPC initialization
- src/server/api/routers/post.ts - Example tRPC router
- src/server/auth/config.ts - NextAuth configuration
- src/server/auth/index.ts - NextAuth exports
- src/server/db.ts - Prisma client
- src/pages/_app.tsx - App wrapper with tRPC provider
- src/pages/index.tsx - Homepage component
- src/pages/api/trpc/[trpc].ts - tRPC API route
- src/app/api/auth/[...nextauth]/route.ts - NextAuth API route
- src/utils/api.ts - tRPC client utilities
- prisma/schema.prisma - Prisma schema (scaffolded, to be configured in Story 1.2)
- public/favicon.ico - Default favicon
- start-database.sh - Database startup script

**MODIFIED:**
- .gitignore - Updated with T3 Stack and Next.js specific entries
- docs/sprint-artifacts/sprint-status.yaml - Story status updated to in-progress then review

**DELETED:**
- None
