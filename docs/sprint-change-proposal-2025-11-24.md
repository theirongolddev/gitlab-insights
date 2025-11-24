# Sprint Change Proposal: Technology Stack Upgrade

**Date:** 2025-11-24
**Project:** gitlab-insights
**Epic:** Epic 1 - Walking Skeleton
**Trigger Story:** Story 1.4 - Project Selection Onboarding
**Status:** Implementation Complete, Documentation Sync Required
**Author:** Correct Course Workflow

---

## Executive Summary

During Story 1.4 implementation, the development team upgraded the technology stack from originally documented versions to latest stable releases. This was driven by compatibility issues between NextAuth 5.0-beta and Next.js 16, with the official NextAuth project recommending migration to BetterAuth for Next.js 16+ support.

**Key Changes:**
- Next.js 15 → 16.0.4
- React 19 → 19.2.0
- Prisma 5.x → 6.6.0
- NextAuth 5.0-beta → BetterAuth 1.4.1

**Impact:** Stories 1.1-1.4 successfully implemented with new stack. Documentation (Architecture, Tech Spec, Epic Breakdown) requires updates to align with actual implementation.

**Recommendation:** Direct documentation synchronization (~3-4 hours effort, low risk, no code changes needed).

---

## Section 1: Issue Summary

### Problem Statement

During Story 1.4 implementation (Project Selection Onboarding), the development team upgraded the technology stack from the originally documented versions to the latest stable releases. This was driven by compatibility issues between NextAuth 5.0-beta and Next.js 16, with the official NextAuth project recommending migration to BetterAuth for Next.js 16+ support.

**Changes Implemented:**
1. **Next.js 15 → 16.0.4**: Latest stable release
2. **React 19 → 19.2.0**: Patch release with bug fixes
3. **Prisma 5.x → 6.6.0**: Major version with enhanced type safety
4. **NextAuth 5.0-beta → BetterAuth 1.4.1**: Stable, officially recommended auth library for Next.js 16+

### Discovery Context

- **When**: During Story 1.3 (GitLab OAuth Authentication) implementation
- **What**: NextAuth 5.0-beta compatibility issues with Next.js 16 blocked OAuth flow
- **Investigation**: Team found official NextAuth recommendation to use BetterAuth
- **Decision**: Implemented with BetterAuth immediately rather than document technical debt
- **Result**: Stories 1.1-1.4 completed successfully with new stack (all marked "done" or "review")

### Impact

All completed stories (1.1-1.4) now use the upgraded stack, while documentation (Architecture, Epic Tech Spec, Story Breakdown) still references the old versions. This creates a documentation-implementation mismatch that will cause confusion for Stories 1.5-1.7 and future epics.

**Evidence from package.json:**
```json
"next": "^16.0.4"           // Documented: 15
"react": "^19.2.0"          // Documented: 19
"@prisma/client": "^6.6.0"  // Documented: 5.x
"prisma": "^6.6.0"          // Documented: 5.x
"better-auth": "^1.4.1"     // Documented: NextAuth 4.24.x
```

---

## Section 2: Impact Analysis

### 2.1 Epic Impact Assessment

**Epic 1: Walking Skeleton**
- **Status**: ✅ Can complete as planned
- **Modifications Required**:
  - Tech Spec requires major updates (auth patterns, data models, versions)
  - Stories 1.5-1.7 context files need BetterAuth patterns (not yet created)
  - Acceptance Criteria AC-3 needs NextAuth → BetterAuth terminology update
- **No Scope Change**: Epic goals and capabilities remain unchanged

**Future Epics (2-7)**
- **Impact**: Low to Medium
- **Action**: Update auth references when epics are contexted (no immediate action needed)
- Epics 2, 3, 6, 7 reference "session" patterns - update during contexting phase

### 2.2 Artifact Conflict Analysis

| Artifact | Severity | Required Changes | Priority |
|----------|----------|------------------|----------|
| **architecture.md** | HIGH | 8 major sections: Tech stack, Decision summary, Project init, Integration points, Data models, APIs, Component interactions, ADRs | HIGH |
| **tech-spec-epic-1.md** | HIGH | 6 major sections: Tech stack, Authentication service, Data models, APIs, AC-3, Dependencies | HIGH |
| **epic-1-walking-skeleton-story-breakdown.md** | MEDIUM | 5 references across Stories 1.1-1.3: T3 command, schema notes, NextAuth config, env variables | MEDIUM |
| **Story files 1-1 to 1-4** | MEDIUM | Dev notes sections documenting actual implementation | MEDIUM |
| **prd.md** | NONE | ✅ No changes needed (technology-agnostic) | N/A |

