# GitLab Insights Intelligence Platform - Epics & Stories

**Created:** 2025-12-11
**Source:** Design Thinking Session (2025-12-10)
**Status:** Planning Complete

---

## Overview

Transform GitLab data into an actionable intelligence platform with 5 views into a unified query engine. Each epic is **feature/UI complete** when closed (testable in app), with **2-4 hour story chunks**.

### Architecture

```
┌─────────────────────────────────────────┐
│     "Related Things" Query Engine       │
│  (given X, find weighted connections)   │
└─────────────────┬───────────────────────┘
                  │
    ┌─────┬───────┼───────┬───────┐
    ▼     ▼       ▼       ▼       ▼
 Expert Decision Territory Activity Email
  View    View    View     View   Digest
```

### Success Criteria

- 5+ high-value interventions per week
- Colleagues asking "How did you know about that?"
- 200+ hours cumulative time saved by Week 16
- Organic demand emerges (3-5 unsolicited access requests)

---

## Data Model Reference

### Core Entities

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   PERSON    │     │    FILE     │     │   BRANCH    │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ gitlab_id   │     │ path        │     │ name        │
│ username    │     │ project_id  │     │ project_id  │
│ name        │     │ directory   │     │ is_default  │
│ email       │     │ extension   │     │ is_protected│
└─────────────┘     │ module*     │     └─────────────┘
                    └─────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   ISSUE     │     │  MERGE_REQ  │     │   COMMIT    │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ iid         │     │ iid         │     │ sha         │
│ title       │     │ title       │     │ message     │
│ description │     │ description │     │ authored_at │
│ state       │     │ state       │     │ files[]     │
│ labels      │     │ source_branch│    └─────────────┘
│ created_at  │     │ target_branch│
│ updated_at  │     │ created_at  │     ┌─────────────┐
└─────────────┘     │ merged_at   │     │  COMMENT    │
                    └─────────────┘     ├─────────────┤
                                        │ id          │
                                        │ body        │
                                        │ noteable_id │
                                        │ noteable_type│
                                        │ created_at  │
                                        └─────────────┘
```

### Connection Types (Edges)

```
PERSON ──commits──► COMMIT ──touches──► FILE
   │                   │
   │                   ├──belongs_to──► MERGE_REQ
   │                   └──on_branch──► BRANCH
   │
   ├──authors──► ISSUE
   ├──authors──► MERGE_REQ
   ├──comments_on──► ISSUE / MERGE_REQ
   ├──reviews──► MERGE_REQ
   └──assigned_to──► ISSUE / MERGE_REQ

ISSUE ──relates_to──► ISSUE (linked issues)
ISSUE ──closed_by──► MERGE_REQ
ISSUE ──mentioned_in──► MERGE_REQ (referenced in MR description/comments)

MERGE_REQ ──touches──► FILE (from diff)
MERGE_REQ ──closes──► ISSUE (explicit closes/fixes #)
MERGE_REQ ──references──► ISSUE (mentions without closing)
MERGE_REQ ──source──► BRANCH
MERGE_REQ ──target──► BRANCH

BRANCH ──contains──► COMMIT
BRANCH ──diverges_from──► BRANCH (parent/base)

COMMENT ──mentions──► PERSON (@username)
COMMENT ──mentions──► FILE (path references)
COMMENT ──mentions──► ISSUE (#123 references)
COMMENT ──belongs_to──► ISSUE / MERGE_REQ
```

---

## Scoring Algorithms Reference

### Expertise Scoring (Person → File/Directory)

```typescript
expertise_score = (
    commits × 3.0 × decay(days, τ=90) +       // Slow decay - authorship sticks
    mrs_authored × 4.0 × decay(days, τ=120) + // Slowest - you remember MRs longest
    mrs_reviewed × 2.0 × decay(days, τ=60) +  // Medium - reviewing less memorable
    issues_assigned × 2.0 × decay(days, τ=45) + // Faster - task memory fades
    comments × 0.5 × decay(days, τ=30)         // Fastest - conversation details fade
)

decay(days, τ) = Math.exp(-days / τ)
```

### Similarity Scoring (Issue → Issue, MR → MR)

```typescript
similarity_score = (
    title_embedding_cosine × 0.35 +
    description_embedding_cosine × 0.35 +
    label_jaccard × 0.15 +
    file_overlap × 0.15
)

threshold_similar = 0.7   // Surface as "potentially related"
threshold_duplicate = 0.85 // Flag as "likely duplicate"
```

### Territory Overlap Scoring (MR → MR)

```typescript
territory_collision = (
    file_overlap_score × 0.7 +
    directory_overlap_score × 0.3
)

collision_severity = territory_collision × (
    your_expertise + their_expertise
) / 2

alert_threshold = 0.3
```

### Connection Depth Scoring

```typescript
depth_1_score = direct_score × 1.0
depth_2_score = direct_score × 0.4
depth_3_score = direct_score × 0.15
max_depth = 3  // Beyond this is noise
```

### Activity Relevance Scoring (Email Digest)

```typescript
event_relevance = (
    territory_match × 0.4 +
    person_match × 0.3 +
    topic_match × 0.2 +
    recency × 0.1
)

digest_threshold = 0.5
daily_limit = 15
```

---

## Epic Dependencies

```
Epic 8 (Person Entity)
    |
    v
Epic 9 (Commit & File) -----> Epic 12 (Similarity)
    |                              |
    v                              v
Epic 10 (Expertise) ---------> Epic 13 (Decision Archaeology)
    |                              |
    v                              v
Epic 11 (Territory) ---------> Epic 14 (Activity View)
                                   |
                                   v
                              Epic 15 (Email Digest)

Epic 16 (MR Context) <-- needs 10, 11, 12
Epic 17 (Incident Response) <-- needs 10, 13
```

---

## Epic 8: Person Entity & Basic Expertise Foundation

**Goal:** Establish Person entity and basic expertise signals - the minimum needed for any "who knows about X?" query.

**Testable when closed:**
- Can see a list of people extracted from GitLab activity
- Can click on a person and see their basic activity summary
- Basic "Who touched file X?" query works

**Dependencies:** None

### Current State

The existing `Event` model stores issues, MRs, and comments with an `author` string field and `authorAvatar` URL. There is no Person entity - authors are stored as strings without normalization or relationships.

**Relevant files:**
- `prisma/schema.prisma` - Add Person model here
- `src/server/services/event-transformer.ts` - Pattern for transforming GitLab data
- `src/server/api/routers/events.ts` - Pattern for tRPC routers

### Stories

---

#### Story 8.1: Add Person model to Prisma schema

**Context:** Currently authors are stored as strings on Events. We need a first-class Person entity to enable expertise tracking, relationship queries, and person-centric views.

**Implementation:**

Add to `prisma/schema.prisma`:

```prisma
model Person {
  id            String   @id @default(cuid())
  userId        String   // The app user who owns this data
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  gitlabId      Int      // GitLab user ID
  username      String   // GitLab username
  name          String?  // Display name (may be null)
  email         String?  // Email (may be null/hidden)
  avatarUrl     String?  // Avatar URL

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([userId, gitlabId])
  @@index([userId])
  @@index([userId, username])
}
```

Also add relation to User model:
```prisma
model User {
  // ... existing fields
  people        Person[]
}
```

**Acceptance criteria:**
- [ ] Person model added with all fields
- [ ] Unique constraint on [userId, gitlabId] prevents duplicates
- [ ] Migration runs successfully
- [ ] No breaking changes to existing Event model

**Hours:** 2

---

#### Story 8.2: Create Person extraction service

**Context:** We have existing Events with author information that needs to be extracted into Person records. New Events should also create/update Person records.

**Implementation:**

Create `src/server/services/person-extractor.ts`:

```typescript
interface ExtractedPerson {
  gitlabId: number;
  username: string;
  name: string | null;
  avatarUrl: string | null;
}

// Extract unique people from existing Events
async function extractPeopleFromEvents(db: PrismaClient, userId: string): Promise<number>

// Extract person from a GitLab API response (issue, MR, note author)
function extractPersonFromGitLabAuthor(author: GitLabAuthor): ExtractedPerson

// Upsert person - create if new, update if exists
async function upsertPerson(db: PrismaClient, userId: string, person: ExtractedPerson): Promise<Person>
```

The extraction should:
1. Query all Events for the user
2. Parse unique authors (by gitlabId if available, or username)
3. Deduplicate
4. Create Person records with upsert semantics

**GitLab author structure** (from API):
```json
{
  "id": 123,
  "username": "jsmith",
  "name": "John Smith",
  "avatar_url": "https://..."
}
```

**Acceptance criteria:**
- [ ] Can extract people from existing Events
- [ ] Deduplication works correctly
- [ ] Upsert creates new or updates existing
- [ ] Returns count of people created/updated

**Hours:** 3

---

#### Story 8.3: Add Person tRPC router

**Context:** Need API endpoints to query and display Person data.

**Implementation:**

Create `src/server/api/routers/people.ts`:

```typescript
export const peopleRouter = createTRPCRouter({
  // List all people with optional search
  list: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      limit: z.number().default(50)
    }))
    .query(async ({ ctx, input }) => {
      // Return Person[] with basic stats
    }),

  // Get single person by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Return Person with detailed stats
    }),

  // Get person's activity (Events they authored)
  getActivity: protectedProcedure
    .input(z.object({
      personId: z.string(),
      limit: z.number().default(50)
    }))
    .query(async ({ ctx, input }) => {
      // Return Events where author matches person's username
    }),

  // Trigger extraction from existing Events
  extractFromEvents: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Run person extraction, return count
    })
});
```

Add to `src/server/api/root.ts`:
```typescript
import { peopleRouter } from "./routers/people";

export const appRouter = createTRPCRouter({
  // ... existing
  people: peopleRouter,
});
```

**Acceptance criteria:**
- [ ] `people.list` returns paginated people with search
- [ ] `people.getById` returns single person
- [ ] `people.getActivity` returns person's Events
- [ ] `people.extractFromEvents` runs extraction
- [ ] All procedures enforce user isolation (userId filter)

**Hours:** 3

---

#### Story 8.4: Create PersonCard component

**Context:** Need a reusable card to display person information with their activity stats.

**Implementation:**

Create `src/components/people/PersonCard.tsx`:

```tsx
interface PersonCardProps {
  person: {
    id: string;
    username: string;
    name: string | null;
    avatarUrl: string | null;
  };
  stats?: {
    issuesAuthored: number;
    mrsAuthored: number;
    mrsReviewed: number;
    commentsCount: number;
  };
  onClick?: () => void;
}

