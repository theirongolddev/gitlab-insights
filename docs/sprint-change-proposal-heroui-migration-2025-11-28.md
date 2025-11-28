# Sprint Change Proposal: HeroUI Migration & HSL Color System

**Date:** 2025-11-28
**Project:** gitlab-insights
**Trigger:** Story 3.2 drafting revealed ongoing UI coherence issues
**Proposed By:** Technical Lead
**Change Type:** Architecture Pivot - Component Library Migration
**Status:** ✅ APPROVED

---

## Executive Summary

Migrate from React Aria Components (unstyled primitives) to HeroUI (styled components built on React Aria foundation) and convert all color definitions from hex to HSL format. This addresses critical UI coherence issues discovered during Epic 1-2 implementation and Story 3.2 drafting.

**Key Metrics:**
- **Timeline Impact:** +2-3 weeks (Epic 1.5 insertion)
- **Scope:** All Epic 1-2 UI components + global color system
- **Risk:** MEDIUM (clear migration path, React Aria foundation preserved)
- **Benefit:** HIGH (coherent design system, maintainable colors, faster future development)

---

## 1. Issue Summary

### Problem Statement

The decision to use React Aria Components (unstyled primitives) from ADR-008 has resulted in:
- **Inconsistent styling** across Epic 1-2 components
- **Poor UI/UX implementation quality**
- **Lack of visual coherence**
- **High maintenance burden** for custom styling
- **Slower development velocity** than anticipated
- **Hex color code** management complexity

### Root Cause

Should have started with a **pre-styled component library** instead of building custom styling on top of unstyled React Aria primitives. Additionally, hex color codes are harder to maintain and manipulate compared to HSL format.

### Discovery Context

- Issue observed across all Epic 1-2 UI work (Stories 1.6-2.10)
- Epic 2 Retrospective (2025-11-26) attempted systematization via `ui-component-architecture.md` and design tokens
- Story 3.2 (Catch-Up Mode View) drafting made coherence problems critical
- User decision: "should have been specified in the beginning"

### Evidence

1. User feedback: "Inconsistent styling, bad UI/UX implementation"
2. Multiple attempts to fix via retrospective actions (ui-component-architecture.md, design tokens)
3. Ongoing friction in Story 3.2 implementation
4. Technical debt accumulating in Epic 1-2 components

---

## 2. Epic Impact Analysis

### Current Epic (Epic 3: Catch-Up Mode & Background Sync)

**Status:** ⏸️ PAUSE REQUIRED

- Story 3.1 ✅ Done (backend, no UI changes needed)
- Story 3.2 📝 Drafted → **REDRAFT** after migration
- Stories 3.3-3.7 📋 Backlog → Plan with HeroUI from start

**Action:** Pause Epic 3, redraft Story 3.2 post-migration

---

### Completed Epics (Epic 1-2)

**Epic 1: Walking Skeleton** ✅ COMPLETE - **Requires Migration**

Affected Stories:
- 1.3: GitLab OAuth screens → HeroUI Form components + HSL
- 1.4: Project selection onboarding → HeroUI Checkbox/Select + HSL
- 1.6: 2-line table view → HeroUI Table + HSL
- 1.7: App layout → HeroUI Layout components + HSL

**Epic 2: User-Controlled Queries** ✅ COMPLETE - **Requires Migration**

Affected Stories:
- 2.2: Table with vim navigation → HeroUI Table (preserve keyboard handlers) + HSL
- 2.4: Search bar → HeroUI Input/SearchField + HSL
- 2.6: Filter UI → HeroUI Select/Checkbox + HSL
- 2.8: Sidebar navigation → HeroUI Sidebar/Navigation + HSL
- 2.9: Create query modal → HeroUI Modal + HSL
- 2.10: Edit/delete actions → HeroUI Button variants + HSL

---

### Future Epics (Epic 4-7)

**Impact:** ✅ **POSITIVE** - Easier implementation with HeroUI + HSL

- Epic 4: Split pane perfect for HeroUI Card/Divider/Layout
- Epic 5: Keyboard shortcuts preserved (HeroUI = React Aria under hood)
- Epic 6: Error handling easier with HeroUI Toast/Alert
- Epic 7: Less polish needed (HeroUI provides professional design)

---

### New Epic Required

**Epic 1.5: HeroUI Migration & HSL Color System** 🆕