**Why Changes Are Needed:**
- **Documentation drift**: Docs say NextAuth, code uses BetterAuth
- **Developer confusion**: Future story implementers will follow outdated patterns
- **Context accuracy**: Story context generation will reference wrong libraries
- **Knowledge preservation**: Accurate history of technical decisions

### 2.3 PRD and MVP Impact

**PRD Impact:** ✅ **NONE**
- PRD is technology-agnostic
- All functional requirements (FR78, FR80, FR82-83) fulfilled by BetterAuth
- Authentication library is implementation detail, not user-facing feature

**MVP Impact:** ✅ **NONE**
- MVP scope completely unaffected
- All capabilities delivered as planned
- Performance targets achievable with new stack

---

## Section 3: Recommended Approach

### Selected Path: Direct Adjustment (Documentation Synchronization)

**Justification:**

**1. Implementation Effort**
- Documentation updates: ~3-4 hours
- No code changes required (implementation already complete)
- No testing required (stories 1.1-1.4 already validated)

**2. Technical Risk: LOW**
- Changes are descriptive, not prescriptive
- Implementation already proven working in 4 completed stories
- BetterAuth + Next.js 16 is officially recommended path

**3. Impact on Team Morale and Momentum: POSITIVE**
- Validates proactive technical decision-making
- Demonstrates responsiveness to ecosystem changes
- Avoids technical debt accumulation
- Team continues forward without disruption

**4. Long-term Sustainability**
- Eliminates beta dependency (NextAuth 5.0-beta is unstable)
- Aligns with official recommendations (NextAuth team → BetterAuth)
- Uses latest stable releases (Next.js 16, Prisma 6)
- Reduces future migration burden

**5. Stakeholder Expectations**
- **User-facing**: Zero impact (authentication flow identical)
- **Developer**: Better experience with stable, well-documented libraries
- **Business**: Same MVP timeline, reduced technical debt

### Alternatives Considered

**Option 2: Rollback to NextAuth**
- ❌ Rejected: Reintroduces compatibility issues
- ❌ Higher effort (4-6 hours code changes + testing)
- ❌ Higher risk (regression in working stories)
- ❌ Goes against official recommendations

**Option 3: PRD MVP Review**
- ❌ Not needed: MVP scope unaffected
- ✅ All functional requirements met with new stack
- ✅ Performance targets achievable

---

## Section 4: Detailed Change Proposals

### Change Proposal 1: architecture.md - Tech Stack Section

**Location:** Lines 87-110

**OLD:**
```markdown
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript 5.x
- **Database**: PostgreSQL with Prisma 5.x ORM
- **Authentication**: NextAuth.js 4.24.x with GitLab OAuth provider
```

**NEW:**
```markdown
- **Frontend**: Next.js 16.0.4 (App Router), React 19.2.0, TypeScript 5.8.2
- **Database**: PostgreSQL with Prisma 6.6.0 ORM
- **Authentication**: BetterAuth 1.4.1 with GitLab OAuth provider
```

---

### Change Proposal 2: architecture.md - Executive Summary

**Location:** Lines 1-11

**OLD:**
```markdown
gitlab-insights is built using the T3 Stack (Next.js + TypeScript + tRPC + Prisma + NextAuth + Tailwind)
```

**NEW:**
```markdown
gitlab-insights is built using the T3 Stack (Next.js 16 + TypeScript + tRPC + Prisma 6 + BetterAuth + Tailwind v4)
```

---

### Change Proposal 3: architecture.md - Project Initialization

**Location:** Lines 14-27

**OLD:**
```bash
npm create t3-app@latest gitlab-insights -- --trpc --prisma --nextAuth --tailwind --typescript --dbProvider postgres
```

**NEW:**
```bash
npm create t3-app@latest gitlab-insights -- --trpc --prisma --tailwind --typescript --dbProvider postgres
```

**Note Added:**
```markdown
**Note:** The project was initialized without the `--nextAuth` flag. BetterAuth was installed separately after T3 Stack initialization:

```bash
npm install better-auth
```
```

---

### Change Proposal 4: architecture.md - Decision Summary Table

**Location:** Lines 112-134

**NEW ROW ADDED:**
```markdown
| **Authentication Library** | BetterAuth 1.4.1 (not NextAuth) | User Management (FR78-82) | NextAuth 5.0-beta has compatibility issues with Next.js 16. Official NextAuth team recommends BetterAuth for Next.js 16+ projects. BetterAuth provides stable, production-ready OAuth with GitLab provider support. Simpler API, better TypeScript support, actively maintained. | Decision |
```

---

### Change Proposal 5: architecture.md - Add New ADR-012

**Location:** After ADR-011 (around line 1020)