export function PersonCard({ person, stats, onClick }: PersonCardProps) {
  // Avatar (use HeroUI Avatar component)
  // Name/username
  // Stats badges if provided (issues, MRs, comments)
  // Clickable for navigation
}
```

**Design notes:**
- Use HeroUI Avatar, Card components
- Match existing app styling (olive/cream theme)
- Compact variant for lists, expanded for detail views

**Acceptance criteria:**
- [ ] Displays avatar, name, username
- [ ] Shows stats badges when provided
- [ ] Handles missing avatar gracefully
- [ ] Clickable with proper hover state
- [ ] Responsive layout

**Hours:** 3

---

#### Story 8.5: Create PersonListView page

**Context:** Need a page to browse all extracted people with search functionality.

**Implementation:**

Create `src/app/(auth)/people/page.tsx`:

```tsx
// Server component for auth
export default async function PeoplePage() {
  await requireAuth();
  return <PersonListClient />;
}
```

Create `src/components/people/PersonListClient.tsx`:

```tsx
export function PersonListClient() {
  // Search input (debounced)
  // List of PersonCards
  // Loading skeleton
  // Empty state if no people extracted yet
  // "Extract people" button if empty
}
```

**Integration with existing layout:**
- Add "People" link to sidebar in AuthenticatedLayout
- Use existing split-pane pattern (list on left, detail on right)
- Keyboard navigation (j/k) following existing patterns

**Acceptance criteria:**
- [ ] Page renders at /people
- [ ] Search filters people by name/username
- [ ] Shows loading state
- [ ] Empty state prompts extraction
- [ ] Sidebar link added
- [ ] Keyboard navigation works

**Hours:** 3

---

#### Story 8.6: Create PersonDetailView

**Context:** When clicking a person, show their full activity timeline.

**Implementation:**

Create `src/app/(auth)/people/[id]/page.tsx`:

```tsx
export default async function PersonDetailPage({ params }: { params: { id: string } }) {
  await requireAuth();
  return <PersonDetailClient personId={params.id} />;
}
```

Create `src/components/people/PersonDetailClient.tsx`:

```tsx
export function PersonDetailClient({ personId }: { personId: string }) {
  // Person header (avatar, name, overall stats)
  // Activity timeline (their Events)
  // Filter by type (issues/MRs/comments)
  // Date range filter
}
```

**Activity timeline should show:**
- Issues they authored
- MRs they authored or reviewed
- Comments they made
- Sorted by date, most recent first

**Acceptance criteria:**
- [ ] Page renders at /people/[id]
- [ ] Shows person header with stats
- [ ] Activity timeline loads
- [ ] Can filter by event type
- [ ] Handles person not found

**Hours:** 3

---

#### Story 8.7: Add "Who touched?" query

**Context:** Enable the core expert discovery query: "Given a file path or search term, who has touched related Events?"

**Implementation:**

Add to `src/server/api/routers/people.ts`:

```typescript
// Find people whose Events match a search term
whoTouched: protectedProcedure
  .input(z.object({
    query: z.string().min(1),
    limit: z.number().default(10)
  }))
  .query(async ({ ctx, input }) => {
    // 1. Search Events matching query (use existing FTS)
    // 2. Group by author
    // 3. Count occurrences per author
    // 4. Return ranked Person[] with match counts
  })
```

**Ranking logic:**
- Count how many matching Events each person authored
- More matches = higher rank
- Return Person with `matchCount` and sample matching Events

**Acceptance criteria:**
- [ ] Can query with file path (e.g., "src/auth/")
- [ ] Can query with keyword (e.g., "authentication")
- [ ] Returns ranked people by relevance
- [ ] Includes match count per person
- [ ] Performance acceptable (<1s for typical queries)

**Hours:** 4

---

#### Story 8.8: Add PersonActivityStats component

**Context:** Reusable component showing a person's activity breakdown with date ranges.

**Implementation:**

Create `src/components/people/PersonActivityStats.tsx`:

```tsx
interface PersonActivityStatsProps {
  personId: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  variant?: 'compact' | 'full';
}

export function PersonActivityStats({ personId, dateRange, variant = 'compact' }: PersonActivityStatsProps) {
  // Fetch stats from API
  // Display:
  // - Issues authored (count)
  // - MRs authored (count)
  // - MRs reviewed (count) - future, placeholder for now
  // - Comments (count)
  // - Date range selector (full variant)
}
```

**Stats to display:**
- Issues authored
- MRs authored
- MRs reviewed (placeholder - Epic 9 adds this)
- Comments made
- "Last active" date

**Acceptance criteria:**
- [ ] Compact variant shows badges
- [ ] Full variant shows detailed breakdown
- [ ] Date range filtering works
- [ ] Loading and error states handled

**Hours:** 2

---

## Epic 9: Commit & File Data Foundation

**Goal:** Fetch commit and file-level data from GitLab, establishing the foundation for expertise scoring and territory detection.

**Testable when closed:**
- Commits are fetched and stored with file lists
- Can browse files touched in a project
- Person-to-File relationships visible through commits

**Dependencies:** Epic 8 (Person entity)

### Current State

The existing GitLab client fetches issues, MRs, and notes but NOT commits. MRs have titles and descriptions but not the list of files they touch. Commits are not stored at all.

**GitLab APIs needed:**
- `GET /projects/:id/repository/commits` - List commits
- `GET /projects/:id/repository/commits/:sha` - Single commit with stats
- `GET /projects/:id/repository/commits/:sha/diff` - Commit diff (files changed)
- `GET /projects/:id/merge_requests/:iid/changes` - MR files changed

**Relevant files:**
- `src/server/services/gitlab-client.ts` - Extend for commits
- `prisma/schema.prisma` - Add Commit, File models

### Stories

---

#### Story 9.1: Add Commit model and CommitFile junction

**Context:** Need to store commits with their metadata and link them to the files they touch.

**Implementation:**

Add to `prisma/schema.prisma`:

```prisma
model Commit {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  sha           String   // Full commit SHA
  shortSha      String   // First 8 chars for display
  message       String   // Commit message
  title         String   // First line of message
  authoredAt    DateTime // When authored

  // Author link - may be null if person not found
  personId      String?
  person        Person?  @relation(fields: [personId], references: [id])

  // GitLab metadata
  projectId     String   // GitLab project ID
  webUrl        String   // Link to GitLab

  // Stats
  additions     Int      @default(0)
  deletions     Int      @default(0)

  // Relationships
  files         CommitFile[]

  createdAt     DateTime @default(now())

  @@unique([userId, sha])
  @@index([userId, authoredAt])
  @@index([userId, projectId])
  @@index([personId])
}

model CommitFile {
  id        String @id @default(cuid())
  commitId  String
  commit    Commit @relation(fields: [commitId], references: [id], onDelete: Cascade)
  fileId    String
  file      File   @relation(fields: [fileId], references: [id], onDelete: Cascade)

  // Change type
  changeType String // 'added' | 'modified' | 'deleted' | 'renamed'

  @@unique([commitId, fileId])
  @@index([fileId])
}
```

**Acceptance criteria:**
- [ ] Commit model with all fields
- [ ] CommitFile junction table
- [ ] Proper indexes for queries
- [ ] Migration runs successfully

**Hours:** 2

---

#### Story 9.2: Add File model

**Context:** Need to store unique file paths with computed directory and extension for grouping and querying.

**Implementation:**

Add to `prisma/schema.prisma`:

```prisma
model File {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  path        String   // Full file path (e.g., "src/auth/login.ts")
  directory   String   // Parent directory (e.g., "src/auth")
  filename    String   // Just filename (e.g., "login.ts")
  extension   String?  // Extension (e.g., "ts")
  projectId   String   // GitLab project ID

  // Relationships
  commits     CommitFile[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([userId, projectId, path])
  @@index([userId, projectId])
  @@index([userId, directory])
  @@index([userId, extension])
}
```

**Directory/extension parsing logic:**
```typescript
function parseFilePath(fullPath: string) {
  const parts = fullPath.split('/');
  const filename = parts.pop() || '';
  const directory = parts.join('/') || '/';
  const extMatch = filename.match(/\.([^.]+)$/);
  const extension = extMatch ? extMatch[1] : null;
  return { filename, directory, extension };
}
```

**Acceptance criteria:**
- [ ] File model with all fields
- [ ] Unique constraint on [userId, projectId, path]
- [ ] Directory index for prefix queries
- [ ] Extension index for type filtering

**Hours:** 2

---

#### Story 9.3: Extend GitLabClient to fetch commits

**Context:** Need to fetch commits from GitLab API with file diffs.

**Implementation:**

Extend `src/server/services/gitlab-client.ts`:

```typescript
interface GitLabCommit {
  id: string;           // SHA
  short_id: string;
  title: string;
  message: string;
  author_name: string;
  author_email: string;
  authored_date: string;
  web_url: string;
  stats?: {
    additions: number;
    deletions: number;
  };
}

interface GitLabCommitDiff {
  old_path: string;
  new_path: string;
  new_file: boolean;
  renamed_file: boolean;
  deleted_file: boolean;
}

// Add to GitLabClient class:

async fetchCommits(
  projectId: string,
  options?: {
    since?: string;      // ISO date
    until?: string;      // ISO date
    ref_name?: string;   // Branch
    per_page?: number;
    maxPages?: number;
  }
): Promise<GitLabCommit[]>

async fetchCommitDiff(
  projectId: string,
  sha: string
): Promise<GitLabCommitDiff[]>
```

**API endpoints:**
- `GET /projects/:id/repository/commits?with_stats=true&per_page=100`
- `GET /projects/:id/repository/commits/:sha/diff`

**Rate limiting considerations:**
- Commits endpoint: 2 pages max (200 commits)
- Diff endpoint: Only fetch for recent commits or on-demand
- Consider caching diffs since they don't change

**Acceptance criteria:**
- [ ] Can fetch commit list with pagination
- [ ] Can fetch commit diff (files changed)
- [ ] Handles rate limiting
- [ ] Returns typed responses

**Hours:** 4

---

#### Story 9.4: Create commit-transformer service

**Context:** Transform GitLab commit API responses into our database models.

**Implementation:**

Create `src/server/services/commit-transformer.ts`:

```typescript
interface TransformResult {
  commit: Prisma.CommitCreateInput;
  files: { path: string; changeType: string }[];
}

// Transform GitLab commit to our format
function transformCommit(
  gitlabCommit: GitLabCommit,
  diff: GitLabCommitDiff[],
  userId: string,
  projectId: string
): TransformResult

// Determine change type from diff entry
function getChangeType(diff: GitLabCommitDiff): 'added' | 'modified' | 'deleted' | 'renamed'

// Store commits with their files
async function storeCommits(
  db: PrismaClient,
  userId: string,
  commits: TransformResult[]
): Promise<{ stored: number; skipped: number }>
```

**Change type logic:**
```typescript
function getChangeType(diff: GitLabCommitDiff) {
  if (diff.new_file) return 'added';
  if (diff.deleted_file) return 'deleted';
  if (diff.renamed_file) return 'renamed';
  return 'modified';
}
```

**Acceptance criteria:**
- [ ] Transforms GitLab commits to our format
- [ ] Extracts files from diff
- [ ] Determines change types correctly
- [ ] Stores with deduplication (skip existing SHAs)

**Hours:** 3

---

#### Story 9.5: Link commits to Person records

**Context:** Match commit authors to existing Person records for relationship queries.

**Implementation:**

Add to `src/server/services/commit-transformer.ts`:

```typescript
// Find or create Person from commit author
async function resolveCommitAuthor(
  db: PrismaClient,
  userId: string,
  authorName: string,
  authorEmail: string
): Promise<string | null> // Returns personId or null
```

**Matching logic (in priority order):**
1. Match by email (exact)
2. Match by name (exact, case-insensitive)
3. Match by name (fuzzy - first/last name parts)
4. Return null if no match (orphan commit)

**Future enhancement:** Store unmatched authors for manual linking.

**Acceptance criteria:**
- [ ] Matches commits to Person by email
- [ ] Falls back to name matching
- [ ] Handles unmatched authors gracefully
- [ ] Links personId in Commit record

**Hours:** 3

---

#### Story 9.6: Create File extraction from commit diffs

**Context:** Populate the File table with unique file paths from commit diffs.

**Implementation:**

Add to `src/server/services/commit-transformer.ts`:

```typescript
// Ensure file exists in File table, create if not
async function ensureFile(
  db: PrismaClient,
  userId: string,
  projectId: string,
  filePath: string
): Promise<string> // Returns fileId

// Parse file path into components
function parseFilePath(path: string): {
  filename: string;
  directory: string;
  extension: string | null;
}

// Batch create/update files from commit diffs
async function ensureFilesFromDiffs(
  db: PrismaClient,
  userId: string,
  projectId: string,
  diffs: GitLabCommitDiff[]
): Promise<Map<string, string>> // path -> fileId
```

**Implementation notes:**
- Use upsert to handle existing files
- Track both old_path and new_path for renames
- Skip deleted files from future queries but keep history

**Acceptance criteria:**
- [ ] Creates File records for new paths
- [ ] Parses directory/extension correctly
- [ ] Handles renames (both paths stored)
- [ ] Deduplicates across commits

**Hours:** 3

---

#### Story 9.7: Add getFileActivity tRPC endpoint

**Context:** API to query who has touched a file and what commits affected it.

**Implementation:**

Create `src/server/api/routers/files.ts`:

```typescript
export const filesRouter = createTRPCRouter({
  // Get file by path
  getByPath: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      path: z.string()
    }))
    .query(async ({ ctx, input }) => {
      // Return File with commit count, last modified
    }),

  // Get commits that touched a file
  getCommits: protectedProcedure
    .input(z.object({
      fileId: z.string(),
      limit: z.number().default(50)
    }))
    .query(async ({ ctx, input }) => {
      // Return Commits with Person info, ordered by date
    }),

  // Get people who touched a file (aggregated)
  getContributors: protectedProcedure
    .input(z.object({
      fileId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      // Return Person[] with commit counts
    }),

  // List files in a directory
  listDirectory: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      directory: z.string()
    }))
    .query(async ({ ctx, input }) => {
      // Return File[] in directory
    })
});
```

**Acceptance criteria:**
- [ ] Can get file by path
- [ ] Can get commits for a file
- [ ] Can get contributors for a file
- [ ] Can list directory contents
- [ ] All enforce user isolation

**Hours:** 3

---

#### Story 9.8: Add FileExplorer component

**Context:** UI to browse files, see commit history, and discover who worked on them.

**Implementation:**

Create `src/app/(auth)/files/page.tsx` and `src/components/files/FileExplorer.tsx`:

```tsx
interface FileExplorerProps {
  projectId?: string; // If provided, filter to this project
}

