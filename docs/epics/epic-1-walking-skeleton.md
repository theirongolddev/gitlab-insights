# Epic 1: Walking Skeleton
**Timeline:** Week 1 (3-5 days)

**Goal:** Prove end-to-end technical stack works with minimal but complete user flow

**Value Statement:** Users can see a working filtered GitLab feed with hardcoded query, validating core hypothesis

**Scope:**
- T3 Stack initialization (Next.js 16 + TypeScript + tRPC + Prisma 6 + BetterAuth + Tailwind v4)
- GitLab OAuth authentication
- Project scoping onboarding (select projects to monitor)
- Basic API polling (manual refresh only, no background job)
- Hardcoded query: `label:security`
- 2-line table view (Issues/MRs/Comments sections)
- Click through to GitLab
- Basic layout with React Aria Components foundation

**FRs Covered:** FR78 (GitLab OAuth), FR82-83 (Project selection), FR1-3 (Basic API polling), FR27-28 (Basic dashboard), FR13 (Click through)

**Rationale:** Walking skeleton proves full stack works and delivers demo-able product in 3-5 days. Validates technical decisions early. Establishes foundation for rapid iteration.

---