**NEW ADR:**
```markdown
### ADR-012: BetterAuth for Next.js 16 Compatibility

**Decision:** Use BetterAuth 1.4.1 instead of NextAuth for authentication

**Context:**
During Story 1.3 (GitLab OAuth Authentication) implementation, NextAuth 5.0.0-beta exhibited compatibility issues with Next.js 16.0.4. The NextAuth team officially recommends migrating to BetterAuth for Next.js 16+ projects, as NextAuth v5 remains in beta with no stable release timeline.

**Rationale:**
- **Stability**: BetterAuth is production-ready (v1.4.1 stable), NextAuth v5 is beta
- **Next.js 16 Support**: BetterAuth designed specifically for Next.js 15+ with full App Router support
- **Official Recommendation**: NextAuth maintainers explicitly recommend BetterAuth for new projects
- **Better DX**: Simpler API surface, improved TypeScript inference, clearer documentation
- **Active Maintenance**: Regular releases, responsive maintainers, growing ecosystem
- **Feature Parity**: Supports GitLab OAuth provider with same capabilities as NextAuth

**Consequences:**
- **Pro**: Eliminates beta dependency, improves stability
- **Pro**: Future-proof decision aligned with ecosystem direction
- **Pro**: Better TypeScript support reduces type errors
- **Pro**: Simpler mental model (fewer abstractions than NextAuth)
- **Con**: Smaller community compared to NextAuth (mitigated by official recommendation)
- **Con**: Documentation references NextAuth in T3 Stack guides (easily adapted)

**Implementation Details:**
- Configuration: `src/lib/auth.ts` (BetterAuth convention, not `src/server/auth.ts`)
- Environment Variables: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (not `NEXTAUTH_*`)
- Database Schema: BetterAuth uses similar User/Account/Session tables with minor differences
- Session Management: BetterAuth provides equivalent session handling with simpler API

**Status:** Accepted (2025-11-24)

**Related Decisions:** ADR-001 (T3 Stack), ADR-011 (Phased MVP)
```

---

### Change Proposal 6-8: architecture.md - Component Interactions & Integration Points

**Multiple Locations**

**Changes:**
- Component flow diagram: NextAuth → BetterAuth
- Services table: `src/server/auth.ts` → `src/lib/auth.ts`, Owner: NextAuth.js → BetterAuth
- Integration points: "NextAuth → Prisma" → "BetterAuth → Prisma"

---

### Change Proposal 9: tech-spec-epic-1.md - Tech Stack Section

**Location:** Lines 47-56

**NEW NOTE ADDED:**
```markdown
**Note:** The project uses BetterAuth instead of NextAuth due to Next.js 16 compatibility. See ADR-012 in Architecture document for rationale.
```

**Version Updates:**
- Next.js 15 → 16.0.4
- React 19 → 19.2.0
- Prisma 5.x → 6.6.0
- NextAuth → BetterAuth 1.4.1

---

### Change Proposal 10: tech-spec-epic-1.md - Data Models

**Location:** Lines 96-193

**NEW NOTE ADDED:**
```markdown
**Note:** This schema uses BetterAuth (not NextAuth). The User, Account, and Session models are compatible with BetterAuth's requirements. Actual implementation may have minor field differences - refer to the project's `prisma/schema.prisma` for authoritative schema.
```

---

### Change Proposal 11-12: tech-spec-epic-1.md - Environment Variables & AC-3

**Environment Variables:**
- NEXTAUTH_SECRET → BETTER_AUTH_SECRET
- NEXTAUTH_URL → BETTER_AUTH_URL

**AC-3 Updates:**
- Added BETTER_AUTH_* to env variable list
- Added "(via BetterAuth)" clarifications in OAuth flow steps

---

### Change Proposal 13-15: epic-1-walking-skeleton-story-breakdown.md

**Story 1.1:**
- Removed `--nextAuth` flag from T3 command
- Added note about BetterAuth separate installation
- Added "Actual Implementation" section with real versions

**Story 1.2:**
- "(NextAuth)" → "(BetterAuth compatible)"
- Added schema compatibility note

**Story 1.3:**
- Config file: `src/server/auth.ts` → `src/lib/auth.ts`
- Env variables: NEXTAUTH_* → BETTER_AUTH_*
- Added implementation note referencing ADR-012

---

### Change Proposal 16: Story Files - Implementation Notes

**Stories 1.1 and 1.3 - Add implementation notes:**

```markdown
## Implementation Stack (Actual)

**Versions Used:**
- Next.js 16.0.4, React 19.2.0, TypeScript 5.8.2
- Prisma 6.6.0, tRPC 11.0.0, Tailwind CSS 4.0.15
- BetterAuth 1.4.1 (not NextAuth)

**Rationale:** NextAuth 5.0-beta has compatibility issues with Next.js 16; official recommendation is BetterAuth. See ADR-012 in Architecture document for full rationale.
```

