# GitLab Insights Code Quality Standards

## Description
Comprehensive code quality standards for TypeScript/Next.js/TanStack/Tailwind/React development in the GitLab Insights project. Enforces semantic colors, type safety, component patterns, data fetching conventions, and performance optimizations.

## When to use
- When writing or reviewing any code in this project
- When making styling decisions
- When creating new components or pages
- When implementing data fetching logic
- When setting up tRPC procedures
- When encountering ESLint/TypeScript errors
- When optimizing component performance

## Instructions

### 1. Styling Standards

#### 1.1 Semantic Colors (CRITICAL)

**ALWAYS use semantic color tokens from globals.css instead of arbitrary values.**

**✅ CORRECT - Semantic Tokens:**
```typescript
// Use CSS custom properties via Tailwind utilities
<div className="bg-primary text-white" />
<div className="text-success border-success" />
<div className="bg-error-50 text-error-700" />

// For dark mode support
<div className="bg-primary dark:bg-primary-dark" />

// HeroUI components get semantic color props
<Button color="primary" />
<Chip color="success" variant="flat" />
<Badge color="warning" />
```

**❌ WRONG - Hardcoded Colors:**
```typescript
// Never use arbitrary hex values
<div className="bg-[#5e6b24]" /> // ❌ Use bg-primary
<div className="border-l-[#9DAA5F]" /> // ❌ Use border-primary

// Never use generic color names without semantic meaning
<div className="bg-green-500" /> // ❌ Use bg-success
<div className="text-red-600" /> // ❌ Use text-error
```

**Semantic Color Palette:**
```css
/* Available semantic tokens: */
--color-primary: Olive green (#5e6b24)
--color-success: Green
--color-warning: Amber
--color-error: Red

/* Each has variants: */
primary-50, primary-100, ..., primary-900
success-50, success-100, ..., success-900
warning-50, warning-100, ..., warning-900
error-50, error-100, ..., error-900
```

#### 1.2 Tailwind Conventions

**✅ CORRECT:**
```typescript
// 1. Utility-first approach
<div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-900" />

// 2. Conditional classes with template literals
className={`transition-all duration-200 ${
  isUnread ? "border-l-2 border-l-primary font-semibold" : "opacity-80"
}`}

// 3. Dark mode variants
<div className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800" />

// 4. Responsive variants
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" />
```

**❌ WRONG:**
```typescript
// Never use inline styles
<div style={{ backgroundColor: '#5e6b24' }} /> // ❌

// Never mix Tailwind with CSS-in-JS
<div className="px-4" style={{ padding: '16px' }} /> // ❌ Conflicting

// Don't forget dark mode
<div className="bg-white" /> // ❌ Add dark:bg-gray-900
```

#### 1.3 CSS Modules (Only for Complex Animations)

**✅ CORRECT - CSS Modules for animations:**
```typescript
// WorkItemCard.module.css
.expandable-content {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 200ms ease-in-out;
}

.expandable-content.expanded {
  grid-template-rows: 1fr;
}

// Component
import styles from './WorkItemCard.module.css';

<div className={`${styles['expandable-content']} ${isExpanded ? styles.expanded : ''}`} />
```

**❌ WRONG - CSS Modules for simple styles:**
```css
/* Don't use CSS Modules for basic utilities */
.card {
  padding: 16px;        /* ❌ Use px-4 */
  border-radius: 8px;   /* ❌ Use rounded-lg */
}
```

---

### 2. TypeScript Standards

#### 2.1 Type Safety (CRITICAL)

**✅ CORRECT:**
```typescript
// 1. Explicit prop interfaces
interface WorkItemCardProps {
  item: WorkItem;
  onSelect: (id: string) => void;
  isSelected: boolean;
}

// 2. No any types
const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
  event.preventDefault();
};

// 3. Type inference for simple cases
const items = workItems.filter(item => item.status === 'open'); // ✅ Type inferred

// 4. Strict null checks with optional chaining
const author = event.author?.name ?? 'Unknown';

// 5. Use branded types from tRPC
import type { RouterInputs, RouterOutputs } from '~/trpc/react';

type WorkItemsInput = RouterInputs['workItems']['getGrouped'];
type WorkItemsOutput = RouterOutputs['workItems']['getGrouped'];
```

