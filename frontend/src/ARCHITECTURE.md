# Frontend Architecture

This document describes the folder structure and architectural patterns used in the Agni frontend.

## Folder Structure Overview

```
src/
  app/          # App shell, routing, providers, initialization
  pages/        # Route-level composition (one folder per route)
  widgets/      # Big composed UI regions (sidebars, headers)
  features/     # User actions and workflows by domain
  entities/     # Domain objects and their core UI
  shared/       # Reusable, generic building blocks
  mock/         # Mock/test data
```

The structure follows a **domain-first + layered boundaries** approach, reading from generic → domain → action → composition → route → app bootstrap.

---

## Layer Details

### `shared/` - Reusable Building Blocks
Generic utilities and components with **no app-specific logic**.

```
shared/
  ui/           # Generic UI components (Avatar, DatePicker, Modal)
  hooks/        # Generic hooks (useClickOutside, useAnchoredMenu)
  lib/          # Utility functions (date, markdown, string helpers)
  api/          # Base API client (apiFetch wrapper)
  types/        # TypeScript types and interfaces
  context/      # React context providers
  assets/       # Static assets
```

**Can import from:** Nothing above it (base layer)

### `entities/` - Domain Objects
Core domain models and their basic UI representation.

```
entities/
  task/
    model/      # Task types, itemTypeConfig, domain logic
    ui/         # TaskCard, StatusSelector
    api/        # Task API endpoints
  goal/
    model/      # Goal types, goalStyles
    ui/         # GoalCard
  companion/
    ui/         # CompanionAvatar
  day/
    ui/         # DayCard, DayCardHeader, AddButton
  week/
    ui/         # WeekHeader
  group/
    ui/         # GroupCard
  calendar-event/
    model/      # Calendar event types
    ui/         # Calendar event components
```

**Can import from:** `shared`

### `features/` - User Workflows
User actions and feature-specific logic organized by domain.

```
features/
  weekly/
    edit-task/      # TaskDetailsForm, TaskDetailsContent
    recurrence/     # RecurrenceSelector, recurrence logic
    week-picker/    # WeeklyFolderTree, CreateWeekPickerButton
    stats/          # WeeklyStatsPanel, stats calculations
    day-settings/   # DayCardSettings, clipboard actions
    useWeekState.ts # Main state management hook
  notes/
    editor/         # LiveMarkdownEditor, MarkdownNotePreview
    search/         # NotesFileSearchPanel, search logic
    drawer/         # NotesDrawer, NotesFileExplorerPanel
  goals/
    goal-details/   # GoalDetailsPanel
    goal-color/     # GoalColorSelect
  companions/       # Companion management features
  settings/
    editing-and-saving/  # EditingAndSavingSettingsPage
```

**Can import from:** `entities`, `shared`

### `widgets/` - Composed UI Regions
Big UI regions that compose features and entities. Keep widgets "dumb" - they receive content via props/slots.

```
widgets/
  SidePanel/        # RightSidePanel, LeftSidebar, PanelToggle
  PageHeader/       # PageHeader component
  TopNotifications/ # TopNotificationHost
```

**Can import from:** `features`, `entities`, `shared`

### `pages/` - Route-Level Composition
One folder per route, stitching widgets and features together.

```
pages/
  WeeklyPage/       # WeeklyView, selectors, useWeeklyViewDetails
  NotesPage/        # NotesPage
  GoalsPage/        # GoalsPage
  CompanionsPage/   # CompanionsPage
  CalendarPage/     # CalendarView, BigCalendarShell, YearCalendarGrid
  SettingsPage/     # SettingsPage
```

**Can import from:** `widgets`, `features`, `entities`, `shared`

### `app/` - App Bootstrap
App shell, routing, and global initialization.

```
app/
  layout/           # AppShellLayout
  router/           # Tab routing logic
  styles/           # Global styles
  config/           # App configuration
```

**Can import from:** `pages`, `widgets`, `features`, `entities`, `shared`

---

## Dependency Rules