**Insert Position:** Between Epic 2 and Epic 3
**Estimated Duration:** 2-3 weeks
**Priority:** CRITICAL (blocks Epic 3-7 progress)

---

## 3. Artifact Conflicts & Required Updates

### PRD (docs/prd.md)
**Status:** ✅ NO CONFLICTS
**Changes:** None required (behavior-focused, library-agnostic)

---

### Architecture (docs/architecture.md)
**Status:** ❌ MAJOR CONFLICTS
**Required Changes:**

1. **ADR-008: React Aria Components** (Lines 1001-1135)
   - **Current:** "Use React Aria Components instead of shadcn/ui"
   - **New:** "ADR-008 (Revised): HeroUI for Design System + React Aria Foundation"
   - **Rationale Update:** "HeroUI provides professional design system built on React Aria, solving coherence issues while maintaining accessibility foundation"

2. **UI Component Architecture Reference** (Line 229)
   - **Current:** Points to `ui-component-architecture.md` (React Aria patterns)
   - **Action:** Document will be completely rewritten for HeroUI

3. **Cross-Cutting Concerns → UI Component Architecture** (Lines 227-248)
   - **Current:** "React Aria First - Use React Aria for all interactive elements"
   - **New:** "HeroUI First - Use HeroUI components (built on React Aria)"

4. **UI Component Patterns** (Lines 752-832)
   - **Current:** React Aria Table/Dialog/Button usage
   - **New:** HeroUI component patterns and theming

---

### UX Design Specification (docs/ux-design-specification.md)
**Status:** ❌ MAJOR CONFLICTS
**Required Changes:**

1. **Section 1.1: Design System Choice** (Lines 103-147)
   - **Current:** "Selected: React Aria Components (Adobe)"
   - **New:** "Selected: HeroUI (formerly NextUI) - Built on React Aria Foundation"
   - **Update Rationale:** Professional design system + React Aria accessibility

2. **Section 6: Component Library** (Lines 1002-1260)
   - **Current:** React Aria component catalog
   - **New:** HeroUI component catalog with theming examples

3. **Section 3.1: Color System** (Lines 380-525)
   - **Current:** Hex color definitions
   - **New:** HSL color system with conversion table
   - **Verify:** HeroUI custom theme supports olive/moss colors ✅ CONFIRMED

---

### UI Component Architecture (docs/ui-component-architecture.md)
**Status:** ❌ COMPLETE REWRITE REQUIRED
**Action:** New document covering:
- HeroUI component catalog
- Custom olive theme configuration (HSL-based)
- Component usage patterns
- Theming and customization guide
- Migration from hex → HSL color references

---

### Design Tokens (src/styles/globals.css)
**Status:** ⚠️ MAJOR UPDATE REQUIRED
**Action:**
- Migrate all CSS custom properties from hex → HSL
- Integrate with HeroUI theme system
- Ensure compatibility with Tailwind CSS utilities
- Example conversion:
  ```css
  /* Before */
  --color-olive: #5e6b24;

  /* After */
  --color-olive: hsl(68, 49%, 28%);
  ```

---

### Tech Specs & Story Files
**Status:** ⚠️ REFERENCE UPDATES
**Action:**
- Add migration notes to Epic 1-2 tech specs
- Note "Migrated to HeroUI + HSL in Epic 1.5" on affected story files
- Maintain historical record for traceability

---

## 4. HeroUI Technical Validation

### Verified Capabilities (via Context7 MCP)

