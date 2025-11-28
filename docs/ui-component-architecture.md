# UI Component Architecture

**Created:** 2025-11-26 (Epic 2 Retrospective Action Item)
**Purpose:** Establish systematic standards for React Aria Components usage and design token integration
**Status:** Living Document - Updated as patterns evolve

---

## Executive Summary

This document defines the foundational UI component architecture for GitLab Insights, establishing HeroUI (built on React Aria Components) as the primary UI library and Tailwind CSS design tokens as the styling foundation.

**Core Principles:**
1. **HeroUI First** - Use HeroUI components for professional, coherent design system
2. **Design Tokens Only** - Never use hardcoded hex values; always use CSS custom properties
3. **Accessibility by Default** - WCAG 2.1 Level AA compliance through React Aria foundation
4. **Consistency Over Convenience** - Reuse established patterns rather than creating one-offs

**Updated as part of Story 1.5.1 (2025-11-28)** - Migrated from React Aria (unstyled primitives) to HeroUI (styled design system built on React Aria foundation).

---

## 1. Design Token System

### 1.1 Color Token Reference

All colors are defined in `src/styles/globals.css` within the `@theme` block. **NEVER use hardcoded hex values.**

#### Accent Colors (Olive/Moss Green)

```css
/* Use these for primary actions, focus states, active states */
--color-olive          /* #5e6b24 - Light mode accent */
--color-olive-light    /* #9DAA5F - Dark mode accent */
--color-olive-hover    /* #4F5A1F - Light mode hover */
--color-olive-hover-light /* #A8B86C - Dark mode hover */
```

**Usage Examples:**
```tsx
// ✅ CORRECT
<button className="bg-olive text-white hover:bg-olive-hover">

// ❌ WRONG
<button className="bg-[#5e6b24] text-white hover:bg-[#4F5A1F]">
```

#### Semantic Colors

```css
/* Success States */
--color-success       /* #16A34A - Light mode */
--color-success-dark  /* #22C55E - Dark mode */

/* Warning States */
--color-warning       /* #F59E0B - Light mode */
--color-warning-dark  /* #FDE047 - Dark mode */

/* Error States */
--color-error         /* #B91C1C - Light mode */
--color-error-dark    /* #DC2626 - Dark mode */

/* Info States */
--color-info          /* #0284C7 - Light mode */
--color-info-dark     /* #38BDF8 - Dark mode */
```

**Usage Context:**
- Success: API sync completed, query saved, item marked as reviewed
- Warning: Filters too broad (>15 items), stale data, rate limit warnings
- Error: API failures, search errors, invalid filters
- Info: Onboarding tips, keyboard shortcut hints, help messages

#### Event Type Badge Colors

```css
/* Issues (Purple) */
--color-badge-issue       /* #8B5CF6 - Light mode */
--color-badge-issue-dark  /* #A78BFA - Dark mode */

/* Merge Requests (Blue) */
--color-badge-mr          /* #0EA5E9 - Light mode */
--color-badge-mr-dark     /* #38BDF8 - Dark mode */

/* Comments (Gray) */
--color-badge-comment     /* #64748B - Light mode */
--color-badge-comment-dark /* #94A3B8 - Dark mode */
```

#### Neutral Gray Scale

```css
/* Light → Dark spectrum */
--color-gray-50   /* #F9FAFB - Lightest */
--color-gray-100  /* #F3F4F6 */
--color-gray-200  /* #E5E7EB */
--color-gray-300  /* #D1D5DB */
--color-gray-400  /* #9CA3AF */
--color-gray-500  /* #6B7280 */
--color-gray-600  /* #4B5563 */
--color-gray-700  /* #374151 */
--color-gray-800  /* #1F2937 */
--color-gray-900  /* #111827 - Darkest */
```

**Usage Mapping (Dark Mode):**
- Primary text: `gray-50`
- Headings: `gray-100`
- Body text: `gray-200`
- Secondary text: `gray-300`
- Disabled/placeholders: `gray-400`
- Borders: `gray-600`
- Elevated surfaces: `gray-700`
- Surface backgrounds: `gray-800`
- Layering: `gray-900`

#### Semantic Tokens (Contextual)

```css
/* Text Colors (Dark Mode) */
--color-text-primary    /* Primary readable text */
--color-text-secondary  /* De-emphasized text */
--color-text-tertiary   /* Metadata, timestamps */

/* Background Colors (Dark Mode) */
--color-bg-surface     /* Default surface */
--color-bg-elevated    /* Elevated cards, modals */

/* Border Colors (Dark Mode) */
--color-border-default /* Standard borders */
--color-border-subtle  /* Subtle dividers */
```