```
shared    ← entities ← features ← widgets ← pages ← app
   ↑____________↑__________↑__________↑________↑______↑
              (each layer can import from layers to its left)
```

| Layer     | Can Import From                           |
|-----------|-------------------------------------------|
| `shared`  | (nothing - base layer)                    |
| `entities`| `shared`                                  |
| `features`| `entities`, `shared`                      |
| `widgets` | `features`, `entities`, `shared`          |
| `pages`   | `widgets`, `features`, `entities`, `shared`|
| `app`     | everything                                |

---

## Import Aliases

Path aliases are configured in `tsconfig.app.json` and `vite.config.ts`:

```typescript
import { Avatar } from "@/shared/ui";
import { TaskCard } from "@/entities/task/ui";
import { TaskDetailsForm } from "@/features/weekly/edit-task";
import { RightSidePanel } from "@/widgets/SidePanel";
import { WeeklyView } from "@/pages/WeeklyPage";
import { AppShellLayout } from "@/app/layout";
```

---

## Naming Conventions

| Type       | Convention              | Example                    |
|------------|-------------------------|----------------------------|
| Folders    | kebab-case              | `edit-task/`, `week-picker/`|
| Components | PascalCase.tsx          | `TaskCard.tsx`             |
| Hooks      | useThing.ts             | `useWeekState.ts`          |
| Types      | types.ts                | `types.ts`                 |
| Utilities  | camelCase.ts            | `dateUtils.ts`             |
| Barrel     | index.ts                | `index.ts`                 |

---

## "Where Do I Put X?" Guide

| I want to add...                              | Put it in...                         |
|-----------------------------------------------|--------------------------------------|
| A new reusable button/input/modal             | `shared/ui/`                         |
| A new generic utility function                | `shared/lib/`                        |
| A new React hook (generic)                    | `shared/hooks/`                      |
| A new domain type (Task, Goal, etc.)          | `entities/[domain]/model/`           |
| A basic display for a domain object           | `entities/[domain]/ui/`              |
| API endpoints for a domain                    | `entities/[domain]/api/`             |
| A user workflow (edit, search, manage)        | `features/[domain]/[feature-name]/`  |
| A large UI region (sidebar, panel)            | `widgets/[Widget]/`                  |
| A new route/page                              | `pages/[PageName]/`                  |
| Global styles or app config                   | `app/styles/` or `app/config/`       |

---

## Adding a New Feature (Checklist)

1. **Identify the domain** - Which entity does this feature relate to?
2. **Create the feature folder** - `features/[domain]/[feature-name]/`
3. **Add components** - Feature-specific components in the folder
4. **Add index.ts** - Export all public components/functions
5. **Update parent index.ts** - Add export to `features/[domain]/index.ts`
6. **Import using aliases** - Use `@/features/...` paths

Example: Adding a "task-archive" feature
```
features/weekly/task-archive/
  TaskArchiveButton.tsx
  TaskArchiveModal.tsx
  useTaskArchive.ts
  index.ts
```

---

## Example Imports

```typescript
// In a page component
import { TaskCard } from "@/entities/task/ui";
import { TaskDetailsForm } from "@/features/weekly/edit-task";
import { RightSidePanel } from "@/widgets/SidePanel";
import { useAppSettings } from "@/shared/context";
import type { Task } from "@/shared/types";

// In an entity component
import { Avatar } from "@/shared/ui";
import type { Goal } from "@/shared/types";

// In a feature component
import { TaskCard } from "@/entities/task/ui";
import { useClickOutside } from "@/shared/hooks";
```

---

## Migration Notes

This architecture was migrated from a flat `components/` structure. Some import paths may still need updating. When you encounter old paths like:
- `../../../types/weekly` → `@/shared/types`
- `../../../lib/api` → `@/entities/task/api` or `@/shared/api`
- `../../ui/Avatar` → `@/shared/ui`
- `../shared/useClickOutside` → `@/shared/hooks`

Update them to use the new `@/` aliases.