✅ **Custom Color Theming Fully Supported**
- Can define custom `primary` color with olive/moss green (#5e6b24 light, #9DAA5F dark)
- Supports full color scales (50-900 shades)
- Theme extends `light` or `dark` base themes

✅ **React Aria Foundation Confirmed**
- "Built on top of Tailwind CSS and React Aria" (official docs)
- All components expose React Aria accessibility features
- Keyboard navigation (arrow keys, Tab, Space, Enter) preserved
- ARIA roles, labels, and live regions maintained

✅ **Component Coverage**
- Table (with keyboard nav, sorting, selection)
- Modal/Dialog
- Button (all variants)
- Form components (Input, Select, Switch, Checkbox)
- Dropdown/Menu
- Tooltip
- Layout components

✅ **Tailwind v4 Compatible**
- Uses `@tailwindcss/vite` plugin
- Configuration via `tailwind.config.js` or inline `@plugin` directive

### Custom Olive Theme Configuration Example

```js
// tailwind.config.js
const {heroui} = require("@heroui/react");

module.exports = {
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              DEFAULT: "hsl(68, 49%, 28%)", // #5e6b24
              foreground: "#FFFFFF",
            },
            focus: "hsl(68, 49%, 28%)",
          },
        },
        dark: {
          colors: {
            primary: {
              DEFAULT: "hsl(68, 36%, 52%)", // #9DAA5F
              foreground: "#000000",
            },
            focus: "hsl(68, 36%, 52%)",
          },
        },
      },
    }),
  ],
};
```

---

## 5. Path Forward Analysis

### Option 1: Full Migration Now ✅ **SELECTED**

**Scope:**
- Create Epic 1.5: HeroUI Migration
- Pause Epic 3 at Story 3.2
- Migrate all Epic 1-2 UI components to HeroUI
- Convert all colors from hex → HSL
- Update theme configuration
- Resume Epic 3 with HeroUI + HSL colors

**Effort Estimate:** **HIGH** (2-3 weeks)
- HeroUI component migration: 1.5-2 weeks
- Hex → HSL conversion: 1-2 days
- Theme configuration + testing: 2-3 days

**Risk Level:** **MEDIUM**
- ✅ Low technical risk (HeroUI maintains React Aria foundation)
- ✅ Clear migration path (documented components)
- ⚠️ Timeline risk (blocks Epic 3-7 progress)
- ✅ Color migration low risk (mechanical conversion)

**Benefits:**
- ✅ Complete UI coherence before continuing
- ✅ No technical debt accumulation
- ✅ Single color system migration (hex → HSL)
- ✅ Future stories easier with established HeroUI patterns

**Status:** ✅ **VIABLE - SELECTED**

---

### Option 2: Defer to Epic 7 ❌ **REJECTED**

**Scope:**
- Continue Epic 3+ with HeroUI + HSL
- Keep Epic 1-2 with React Aria + hex colors
- Migrate Epic 1-2 during Epic 7 (polish phase)

**Risk Level:** **HIGH**
- ❌ Inconsistent UI during Epic 3-6 (React Aria + HeroUI mix)
- ❌ Two color systems (hex in Epic 1-2, HSL in Epic 3+)
- ❌ Maintenance burden tracking two component approaches
- ⚠️ User frustration continuing with known coherence issues

**Status:** ❌ **NOT VIABLE** - Defeats purpose of fixing coherence issues now

---

### Option 3: Incremental Migration ❌ **REJECTED**

**Scope:**
- Migrate critical shared components now (Table, Sidebar, Modal) to HeroUI
- Convert shared colors to HSL
- Keep isolated components as React Aria + hex
- Complete migration in Epic 7

**Risk Level:** **HIGH**
- ❌ Still inconsistent (partial HeroUI, partial React Aria)
- ❌ Mixed color systems (HSL + hex)
- ❌ Complex to determine "critical" vs "isolated" boundaries
- ⚠️ Doesn't solve coherence problem

**Status:** ❌ **NOT VIABLE** - Half-measure doesn't address core issue

---

### Selected Path Rationale

**Why Option 1:**

1. **Coherence Goal:** User explicitly stated UI coherence is the problem - partial solutions won't fix it
2. **Clean Foundation:** Get HeroUI + HSL in place before Epic 3-7 dependency builds up
3. **Team Morale:** Continuing with known problematic approach demoralizes team
4. **Long-term Efficiency:** 2-3 week investment now saves ongoing friction
5. **Single Migration:** Doing HeroUI + HSL together avoids revisiting colors later
6. **React Aria Preserved:** HeroUI uses React Aria under hood - no accessibility regression

**Trade-offs Accepted:**
- ⚠️ Timeline Impact: +2-3 weeks before Epic 3 resumes
- ✅ Worth It: Prevents accumulating more inconsistent UI work
- ✅ Future Velocity: Epic 3-7 faster with coherent component system

---

## 6. PRD MVP Impact

**MVP Status:** ✅ NOT AFFECTED

**MVP Timeline Impact:** +2-3 weeks for migration

**MVP Scope:** UNCHANGED
- All functional requirements remain achievable with HeroUI
- HeroUI maintains React Aria accessibility foundation
- Keyboard navigation (vim-style) preserved
- Performance characteristics equivalent or better

**Benefits to MVP:**
- ✅ Higher quality UI implementation
- ✅ Consistent design system
- ✅ Faster Epic 3-7 development
- ✅ More maintainable color system (HSL)
- ✅ Professional visual polish (HeroUI design)

---

## 7. Implementation Plan

### Phase 1: Setup & Configuration (2-3 days)

**Tasks:**

1. **Install HeroUI dependencies:**
   ```bash
   npm install @heroui/react @heroui/theme
   ```

2. **Configure custom olive theme in `tailwind.config.js`:**
   ```js
   const {heroui} = require("@heroui/react");

   module.exports = {
     content: [
       "./src/**/*.{js,ts,jsx,tsx}",
       "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
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
                 DEFAULT: "hsl(68, 49%, 28%)", // #5e6b24
                 foreground: "#FFFFFF",
               },
               focus: "hsl(68, 49%, 28%)",
             },
           },
           dark: {
             colors: {
               primary: {
                 DEFAULT: "hsl(68, 36%, 52%)", // #9DAA5F
                 foreground: "#000000",
               },
               focus: "hsl(68, 36%, 52%)",
             },
           },
         },
       }),
     ],
   };
   ```

3. **Convert `src/styles/globals.css` hex → HSL:**

   Conversion table:
   ```
   /* Olive/Moss Accent */
   #5e6b24 → hsl(68, 49%, 28%)
   #9DAA5F → hsl(68, 36%, 52%)
   #4F5A1F → hsl(68, 49%, 24%)
   #A8B86C → hsl(68, 36%, 56%)

   /* Backgrounds */
   #2d2e2e → hsl(0, 2%, 18%)
   #FDFFFC → hsl(120, 100%, 99%)

   /* Semantic Colors */
   #16A34A → hsl(142, 71%, 37%)  // success
   #22C55E → hsl(142, 71%, 45%)  // success-dark
   #F59E0B → hsl(38, 92%, 50%)   // warning
   #FDE047 → hsl(54, 98%, 64%)   // warning-dark
   #B91C1C → hsl(0, 72%, 42%)    // error
   #DC2626 → hsl(0, 73%, 51%)    // error-dark
   #0284C7 → hsl(199, 97%, 39%)  // info
   #38BDF8 → hsl(199, 95%, 60%)  // info-dark

   /* Event Type Badges */
   #8B5CF6 → hsl(258, 90%, 66%)  // issue
   #A78BFA → hsl(258, 90%, 76%)  // issue-dark
   #0EA5E9 → hsl(199, 89%, 48%)  // mr
   #38BDF8 → hsl(199, 95%, 60%)  // mr-dark
   #64748B → hsl(215, 16%, 47%)  // comment
   #94A3B8 → hsl(214, 14%, 65%)  // comment-dark
   ```

4. **Update Vite configuration for Tailwind v4:**
   ```typescript
   // vite.config.ts
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'
   import tailwindcss from "@tailwindcss/vite"

   export default defineConfig({
     plugins: [react(), tailwindcss()],
   })
   ```

---

### Phase 2: Epic 1 Component Migration (3-4 days)

**Components to Migrate:**

**Story 1.3: GitLab OAuth Authentication**
```tsx
// Before (React Aria)
import { Button, TextField, Label, Input } from 'react-aria-components';

// After (HeroUI)
import { Button, Input } from '@heroui/react';
```

**Story 1.4: Project Selection Onboarding**
```tsx
// Before (React Aria)
import { Checkbox, CheckboxGroup } from 'react-aria-components';

// After (HeroUI)
import { Checkbox, CheckboxGroup } from '@heroui/react';
```

**Story 1.6: 2-Line Table View**
```tsx
// Before (React Aria)
import { Table, TableHeader, TableBody, Row, Cell } from 'react-aria-components';

// After (HeroUI)
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@heroui/react';
```

**Story 1.7: Basic App Layout**
```tsx
// Before (React Aria)
import { Heading, Text, Section } from 'react-aria-components';

// After (HeroUI)
import { Card, CardHeader, CardBody, Divider } from '@heroui/react';
```

**Pattern:**
```tsx
// Before (React Aria + custom styling)
<Button className="px-4 py-2 bg-olive text-white hover:bg-olive-hover">
  Click Me
</Button>

// After (HeroUI + theme)
<Button color="primary">
  Click Me
</Button>
```

---

### Phase 3: Epic 2 Component Migration (5-7 days)

**Components to Migrate:**

**Story 2.2: React Aria Table with vim-style navigation**
```tsx
// After (HeroUI Table with custom keyboard handlers)
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from '@heroui/react';

<Table
  aria-label="GitLab Items"
  selectionMode="single"
  onKeyDown={(e) => {
    if (e.key === 'j') handleNextItem();
    if (e.key === 'k') handlePrevItem();
    if (e.key === 'o') handleOpenInGitLab();
  }}
>
  <TableHeader>
    <TableColumn>Title</TableColumn>
    <TableColumn>Project</TableColumn>
    <TableColumn>Author</TableColumn>
  </TableHeader>
  <TableBody>
    {items.map((item) => (
      <TableRow key={item.id}>
        <TableCell>{item.title}</TableCell>
        <TableCell>{item.project}</TableCell>
        <TableCell>{item.author}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

**Story 2.4: Search Bar UI**
```tsx
// After (HeroUI Input with search variant)
import { Input } from '@heroui/react';

<Input
  type="search"
  placeholder="Search items..."
  startContent={<SearchIcon />}
  onValueChange={handleSearch}
/>
```

**Story 2.6: Filter UI & Logic**
```tsx
// After (HeroUI Select and Checkbox)
import { Select, SelectItem, Checkbox } from '@heroui/react';

<Select
  label="Filter by type"
  placeholder="Select type"
  onSelectionChange={handleTypeFilter}
>
  <SelectItem key="issue">Issues</SelectItem>
  <SelectItem key="merge_request">Merge Requests</SelectItem>
  <SelectItem key="comment">Comments</SelectItem>
</Select>
```

**Story 2.8: Sidebar Navigation**
```tsx
// After (HeroUI Sidebar/Listbox)
import { Listbox, ListboxItem } from '@heroui/react';

<Listbox
  aria-label="Saved Queries"
  onAction={handleQuerySelect}
>
  {queries.map((query) => (
    <ListboxItem key={query.id}>
      {query.name}
    </ListboxItem>
  ))}
</Listbox>
```

**Story 2.9: Create Query Modal**
```tsx
// After (HeroUI Modal)
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from '@heroui/react';

<Modal isOpen={isOpen} onClose={onClose}>
  <ModalContent>
    <ModalHeader>Save as Query</ModalHeader>
    <ModalBody>
      <Input
        label="Query Name"
        placeholder="Enter query name..."
        value={queryName}
        onValueChange={setQueryName}
      />
    </ModalBody>
    <ModalFooter>
      <Button color="default" onPress={onClose}>
        Cancel
      </Button>
      <Button color="primary" onPress={handleSave}>
        Save
      </Button>
    </ModalFooter>
  </ModalContent>
</Modal>
```

**Story 2.10: Edit/Delete Query Actions**
```tsx
// After (HeroUI Button variants)
import { Button } from '@heroui/react';

<div className="flex gap-2">
  <Button color="primary" size="sm" onPress={handleEdit}>
    Edit
  </Button>
  <Button color="danger" size="sm" onPress={handleDelete}>
    Delete
  </Button>
</div>
```

**Critical:** Preserve vim-style keyboard shortcuts throughout all components.

---

### Phase 4: Documentation Updates (2-3 days)

**1. Rewrite `docs/ui-component-architecture.md`:**

New structure:
```markdown
# UI Component Architecture (HeroUI + HSL)

## Design System: HeroUI (Built on React Aria)

### Custom Olive Theme Configuration
[Include tailwind.config.js example]

### HSL Color System
[Include conversion table from hex]

### Component Catalog
- Table
- Modal/Dialog
- Button variants
- Form components (Input, Select, Checkbox, Switch)
- Sidebar/Navigation
- Tooltip

### Usage Patterns
[Component-specific examples]

### Migration Guide
[Hex → HSL conversion reference]
```

**2. Revise `docs/architecture.md` ADR-008:**

Update ADR-008:
```markdown
## ADR-008 (Revised): HeroUI for Design System + React Aria Foundation

**Date:** 2025-11-28 (Revised from 2025-11-20)

**Status:** Accepted (Supersedes original ADR-008)

**Context:**
Original decision chose React Aria Components (unstyled primitives) for keyboard-first UX and custom styling flexibility. Implementation revealed UI coherence issues and high maintenance burden for custom styling.

**Decision:**
Adopt HeroUI (formerly NextUI) as the primary UI component library. HeroUI is built on React Aria Components foundation, providing:
- Professional design system with coherent styling
- React Aria accessibility and keyboard navigation
- Custom theme support (olive/moss accent colors)
- HSL-based color system for maintainability

**Consequences:**
- ✅ Maintains React Aria keyboard navigation foundation
- ✅ Professional UI design out of box
- ✅ Reduced custom styling burden
- ✅ HSL color system easier to maintain/manipulate
- ⚠️ One-time migration effort (Epic 1.5: 2-3 weeks)
- ✅ Faster future development velocity
```

**3. Update `docs/ux-design-specification.md`:**

Updates:
- **Section 1.1:** HeroUI as design system (lines 103-147)
- **Section 3.1:** HSL color system (lines 380-525)
- **Section 6:** HeroUI component library (lines 1002-1260)

**4. Add migration notes:**
- Epic 1-2 tech specs: Add "Migrated to HeroUI + HSL in Epic 1.5 (2025-11-28)"
- Affected story files: Note migration for traceability

---

### Phase 5: Testing & Validation (2-3 days)

**Test Coverage:**

1. **Visual Regression Testing**
   - ✅ All Epic 1-2 screens render correctly
   - ✅ Olive theme colors display properly (light/dark modes)
   - ✅ HSL colors render identically to original hex
   - ✅ No layout shifts or visual regressions

2. **Functional Testing**
   - ✅ All Epic 1-2 functionality preserved
   - ✅ Authentication flow works
   - ✅ Project selection works
   - ✅ Table displays items correctly
   - ✅ Search filters items
   - ✅ Sidebar navigation works
   - ✅ Modal open/close works
   - ✅ Query CRUD operations work

3. **Keyboard Navigation Testing**
   - ✅ j/k navigation works on table
   - ✅ / focuses search
   - ✅ Tab navigation works
   - ✅ Enter/Space activate buttons
   - ✅ Esc closes modals
   - ✅ Arrow keys work in dropdowns

4. **Accessibility Testing**
   - ✅ Screen reader announces components correctly
   - ✅ ARIA labels present
   - ✅ Focus indicators visible
   - ✅ Color contrast meets WCAG 2.1 AA (HSL colors)
   - ✅ Keyboard-only navigation possible

5. **Performance Testing**
   - ✅ Page load times equivalent or better
   - ✅ No performance regressions
   - ✅ Bundle size acceptable

---

## 8. Epic 1.5: Story Breakdown

**Epic 1.5: HeroUI Migration & HSL Color System**

**Objective:** Migrate all Epic 1-2 UI components from React Aria (unstyled) to HeroUI (styled) and convert color system from hex to HSL format.

**Stories:**

### Story 1.5.1: HeroUI Setup & Custom Olive Theme Configuration
**Effort:** 2-3 days
**Tasks:**
- Install HeroUI dependencies (`@heroui/react`, `@heroui/theme`)
- Configure custom olive theme in `tailwind.config.js` (HSL-based)
- Update Vite configuration for Tailwind v4
- Verify theme renders correctly (light/dark modes)
- **Document theme configuration** in new `ui-component-architecture.md` section
- **Revise ADR-008 in architecture.md** (document decision to adopt HeroUI)

**Acceptance Criteria:**
- ✅ HeroUI installed and configured
- ✅ Custom olive theme working (HSL colors)
- ✅ Dark mode toggle works
- ✅ Theme matches UX spec colors
- ✅ **Theme configuration documented in ui-component-architecture.md**
- ✅ **ADR-008 revised with HeroUI decision and rationale**

---

### Story 1.5.2: Hex → HSL Color System Migration
**Effort:** 1-2 days
**Tasks:**
- Convert all `src/styles/globals.css` hex → HSL
- Update CSS custom properties
- Verify color rendering identical to hex
- **Add inline comments** to globals.css explaining HSL values
- **Document hex→HSL conversion table** in `ui-component-architecture.md`
- **Update color system section** in `ux-design-specification.md` (Section 3.1)

**Acceptance Criteria:**
- ✅ All colors converted to HSL
- ✅ Visual rendering identical to hex
- ✅ No color regressions
- ✅ **Inline comments added to globals.css**
- ✅ **Conversion table documented in ui-component-architecture.md**
- ✅ **ux-design-specification.md Section 3.1 updated with HSL colors**

---

### Story 1.5.3: Epic 1 Component Migration
**Effort:** 3-4 days
**Tasks:**
- Migrate Story 1.3 (Auth screens) to HeroUI
- Migrate Story 1.4 (Project selection) to HeroUI
- Migrate Story 1.6 (Table view) to HeroUI
- Migrate Story 1.7 (App layout) to HeroUI
- Test all Epic 1 functionality
- **Update Epic 1 component patterns** in `ui-component-architecture.md`
- **Add migration notes** to Epic 1 tech spec (`tech-spec-epic-1.md`)
- **Add migration notes** to affected story files (1.3, 1.4, 1.6, 1.7)
- **Document Epic 1-specific HeroUI patterns** discovered during migration

**Acceptance Criteria:**
- ✅ All Epic 1 components use HeroUI
- ✅ All Epic 1 functionality works
- ✅ Keyboard navigation preserved
- ✅ No visual regressions
- ✅ **Epic 1 component patterns documented in ui-component-architecture.md**
- ✅ **Migration notes added to tech-spec-epic-1.md**
- ✅ **Story files 1.3, 1.4, 1.6, 1.7 annotated with migration context**

---

### Story 1.5.4: Epic 2 Component Migration
**Effort:** 5-7 days
**Tasks:**
- Migrate Story 2.2 (Table + vim nav) to HeroUI
- Migrate Story 2.4 (Search bar) to HeroUI
- Migrate Story 2.6 (Filters) to HeroUI
- Migrate Story 2.8 (Sidebar) to HeroUI
- Migrate Story 2.9 (Modal) to HeroUI
- Migrate Story 2.10 (Buttons) to HeroUI
- Test all Epic 2 functionality
- Verify vim-style shortcuts work
- **Update Epic 2 component patterns** in `ui-component-architecture.md`
- **Document vim-style keyboard integration** with HeroUI Table
- **Add migration notes** to Epic 2 tech spec (`tech-spec-epic-2.md`)
- **Add migration notes** to affected story files (2.2, 2.4, 2.6, 2.8, 2.9, 2.10)
- **Update ux-design-specification.md Section 1.1** (Design System Choice - HeroUI)
- **Update ux-design-specification.md Section 6** (Component Library - HeroUI catalog)
- **Document Epic 2-specific HeroUI patterns** discovered during migration

**Acceptance Criteria:**
- ✅ All Epic 2 components use HeroUI
- ✅ All Epic 2 functionality works
- ✅ Vim shortcuts (j/k, /, o) work
- ✅ Keyboard navigation preserved
- ✅ No visual regressions
- ✅ **Epic 2 component patterns documented in ui-component-architecture.md**
- ✅ **Vim keyboard integration documented**
- ✅ **Migration notes added to tech-spec-epic-2.md**
- ✅ **Story files 2.2, 2.4, 2.6, 2.8, 2.9, 2.10 annotated with migration context**
- ✅ **ux-design-specification.md Section 1.1 updated** (HeroUI as design system)
- ✅ **ux-design-specification.md Section 6 updated** (HeroUI component catalog)

---

### Story 1.5.5: Testing, Validation & Polish
**Effort:** 2-3 days
**Tasks:**
- Visual regression testing
- Functional testing (all Epic 1-2 features)
- Keyboard navigation testing
- Accessibility testing (WCAG 2.1 AA)
- Performance testing
- **Final documentation consistency review** across all updated docs
- Fix any issues found
- Final polish

**Acceptance Criteria:**
- ✅ All tests pass
- ✅ No visual regressions
- ✅ No functional regressions
- ✅ Accessibility maintained
- ✅ Performance equivalent or better
- ✅ **All documentation consistent and complete**
- ✅ Ready to resume Epic 3

---

**Total Epic 1.5 Effort:** 13-20 days (2-3 weeks)

**Total Stories:** 5 (documentation fully integrated into implementation)

---

## 9. Agent Handoff Plan

### Architect Role
**Document:** `docs/architecture.md`
**Responsibilities:**
- Revise ADR-008 with HeroUI decision rationale
- Update UI component patterns section
- Validate HSL color system integration
- Review and approve architecture documentation changes

---

### UX Designer Role
**Document:** `docs/ux-design-specification.md`
**Responsibilities:**
- Update Section 1.1 (Design System Choice)
- Revise Section 3.1 (Color System → HSL)
- Update Section 6 (Component Library → HeroUI)
- Create hex → HSL conversion reference table
- Review and approve UX spec changes

---

### Technical Writer Role
**Document:** `docs/ui-component-architecture.md`
**Responsibilities:**
- Complete rewrite for HeroUI patterns
- Document custom olive theme configuration
- Create component usage examples
- Write hex → HSL migration guide
- Create HeroUI component catalog

---

### Development Team
**Stories:** Epic 1.5 (Stories 1.5.1 through 1.5.6)
**Responsibilities:**
- Execute all 6 stories in Epic 1.5
- Install and configure HeroUI
- Migrate all Epic 1-2 components
- Convert hex → HSL colors
- Preserve keyboard shortcuts and accessibility
- Test migrations thoroughly
- Fix any issues discovered

---

### Scrum Master / Product Manager
**Documents:** `sprint-status.yaml`, Epic files
**Responsibilities:**
- Update sprint-status.yaml:
  - Story 3.2: drafted → backlog
  - Create epic-1.5 entry
- Create `docs/epics/epic-1-5-heroui-migration.md`
- Update epic sequence in index
- Track Epic 1.5 progress
- Coordinate with development team

---

## 10. Success Criteria

**Epic 1.5 Migration Considered Successful When:**

1. ✅ All Epic 1-2 components migrated to HeroUI
2. ✅ All colors converted from hex → HSL
3. ✅ Custom olive theme renders correctly (light/dark modes)
4. ✅ Keyboard navigation preserved (j/k, vim-style shortcuts)
5. ✅ Accessibility maintained (WCAG 2.1 Level AA)
6. ✅ No visual regressions from Epic 1-2
7. ✅ No functional regressions from Epic 1-2
8. ✅ Performance equivalent or better
9. ✅ Documentation updated (Architecture, UX Spec, UI Component Guide)
10. ✅ Epic 3 ready to resume with HeroUI foundation

---

## 11. Timeline & Next Steps

### Current State
- Epic 1: ✅ Complete (requires migration)
- Epic 2: ✅ Complete (requires migration)
- Epic 3: Story 3.1 ✅ Done, Story 3.2 📝 Drafted
- Epic 4-7: 📋 Backlog

### Immediate Actions (Post-Approval)
1. ✅ Save Sprint Change Proposal
2. ✅ Update sprint-status.yaml
3. ✅ Create Epic 1.5 epic file
4. Draft Story 1.5.1 (HeroUI Setup)
5. Begin Epic 1.5 execution

### Timeline
- **Epic 1.5 execution:** 2-3 weeks (15-22 working days)
- **Epic 3 resume:** After Epic 1.5 completion
- **MVP original estimate:** 6-8 weeks
- **MVP with migration:** 8-11 weeks (+2-3 weeks)

### Quality Improvement
- **UI Coherence:** Significant improvement (professional design system)
- **Maintainability:** High (HSL colors easier to manage)
- **Development Velocity:** Increased for Epic 3-7 (coherent component library)
- **Technical Debt:** Eliminated (no accumulated inconsistencies)

---

## 12. Risk Mitigation

### Identified Risks & Mitigations

**Risk 1: Timeline Slippage**
- **Probability:** Medium
- **Impact:** Medium (delays Epic 3-7)
- **Mitigation:**
  - Clear story breakdown with effort estimates
  - Regular progress tracking
  - Parallel work where possible (docs while migrating)

**Risk 2: Keyboard Navigation Regression**
- **Probability:** Low
- **Impact:** High (breaks core UX principle)
- **Mitigation:**
  - HeroUI uses React Aria under hood
  - Dedicated testing in Story 1.5.6
  - Preserve custom keyboard handlers

**Risk 3: Theme Customization Issues**
- **Probability:** Low
- **Impact:** Medium (olive colors not working)
- **Mitigation:**
  - ✅ Already verified HeroUI supports custom themes
  - Story 1.5.1 validates theme early
  - HSL format well-supported by HeroUI

**Risk 4: Scope Creep During Migration**
- **Probability:** Medium
- **Impact:** Medium (timeline extension)
- **Mitigation:**
  - Strict scope: Only migrate, don't redesign
  - Focus on functional parity, not improvements
  - Defer enhancements to Epic 3+

---

## 13. Approval & Sign-off

**Approval Date:** 2025-11-28
**Approved By:** Technical Lead
**Status:** ✅ APPROVED

**Next Action:** Execute implementation plan (Section 7)

---

**END OF SPRINT CHANGE PROPOSAL**