**When to Use Semantic Tokens:**
- Use semantic tokens for role-based styling (text-primary for body copy)
- Use specific grays when you need precise control (gray-300 for icons)
- Prefer semantic tokens for maintainability

### 1.2 Tailwind Class Usage

**With Tailwind v4 `@theme` integration**, colors are available as Tailwind classes:

```tsx
// Accent colors
className="text-olive bg-olive-light border-olive-hover"

// Semantic colors
className="text-success bg-warning border-error"

// Grays
className="text-gray-300 bg-gray-800 border-gray-600"

// Semantic tokens
className="text-text-primary bg-bg-surface border-border-default"
```

**Migration from Hardcoded Values:**

```tsx
// ❌ BEFORE (Epic 1-2 pattern - DEPRECATED)
className="text-[#9DAA5F] bg-[#2d2e2e]"

// ✅ AFTER (Epic 3+ standard)
className="text-olive-light bg-bg-dark"
```

---

## 1.5 HeroUI Setup & Configuration

**Added:** Story 1.5.1 (2025-11-28)

HeroUI is a professional design system built on React Aria Components, providing styled, accessible components with custom theming support. It maintains all the accessibility and keyboard navigation benefits of React Aria while adding visual coherence and reducing maintenance burden.

### 1.5.1 Installation

**Dependencies:**
```bash
npm install @heroui/react framer-motion
```

**Current Versions:**
- `@heroui/react`: ^2.8.5 (supports React 19, Next.js 16)
- `framer-motion`: ^12.23.24

### 1.5.2 Theme Configuration

HeroUI is configured via `tailwind.config.ts` with custom olive theme colors using HSL format:

```typescript
import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/react/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              DEFAULT: "hsl(68, 49%, 28%)", // #5e6b24 - Olive
              foreground: "#FFFFFF",
            },
            focus: "hsl(68, 49%, 28%)",
          },
        },
        dark: {
          colors: {
            primary: {
              DEFAULT: "hsl(68, 36%, 52%)", // #9DAA5F - Olive Light
              foreground: "#000000",
            },
            focus: "hsl(68, 36%, 52%)",
          },
        },
      },
    }),
  ],
};

export default config;
```

### 1.5.3 HSL Color Values

Custom olive theme uses HSL color format for easier theming and color manipulation:

| Mode | Color | HSL Value | Hex Equivalent |
|------|-------|-----------|----------------|
| Light | Primary | `hsl(68, 49%, 28%)` | #5e6b24 |
| Light | Foreground | `#FFFFFF` | White |
| Dark | Primary | `hsl(68, 36%, 52%)` | #9DAA5F |
| Dark | Foreground | `#000000` | Black |

### 1.5.4 Basic Usage

**HeroUIProvider (Required):**

```tsx
import { HeroUIProvider } from "@heroui/react";

export default function RootLayout({ children }: { children: React.Node }) {
  return (
    <HeroUIProvider>
      {children}
    </HeroUIProvider>
  );
}
```

**Button Component Example:**

```tsx
import { Button } from "@heroui/react";

// Primary button with olive theme
<Button color="primary" variant="solid">
  Save Query
</Button>

// Other variants
<Button color="primary" variant="bordered">Bordered</Button>
<Button color="primary" variant="light">Light</Button>
<Button color="primary" variant="flat">Flat</Button>
<Button color="primary" variant="ghost">Ghost</Button>

// Button sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// Button states
<Button isDisabled>Disabled</Button>
<Button isLoading>Loading</Button>
```

### 1.5.5 Migration Strategy (React Aria → HeroUI)

**Pattern:**

```tsx
// BEFORE (React Aria - unstyled)
import { Button } from 'react-aria-components';

<Button className="px-4 py-2 bg-olive text-white hover:bg-olive-hover rounded-md">
  Click Me
</Button>

// AFTER (HeroUI - styled)
import { Button } from '@heroui/react';

<Button color="primary">
  Click Me
</Button>
```

**Benefits:**
- Less custom styling code (HeroUI handles visual design)
- Consistent design system across all components
- Maintains React Aria accessibility and keyboard navigation
- Professional polish out of the box

**Migration Status:**
- Story 1.5.1: ✅ HeroUI installed and configured
- Story 1.5.2: 🔄 Hex → HSL color migration (pending)
- Story 1.5.3: 🔄 Epic 1 component migration (pending)
- Story 1.5.4: 🔄 Epic 2 component migration (pending)
- Story 1.5.5: 🔄 Testing & validation (pending)