**❌ WRONG:**
```typescript
// Never use any
const handleClick = (event: any) => {}; // ❌

// Don't use non-null assertion without justification
const name = user!.name; // ❌ Use user?.name ?? default

// Don't ignore TypeScript errors
// @ts-ignore // ❌ Fix the error
const result = dangerousOperation();
```

#### 2.2 Import Conventions

**✅ CORRECT - Import Order:**
```typescript
// 1. React/Next.js core
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Metadata } from "next";

// 2. External packages (sorted alphabetically)
import { Card, Button } from "@heroui/react";
import { format } from "date-fns";

// 3. Internal absolute imports (~/ prefix)
import { api } from "~/trpc/react";
import type { WorkItem } from "~/types/work-items";
import { cn } from "~/lib/utils";

// 4. Relative imports (if any)
import { extractKeywords } from "./ContextBadges";
import styles from "./WorkItemCard.module.css";
```

**❌ WRONG:**
```typescript
// Don't mix import styles
import { api } from "~/trpc/react";
import { useState } from "react"; // ❌ React imports should be first
import type { WorkItem } from "../../../types/work-items"; // ❌ Use ~/ alias
```

---

### 3. Component Patterns

#### 3.1 Client/Server Boundary (CRITICAL)

**✅ CORRECT:**
```typescript
// SERVER COMPONENT (page.tsx)
export default async function PeoplePage() {
  // Can use async/await, access DB directly
  const initialData = await db.person.findMany();

  return <PeopleClient initialData={initialData} />;
}

// CLIENT COMPONENT (PeopleClient.tsx)
"use client";

export function PeopleClient({ initialData }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  // Client-side interactivity
  return <div onClick={() => setSelected('123')}>...</div>;
}
```

**❌ WRONG:**
```typescript
// Don't use "use client" in pages unless necessary
"use client"; // ❌ Page components should be server by default

export default function Page() {
  return <div>Static content</div>;
}

// Don't forget "use client" for hooks
export function Component() {
  const [state, setState] = useState(); // ❌ Needs "use client"
  return <div />;
}
```

#### 3.2 Naming Conventions

**Client Components:**
```typescript
// Components with "use client" should end with "Client"
WorkItemCardClient.tsx    // ❌ Already has interactivity, no suffix needed
PeopleClient.tsx          // ✅ Wrapper around server-fetched data
FilesPageClient.tsx       // ✅ Page-level client component
```

**Other Components:**
```typescript
WorkItemCard.tsx          // ✅ Feature component
ActivityTimeline.tsx      // ✅ Presentation component
EmptyStates.tsx           // ✅ Utility component (may export multiple)
```

#### 3.3 Performance Optimization

**✅ CORRECT - Memoize List Items:**
```typescript
import { memo } from "react";

export const WorkItemCard = memo(function WorkItemCard({ item, onSelect }: Props) {
  // Prevents re-render when siblings change
  const keywords = useMemo(() => extractKeywords(item), [item]);

  const handleClick = useCallback(() => {
    onSelect(item.id);
  }, [item.id, onSelect]);

  return <div onClick={handleClick}>{/* ... */}</div>;
});
```

**❌ WRONG:**
```typescript
// Don't memoize single-instance components
export const Header = memo(function Header() { // ❌ Only one header
  return <div>Header</div>;
});

// Don't forget dependencies
const keywords = useMemo(() => extractKeywords(item), []); // ❌ Missing [item]
```

**When to Use Memoization:**
| Technique | Use When | Don't Use When |
|-----------|----------|----------------|
| `React.memo()` | Component renders in a list | Single instance components |
| `useMemo()` | Computation is expensive (>5ms) | Simple operations (<1ms) |
| `useCallback()` | Passing to memoized children | Regular children |

