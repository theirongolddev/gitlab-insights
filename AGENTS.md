# Agent Development Guide

## Build/Lint/Test Commands
- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run typecheck` - Type check without emit
- `npm run lint` - Run ESLint
- No test suite configured - verify changes manually via dev server

## Code Style
- **TypeScript**: Strict mode enabled, `noUncheckedIndexedAccess: true`, use explicit types
- **Imports**: Use `~/` path alias for src imports (e.g., `~/server/api/trpc`)
- **Components**: React functional components, use `"use client"` directive for client components
- **Formatting**: Use double quotes, semicolons, 2-space indent
- **Error Handling**: Use TRPCError for API errors, logger.error() for logging, throw descriptive messages
- **Naming**: camelCase for variables/functions, PascalCase for components/types, lowercase with hyphens for files

## Development Principles (from .claude/CLAUDE.md)
- Avoid writing new code when possible - leverage existing code/workflows
- Refactor repeated code when it doesn't change functionality
- Minimize comments - only explain WHAT, not HOW (code documents itself)
- Ask clarifying questions before implementing