export function FileExplorer({ projectId }: FileExplorerProps) {
  // Tree view of directories
  // Click directory to expand
  // Click file to see details
  // File details show:
  //   - Commit history (recent commits)
  //   - Contributors (people who touched it)
  //   - Last modified date
}
```

**Components needed:**
- `FileTree` - Directory tree navigation
- `FileDetailPanel` - Right pane showing file info
- `CommitList` - List of commits for a file
- `ContributorList` - People who touched file

**Acceptance criteria:**
- [ ] Page renders at /files
- [ ] Can browse directory tree
- [ ] Clicking file shows details
- [ ] Shows commit history
- [ ] Shows contributors

**Hours:** 4

---

#### Story 9.9: Integrate commit fetching into manualRefresh

**Context:** Add commit fetching to the existing refresh flow.

**Implementation:**

Modify `src/server/api/routers/events.ts` `manualRefresh`:

```typescript
manualRefresh: protectedProcedure
  .input(z.object({
    includeCommits: z.boolean().default(true),
    commitDepth: z.number().default(100) // Max commits per project
  }))
  .mutation(async ({ ctx, input }) => {
    // Existing: fetch issues, MRs, notes

    // New: if includeCommits
    if (input.includeCommits) {
      for (const project of monitoredProjects) {
        const commits = await gitlabClient.fetchCommits(
          project.gitlabProjectId,
          { per_page: 100, maxPages: Math.ceil(input.commitDepth / 100) }
        );
        // Fetch diffs for each commit (rate limited)
        // Transform and store
      }
    }

    // Return combined stats
  })
```

**Configuration options:**
- `includeCommits` - Toggle commit fetching (default true)
- `commitDepth` - How many commits to fetch per project

**Performance considerations:**
- Fetch diffs in batches (10 at a time)
- Skip commits already in DB
- Add progress tracking for long operations

**Acceptance criteria:**
- [ ] Commits fetched during manual refresh
- [ ] Respects depth limit
- [ ] Skips existing commits
- [ ] Reports commit stats in response

**Hours:** 3

---

#### Story 9.10: Add indexes for file path prefix queries

**Context:** Need efficient queries for "all files in directory X" patterns.

**Implementation:**

Add database indexes and query helpers:

```sql
-- Add to migration
CREATE INDEX idx_file_path_prefix ON "File" USING btree (
  "userId",
  "projectId",
  "path" text_pattern_ops
);

CREATE INDEX idx_file_directory ON "File" (
  "userId",
  "directory"
);
```

Add query helper in `src/lib/db/file-queries.ts`:

```typescript
// Find files matching path prefix
async function findFilesByPathPrefix(
  db: PrismaClient,
  userId: string,
  projectId: string,
  pathPrefix: string
): Promise<File[]> {
  return db.$queryRaw`
    SELECT * FROM "File"
    WHERE "userId" = ${userId}
    AND "projectId" = ${projectId}
    AND "path" LIKE ${pathPrefix + '%'}
    ORDER BY "path"
  `;
}

// Find files in directory (one level)
async function findFilesInDirectory(
  db: PrismaClient,
  userId: string,
  projectId: string,
  directory: string
): Promise<File[]>
```

**Acceptance criteria:**
- [ ] Prefix queries use index
- [ ] Directory queries efficient
- [ ] EXPLAIN shows index usage
- [ ] Performance <100ms for typical queries

**Hours:** 2

---

## Epic 10: Expertise Scoring Engine

**Goal:** Implement weighted expertise scoring algorithm and Expert View UI.

**Testable when closed:**
- Can query "Who is the expert on [file/directory]?"
- Results show ranked people with scores and breakdown
- Scores incorporate recency decay

**Dependencies:** Epic 9 (Commit & File data)

### Algorithm Reference

```typescript
expertise_score = (
    commits × 3.0 × decay(days, τ=90) +       // Slow decay
    mrs_authored × 4.0 × decay(days, τ=120) + // Slowest
    mrs_reviewed × 2.0 × decay(days, τ=60) +  // Medium
    issues_assigned × 2.0 × decay(days, τ=45) + // Faster
    comments × 0.5 × decay(days, τ=30)         // Fastest
)

decay(days, τ) = Math.exp(-days / τ)
```

### Stories

---

#### Story 10.1: Create expertise-scorer service with decay function

**Context:** Core scoring service that will be used across all expertise queries.

**Implementation:**

Create `src/server/services/expertise-scorer.ts`:

```typescript
// Configurable decay parameters
interface DecayConfig {
  commits: { weight: number; tau: number };      // 3.0, 90
  mrsAuthored: { weight: number; tau: number };  // 4.0, 120
  mrsReviewed: { weight: number; tau: number };  // 2.0, 60
  issuesAssigned: { weight: number; tau: number }; // 2.0, 45
  comments: { weight: number; tau: number };     // 0.5, 30
}

const DEFAULT_DECAY_CONFIG: DecayConfig = {
  commits: { weight: 3.0, tau: 90 },
  mrsAuthored: { weight: 4.0, tau: 120 },
  mrsReviewed: { weight: 2.0, tau: 60 },
  issuesAssigned: { weight: 2.0, tau: 45 },
  comments: { weight: 0.5, tau: 30 }
};

// Exponential decay function
function decay(days: number, tau: number): number {
  return Math.exp(-days / tau);
}