---

### 4. Data Fetching with tRPC

#### 4.1 Client-Side Queries

**✅ CORRECT:**
```typescript
"use client";

export function WorkItemList() {
  const { data, isLoading, error } = api.workItems.getGrouped.useQuery({
    filters: { status: 'open', unreadOnly: true },
    limit: 50,
  });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState message={error.message} />;

  return <div>{/* Render data */}</div>;
}
```

**❌ WRONG:**
```typescript
// Don't use queries without error/loading states
const { data } = api.workItems.getGrouped.useQuery(); // ❌ What if loading/error?
return <div>{data.items}</div>; // ❌ Will crash

// Don't destructure nullable data without checking
const { items } = data; // ❌ data might be undefined
```

#### 4.2 Mutations with Optimistic Updates

**✅ CORRECT:**
```typescript
export function useMarkAsRead() {
  const utils = api.useUtils();
  const pendingIds = useRef(new Set<string>());

  return api.events.markAsRead.useMutation({
    onMutate: async ({ eventId }) => {
      // Prevent duplicate requests
      if (pendingIds.current.has(eventId)) return;
      pendingIds.current.add(eventId);

      // Cancel outgoing requests
      await utils.events.getUnread.cancel();

      // Snapshot previous value
      const previousData = utils.events.getUnread.getData();

      // Optimistically update
      utils.events.getUnread.setData(undefined, (old) =>
        old?.filter((item) => item.id !== eventId)
      );

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      utils.events.getUnread.setData(undefined, context?.previousData);
      pendingIds.current.delete(variables.eventId);
    },
    onSettled: (data, error, { eventId }) => {
      // Refetch to ensure sync
      void utils.events.getUnread.invalidate();
      pendingIds.current.delete(eventId);
    },
  });
}
```

**❌ WRONG:**
```typescript
// Don't mutate without error handling
const mutation = api.events.markAsRead.useMutation(); // ❌ No onError

// Don't forget to invalidate cache
const mutation = api.events.markAsRead.useMutation({
  onSuccess: () => {
    // ❌ Missing utils.events.invalidate()
  },
});
```

#### 4.3 Server-Side Procedures (tRPC Routers)

**✅ CORRECT:**
```typescript
// src/server/api/routers/work-items.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const workItemsRouter = createTRPCRouter({
  getGrouped: protectedProcedure
    .input(
      z.object({
        filters: z.object({
          status: z.enum(['open', 'closed']).optional(),
          unreadOnly: z.boolean().optional(),
        }).optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      // Always validate with Zod
      const { filters, cursor, limit } = input;

      const items = await ctx.db.workItem.findMany({
        where: {
          userId: ctx.session.user.id,
          status: filters?.status,
          isUnread: filters?.unreadOnly ? true : undefined,
        },
        take: limit + 1, // Take one extra for cursor
        orderBy: { lastActivityAt: 'desc' },
      });

      const hasMore = items.length > limit;
      const result = hasMore ? items.slice(0, -1) : items;
      const nextCursor = hasMore ? encodeCursor(items[limit]) : undefined;

      return { items: result, nextCursor };
    }),
});
```

**❌ WRONG:**
```typescript
// Don't skip input validation
export const workItemsRouter = createTRPCRouter({
  getGrouped: protectedProcedure
    .query(async ({ ctx, input }) => { // ❌ No .input() validation
      const filters = input.filters; // ❌ No type safety
    }),
});

// Don't expose sensitive data
.query(async ({ ctx }) => {
  return await ctx.db.user.findMany({
    select: { password: true }, // ❌ Never return passwords
  });
});
```

---

### 5. State Management Patterns

#### 5.1 Context for UI State