---

## 2. React Aria Component Standards

### 2.1 Component Catalog

React Aria Components provides unstyled, accessible UI primitives. **Use these instead of raw HTML elements.**

#### Layout & Typography

| Component | Use Instead Of | When to Use |
|-----------|---------------|-------------|
| `Heading` | `<h1>`, `<h2>`, `<h3>`, etc. | All page and section headings |
| `Text` | `<p>`, `<span>` for semantic text | Paragraphs, labels, descriptions |
| `Section` | `<div>` for semantic sections | Logical page sections |
| `Group` | `<div>` for related controls | Button groups, form groups |

**Example:**
```tsx
// ❌ WRONG - Raw HTML
<h1 className="text-xl font-semibold">Dashboard</h1>
<p className="text-gray-300">View all recent events</p>

// ✅ CORRECT - React Aria
import { Heading, Text } from 'react-aria-components';

<Heading level={1} className="text-xl font-semibold">Dashboard</Heading>
<Text slot="description" className="text-text-secondary">View all recent events</Text>
```

#### Form Controls

| Component | Use Instead Of | When to Use |
|-----------|---------------|-------------|
| `TextField` | `<input type="text">` | Text inputs |
| `SearchField` | `<input type="search">` | Search inputs |
| `Checkbox` | `<input type="checkbox">` | Checkboxes |
| `CheckboxGroup` | Multiple `<input type="checkbox">` | Related checkboxes |
| `RadioGroup` | `<input type="radio">` | Radio button groups |
| `Switch` | Custom toggle | On/off toggles |
| `Select` | `<select>` | Dropdown selects |
| `ComboBox` | `<select>` with search | Searchable dropdowns |
| `Button` | `<button>` | **ALL buttons** |

