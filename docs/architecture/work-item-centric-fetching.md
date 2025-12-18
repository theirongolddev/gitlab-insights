# Architecture Redesign: Work-Item-Centric Fetching

> **Status:** Approved for implementation
> **Created:** 2024-12-18
> **Issue:** Parent-child linking fails 87% of the time with current event-centric approach

## The Fundamental Problem

**Current approach (event-centric, broken):**
```
1. Fetch 250 issues (bulk)
2. Fetch 250 MRs (bulk)
3. Fetch notes for first 75 of each (bulk)
4. Store everything flat
5. Try to link notes to parents (fails 87% because parent wasn't fetched!)
```

**Desired approach (work-item-centric):**
```
1. Decide which work items matter (top N by activity)
2. For EACH work item, fetch ALL its activity
3. Store parent + children together as a unit
4. No post-hoc linking needed
```

## Schema Assessment

**The current schema is fine.** It already supports:
- Self-referencing hierarchy (`parentEventId` → `Event`)
- `parent` / `children` relations via `EventHierarchy`
- Activity metadata per work item

**No schema migration needed.** Only the fetching strategy needs to change.

## New Fetching Strategy

### Phase 1: Identify Work Items to Track

```typescript
// Fetch top N issues/MRs by updated_at (most recent activity first)
const topIssues = await fetchIssues(projectIds, {
  limit: 25,
  state: "opened",
  orderBy: "updated_at"
});

const topMRs = await fetchMergeRequests(projectIds, {
  limit: 25,
  state: "opened",
  orderBy: "updated_at"
});
```

### Phase 2: Fetch Complete Activity for Each

```typescript
for (const issue of topIssues) {
  // Fetch ALL notes for this specific issue (no pagination limit)
  const notes = await fetchAllNotesForIssue(projectId, issue.iid);

  // Store parent first
  await storeWorkItem(issue);

  // Store children with parent link set immediately
  await storeActivities(notes, parentEventId: issue.dbId);
}
```

### Phase 3: No Linking Step Needed

Because we:
1. Fetch the parent first
2. Immediately store it
3. Then fetch and store children with the parent reference

The `parentEventId` is set correctly from the start.

## Implementation Changes

### 1. New GitLab Client Method

**File:** `src/server/services/gitlab-client.ts`

```typescript
/**
 * Fetch a limited set of work items with ALL their activity
 * This is work-item-centric: fewer items, complete data
 */
async fetchWorkItemsWithActivity(
  projectIds: string[],
  options: {
    issueLimit?: number;  // default: 25
    mrLimit?: number;     // default: 25
    state?: "opened" | "all";
  }
): Promise<WorkItemWithActivity[]> {

  // 1. Fetch top N issues and MRs
  const issues = await this.fetchTopIssues(projectIds, options.issueLimit);
  const mrs = await this.fetchTopMRs(projectIds, options.mrLimit);

  // 2. For each, fetch ALL notes (no pagination limit)
  const workItems: WorkItemWithActivity[] = [];

  for (const issue of issues) {
    const notes = await this.fetchAllNotesForIssue(issue.project_id, issue.iid);
    workItems.push({ parent: issue, children: notes, type: 'issue' });
  }

  for (const mr of mrs) {
    const notes = await this.fetchAllNotesForMR(mr.project_id, mr.iid);
    workItems.push({ parent: mr, children: notes, type: 'merge_request' });
  }

  return workItems;
}

/**
 * Fetch ALL notes for a single issue (no pagination limit)
 */
private async fetchAllNotesForIssue(projectId: number, issueIid: number) {
  const url = `${this.baseUrl}/projects/${projectId}/issues/${issueIid}/notes`;
  return this.fetchPaginated(url, Infinity); // No page limit
}
```

### 2. New Storage Method

**File:** `src/server/services/event-transformer.ts`

```typescript
/**
 * Store a work item with all its activity in one transaction
 * Parent is stored first, children reference it immediately
 */
async function storeWorkItemWithActivity(
  db: PrismaClient,
  userId: string,
  workItem: WorkItemWithActivity
): Promise<void> {
  await db.$transaction(async (tx) => {
    // 1. Upsert the parent (issue/MR)
    const parent = await tx.event.upsert({
      where: { gitlabEventId: workItem.parent.gitlabEventId },
      create: { ...transformParent(workItem.parent), userId },
      update: { ...transformParent(workItem.parent) },
    });

    // 2. Upsert children with parentEventId set immediately
    for (const note of workItem.children) {
      await tx.event.upsert({
        where: { gitlabEventId: `note-${note.id}` },
        create: {
          ...transformNote(note),
          userId,
          parentEventId: parent.id,  // ← Set immediately!
        },
        update: {
          ...transformNote(note),
          parentEventId: parent.id,
        },
      });
    }

    // 3. Update activity metadata (already have all children)
    await tx.event.update({
      where: { id: parent.id },
      data: {
        commentCount: workItem.children.filter(n => !n.system).length,
        lastActivityAt: maxDate(workItem.children.map(n => n.created_at)),
        participants: uniqueAuthors(workItem.children),
      },
    });
  });
}
```

### 3. Simplified Sync Flow

**File:** `src/server/api/routers/events.ts` (manualRefresh)

```typescript
// OLD: Fetch bulk, store bulk, link after
const { issues, mergeRequests, notes } = await gitlabClient.fetchEvents(...);
await storeEvents(...);
await linkParentEvents(...);  // Often fails!
await updateActivityMetadata(...);

// NEW: Fetch work items with activity, store as units
const workItems = await gitlabClient.fetchWorkItemsWithActivity(projectIds, {
  issueLimit: 25,
  mrLimit: 25,
  state: "opened",
});

for (const workItem of workItems) {
  await storeWorkItemWithActivity(db, userId, workItem);
}
// No linking step needed!
```

## Benefits of This Approach

| Aspect | Old (Event-centric) | New (Work-item-centric) |
|--------|---------------------|-------------------------|
| Parent-child linking | Post-hoc, 13% success | Immediate, 100% success |
| Data completeness | Shallow (limited notes) | Deep (all notes per item) |
| API calls | Many bulk calls | Fewer targeted calls |
| Storage atomicity | Batch, can partially fail | Per-item transactions |
| Mental model | "Events that might link" | "Work items with their activity" |

## Migration Path

1. **Add new methods** alongside existing ones (no breaking changes)
2. **Update manualRefresh** to use new approach
3. **Wipe and resync** to populate with correct data
4. **Remove old methods** once verified working

## Files to Modify

| File | Changes |
|------|---------|
| `src/server/services/gitlab-client.ts` | Add `fetchWorkItemsWithActivity`, `fetchAllNotesForIssue`, `fetchAllNotesForMR` |
| `src/server/services/event-transformer.ts` | Add `storeWorkItemWithActivity`, simplify/remove `linkParentEvents` |
| `src/server/api/routers/events.ts` | Update `manualRefresh` to use new flow |
| `src/inngest/functions/api-polling.ts` | Update background sync to use new flow |

## Open Questions

1. **Pagination limit for notes per item?** Currently unlimited, but should we cap at 100-200 for very active items?
2. **Incremental sync?** How do we handle "just fetch new activity" without re-fetching everything?
3. **Closed items?** Should we ever fetch closed issues/merged MRs, or only open?

## Summary

The schema is correct. The fetching strategy was wrong. By switching to work-item-centric fetching:
- Fetch parent first
- Fetch ALL its children
- Store together with immediate linking

We guarantee 100% parent-child linking and complete activity data for tracked items.
