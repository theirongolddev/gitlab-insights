# GitLab Insights Skills

This directory contains Claude Code skills that enforce code quality standards and best practices for the GitLab Insights project.

## Team-Shared Skills

Skills are stored in `docs/skills/` (tracked in version control) and symlinked to `.claude/skills/` and `.opencode/skills/` for tool integration. This ensures the entire team follows the same standards.

## Available Skills

### 1. gitlab-insights-code-standards.md
**Comprehensive code quality standards for the entire stack.**

**Covers:**
- Semantic color tokens in Tailwind (CRITICAL)
- TypeScript type safety and strict mode
- Component patterns (client/server boundaries)
- tRPC + React Query data fetching
- Performance optimization (memoization, lazy loading)
- File organization and import conventions
- Error handling (client + server)
- Testing standards with Vitest
- Security patterns (input validation, authentication)

**Key Highlights:**
- ✅ Always use semantic colors (`bg-primary`, `text-success`) instead of hardcoded hex values
- ✅ Strict TypeScript with no `any` types
- ✅ Client components named with `*Client.tsx` suffix
- ✅ All tRPC inputs validated with Zod schemas
- ✅ Optimistic updates with rollback logic
- ✅ Dark mode support for all styled elements
- ✅ Proper error handling and user feedback

### 2. react-19-patterns.md
**React 19-specific patterns and best practices.**

**Covers:**
- Controlled vs semi-controlled components
- Derived state with useMemo
- useEffectEvent for stable callbacks
- Common ESLint violations and fixes
- Performance patterns (debouncing, memoization)

## Setup for New Team Members

If you just cloned the repository:

```bash
# Create symlinks (run from project root)
mkdir -p .claude/skills .opencode/skills

# Symlink to shared skills
ln -sf ../../docs/skills/*.md .claude/skills/
ln -sf ../../docs/skills/*.md .opencode/skills/
```

This connects your local Claude Code configuration to the team's shared skills.

## How to Use

### In Claude Code
When Claude Code processes files in this project, it will automatically reference these skills to enforce standards.

### Manual Reference
You can explicitly ask Claude to follow a skill:
```
Follow the gitlab-insights-code-standards skill when refactoring this component
```

### Code Review
Use these skills as checklists during code review:
```
Review this PR against the gitlab-insights-code-standards checklist
```

## Integration with Development

### Claude Code / VS Code
Skills are automatically loaded from `.claude/skills/` (which symlinks to this directory).

### Git Hooks
Consider adding a pre-commit hook that reminds developers to check against skill standards:
```bash
# .git/hooks/pre-commit
echo "Remember to follow gitlab-insights-code-standards:"
echo "  - Use semantic colors (primary, success, warning, error)"
echo "  - No 'any' types"
echo "  - Add dark mode variants"
```

### Directory Structure
```
docs/skills/                          # SOURCE OF TRUTH (tracked in git)
├── gitlab-insights-code-standards.md
├── react-19-patterns.md
└── README.md

.claude/skills/                       # Symlinks (gitignored)
├── gitlab-insights-code-standards.md -> ../../docs/skills/...
├── react-19-patterns.md -> ../../docs/skills/...
└── README.md -> ../../docs/skills/...

.opencode/skills/                     # Symlinks (gitignored)
├── gitlab-insights-code-standards.md -> ../../docs/skills/...
├── react-19-patterns.md -> ../../docs/skills/...
└── README.md -> ../../docs/skills/...
```

## Maintaining Skills

### When to Update
- New architectural patterns emerge
- Team discovers common mistakes
- New libraries/frameworks added to stack
- ESLint rules change

### How to Update
1. Edit the relevant `.md` file in `docs/skills/` (source of truth)
2. Add examples of correct and incorrect patterns
3. Update the "Tags" section for searchability
4. Commit changes - symlinks automatically reflect updates
5. Team members get updated skills on next git pull

## Skill Priority

When multiple skills apply, follow this priority:
1. **gitlab-insights-code-standards** - Project-specific standards
2. **react-19-patterns** - React-specific patterns
3. Global Claude Code best practices

## Quick Reference

**Most Critical Rules:**
1. Semantic colors only (no hex in className)
2. TypeScript strict mode (no any)
3. Client components need "use client"
4. tRPC inputs need Zod validation
5. Optimistic updates need rollback
6. All queries need loading/error states
7. Dark mode variants required
8. Memoize list item components

## Contributing

To add a new skill:
1. Create `skill-name.md` in `docs/skills/`
2. Follow the structure of existing skills:
   - Description
   - When to use
   - Instructions (with ✅ correct and ❌ wrong examples)
   - Examples
   - Related skills
   - Tags
3. Update this README with the new skill
4. Create symlinks if needed:
   ```bash
   ln -sf ../../docs/skills/skill-name.md .claude/skills/
   ln -sf ../../docs/skills/skill-name.md .opencode/skills/
   ```
5. Commit to version control - team gets it automatically

## Related Documentation
- `/docs/architecture.md` - System architecture
- `/docs/development.md` - Development workflow
- `.eslintrc.js` - ESLint configuration
- `tsconfig.json` - TypeScript configuration