---

## Section 5: Implementation Handoff

### Change Scope Classification

**Scope:** MINOR (documentation sync only, no code changes)
**Complexity:** LOW (straightforward find-replace with context awareness)
**Risk:** LOW (implementation already validated)

### Responsible Roles

**Development Team (Primary)**
- **Execute documentation updates**
- Tasks:
  - Update architecture.md (8 sections)
  - Update tech-spec-epic-1.md (6 sections)
  - Update epic-1-story-breakdown.md (5 references)
  - Add implementation notes to completed stories
  - Create ADR-012
  - Generate accurate context for Stories 1.5-1.7

**Product Owner / Scrum Master (Review)**
- **Validate documentation accuracy**
- Tasks:
  - Review updated docs for clarity
  - Verify no PRD conflicts introduced
  - Approve Story 1.4 with updated context
  - Confirm Stories 1.5-1.7 ready for dev with correct context

**No Escalation Needed:**
- Changes don't affect MVP scope or timeline
- No architectural rework required
- No PM/Architect involvement needed

### Implementation Plan

**Phase 1: High-Priority Documentation Sync** (Stories 1.5-1.7 blockers)
1. Update **architecture.md** - Tech stack versions, auth patterns, ADRs (2 hours)
2. Update **tech-spec-epic-1.md** - Auth service, data models, APIs (1 hour)
3. Generate story context for Stories 1.5-1.7 with correct BetterAuth patterns (30 min)

**Phase 2: Medium-Priority Documentation Cleanup** (Pre-Epic 2)
4. Update **epic-1-walking-skeleton-story-breakdown.md** - Story 1.1-1.3 references (15 min)
5. Add Dev Notes to completed stories 1.1-1.4 documenting actual implementation (30 min)

**Phase 3: Future Epic Preparation** (During Epic 2+ Contexting)
6. Update Epic 2-7 references to auth patterns as epics are contexted
7. Update README/setup docs with BetterAuth configuration steps

**Total Effort Estimate:** 3-4 hours

### Success Criteria

**Documentation Complete When:**
- ✅ All version numbers match package.json
- ✅ All NextAuth references replaced with BetterAuth (where applicable)
- ✅ ADR-012 created and linked from relevant sections
- ✅ Environment variables updated throughout
- ✅ Stories 1.5-1.7 can proceed with accurate context
- ✅ No confusion for future epic contexting

**Validation:**
- Run grep for "NextAuth" and "Next.js 15" across docs - should find only historical references
- Verify Story 1.5 context generation uses BetterAuth patterns
- Review with team that documentation now matches implementation

---

## Section 6: Workflow Completion Summary

### Change Trigger

- **Story**: 1.4 - Project Selection Onboarding
- **Issue Type**: Technical limitation discovered during implementation
- **Problem**: NextAuth 5.0-beta compatibility issues with Next.js 16

### Change Scope

- **Classification**: Minor (documentation sync)
- **Artifacts Modified**: 4 major documents
- **Code Changes**: None (implementation complete)
- **Routing**: Development team for direct implementation

### Deliverables

1. ✅ Sprint Change Proposal document (this document)
2. ✅ 16 specific edit proposals with before/after
3. ✅ Implementation handoff plan with phases
4. ✅ ADR-012 content ready for insertion

### Next Steps for Implementation Team

1. **Review this proposal** - Validate all changes make sense
2. **Execute Phase 1** - High-priority updates (Stories 1.5-1.7 blockers)
3. **Generate Story 1.5-1.7 contexts** - Use updated documentation
4. **Execute Phase 2** - Medium-priority cleanup
5. **Mark Story 1.4 as done** - Move to next story with confidence

---

## Appendix: Full File List

**Files Requiring Updates:**

1. `/docs/architecture.md` - 8 sections
2. `/docs/sprint-artifacts/tech-spec-epic-1.md` - 6 sections
3. `/docs/epics/epic-1-walking-skeleton-story-breakdown.md` - 3 stories
4. `/docs/sprint-artifacts/1-1-initialize-t3-stack-project.md` - Add implementation notes
5. `/docs/sprint-artifacts/1-3-gitlab-oauth-authentication.md` - Add auth library notes

**Files NOT Requiring Updates:**

- `/docs/prd.md` - Technology-agnostic ✅
- Epic 2-7 files - Update during future contexting
- Story 1-2, 1-4 files - Optional minor updates only

---

**End of Sprint Change Proposal**

✅ Correct Course workflow complete!

**Generated:** 2025-11-24
**Workflow:** BMad Method - Correct Course (Sprint Change Management)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