**✅ CORRECT:**
```typescript
// contexts/DetailPaneContext.tsx
"use client";

interface DetailPaneContextValue {
  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
}

const DetailPaneContext = createContext<DetailPaneContextValue | null>(null);

export function DetailPaneProvider({ children }: { children: React.ReactNode }) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  return (
    <DetailPaneContext.Provider value={{ selectedEventId, setSelectedEventId }}>
      {children}
    </DetailPaneContext.Provider>
  );
}

export function useDetailPane() {
  const context = useContext(DetailPaneContext);
  if (!context) {
    throw new Error('useDetailPane must be used within DetailPaneProvider');
  }
  return context;
}
```

**❌ WRONG:**
```typescript
// Don't use Context for server state
const EventsContext = createContext(); // ❌ Use React Query instead

export function EventsProvider({ children }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetch('/api/events').then(setEvents); // ❌ Use tRPC + React Query
  }, []);
}
```

#### 5.2 React Query for Server State

**✅ CORRECT:**
```typescript
// ✅ React Query handles caching, refetching, etc.
function EventList() {
  const { data, isLoading } = api.events.list.useQuery();
  // React Query manages the server state
}

// ✅ Shared across components automatically
function EventCount() {
  const { data } = api.events.list.useQuery(); // Same query, shared cache
}
```

---

### 6. File Organization

#### 6.1 Component Structure

```
src/components/
├── work-items/              # Feature-based grouping
│   ├── WorkItemCard.tsx     # Main component
│   ├── WorkItemCard.module.css
│   ├── WorkItemList.tsx
│   ├── WorkItemFilters.tsx
│   └── index.ts             # Re-exports
├── ui/                      # Reusable UI primitives
│   ├── Button/
│   ├── Modal/
│   └── Toast/
└── layout/                  # Layout components
    ├── Header.tsx
    └── Sidebar.tsx
```

#### 6.2 Export Patterns

**✅ CORRECT:**
```typescript
// Named exports for components (tree-shaking friendly)
export const WorkItemCard = memo(function WorkItemCard() { /* ... */ });
export function WorkItemList() { /* ... */ }

// Re-export from index.ts
// components/work-items/index.ts
export { WorkItemCard } from './WorkItemCard';
export { WorkItemList } from './WorkItemList';

// Usage
import { WorkItemCard, WorkItemList } from '~/components/work-items';
```

**❌ WRONG:**
```typescript
// Don't use default exports for components (except pages)
export default function WorkItemCard() {} // ❌

// Don't export everything as default
export default { WorkItemCard, WorkItemList }; // ❌
```

---

### 7. Error Handling

#### 7.1 Client-Side Errors

**✅ CORRECT:**
```typescript
import { toast } from 'sonner';

function handleAction() {
  try {
    performOperation();
  } catch (error) {
    toast.error('Failed to perform action', {
      description: error instanceof Error ? error.message : 'Unknown error',
    });
    logger.error('Action failed', { error });
  }
}
```

#### 7.2 Server-Side Errors

**✅ CORRECT:**
```typescript
import { TRPCError } from "@trpc/server";
import { logger } from "~/lib/logger";

.mutation(async ({ ctx, input }) => {
  try {
    const result = await dangerousOperation(input);
    return result;
  } catch (error) {
    logger.error('Operation failed', { error, input });

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Operation failed',
      cause: error,
    });
  }
}),
```

---

### 8. Testing Standards

#### 8.1 Unit Tests with Vitest

**✅ CORRECT:**
```typescript
// src/utils/cursor.test.ts
import { describe, it, expect, vi } from 'vitest';
import { encodeCursor, decodeCursor } from './cursor';

describe('cursor utilities', () => {
  it('should encode and decode cursor data', () => {
    const data = { createdAt: new Date('2024-01-15'), id: 'abc123' };
    const encoded = encodeCursor(data);
    const decoded = decodeCursor(encoded);

    expect(decoded).toEqual(data);
  });

  it('should return null for invalid cursor', () => {
    const decoded = decodeCursor('invalid-cursor');
    expect(decoded).toBeNull();
  });
});
```

**Test File Organization:**
```
src/
├── utils/
│   ├── cursor.ts
│   └── cursor.test.ts       # Co-located with implementation
├── server/api/routers/
│   ├── people.ts
│   └── people.test.ts       # Co-located with router
```