**Critical Rule:** **ALWAYS use the `~/components/ui/Button.tsx` wrapper** for buttons (it wraps React Aria's Button with our styling).

**Example:**
```tsx
// ❌ WRONG - Raw HTML button
<button onClick={handleClick} className="px-4 py-2 bg-olive">
  Save
</button>

// ✅ CORRECT - Button component
import { Button } from '~/components/ui/Button';

<Button variant="primary" onPress={handleClick}>
  Save
</Button>
```

#### Navigation & Overlays

| Component | Use Instead Of | When to Use |
|-----------|---------------|-------------|
| `Link` | `<a>` for navigation | Internal and external links |
| `Menu` | Custom dropdown | Action menus |
| `Dialog` | Custom modal | **ALL modals** |
| `Modal` | Backdrop for Dialog | Modal overlays |
| `Popover` | Custom tooltips/popovers | Positioned overlays |
| `Tooltip` | Custom tooltips | Hover help text |

#### Data Display

| Component | Use Instead Of | When to Use |
|-----------|---------------|-------------|
| `Table` | `<table>` | Data tables |
| `ListBox` | `<ul>` with items | Selectable lists |
| `TagGroup` | Custom tag chips | Tag collections |

### 2.2 When to Use React Aria vs Raw HTML

**Always Use React Aria For:**
- ✅ Interactive elements (buttons, links, inputs)
- ✅ Semantic content (headings, text blocks)
- ✅ Form controls (checkboxes, radios, selects)
- ✅ Navigation elements (menus, tabs)
- ✅ Overlays (modals, tooltips, popovers)
- ✅ Data displays (tables, lists)

**Raw HTML Acceptable For:**
- ✅ Pure layout containers (`<div>`, `<main>`, `<aside>`)
- ✅ Images (`<img>`)
- ✅ Structural elements (`<header>`, `<footer>`, `<nav>` - unless using `useLandmark`)
- ✅ SVG graphics

**Example Decision Tree:**
```
Is it interactive or semantic?
  ├─ Yes → Use React Aria Component
  └─ No → Is it purely structural/layout?
       ├─ Yes → Raw HTML acceptable
       └─ No → Use React Aria Component
```

---

## 3. Component Usage Rules

### 3.1 Button Patterns

**Mandatory:** Use `~/components/ui/Button.tsx` for **ALL buttons**.

```tsx
import { Button } from '~/components/ui/Button';

// Primary action (olive background)
<Button variant="primary" onPress={handleSave}>
  Save Query
</Button>

// Secondary action (gray background)
<Button variant="secondary" onPress={handleCancel}>
  Cancel
</Button>

// Ghost/minimal (text only)
<Button variant="ghost" onPress={handleSkip}>
  Skip
</Button>

// With loading state
<Button variant="primary" isDisabled={isLoading}>
  {isLoading ? 'Saving...' : 'Save'}
</Button>
```

**Button Hierarchy (One Primary Max):**
- Primary: Main action in context (Save, Submit, Open in GitLab)
- Secondary: Supporting actions (Cancel, Mark as Reviewed)
- Ghost: Low-priority actions (Skip, Dismiss)

### 3.2 Form Input Patterns

**Use React Aria form components with proper labels:**

```tsx
import { TextField, Label, Input } from 'react-aria-components';

<TextField>
  <Label>Query Name *</Label>
  <Input
    placeholder="Enter a descriptive name"
    className="w-full px-3 py-2 border border-border-default rounded"
  />
</TextField>
```

**Validation and Errors:**
```tsx
<TextField isInvalid={hasError}>
  <Label>Query Name *</Label>
  <Input />
  {hasError && (
    <Text slot="errorMessage" className="text-error text-sm">
      Query name must be 3-50 characters
    </Text>
  )}
</TextField>
```

### 3.3 Modal/Dialog Patterns

**Standard Modal Structure:**

```tsx
import { Dialog, DialogTrigger, Modal, ModalOverlay, Heading, Button } from 'react-aria-components';

<DialogTrigger>
  <Button>Open Modal</Button>
  <ModalOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm">
    <Modal className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-bg-surface p-6 rounded-lg">
      <Dialog>
        {({ close }) => (
          <>
            <Heading slot="title" className="text-xl font-semibold mb-4">
              Modal Title
            </Heading>
            <div className="mb-6">
              {/* Modal content */}
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onPress={close}>Cancel</Button>
              <Button variant="primary" onPress={handleSubmit}>Save</Button>
            </div>
          </>
        )}
      </Dialog>
    </Modal>
  </ModalOverlay>
</DialogTrigger>
```

**Standard Backdrop:** Always use `bg-black/60` for consistency.

### 3.4 Typography Patterns

**Page Headings:**
```tsx
import { Heading } from 'react-aria-components';

// Page title (h1)
<Heading level={1} className="text-2xl font-semibold text-text-primary">
  Dashboard
</Heading>

// Section header (h2)
<Heading level={2} className="text-lg font-medium text-text-primary">
  Recent Issues
</Heading>
```

**Body Text:**
```tsx
import { Text } from 'react-aria-components';

// Standard paragraph
<Text className="text-sm text-text-secondary">
  No items match this query right now.
</Text>

// Metadata text
<Text className="text-xs text-text-tertiary">
  Last sync: 5m ago
</Text>
```

---

## 4. Component Pattern Library

### 4.1 Loading States

**Standard Patterns (To Be Implemented):**

1. **Spinner (for short waits <3s):**
```tsx
// TODO: Create ~/components/ui/LoadingSpinner.tsx
<LoadingSpinner size="sm" /> // For inline use
<LoadingSpinner size="md" /> // For buttons
<LoadingSpinner size="lg" /> // For page loads
```

2. **Skeleton Loader (for content):**
```tsx
// Used while ItemRow content loads
<div className="h-[52px] animate-pulse bg-gray-800 rounded" />
```

3. **Progress Bar (for long operations):**
```tsx
import { ProgressBar } from 'react-aria-components';

<ProgressBar value={progress}>
  <Label>Syncing...</Label>
  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
    <div
      className="h-full bg-olive transition-all"
      style={{ width: `${progress}%` }}
    />
  </div>
</ProgressBar>
```

### 4.2 Feedback Patterns

**Toast Notifications (To Be Standardized):**
```tsx
// Success
<Toast variant="success">
  Query saved successfully
</Toast>

// Error
<Toast variant="error">
  Failed to sync with GitLab
</Toast>

// Warning
<Toast variant="warning">
  Query returned 142 items (too broad)
</Toast>

// Info
<Toast variant="info">
  Press ? for keyboard shortcuts
</Toast>
```

**Inline Alerts:**
```tsx
<div className="flex items-center gap-2 p-3 rounded border-l-4 border-warning bg-warning/10">
  <WarningIcon className="text-warning" />
  <Text className="text-sm">Last sync was 30+ minutes ago</Text>
</div>
```

### 4.3 Badge Components

**Event Type Badges:**
```tsx
// src/components/dashboard/Badge.tsx pattern
const badgeColors = {
  issue: 'bg-badge-issue text-white',
  merge_request: 'bg-badge-mr text-white',
  comment: 'bg-badge-comment text-white',
  new: 'bg-olive-light text-white',
};

<div className={`px-2 py-0.5 rounded-full text-xs ${badgeColors[type]}`}>
  {label}
</div>
```

---

## 5. Migration Strategy

### 5.1 Opportunistic Refactoring

**Approach:** Fix components when touched for Epic 3+ work, NOT a massive refactor.

**Priority 1 - Critical (Fix Immediately):**
1. ✅ `RefreshButton.tsx` → Use `Button` component wrapper
2. ✅ Onboarding Continue button → Use `Button` component
3. ✅ Create `LoadingSpinner` reusable component

**Priority 2 - Medium (Fix When Editing):**
1. Page headings → Use `Heading` component when editing pages
2. `ItemRow.tsx` → Use `Text` component for text content
3. `ProjectSelector.tsx` → Use React Aria `Checkbox`/`CheckboxGroup`
4. Query edit/delete buttons → Use `Button` component

**Priority 3 - Low (Nice to Have):**
1. `Badge.tsx` → Add proper ARIA labels
2. Modal backdrop colors → Standardize to `bg-black/60`
3. Form inputs → Migrate to `TextField` when editing

### 5.2 Code Review Checklist

When reviewing Epic 3+ code, check:

- [ ] No hardcoded hex values (`text-[#...]`) - only design tokens
- [ ] All buttons use `Button` component wrapper
- [ ] All headings use `Heading` component
- [ ] All form inputs use React Aria primitives
- [ ] Modal backdrops use standard `bg-black/60`
- [ ] Consistent spacing (8px grid system)
- [ ] Accessible ARIA labels where needed

---

## 6. Examples: Before & After

### Example 1: Button Migration

**Before (Epic 1-2):**
```tsx
<button
  onClick={handleRefresh}
  className="px-4 py-2 bg-[#5e6b24] text-white hover:bg-[#4F5A1F] rounded transition"
>
  Refresh
</button>
```

**After (Epic 3+):**
```tsx
import { Button } from '~/components/ui/Button';

<Button variant="primary" onPress={handleRefresh}>
  Refresh
</Button>
```

### Example 2: Heading Migration

**Before (Epic 1-2):**
```tsx
<h1 className="text-2xl font-semibold text-[#FDFFFC]">
  Dashboard
</h1>
```

**After (Epic 3+):**
```tsx
import { Heading } from 'react-aria-components';

<Heading level={1} className="text-2xl font-semibold text-text-primary">
  Dashboard
</Heading>
```

### Example 3: Form Input Migration

**Before (Epic 1-2):**
```tsx
<div>
  <label htmlFor="queryName">Query Name *</label>
  <input
    id="queryName"
    type="text"
    className="w-full px-3 py-2 bg-[#1F2937] border border-[#4B5563] rounded"
  />
</div>
```

**After (Epic 3+):**
```tsx
import { TextField, Label, Input } from 'react-aria-components';

<TextField>
  <Label>Query Name *</Label>
  <Input className="w-full px-3 py-2 bg-bg-elevated border border-border-default rounded" />
</TextField>
```

---

## 7. Reference Documentation

### React Aria Component Documentation

**Official Docs:** https://react-spectrum.adobe.com/react-aria/

**Quick Links:**
- [Button](https://react-spectrum.adobe.com/react-aria/Button.html)
- [TextField](https://react-spectrum.adobe.com/react-aria/TextField.html)
- [Checkbox](https://react-spectrum.adobe.com/react-aria/Checkbox.html)
- [Dialog](https://react-spectrum.adobe.com/react-aria/Dialog.html)
- [Table](https://react-spectrum.adobe.com/react-aria/Table.html)
- [Heading](https://react-spectrum.adobe.com/react-aria/Heading.html)
- [Text](https://react-spectrum.adobe.com/react-aria/Text.html)

**MCP Access:** Use the `react-aria` MCP server for live documentation queries.

### Internal Documentation

- **UX Design Specification:** `docs/ux-design-specification.md` - Source of truth for colors and design patterns
- **Architecture:** `docs/architecture.md` - System architecture including React Aria decisions
- **Design Tokens:** `src/styles/globals.css` - All color definitions

---

## Document History

| Date       | Version | Changes                                     | Author |
|------------|---------|---------------------------------------------|--------|
| 2025-11-26 | 1.0     | Initial UI component architecture document  | BMad   |

---

**Note:** This is a living document. Update when establishing new patterns or migrating components.