// Calculate days since date
function daysSince(date: Date): number {
  return (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
}

// Calculate weighted score for a single signal
function calculateSignalScore(
  count: number,
  date: Date,
  config: { weight: number; tau: number }
): number {
  const days = daysSince(date);
  return count * config.weight * decay(days, config.tau);
}
```

**Acceptance criteria:**
- [ ] Decay function implemented correctly
- [ ] Configurable weights and tau values
- [ ] Unit tests for decay calculations
- [ ] Default config matches spec

**Hours:** 3

---

#### Story 10.2: Implement commit-based expertise calculation

**Context:** Calculate expertise from commits touching a file/directory.

**Implementation:**

Add to `src/server/services/expertise-scorer.ts`:

```typescript
interface CommitExpertise {
  personId: string;
  commitCount: number;
  lastCommitDate: Date;
  score: number;
}

// Get commit-based expertise for a file
async function getCommitExpertise(
  db: PrismaClient,
  userId: string,
  fileIdOrDirectory: string,
  isDirectory: boolean,
  config: DecayConfig = DEFAULT_DECAY_CONFIG
): Promise<CommitExpertise[]> {
  // Query commits touching file(s)
  // Group by personId
  // Calculate decayed scores
  // Return sorted by score DESC
}
```

**SQL approach (for performance):**
```sql
SELECT
  c."personId",
  COUNT(*) as commit_count,
  MAX(c."authoredAt") as last_commit,
  SUM(
    3.0 * EXP(-EXTRACT(DAY FROM NOW() - c."authoredAt") / 90)
  ) as score
FROM "Commit" c
JOIN "CommitFile" cf ON cf."commitId" = c.id
JOIN "File" f ON f.id = cf."fileId"
WHERE c."userId" = $1
  AND (f.id = $2 OR f."directory" LIKE $3)
GROUP BY c."personId"
ORDER BY score DESC
```

**Acceptance criteria:**
- [ ] Calculates commit expertise per person
- [ ] Works for single file or directory
- [ ] Applies decay correctly
- [ ] Performance acceptable (<500ms)

**Hours:** 3

---

#### Story 10.3: Implement MR-based expertise

**Context:** Calculate expertise from MRs authored and reviewed.

**Implementation:**

Add to `src/server/services/expertise-scorer.ts`:

```typescript
interface MRExpertise {
  personId: string;
  mrsAuthored: number;
  mrsReviewed: number;
  lastMRDate: Date;
  authoredScore: number;
  reviewedScore: number;
}

// Get MR-based expertise for files
async function getMRExpertise(
  db: PrismaClient,
  userId: string,
  filePaths: string[],
  config: DecayConfig = DEFAULT_DECAY_CONFIG
): Promise<MRExpertise[]>
```

**Note:** This requires MR → File relationships which are added in Epic 11. For now, use Event-based matching:
- Search Events of type 'merge_request' containing file paths in title/body
- Group by author
- Apply decay based on createdAt

**Fallback implementation (until Epic 11):**
```typescript
// Search MR Events mentioning file paths
const events = await db.event.findMany({
  where: {
    userId,
    type: 'merge_request',
    OR: filePaths.map(p => ({
      OR: [
        { title: { contains: p } },
        { body: { contains: p } }
      ]
    }))
  }
});
// Group by author, apply decay
```

**Acceptance criteria:**
- [ ] Calculates MR authored score (4.0 weight, 120d tau)
- [ ] Calculates MR reviewed score (2.0 weight, 60d tau) - placeholder
- [ ] Works with file path search
- [ ] Applies decay correctly

**Hours:** 3

---

#### Story 10.4: Implement issue-based expertise

**Context:** Calculate expertise from issues assigned and comments made.

**Implementation:**

Add to `src/server/services/expertise-scorer.ts`:

```typescript
interface IssueExpertise {
  personId: string;
  issuesAssigned: number;
  commentsCount: number;
  assignedScore: number;
  commentScore: number;
}

async function getIssueExpertise(
  db: PrismaClient,
  userId: string,
  searchTerms: string[], // File paths or keywords
  config: DecayConfig = DEFAULT_DECAY_CONFIG
): Promise<IssueExpertise[]>
```

**Query approach:**
1. Search Events (issues, comments) matching terms
2. For issues: group by author, apply 2.0 weight, 45d tau
3. For comments: group by author, apply 0.5 weight, 30d tau
4. Combine scores

**Acceptance criteria:**
- [ ] Calculates issue assigned score
- [ ] Calculates comment score
- [ ] Searches by file path or keyword
- [ ] Applies correct weights and decay

**Hours:** 3

---

#### Story 10.5: Create calculateExpertise function

**Context:** Combine all expertise signals into a single ranked result.

**Implementation:**

Add to `src/server/services/expertise-scorer.ts`:

```typescript
interface ExpertiseResult {
  person: Person;
  totalScore: number;
  breakdown: {
    commits: { count: number; score: number };
    mrsAuthored: { count: number; score: number };
    mrsReviewed: { count: number; score: number };
    issuesAssigned: { count: number; score: number };
    comments: { count: number; score: number };
  };
  lastActivity: Date;
}

async function calculateExpertise(
  db: PrismaClient,
  userId: string,
  query: {
    filePath?: string;      // Specific file
    directory?: string;     // Directory prefix
    searchTerm?: string;    // Keyword search
  },
  options?: {
    limit?: number;         // Max results (default 10)
    config?: DecayConfig;   // Custom weights
  }
): Promise<ExpertiseResult[]>
```

**Implementation flow:**
1. Get commit expertise
2. Get MR expertise
3. Get issue expertise
4. Merge by personId
5. Sum total scores
6. Sort by totalScore DESC
7. Limit results
8. Fetch Person details
9. Return with breakdown

**Acceptance criteria:**
- [ ] Combines all signal types
- [ ] Returns breakdown per signal
- [ ] Sorts by total score
- [ ] Includes Person details
- [ ] Respects limit

**Hours:** 4

---

#### Story 10.6: Add getExperts tRPC endpoint

**Context:** API endpoint for expert queries.

**Implementation:**

Create `src/server/api/routers/expertise.ts`:

```typescript
export const expertiseRouter = createTRPCRouter({
  // Get experts for a file/directory/term
  getExperts: protectedProcedure
    .input(z.object({
      filePath: z.string().optional(),
      directory: z.string().optional(),
      searchTerm: z.string().optional(),
      limit: z.number().default(10)
    }).refine(data =>
      data.filePath || data.directory || data.searchTerm,
      { message: "Must provide filePath, directory, or searchTerm" }
    ))
    .query(async ({ ctx, input }) => {
      return calculateExpertise(ctx.db, ctx.session.userId, input, {
        limit: input.limit
      });
    }),

  // Get expertise summary for a person
  getPersonExpertise: protectedProcedure
    .input(z.object({
      personId: z.string(),
      limit: z.number().default(10) // Top N areas
    }))
    .query(async ({ ctx, input }) => {
      // Return top directories/files person is expert in
    })
});
```

**Acceptance criteria:**
- [ ] Can query by file path
- [ ] Can query by directory
- [ ] Can query by search term
- [ ] Validates at least one input provided
- [ ] Enforces user isolation

**Hours:** 3

---

#### Story 10.7: Create ExpertView page

**Context:** Dedicated page for expert discovery.

**Implementation:**

Create `src/app/(auth)/experts/page.tsx`:

```tsx
export default async function ExpertsPage() {
  await requireAuth();
  return <ExpertViewClient />;
}
```

Create `src/components/expertise/ExpertViewClient.tsx`:

```tsx
export function ExpertViewClient() {
  // Search input (file path, directory, or keyword)
  // Search type selector (file | directory | keyword)
  // Results list (ExpertResultCards)
  // Empty state with example queries
}
```

**Search modes:**
- **File path:** "src/auth/login.ts"
- **Directory:** "src/auth/" (auto-adds trailing slash)
- **Keyword:** "authentication" (searches event content)

**Acceptance criteria:**
- [ ] Page renders at /experts
- [ ] Search input with type selector
- [ ] Shows results with scores
- [ ] Empty state guides usage
- [ ] Sidebar link added

**Hours:** 3

---

#### Story 10.8: Create ExpertResultCard with score visualization

**Context:** Display expert results with score breakdown.

**Implementation:**

Create `src/components/expertise/ExpertResultCard.tsx`:

```tsx
interface ExpertResultCardProps {
  result: ExpertiseResult;
  rank: number;
}

export function ExpertResultCard({ result, rank }: ExpertResultCardProps) {
  // Rank badge (#1, #2, etc.)
  // PersonCard (avatar, name)
  // Total score (prominent)
  // Score breakdown visualization:
  //   - Bar chart or progress bars showing contribution of each signal
  //   - Commits: 45% | MRs: 30% | Issues: 15% | Comments: 10%
  // Last activity date
  // Click to expand/navigate to person
}
```

**Visualization approach:**
- Stacked horizontal bar showing relative contribution
- Color-coded: commits (blue), MRs (green), issues (yellow), comments (gray)
- Percentage labels on hover

**Acceptance criteria:**
- [ ] Shows rank and total score
- [ ] Displays person info
- [ ] Visualizes score breakdown
- [ ] Shows last activity
- [ ] Clickable for navigation

**Hours:** 4

---

#### Story 10.9: Add "expand to directory" option

**Context:** When viewing file experts, offer to expand to containing directory.

**Implementation:**

Add to ExpertViewClient:

```tsx
// When query is a file path
if (queryType === 'file' && results.length > 0) {
  const directory = getParentDirectory(query);
  return (
    <>
      <div className="mb-4">
        <Button
          variant="ghost"
          onClick={() => setQuery(directory, 'directory')}
        >
          Expand to directory: {directory}
        </Button>
      </div>
      {/* Results */}
    </>
  );
}
```

**Use cases:**
- File has few experts → expand to see directory experts
- Broaden search to find more people
- Navigate up the directory tree

**Acceptance criteria:**
- [ ] Button shown for file queries
- [ ] Click expands to parent directory
- [ ] Can continue expanding up

**Hours:** 2

---

#### Story 10.10: Add configurable decay parameters

**Context:** Allow advanced users to tune scoring weights and decay rates.

**Implementation:**

Add to settings page `src/app/(auth)/settings/page.tsx`:

```tsx
// Advanced section (collapsed by default)
<Accordion>
  <AccordionItem title="Expert Scoring Configuration">
    <ExpertiseConfigForm />
  </AccordionItem>
</Accordion>
```

Create `src/components/settings/ExpertiseConfigForm.tsx`:

```tsx
// Form fields for each signal:
// - Weight (0.1 - 10.0)
// - Decay tau in days (7 - 365)
// Save to user preferences (new field in User model)
// Reset to defaults button
```

Add to schema:
```prisma
model User {
  // ... existing
  expertiseConfig Json? // Store custom DecayConfig
}
```

**Acceptance criteria:**
- [ ] Can adjust weights per signal
- [ ] Can adjust decay rates
- [ ] Changes saved to user prefs
- [ ] Reset to defaults works
- [ ] Expert queries use custom config

**Hours:** 2

---

## Epic 11: Territory & Collision Detection

**Goal:** Implement Territory View showing who's working where, with collision alerts.

**Testable when closed:**
- Can see "territory map" of active work areas
- MRs show potential collision warnings
- Collision severity scored

**Dependencies:** Epic 10 (Expertise scoring)

### Algorithm Reference

```typescript
territory_collision = (
    file_overlap_score × 0.7 +
    directory_overlap_score × 0.3
)

collision_severity = territory_collision × (
    your_expertise + their_expertise
) / 2

alert_threshold = 0.3
```

### Stories

---

#### Story 11.1: Add file_changes to MR model

**Context:** Store the list of files an MR touches for collision detection.

**Implementation:**

Modify Events to track MR files. Add to schema:

```prisma
model MRFileChange {
  id        String @id @default(cuid())
  eventId   String
  event     Event  @relation(fields: [eventId], references: [id], onDelete: Cascade)

  filePath  String
  changeType String // 'added' | 'modified' | 'deleted' | 'renamed'

  @@index([eventId])
  @@index([filePath])
}

model Event {
  // ... existing fields
  mrFileChanges MRFileChange[]
}
```

**Acceptance criteria:**
- [ ] MRFileChange model added
- [ ] Linked to Event
- [ ] Indexed for queries
- [ ] Migration runs

**Hours:** 3

---

#### Story 11.2: Extend GitLabClient for MR changes

**Context:** Fetch file changes for merge requests.

**Implementation:**

Add to `src/server/services/gitlab-client.ts`:

```typescript
interface GitLabMRChange {
  old_path: string;
  new_path: string;
  new_file: boolean;
  renamed_file: boolean;
  deleted_file: boolean;
}

async fetchMRChanges(
  projectId: string,
  mrIid: number
): Promise<GitLabMRChange[]>
```

**API endpoint:** `GET /projects/:id/merge_requests/:iid/changes`

**Rate limiting:** This is expensive - only fetch for open MRs or on-demand.

Add to event-transformer to populate MRFileChange on MR fetch.

**Acceptance criteria:**
- [ ] Can fetch MR file changes
- [ ] Transforms to MRFileChange records
- [ ] Handles rate limits
- [ ] Integrated into MR refresh

**Hours:** 3

---

#### Story 11.3: Create territory-scorer service

**Context:** Calculate territory overlap between MRs or between person and files.

**Implementation:**

Create `src/server/services/territory-scorer.ts`:

```typescript
interface FileOverlap {
  file: string;
  inBoth: boolean;
}

interface TerritoryScore {
  fileOverlapScore: number;      // 0-1
  directoryOverlapScore: number; // 0-1
  totalScore: number;            // Weighted combination
  overlappingFiles: string[];
  overlappingDirectories: string[];
}

// Calculate overlap between two sets of files
function calculateOverlap(
  files1: string[],
  files2: string[]
): TerritoryScore {
  // File overlap: |intersection| / |union|
  const fileSet1 = new Set(files1);
  const fileSet2 = new Set(files2);
  const intersection = files1.filter(f => fileSet2.has(f));
  const union = new Set([...files1, ...files2]);
  const fileOverlapScore = intersection.length / union.size;

  // Directory overlap: same logic on parent directories
  const dirs1 = new Set(files1.map(f => getParentDirectory(f)));
  const dirs2 = new Set(files2.map(f => getParentDirectory(f)));
  // ...

  return {
    fileOverlapScore,
    directoryOverlapScore,
    totalScore: fileOverlapScore * 0.7 + directoryOverlapScore * 0.3,
    overlappingFiles: intersection,
    overlappingDirectories: [...]
  };
}
```

**Acceptance criteria:**
- [ ] Calculates file overlap correctly
- [ ] Calculates directory overlap
- [ ] Returns weighted total
- [ ] Lists overlapping items

**Hours:** 4

---

#### Story 11.4: Implement collision detection

**Context:** Find other MRs that overlap with a given MR's files.

**Implementation:**

Add to `src/server/services/territory-scorer.ts`:

```typescript
interface Collision {
  otherMR: Event;
  overlapScore: TerritoryScore;
  severity: number;
}

async function findCollisions(
  db: PrismaClient,
  userId: string,
  mrEventId: string,
  options?: {
    threshold?: number;      // Default 0.3
    includeExpertise?: boolean;
  }
): Promise<Collision[]>
```

**Implementation flow:**
1. Get files for the input MR
2. Find other open MRs with overlapping files
3. Calculate overlap score for each
4. Filter by threshold
5. Sort by severity DESC

**Query approach:**
```sql
-- Find MRs with overlapping files
SELECT DISTINCT e.id, e.title, e."gitlabUrl"
FROM "Event" e
JOIN "MRFileChange" mfc ON mfc."eventId" = e.id
WHERE e."userId" = $1
  AND e.type = 'merge_request'
  AND e.id != $2
  AND mfc."filePath" IN (
    SELECT "filePath" FROM "MRFileChange" WHERE "eventId" = $2
  )
```

**Acceptance criteria:**
- [ ] Finds overlapping MRs
- [ ] Calculates overlap scores
- [ ] Filters by threshold
- [ ] Returns sorted results

**Hours:** 3

---

#### Story 11.5: Add collision severity scoring

**Context:** Weight collisions by the expertise of both parties.

**Implementation:**

Extend collision detection:

```typescript
async function calculateCollisionSeverity(
  db: PrismaClient,
  userId: string,
  collision: Collision,
  yourPersonId: string
): Promise<number> {
  // Get your expertise in overlapping files
  const yourExpertise = await calculateExpertise(
    db, userId,
    { filePaths: collision.overlapScore.overlappingFiles }
  );

  // Get their expertise (MR author)
  const theirPersonId = await getPersonIdFromAuthor(
    db, userId, collision.otherMR.author
  );
  const theirExpertise = await calculateExpertise(
    db, userId,
    { filePaths: collision.overlapScore.overlappingFiles }
  );

  // Severity = overlap × (your_expertise + their_expertise) / 2
  const avgExpertise = (yourExpertise + theirExpertise) / 2;
  return collision.overlapScore.totalScore * avgExpertise;
}
```

**Interpretation:**
- High severity: Both parties are experts → important collision
- Low severity: Neither is expert → less critical
- Mixed: Expert should be aware of non-expert's work

**Acceptance criteria:**
- [ ] Calculates severity with expertise weighting
- [ ] Higher expertise = higher severity
- [ ] Severity used for ranking/filtering

**Hours:** 3

---

#### Story 11.6: Create getTerritoryForPerson endpoint

**Context:** Show what files/directories a person is currently working on.

**Implementation:**

Add to `src/server/api/routers/territory.ts`:

```typescript
export const territoryRouter = createTRPCRouter({
  // Get person's active territory
  getForPerson: protectedProcedure
    .input(z.object({
      personId: z.string(),
      timeWindow: z.number().default(30) // Days
    }))
    .query(async ({ ctx, input }) => {
      // Find files they've touched recently (commits, MRs)
      // Group by directory
      // Return with activity counts
    }),

  // Get territory heatmap (all people's activity)
  getHeatmap: protectedProcedure
    .input(z.object({
      projectId: z.string().optional(),
      timeWindow: z.number().default(30)
    }))
    .query(async ({ ctx, input }) => {
      // Aggregate all activity by directory
      // Return directories with person counts
    })
});
```

**Acceptance criteria:**
- [ ] Returns person's active files/directories
- [ ] Respects time window
- [ ] Groups by directory
- [ ] Heatmap shows activity density

**Hours:** 3

---

#### Story 11.7: Create getCollisions endpoint

**Context:** API to check collisions for an MR.

**Implementation:**

Add to territory router:

```typescript
// Get collisions for an MR
getCollisions: protectedProcedure
  .input(z.object({
    mrEventId: z.string(),
    threshold: z.number().default(0.3)
  }))
  .query(async ({ ctx, input }) => {
    return findCollisions(ctx.db, ctx.session.userId, input.mrEventId, {
      threshold: input.threshold,
      includeExpertise: true
    });
  }),

// Check if any open MRs have collisions (for dashboard alert)
getActiveCollisions: protectedProcedure
  .input(z.object({
    threshold: z.number().default(0.3)
  }))
  .query(async ({ ctx, input }) => {
    // Find user's open MRs
    // Check each for collisions
    // Return MRs with collision counts
  })
```

**Acceptance criteria:**
- [ ] Can check single MR for collisions
- [ ] Can get all active collisions
- [ ] Respects threshold
- [ ] Returns severity scores

**Hours:** 3

---

#### Story 11.8: Create TerritoryView page

**Context:** Dedicated page showing activity heatmap and collision alerts.

**Implementation:**

Create `src/app/(auth)/territory/page.tsx`:

```tsx
export default async function TerritoryPage() {
  await requireAuth();
  return <TerritoryViewClient />;
}
```

Create `src/components/territory/TerritoryViewClient.tsx`:

```tsx
export function TerritoryViewClient() {
  // Two tabs: "Heatmap" and "My Collisions"

  // Heatmap tab:
  // - Directory tree with activity intensity
  // - Click directory to see who's active there
  // - Color intensity = activity level

  // Collisions tab:
  // - List of your open MRs with collision indicators
  // - Click to see collision details
}
```

**Acceptance criteria:**
- [ ] Page renders at /territory
- [ ] Heatmap shows activity by directory
- [ ] Collision list shows alerts
- [ ] Sidebar link added

**Hours:** 4

---

#### Story 11.9: Add CollisionAlert component

**Context:** Show collision warning on MR detail view.

**Implementation:**

Create `src/components/territory/CollisionAlert.tsx`:

```tsx
interface CollisionAlertProps {
  mrEventId: string;
}

export function CollisionAlert({ mrEventId }: CollisionAlertProps) {
  const { data: collisions } = trpc.territory.getCollisions.useQuery({
    mrEventId,
    threshold: 0.3
  });

  if (!collisions?.length) return null;

  return (
    <Alert color="warning">
      <AlertTitle>
        {collisions.length} potential collision(s) detected
      </AlertTitle>
      {collisions.map(c => (
        <CollisionItem key={c.otherMR.id} collision={c} />
      ))}
    </Alert>
  );
}
```

Integrate into EventDetail for MR type events.

**Acceptance criteria:**
- [ ] Shows alert for collisions above threshold
- [ ] Lists conflicting MRs
- [ ] Shows severity indicator
- [ ] Hidden when no collisions

**Hours:** 3

---

#### Story 11.10: Create TerritoryCard component

**Context:** Show person's active territory in profile views.

**Implementation:**

Create `src/components/territory/TerritoryCard.tsx`:

```tsx
interface TerritoryCardProps {
  personId: string;
  timeWindow?: number; // Days, default 30
}

export function TerritoryCard({ personId, timeWindow = 30 }: TerritoryCardProps) {
  // Shows top 5 directories person is active in
  // With activity counts (commits, MRs)
  // Expandable to show all
}
```

Integrate into PersonDetailView.

**Acceptance criteria:**
- [ ] Shows person's active directories
- [ ] Activity counts displayed
- [ ] Time window configurable
- [ ] Expandable list

**Hours:** 3

---

#### Story 11.11: Add configurable collision threshold

**Context:** Allow user to adjust collision sensitivity.

**Implementation:**

Add to settings:

```tsx
// In Settings page
<FormField label="Collision Alert Threshold">
  <Slider
    min={0.1}
    max={0.9}
    step={0.1}
    value={threshold}
    onChange={setThreshold}
  />
  <HelpText>
    Lower = more alerts, Higher = only major collisions
    (Default: 0.3)
  </HelpText>
</FormField>
```

Store in user preferences.

**Acceptance criteria:**
- [ ] Can adjust threshold in settings
- [ ] Saved to user prefs
- [ ] Used in collision queries
- [ ] Help text explains impact

**Hours:** 2

---

## Epic 12: Similarity & Duplicate Detection

**Goal:** Detect similar/duplicate issues and MRs using text similarity.

**Testable when closed:**
- Viewing an issue shows related items
- Similar items ranked by score
- "Likely Duplicate" badge for high similarity

**Dependencies:** Epic 8 (Person entity)

### Algorithm Reference

```typescript
similarity_score = (
    title_embedding_cosine × 0.35 +
    description_embedding_cosine × 0.35 +
    label_jaccard × 0.15 +
    file_overlap × 0.15
)

threshold_similar = 0.7
threshold_duplicate = 0.85
```

### Stories

---

#### Story 12.1: Select embedding approach

**Context:** Need to decide between local embeddings (pgvector) or API-based (OpenAI, sentence-transformers API).

**Implementation:**

Research and document decision in ADR format:

**Options:**
1. **pgvector + sentence-transformers** - Local, free, requires setup
2. **OpenAI embeddings API** - Easy, costs per token
3. **Hugging Face Inference API** - Free tier available

**Recommendation:** Start with pgvector + all-MiniLM-L6-v2 (384 dimensions):
- Free and local
- Fast inference
- Good quality for short text
- Can upgrade later

Create `docs/adr/embedding-approach.md` documenting decision.

**Acceptance criteria:**
- [ ] Decision documented
- [ ] Trade-offs analyzed
- [ ] Implementation path clear

**Hours:** 3

---

#### Story 12.2: Add embedding column to Event model

**Context:** Store vector embeddings for similarity search.

**Implementation:**

Add pgvector extension and column:

```sql
-- Migration
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "Event" ADD COLUMN embedding vector(384);

CREATE INDEX idx_event_embedding ON "Event"
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

Update Prisma schema:
```prisma
model Event {
  // ... existing
  embedding     Unsupported("vector(384)")?
}
```

**Note:** Prisma doesn't natively support vector type. Use raw SQL for embedding operations.

**Acceptance criteria:**
- [ ] pgvector extension enabled
- [ ] Embedding column added
- [ ] IVFFlat index created
- [ ] Migration runs

**Hours:** 2

---

#### Story 12.3: Create embedding-generator service

**Context:** Generate embeddings for issue/MR title and description.

**Implementation:**

Create `src/server/services/embedding-generator.ts`:

```typescript
// Using transformers.js or API call
async function generateEmbedding(text: string): Promise<number[]>

// Combine title + description for embedding
function prepareTextForEmbedding(title: string, body: string | null): string {
  const combined = body ? `${title}\n\n${body}` : title;
  // Truncate to model's max length (512 tokens typically)
  return truncateToTokens(combined, 400);
}

// Generate and store embedding for an Event
async function embedEvent(
  db: PrismaClient,
  eventId: string
): Promise<void>
```

**Model options:**
- `Xenova/all-MiniLM-L6-v2` via transformers.js (runs in Node)
- API call to Hugging Face Inference

**Acceptance criteria:**
- [ ] Can generate embeddings for text
- [ ] Handles title + description
- [ ] Truncates long text
- [ ] Stores in Event.embedding

**Hours:** 4

---

#### Story 12.4: Backfill embeddings for existing Events

**Context:** Generate embeddings for all existing issues and MRs.

**Implementation:**

Create backfill script/endpoint:

```typescript
async function backfillEmbeddings(
  db: PrismaClient,
  userId: string,
  options?: {
    batchSize?: number;
    onProgress?: (processed: number, total: number) => void;
  }
): Promise<{ processed: number; skipped: number; errors: number }>
```

Add tRPC endpoint:
```typescript
backfillEmbeddings: protectedProcedure
  .mutation(async ({ ctx }) => {
    return backfillEmbeddings(ctx.db, ctx.session.userId, {
      batchSize: 50,
      onProgress: (p, t) => console.log(`${p}/${t}`)
    });
  })
```

**Performance considerations:**
- Batch processing (50 at a time)
- Rate limiting if using API
- Progress reporting
- Resume from where left off

**Acceptance criteria:**
- [ ] Can backfill all Events
- [ ] Progress tracking
- [ ] Handles errors gracefully
- [ ] Can be re-run safely

**Hours:** 3

---

#### Story 12.5: Create similarity-scorer service

**Context:** Calculate similarity between Events using embeddings.

**Implementation:**

Create `src/server/services/similarity-scorer.ts`:

```typescript
// Cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dotProduct / (normA * normB);
}

// Find similar Events using pgvector
async function findSimilarEvents(
  db: PrismaClient,
  userId: string,
  eventId: string,
  options?: {
    limit?: number;
    threshold?: number;
    types?: ('issue' | 'merge_request')[];
  }
): Promise<SimilarEvent[]>
```

**pgvector query:**
```sql
SELECT
  e.id,
  e.title,
  e.type,
  1 - (e.embedding <=> $1) as similarity
FROM "Event" e
WHERE e."userId" = $2
  AND e.id != $3
  AND e.embedding IS NOT NULL
  AND 1 - (e.embedding <=> $1) > $4
ORDER BY e.embedding <=> $1
LIMIT $5
```

**Acceptance criteria:**
- [ ] Cosine similarity calculation correct
- [ ] pgvector query efficient
- [ ] Returns ranked results
- [ ] Respects threshold

**Hours:** 3

---

#### Story 12.6: Implement combined similarity score

**Context:** Combine embedding similarity with label and file overlap.

**Implementation:**

Extend similarity-scorer:

```typescript
interface CombinedSimilarity {
  titleSimilarity: number;      // 0-1
  descriptionSimilarity: number; // 0-1
  labelJaccard: number;         // 0-1
  fileOverlap: number;          // 0-1
  totalScore: number;           // Weighted
}

function combineSimilarityScores(
  titleSim: number,
  descSim: number,
  labels1: string[],
  labels2: string[],
  files1: string[],
  files2: string[]
): CombinedSimilarity {
  // Jaccard: |intersection| / |union|
  const labelJaccard = jaccardSimilarity(labels1, labels2);
  const fileOverlap = jaccardSimilarity(files1, files2);

  return {
    titleSimilarity: titleSim,
    descriptionSimilarity: descSim,
    labelJaccard,
    fileOverlap,
    totalScore: titleSim * 0.35 + descSim * 0.35 + labelJaccard * 0.15 + fileOverlap * 0.15
  };
}
```

**Acceptance criteria:**
- [ ] Combines all signals
- [ ] Weights match spec
- [ ] Returns breakdown
- [ ] Handles missing labels/files

**Hours:** 3

---

#### Story 12.7: Add getSimilarIssues endpoint

**Context:** API to find similar items.

**Implementation:**

Create `src/server/api/routers/similarity.ts`:

```typescript
export const similarityRouter = createTRPCRouter({
  // Find similar items to an Event
  getSimilar: protectedProcedure
    .input(z.object({
      eventId: z.string(),
      limit: z.number().default(10),
      threshold: z.number().default(0.7),
      types: z.array(z.enum(['issue', 'merge_request'])).optional()
    }))
    .query(async ({ ctx, input }) => {
      return findSimilarEvents(ctx.db, ctx.session.userId, input.eventId, input);
    }),

  // Search for similar items by text (for new issue check)
  searchSimilar: protectedProcedure
    .input(z.object({
      title: z.string(),
      body: z.string().optional(),
      limit: z.number().default(10),
      threshold: z.number().default(0.7)
    }))
    .query(async ({ ctx, input }) => {
      // Generate embedding for input text
      // Search for similar Events
    })
});
```

**Acceptance criteria:**
- [ ] Can find similar to existing Event
- [ ] Can search by text (pre-creation check)
- [ ] Respects threshold
- [ ] Returns similarity scores

**Hours:** 3

---

#### Story 12.8: Add SimilarItemsPanel component

**Context:** Show similar items on Event detail view.

**Implementation:**

Create `src/components/similarity/SimilarItemsPanel.tsx`:

```tsx
interface SimilarItemsPanelProps {
  eventId: string;
}

export function SimilarItemsPanel({ eventId }: SimilarItemsPanelProps) {
  const { data: similar } = trpc.similarity.getSimilar.useQuery({
    eventId,
    threshold: 0.7,
    limit: 5
  });

  if (!similar?.length) return null;

  return (
    <Panel title="Related Items">
      {similar.map(item => (
        <SimilarItemCard
          key={item.id}
          item={item}
          showDuplicateBadge={item.score >= 0.85}
        />
      ))}
    </Panel>
  );
}
```

Integrate into EventDetail.

**Acceptance criteria:**
- [ ] Shows similar items on detail view
- [ ] Displays similarity score
- [ ] Links to related items
- [ ] Hidden when none found

**Hours:** 3

---

#### Story 12.9: Add "Likely Duplicate" badge

**Context:** Prominently flag items that are very similar (>0.85).

**Implementation:**

Create badge component:

```tsx
export function DuplicateBadge({ similarity }: { similarity: number }) {
  if (similarity < 0.85) return null;

  return (
    <Badge color="danger" variant="flat">
      Likely Duplicate ({Math.round(similarity * 100)}%)
    </Badge>
  );
}
```

Show in:
- Event list items
- Event detail header
- Similar items panel

**Acceptance criteria:**
- [ ] Badge shown for >0.85 similarity
- [ ] Shows percentage
- [ ] Appears in relevant places
- [ ] Visually prominent

**Hours:** 2

---

#### Story 12.10: Integrate embedding into Event creation

**Context:** Generate embeddings when new Events are stored.

**Implementation:**

Modify `src/server/services/event-transformer.ts`:

```typescript
async function storeEvents(
  db: PrismaClient,
  userId: string,
  events: TransformedEvent[]
): Promise<StoreResult> {
  // Existing storage logic

  // After storing, queue embedding generation
  for (const event of storedEvents) {
    if (event.type !== 'comment') { // Only issues and MRs
      await queueEmbeddingGeneration(event.id);
    }
  }
}
```

**Options for async processing:**
- Inngest job for background embedding
- Direct inline (slower but simpler)
- Batch at end of refresh

**Acceptance criteria:**
- [ ] New Events get embeddings
- [ ] Doesn't block event storage
- [ ] Comments excluded
- [ ] Error handling for failures

**Hours:** 2

---

## Epic 13: Decision Archaeology View

**Goal:** Enable "What was decided about X?" queries into historical discussions.

**Testable when closed:**
- Can search and see relevant past discussions
- Results ranked by relevance
- Can drill into full threads

**Dependencies:** Epic 12 (Similarity), Epic 8 (Person)

### Stories

---

#### Story 13.1: Enhance FTS to weight content types

**Context:** Title matches should rank higher than body matches.

**Implementation:**

Update `src/lib/search/postgres-fts.ts`:

```sql
-- Weighted search
SELECT
  e.id,
  e.title,
  ts_rank(
    setweight(to_tsvector('english', e.title), 'A') ||
    setweight(to_tsvector('english', COALESCE(e.body, '')), 'B'),
    plainto_tsquery('english', $1)
  ) as rank
FROM "Event" e
WHERE
  to_tsvector('english', e.title || ' ' || COALESCE(e.body, ''))
  @@ plainto_tsquery('english', $1)
ORDER BY rank DESC
```

**Weight meanings:**
- A (title): Highest weight
- B (body): Medium weight
- C, D: Lower weights (for future use)

**Acceptance criteria:**
- [ ] Title matches ranked higher
- [ ] Search still fast
- [ ] Existing search tests pass

**Hours:** 3

---

#### Story 13.2: Create getDecisions endpoint

**Context:** API for decision archaeology queries.

**Implementation:**

Add to `src/server/api/routers/decisions.ts`:

```typescript
export const decisionsRouter = createTRPCRouter({
  // Search for decisions/discussions
  search: protectedProcedure
    .input(z.object({
      query: z.string(),
      types: z.array(z.enum(['issue', 'merge_request', 'comment'])).optional(),
      dateRange: z.object({
        from: z.date().optional(),
        to: z.date().optional()
      }).optional(),
      limit: z.number().default(20)
    }))
    .query(async ({ ctx, input }) => {
      // Combine FTS with semantic search
      // Return ranked results with context
    })
});
```

**Search strategy:**
1. FTS for keyword matches
2. Semantic search for meaning matches
3. Combine and deduplicate
4. Return with context snippets

**Acceptance criteria:**
- [ ] Searches all content types
- [ ] Date range filtering
- [ ] Returns context snippets
- [ ] Combined keyword + semantic

**Hours:** 3

---

#### Story 13.3: Create DecisionView page

**Context:** Dedicated page for decision archaeology.

**Implementation:**

Create `src/app/(auth)/decisions/page.tsx`:

```tsx
export default async function DecisionsPage() {
  await requireAuth();
  return <DecisionViewClient />;
}
```

Create `src/components/decisions/DecisionViewClient.tsx`:

```tsx
export function DecisionViewClient() {
  // Search input
  // Date range filter
  // Type filter (issues/MRs/comments)
  // Results list
  // Empty state with example queries
}
```

**Example queries to suggest:**
- "OAuth implementation"
- "database schema"
- "API design"

**Acceptance criteria:**
- [ ] Page renders at /decisions
- [ ] Search with filters
- [ ] Shows results with context
- [ ] Sidebar link added

**Hours:** 3

---

#### Story 13.4: Create DecisionResultCard

**Context:** Display search results with context and participants.

**Implementation:**

Create `src/components/decisions/DecisionResultCard.tsx`:

```tsx
interface DecisionResultCardProps {
  result: {
    event: Event;
    rank: number;
    snippet: string; // Highlighted context
    participants: Person[];
    discussionCount: number;
  };
}

export function DecisionResultCard({ result }: DecisionResultCardProps) {
  // Event type badge
  // Title (highlighted matches)
  // Context snippet
  // Participants avatars
  // Discussion count
  // Date
  // Click to view full discussion
}
```

**Acceptance criteria:**
- [ ] Shows highlighted context
- [ ] Displays participants
- [ ] Discussion count shown
- [ ] Links to full view

**Hours:** 4

---

#### Story 13.5: Add discussion thread aggregation

**Context:** Group related Events into discussion threads.

**Implementation:**

Create `src/server/services/thread-aggregator.ts`:

```typescript
interface DiscussionThread {
  rootEvent: Event;           // Issue or MR
  comments: Event[];          // Related comments
  participants: Person[];     // All people involved
  dateRange: { start: Date; end: Date };
}

async function aggregateThread(
  db: PrismaClient,
  userId: string,
  eventId: string
): Promise<DiscussionThread>
```

**Aggregation logic:**
1. If comment: find parent issue/MR
2. Find all comments on the parent
3. Extract unique participants
4. Calculate date range

**Acceptance criteria:**
- [ ] Groups comments with parent
- [ ] Extracts participants
- [ ] Calculates date range
- [ ] Works for issues and MRs

**Hours:** 4

---

#### Story 13.6: Create ThreadView component

**Context:** Display full discussion thread.

**Implementation:**

Create `src/components/decisions/ThreadView.tsx`:

```tsx
interface ThreadViewProps {
  eventId: string;
}

export function ThreadView({ eventId }: ThreadViewProps) {
  // Root event (issue/MR) at top
  // Comments in chronological order
  // Participant sidebar
  // Highlight search terms if from search
}
```

**Layout:**
- Header: Event title, type, dates
- Sidebar: Participants with avatars
- Main: Chronological comments
- Footer: Link to GitLab

**Acceptance criteria:**
- [ ] Shows full discussion
- [ ] Comments in order
- [ ] Participants visible
- [ ] Search terms highlighted

**Hours:** 3

---

#### Story 13.7: Add timeline visualization

**Context:** Show when discussion happened over time.

**Implementation:**

Create `src/components/decisions/ThreadTimeline.tsx`:

```tsx
interface ThreadTimelineProps {
  thread: DiscussionThread;
}

export function ThreadTimeline({ thread }: ThreadTimelineProps) {
  // Horizontal timeline
  // Dots for each comment
  // Hover for details
  // Shows activity intensity
}
```

**Visualization:**
- Timeline axis from first to last comment
- Dots/markers for each comment
- Density shows activity bursts
- Click to jump to comment

**Acceptance criteria:**
- [ ] Shows timeline of activity
- [ ] Interactive (click to jump)
- [ ] Shows relative timing
- [ ] Handles long discussions

**Hours:** 3

---

#### Story 13.8: Integrate with Expert View

**Context:** Show who was involved in decision discussions.

**Implementation:**

Add to DecisionResultCard:

```tsx
// "Key contributors" section
<div className="mt-2">
  <span className="text-sm text-gray-500">Key contributors:</span>
  <div className="flex gap-1 mt-1">
    {participants.slice(0, 5).map(p => (
      <Link href={`/people/${p.id}`} key={p.id}>
        <Avatar src={p.avatarUrl} size="sm" />
      </Link>
    ))}
    {participants.length > 5 && (
      <span>+{participants.length - 5} more</span>
    )}
  </div>
</div>
```

Also add "Related decisions" to PersonDetailView.

**Acceptance criteria:**
- [ ] Shows contributors on results
- [ ] Links to Person views
- [ ] Person view shows their decisions

**Hours:** 2

---

#### Story 13.9: Add related decisions suggestions

**Context:** When viewing a decision, show related discussions.

**Implementation:**

Add to ThreadView:

```tsx
// After main thread content
<RelatedDecisions eventId={thread.rootEvent.id} />
```

Create `src/components/decisions/RelatedDecisions.tsx`:

```tsx
export function RelatedDecisions({ eventId }: { eventId: string }) {
  const { data } = trpc.similarity.getSimilar.useQuery({
    eventId,
    threshold: 0.6,
    limit: 5
  });

  return (
    <Panel title="Related Discussions">
      {data?.map(item => (
        <RelatedDecisionCard key={item.id} item={item} />
      ))}
    </Panel>
  );
}
```

**Acceptance criteria:**
- [ ] Shows related discussions
- [ ] Uses similarity scoring
- [ ] Links to other threads
- [ ] Hidden when none found

**Hours:** 3

---

## Epic 14: Activity View & Filtering

**Goal:** "What's happening?" view with smart filtering.

**Testable when closed:**
- Activity feed with date range
- Filters by territory/person/topic
- Relevance scoring surfaces what matters

**Dependencies:** Epic 10 (Territory), Epic 8 (Person)

### Stories

---

#### Story 14.1: Create activity-relevance-scorer service

**Context:** Score events by relevance to user's interests.

**Implementation:**

Create `src/server/services/activity-relevance-scorer.ts`:

```typescript
interface RelevanceScore {
  territoryMatch: number;  // 0-1
  personMatch: number;     // 0-1
  topicMatch: number;      // 0-1
  recency: number;         // 0-1
  totalScore: number;      // Weighted
}

async function scoreEventRelevance(
  db: PrismaClient,
  userId: string,
  event: Event,
  userContext: {
    territories: string[];      // User's active directories
    watchedPeople: string[];    // People user follows
    watchedTopics: string[];    // Topics user watches
  }
): Promise<RelevanceScore>
```

**Scoring:**
- Territory: Does event touch user's directories?
- Person: Is author someone user watches?
- Topic: Does content match watched keywords?
- Recency: How recent? (1 = today, 0 = 30+ days)

**Acceptance criteria:**
- [ ] Scores all relevance signals
- [ ] Weights match spec
- [ ] Returns breakdown
- [ ] Efficient for batch scoring

**Hours:** 4

---

#### Story 14.2: Add getActivityFeed endpoint

**Context:** API for filtered activity feed.

**Implementation:**

Create `src/server/api/routers/activity.ts`:

```typescript
export const activityRouter = createTRPCRouter({
  getFeed: protectedProcedure
    .input(z.object({
      dateRange: z.object({
        from: z.date(),
        to: z.date()
      }),
      filters: z.object({
        territories: z.array(z.string()).optional(),
        people: z.array(z.string()).optional(),
        topics: z.array(z.string()).optional(),
        types: z.array(z.enum(['issue', 'merge_request', 'comment'])).optional()
      }).optional(),
      limit: z.number().default(50),
      cursor: z.string().optional() // Pagination
    }))
    .query(async ({ ctx, input }) => {
      // Fetch events in date range
      // Apply filters
      // Score relevance
      // Sort by relevance × recency
      // Return with cursor for pagination
    })
});
```

**Acceptance criteria:**
- [ ] Date range filtering
- [ ] Territory/person/topic filters
- [ ] Relevance scoring
- [ ] Pagination support

**Hours:** 3

---

#### Story 14.3: Create ActivityView page

**Context:** Dedicated activity feed page.

**Implementation:**

Create `src/app/(auth)/activity/page.tsx`:

```tsx
export default async function ActivityPage() {
  await requireAuth();
  return <ActivityViewClient />;
}
```

Create `src/components/activity/ActivityViewClient.tsx`:

```tsx
export function ActivityViewClient() {
  // Date range picker (last 24h, 7d, 30d, custom)
  // Filter panel (territory, person, topic)
  // Activity feed
  // Relevance indicator on each item
}
```

**Acceptance criteria:**
- [ ] Page renders at /activity
- [ ] Date range selector
- [ ] Filter panel
- [ ] Infinite scroll

**Hours:** 3

---

#### Story 14.4: Add territory filter

**Context:** Filter activity to user's areas of interest.

**Implementation:**

Add to ActivityViewClient:

```tsx
// Territory filter
<FilterSection title="Territory">
  <DirectoryPicker
    selected={filters.territories}
    onChange={(dirs) => setFilters({ ...filters, territories: dirs })}
    suggestions={userTerritories} // From Epic 11
  />
</FilterSection>
```

**Suggestions source:**
- User's recent commit directories
- User's open MR directories
- Manually added directories

**Acceptance criteria:**
- [ ] Can select directories to watch
- [ ] Suggests based on user activity
- [ ] Filter applies to feed
- [ ] Multiple directories supported

**Hours:** 3

---

#### Story 14.5: Add person filter

**Context:** Filter activity to specific people.

**Implementation:**

```tsx
<FilterSection title="People">
  <PersonPicker
    selected={filters.people}
    onChange={(people) => setFilters({ ...filters, people })}
    suggestions={frequentCollaborators}
  />
</FilterSection>
```

**Suggestions:**
- People user has commented on
- People who commented on user's work
- People in same territories

**Acceptance criteria:**
- [ ] Can select people to watch
- [ ] Shows suggestions
- [ ] Filter applies to feed
- [ ] Multiple people supported

**Hours:** 2

---

#### Story 14.6: Add topic filter

**Context:** Filter activity by keywords/topics.

**Implementation:**

```tsx
<FilterSection title="Topics">
  <TopicInput
    topics={filters.topics}
    onChange={(topics) => setFilters({ ...filters, topics })}
    suggestions={recentSearchTerms}
  />
</FilterSection>
```

**Topic matching:**
- FTS search on title + body
- Label matching
- File path matching

**Acceptance criteria:**
- [ ] Can add topic keywords
- [ ] Suggests from search history
- [ ] FTS matching
- [ ] Multiple topics (OR logic)

**Hours:** 2

---

#### Story 14.7: Create ActivityCard component

**Context:** Display activity items with relevance indicator.

**Implementation:**

Create `src/components/activity/ActivityCard.tsx`:

```tsx
interface ActivityCardProps {
  event: Event;
  relevance: RelevanceScore;
}

export function ActivityCard({ event, relevance }: ActivityCardProps) {
  // Type icon (issue/MR/comment)
  // Title
  // Author with avatar
  // Relevance bar/indicator
  // Time ago
  // Click to view details
}
```

**Relevance indicator:**
- Color gradient (red = very relevant, gray = less)
- Tooltip showing why relevant

**Acceptance criteria:**
- [ ] Shows all event types
- [ ] Relevance indicator visible
- [ ] Explains relevance on hover
- [ ] Links to detail view

**Hours:** 3

---

#### Story 14.8: Add "My Activity" quick filter

**Context:** One-click filter for activity in user's territory.

**Implementation:**

```tsx
<QuickFilters>
  <QuickFilterButton
    label="My Activity"
    active={isMyActivityFilter}
    onClick={() => {
      setFilters({
        territories: userTerritories,
        people: [],
        topics: []
      });
    }}
  />
  <QuickFilterButton
    label="Everything"
    active={!hasFilters}
    onClick={() => clearFilters()}
  />
</QuickFilters>
```

**"My Activity" includes:**
- Events in user's territory
- Events mentioning user
- Responses to user's work

**Acceptance criteria:**
- [ ] Quick filter button
- [ ] Uses user's territory
- [ ] One-click activation
- [ ] Clear indicator when active

**Hours:** 3

---

#### Story 14.9: Persist filter preferences

**Context:** Save user's filter settings.

**Implementation:**

Add to User model:
```prisma
model User {
  // ... existing
  activityFilters Json? // { territories: [], people: [], topics: [] }
}
```

Save/load on ActivityView:

```typescript
// Load saved filters on mount
const savedFilters = user.activityFilters;

// Save when filters change
const debouncedSave = useDebouncedCallback((filters) => {
  updateUserPrefs.mutate({ activityFilters: filters });
}, 1000);
```

**Acceptance criteria:**
- [ ] Filters saved to user prefs
- [ ] Restored on page load
- [ ] Debounced saves
- [ ] Works across sessions

**Hours:** 2

---

#### Story 14.10: Add activity trend visualization

**Context:** Show activity volume over time.

**Implementation:**

Create `src/components/activity/ActivityTrend.tsx`:

```tsx
interface ActivityTrendProps {
  dateRange: { from: Date; to: Date };
  filters?: ActivityFilters;
}

export function ActivityTrend({ dateRange, filters }: ActivityTrendProps) {
  // Area chart showing activity volume per day
  // Color-coded by type
  // Hover for counts
}
```

**Chart library:** Use recharts or similar.

**Acceptance criteria:**
- [ ] Shows daily activity counts
- [ ] Respects filters
- [ ] Color by event type
- [ ] Interactive (hover for details)

**Hours:** 3

---

## Epic 15: Email Digest

**Goal:** Proactive daily briefing via email.

**Testable when closed:**
- Can configure digest preferences
- Daily email with relevant activity
- Unsubscribe works

**Dependencies:** Epic 14 (Activity relevance), Epic 10 (Territory)

### Stories

---

#### Story 15.1: Add DigestPreference model

**Context:** Store user's digest configuration.

**Implementation:**

Add to schema:
```prisma
model DigestPreference {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  enabled       Boolean  @default(false)
  frequency     String   @default("daily") // daily, weekly
  sendTime      String   @default("08:00") // HH:mm UTC

  // Filters (what to include)
  territories   String[] // Directories to watch
  topics        String[] // Keywords to watch

  // Thresholds
  minRelevance  Float    @default(0.5)
  maxItems      Int      @default(15)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

**Acceptance criteria:**
- [ ] Model created
- [ ] Linked to User
- [ ] Default values set
- [ ] Migration runs

**Hours:** 2

---

#### Story 15.2: Create digest settings page

**Context:** UI to configure email digest.

**Implementation:**

Create `src/app/(auth)/settings/digest/page.tsx`:

```tsx
export default async function DigestSettingsPage() {
  await requireAuth();
  return <DigestSettingsClient />;
}
```

Create `src/components/settings/DigestSettingsClient.tsx`:

```tsx
export function DigestSettingsClient() {
  // Enable/disable toggle
  // Frequency selector
  // Send time picker
  // Territory filter (reuse from Activity)
  // Topic filter
  // Threshold sliders
  // Test send button
}
```

**Acceptance criteria:**
- [ ] Can enable/disable
- [ ] Can set frequency
- [ ] Can configure filters
- [ ] Saves to DigestPreference

**Hours:** 3

---

#### Story 15.3: Set up email integration

**Context:** Configure email sending service.

**Implementation:**

Install Resend:
```bash
npm install resend @react-email/components
```

Create `src/server/services/email-service.ts`:

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(options: {
  to: string;
  subject: string;
  react: React.ReactElement;
}): Promise<{ success: boolean; id?: string }>
```

Add to `.env`:
```
RESEND_API_KEY=re_xxxxx
```

**Acceptance criteria:**
- [ ] Resend configured
- [ ] Can send test email
- [ ] Environment variable set
- [ ] Error handling

**Hours:** 2

---

#### Story 15.4: Create DigestEmail template

**Context:** Email template for daily digest.

**Implementation:**

Create `src/emails/digest-email.tsx`:

```tsx
import { Html, Head, Body, Container, Section, Text, Link } from '@react-email/components';

interface DigestEmailProps {
  userName: string;
  dateRange: string;
  activities: DigestActivity[];
  stats: {
    total: number;
    byType: Record<string, number>;
  };
}

export function DigestEmail({ userName, activities, stats }: DigestEmailProps) {
  return (
    <Html>
      <Head />
      <Body>
        <Container>
          {/* Header */}
          <Section>
            <Text>Hi {userName}, here's your GitLab activity digest</Text>
          </Section>

          {/* Summary stats */}
          <Section>
            <Text>{stats.total} items in your areas of interest</Text>
          </Section>

          {/* Activity list by relevance */}
          <Section>
            {activities.map(activity => (
              <DigestActivityRow key={activity.id} activity={activity} />
            ))}
          </Section>

          {/* Footer with unsubscribe */}
          <Section>
            <Link href={unsubscribeUrl}>Unsubscribe</Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
```

**Acceptance criteria:**
- [ ] Clean email layout
- [ ] Shows relevant activities
- [ ] Links to GitLab Insights
- [ ] Unsubscribe link

**Hours:** 4

---

#### Story 15.5: Implement digest-generator service

**Context:** Generate digest content for a user.

**Implementation:**

Create `src/server/services/digest-generator.ts`:

```typescript
interface DigestContent {
  activities: DigestActivity[];
  stats: DigestStats;
  generatedAt: Date;
}

async function generateDigest(
  db: PrismaClient,
  userId: string,
  preferences: DigestPreference
): Promise<DigestContent | null> {
  // 1. Get date range (last 24h for daily)
  const from = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const to = new Date();

  // 2. Fetch events in range
  const events = await getEventsInRange(db, userId, from, to);

  // 3. Score relevance
  const scored = await scoreEvents(events, preferences);

  // 4. Filter by threshold
  const relevant = scored.filter(e => e.score >= preferences.minRelevance);

  // 5. Sort and limit
  const activities = relevant
    .sort((a, b) => b.score - a.score)
    .slice(0, preferences.maxItems);

  // 6. Return null if nothing to send
  if (activities.length === 0) return null;

  return { activities, stats: calculateStats(activities), generatedAt: to };
}
```

**Acceptance criteria:**
- [ ] Generates relevant activities
- [ ] Respects thresholds
- [ ] Returns null if empty
- [ ] Calculates stats

**Hours:** 4

---

#### Story 15.6: Create Inngest scheduled function

**Context:** Cron job to send daily digests.

**Implementation:**

Create `src/inngest/functions/daily-digest.ts`:

```typescript
import { inngest } from '../client';

export const sendDailyDigests = inngest.createFunction(
  { id: 'send-daily-digests' },
  { cron: '0 * * * *' }, // Every hour, check who needs digest
  async ({ step }) => {
    // 1. Find users with digests due
    const users = await step.run('find-users', async () => {
      return db.digestPreference.findMany({
        where: {
          enabled: true,
          // sendTime matches current hour
        },
        include: { user: true }
      });
    });

    // 2. Generate and send for each
    for (const pref of users) {
      await step.run(`send-digest-${pref.userId}`, async () => {
        const content = await generateDigest(db, pref.userId, pref);
        if (content) {
          await sendDigestEmail(pref.user.email, content);
        }
      });
    }
  }
);
```

**Acceptance criteria:**
- [ ] Runs hourly
- [ ] Sends to users at their preferred time
- [ ] Handles failures gracefully
- [ ] Logs results

**Hours:** 3

---

#### Story 15.7: Add digest preview feature

**Context:** Let user preview what digest would look like.

**Implementation:**

Add to digest settings:

```tsx
<Button onClick={handlePreview}>
  Preview Digest
</Button>

<DigestPreviewModal
  isOpen={previewOpen}
  content={previewContent}
  onClose={() => setPreviewOpen(false)}
/>
```

Add tRPC endpoint:
```typescript
previewDigest: protectedProcedure
  .query(async ({ ctx }) => {
    const prefs = await getDigestPrefs(ctx.db, ctx.session.userId);
    return generateDigest(ctx.db, ctx.session.userId, prefs);
  })
```

**Acceptance criteria:**
- [ ] Preview button on settings
- [ ] Shows what digest would contain
- [ ] Uses current preferences
- [ ] Renders email content

**Hours:** 2

---

#### Story 15.8: Implement threshold and daily limit

**Context:** Ensure digest quality by filtering low-relevance items.

**Implementation:**

Already in generateDigest, but add UI controls:

```tsx
<FormField label="Minimum Relevance">
  <Slider
    min={0.3}
    max={0.9}
    step={0.1}
    value={minRelevance}
    onChange={setMinRelevance}
  />
  <HelpText>Lower = more items, Higher = only most relevant</HelpText>
</FormField>

<FormField label="Maximum Items">
  <NumberInput
    min={5}
    max={30}
    value={maxItems}
    onChange={setMaxItems}
  />
  <HelpText>Maximum items per digest (default: 15)</HelpText>
</FormField>
```

**Acceptance criteria:**
- [ ] Can adjust relevance threshold
- [ ] Can set max items
- [ ] Defaults match spec (0.5, 15)
- [ ] Changes affect preview

**Hours:** 2

---

#### Story 15.9: Add "alert me about this" from search

**Context:** Search results offer option to add topic to digest.

**Implementation:**

Add to search results:

```tsx
<SearchResultCard>
  {/* ... existing content */}
  <DropdownMenu>
    <DropdownItem onClick={() => addToDigest(searchTerm)}>
      Add "{searchTerm}" to daily digest
    </DropdownItem>
  </DropdownMenu>
</SearchResultCard>
```

Add topic to DigestPreference.topics array.

**Acceptance criteria:**
- [ ] Option available on search results
- [ ] Adds topic to digest prefs
- [ ] Shows confirmation toast
- [ ] Visible in digest settings

**Hours:** 3

---

#### Story 15.10: Create digest analytics

**Context:** Track digest engagement.

**Implementation:**

Add tracking model:
```prisma
model DigestLog {
  id          String   @id @default(cuid())
  userId      String
  sentAt      DateTime
  itemCount   Int
  openedAt    DateTime?
  clickCount  Int      @default(0)
}
```

Add tracking pixel/link tracking to email:
```tsx
// In email template
<img src={`${baseUrl}/api/digest/track?id=${digestId}&event=open`} />

// Links
<Link href={`${baseUrl}/api/digest/track?id=${digestId}&event=click&target=${eventUrl}`}>
```

Add analytics view to settings.

**Acceptance criteria:**
- [ ] Tracks email opens
- [ ] Tracks link clicks
- [ ] Shows stats on settings
- [ ] Respects privacy (opt-in)

**Hours:** 2

---

## Epic 16: MR Context View (Bonus)

**Goal:** Enhanced MR view with intelligent suggestions.

**Testable when closed:**
- MR shows suggested reviewers
- Related decisions displayed
- Collision alerts integrated

**Dependencies:** Epic 10 (Expertise), Epic 11 (Territory), Epic 12 (Similarity)

### Stories (abbreviated)

| # | Story | Hours |
|---|-------|-------|
| 16.1 | Create getMRContext tRPC endpoint aggregating expertise + territory + similarity | 4 |
| 16.2 | Add suggested reviewers based on file expertise (exclude author) | 3 |
| 16.3 | Create MRContextPanel component showing all suggestions | 4 |
| 16.4 | Add related decisions section - past discussions on touched files | 3 |
| 16.5 | Integrate collision alerts prominently | 2 |
| 16.6 | Add similar MRs section using similarity scoring | 3 |
| 16.7 | Create reviewer suggestion explanation (why this person) | 2 |

---

## Epic 17: Incident Response Mode (Bonus)

**Goal:** Quick expert finding for production issues.

**Testable when closed:**
- Enter path, see instant experts
- Recent changes displayed
- Related discussions surfaced

**Dependencies:** Epic 10 (Expertise), Epic 13 (Decisions)

### Stories (abbreviated)

| # | Story | Hours |
|---|-------|-------|
| 17.1 | Create IncidentResponseView page at /incident | 3 |
| 17.2 | Add quick path input with autocomplete from File model | 3 |
| 17.3 | Show instant expert list with contact info | 3 |
| 17.4 | Show recent commits to area (last 30 days) | 3 |
| 17.5 | Show related discussions about the area | 3 |
| 17.6 | Add recent incidents section if historical data available | 2 |
| 17.7 | Create shareable incident response URL | 2 |

---

## Critical Files for Implementation

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Add Person, Commit, File, MRFileChange, DigestPreference entities |
| `src/server/services/gitlab-client.ts` | Extend for commits, MR changes |
| `src/server/services/expertise-scorer.ts` | New - expertise scoring algorithms |
| `src/server/services/territory-scorer.ts` | New - territory/collision detection |
| `src/server/services/similarity-scorer.ts` | New - embedding similarity |
| `src/server/services/embedding-generator.ts` | New - text embeddings |
| `src/server/services/activity-relevance-scorer.ts` | New - digest relevance |
| `src/server/services/digest-generator.ts` | New - digest content generation |

---

_Generated from Design Thinking Session - GitLab Insights Intelligence Platform_