---

### 9. Performance Best Practices

#### 9.1 Image Optimization

**✅ CORRECT:**
```typescript
import Image from 'next/image';

<Image
  src={avatarUrl}
  alt={`${name}'s avatar`}
  width={40}
  height={40}
  className="rounded-full"
/>
```

**❌ WRONG:**
```typescript
// Don't use <img> for user-uploaded content
<img src={avatarUrl} alt="avatar" /> // ❌ Use Next.js Image
```

#### 9.2 Dynamic Imports

**✅ CORRECT:**
```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('~/components/HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false, // If component is client-only
});
```

---

### 10. Security Patterns

#### 10.1 Input Validation

**✅ CORRECT:**
```typescript
// Always validate with Zod
const schema = z.object({
  title: z.string().min(1).max(200),
  type: z.enum(['issue', 'merge_request']),
});

// In tRPC procedure
.input(schema)
.mutation(async ({ input }) => {
  // input is guaranteed to match schema
});
```

#### 10.2 Authentication

**✅ CORRECT:**
```typescript
// Always use protectedProcedure for authenticated endpoints
export const secureRouter = createTRPCRouter({
  getData: protectedProcedure // ✅ Requires auth
    .query(async ({ ctx }) => {
      // ctx.session is guaranteed to exist
      return getData(ctx.session.user.id);
    }),
});
```

**❌ WRONG:**
```typescript
// Never use publicProcedure for sensitive data
export const secureRouter = createTRPCRouter({
  getData: publicProcedure // ❌ Anyone can call this
    .query(async ({ ctx }) => {
      return getAllUserData(); // ❌ Exposes all users
    }),
});
```

---

## Quick Checklist

**Before Committing Code:**
- [ ] All colors use semantic tokens (primary, success, warning, error)
- [ ] Dark mode variants added for all styled elements
- [ ] TypeScript strict mode compliance (no any, explicit types)
- [ ] Client components have "use client" directive
- [ ] Imports ordered: React → External → Internal → Relative
- [ ] tRPC inputs validated with Zod schemas
- [ ] Loading and error states handled for all queries
- [ ] Optimistic updates include rollback logic
- [ ] Components in lists are memoized with React.memo()
- [ ] No inline styles (use Tailwind utilities)
- [ ] Authentication enforced with protectedProcedure
- [ ] User-facing errors shown via Sonner toasts
- [ ] Server errors logged with Pino

**Code Review Checklist:**
- [ ] Semantic colors used consistently
- [ ] No ESLint warnings (especially react-hooks rules)
- [ ] Type safety maintained throughout
- [ ] Performance optimizations appropriate (not over-engineered)
- [ ] Error handling comprehensive
- [ ] Tests added for new utilities/functions

## Examples

### Example 1: Complete Feature Component

```typescript
"use client";

import { memo, useMemo, useCallback, useState } from "react";
import { Card, Chip, Button } from "@heroui/react";
import { api } from "~/trpc/react";
import type { WorkItem } from "~/types/work-items";
import { toast } from "sonner";
import styles from "./WorkItemCard.module.css";

interface WorkItemCardProps {
  item: WorkItem;
  onSelect: (id: string) => void;
  isSelected: boolean;
}

export const WorkItemCard = memo(function WorkItemCard({
  item,
  onSelect,
  isSelected,
}: WorkItemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const utils = api.useUtils();

  // Memoize expensive computation
  const statusColor = useMemo(() => {
    switch (item.status) {
      case 'open':
        return 'success';
      case 'closed':
        return 'default';
      default:
        return 'warning';
    }
  }, [item.status]);

  // Mutation with error handling
  const markAsRead = api.workItems.markAsRead.useMutation({
    onMutate: async () => {
      await utils.workItems.getGrouped.cancel();
      const previous = utils.workItems.getGrouped.getData();

      // Optimistic update
      utils.workItems.getGrouped.setData(undefined, (old) => ({
        ...old!,
        items: old!.items.map((i) =>
          i.id === item.id ? { ...i, isUnread: false } : i
        ),
      }));

      return { previous };
    },
    onError: (error, _, context) => {
      // Rollback
      utils.workItems.getGrouped.setData(undefined, context?.previous);
      toast.error('Failed to mark as read', {
        description: error.message,
      });
    },
    onSettled: () => {
      void utils.workItems.getGrouped.invalidate();
    },
  });

  const handleClick = useCallback(() => {
    onSelect(item.id);
  }, [item.id, onSelect]);

  const handleMarkAsRead = useCallback(() => {
    markAsRead.mutate({ id: item.id });
  }, [item.id, markAsRead]);

  return (
    <Card
      className={`
        transition-all duration-200 cursor-pointer
        hover:shadow-md
        ${item.isUnread ? "border-l-2 border-l-primary" : "opacity-80"}
        ${isSelected ? "ring-2 ring-primary" : ""}
        bg-white dark:bg-gray-900
      `}
      onClick={handleClick}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {item.title}
          </h3>
          <Chip size="sm" color={statusColor} variant="flat">
            {item.status}
          </Chip>
        </div>

        <div className={`${styles['expandable-content']} ${isExpanded ? styles.expanded : ''}`}>
          <div className="overflow-hidden">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {item.description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <Button
            size="sm"
            variant="light"
            color="primary"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </Button>

          {item.isUnread && (
            <Button
              size="sm"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                handleMarkAsRead();
              }}
              isLoading={markAsRead.isPending}
            >
              Mark as read
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
});
```

### Example 2: tRPC Router with Best Practices

```typescript
// src/server/api/routers/work-items.ts
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { logger } from "~/lib/logger";

export const workItemsRouter = createTRPCRouter({
  getGrouped: protectedProcedure
    .input(
      z.object({
        filters: z
          .object({
            status: z.enum(['open', 'closed']).optional(),
            type: z.enum(['issue', 'merge_request']).optional(),
            unreadOnly: z.boolean().optional(),
            search: z.string().optional(),
          })
          .optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { filters, cursor, limit } = input;
        const userId = ctx.session.user.id;

        const where = {
          userId,
          status: filters?.status,
          type: filters?.type,
          isUnread: filters?.unreadOnly ? true : undefined,
          ...(filters?.search && {
            OR: [
              { title: { contains: filters.search, mode: 'insensitive' as const } },
              { description: { contains: filters.search, mode: 'insensitive' as const } },
            ],
          }),
        };

        const items = await ctx.db.workItem.findMany({
          where,
          take: limit + 1,
          cursor: cursor ? { id: cursor } : undefined,
          orderBy: { lastActivityAt: 'desc' },
          include: {
            project: { select: { name: true, avatarUrl: true } },
            author: { select: { name: true, username: true } },
          },
        });

        const hasMore = items.length > limit;
        const result = hasMore ? items.slice(0, -1) : items;
        const nextCursor = hasMore ? items[limit]!.id : undefined;

        return {
          items: {
            issues: result.filter((i) => i.type === 'issue'),
            mergeRequests: result.filter((i) => i.type === 'merge_request'),
            unreadCount: result.filter((i) => i.isUnread).length,
          },
          nextCursor,
        };
      } catch (error) {
        logger.error('Failed to fetch work items', { error, userId: ctx.session.user.id });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch work items',
          cause: error,
        });
      }
    }),

  markAsRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db.workItem.updateMany({
        where: {
          id: input.id,
          userId: ctx.session.user.id, // Security: only update own items
        },
        data: { isUnread: false },
      });

      if (updated.count === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Work item not found',
        });
      }

      return { success: true };
    }),
});
```

## Related Skills
- react-19-patterns (React hooks and state management)
- TypeScript best practices
- Next.js App Router patterns
- Performance optimization
- Accessibility standards

## Tags
typescript, nextjs, tanstack-query, trpc, tailwind, react, heroui, prisma, code-quality, best-practices, semantic-colors, type-safety, performance
