import { useState, useMemo, useRef, useCallback } from "react";
import { IconPencil, IconTrash, IconTrashX, IconSearch, IconLayoutColumns, IconLayoutRows, IconX, IconCopy, IconLink } from "@tabler/icons-react";
import { WeeklyView, type WeeklyPageActions, type WeekTab } from "@/pages/WeeklyPage";
import { CalendarView } from "@/pages/CalendarPage";
import { GoalsPage } from "@/pages/GoalsPage";
import { CompanionsPage } from "@/pages/CompanionsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { NotesPage, type NotesPageActions, type NoteTab, type SplitMode, type EditorPaneState, type FocusedPane } from "@/pages/NotesPage";
import { AgniShellLayout } from "@/app/layout";
import type { PageTab, TabGroup, TabContextMenuCallbacks } from "@/widgets/TopBar";
import type { HeaderMenuItem } from "@/widgets/MainContentHeader";
import {
  useWeekState,
  getMostRecentSunday,
  formatDateISO,
} from "@/features/weekly/useWeekState";
import { convertWeekToCalendarEvents } from "@/shared/lib/calendar/eventAdapters";
import type { PageId, EditorMode } from "@/app/shell/types";

// Utility tabs that can open on any page
export type UtilityTabId = "goals" | "companions" | "settings";

// Pages that support tabs (notes, weekly, calendar)
type TabbedPageId = "notes" | "weekly" | "calendar";

const UTILITY_TAB_LABELS: Record<UtilityTabId, string> = {
  goals: "Goals",
  companions: "Companions",
  settings: "Settings",
};

const UTILITY_TAB_FILE_PATHS: Record<UtilityTabId, string> = {
  goals: "Library/Goals",
  companions: "Library/Companions",
  settings: "Settings",
};

/**
 * Format a week start ISO date into a display path for the header.
 * e.g., "2026-01-26" -> "2026/January/Jan 26 to Feb 1"
 */
function formatWeeklyHeaderPath(weekStartISO: string): string {
  const start = new Date(weekStartISO + "T00:00:00");
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const year = start.getFullYear().toString();
  const monthLong = start.toLocaleDateString("en-US", { month: "long" });

  const formatShort = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const rangeLabel = `${formatShort(start)} to ${formatShort(end)}`;

  return `${year}/${monthLong}/${rangeLabel}`;
}

function App() {
  const [activeTab, setActiveTab] = useState<PageId>("notes");
  const { weekState, actions, availableWeekStartsISO } = useWeekState();
  const [pendingWeeklyTaskId, setPendingWeeklyTaskId] = useState<string | null>(
    null
  );
  const notesActionsRef = useRef<NotesPageActions | null>(null);
  const [notesShellState, setNotesShellState] = useState<{
    filePath: string;
    secondaryFilePath?: string;
    canGoBack: boolean;
    canGoForward: boolean;
    editorMode: EditorMode;
    noteTabs: NoteTab[];
    activeNoteTabIndex: number;
    splitMode: SplitMode;
    tabCount: number;
    primaryPane: EditorPaneState | null;
    secondaryPane: EditorPaneState | null;
    splitRatio: number;
  }>({
    filePath: "Notes",
    secondaryFilePath: undefined,
    canGoBack: false,
    canGoForward: false,
    editorMode: "preview",
    noteTabs: [],
    activeNoteTabIndex: -1,
    splitMode: "none",
    tabCount: 0,
    primaryPane: null,
    secondaryPane: null,
    splitRatio: 0.5,
  });

  const weeklyActionsRef = useRef<WeeklyPageActions | null>(null);
  const [weeklyShellState, setWeeklyShellState] = useState<{
    weekTabs: WeekTab[];
    activeWeekTabIndex: number;
  }>({
    weekTabs: [],
    activeWeekTabIndex: -1,
  });

  // Utility tabs state scoped by page
  const [utilityTabsByPage, setUtilityTabsByPage] = useState<
    Partial<Record<TabbedPageId, UtilityTabId[]>>
  >({});
  const [activeUtilityByPage, setActiveUtilityByPage] = useState<
    Partial<Record<TabbedPageId, UtilityTabId | null>>
  >({});

  // Helper to get current tabbed page (notes, weekly, calendar only)
  const currentTabbedPage: TabbedPageId | null =
    activeTab === "notes" || activeTab === "weekly" || activeTab === "calendar"
      ? activeTab
      : null;

  // Currently active utility tab for the current page
  const activeUtility = currentTabbedPage
    ? activeUtilityByPage[currentTabbedPage] ?? null
    : null;

  // Open a utility tab on the current page
  const handleOpenUtilityTab = useCallback(
    (tab: UtilityTabId) => {
      if (!currentTabbedPage) return;
      setUtilityTabsByPage((prev) => {
        const existing = prev[currentTabbedPage] ?? [];
        if (existing.includes(tab)) return prev;
        return { ...prev, [currentTabbedPage]: [...existing, tab] };
      });
      setActiveUtilityByPage((prev) => ({
        ...prev,
        [currentTabbedPage]: tab,
      }));
    },
    [currentTabbedPage]
  );

  // Close a utility tab on the current page
  const handleCloseUtilityTab = useCallback(
    (tab: UtilityTabId) => {
      if (!currentTabbedPage) return;
      setUtilityTabsByPage((prev) => {
        const existing = prev[currentTabbedPage] ?? [];
        const updated = existing.filter((t) => t !== tab);
        return { ...prev, [currentTabbedPage]: updated };
      });
      setActiveUtilityByPage((prev) => {
        if (prev[currentTabbedPage] === tab) {
          return { ...prev, [currentTabbedPage]: null };
        }
        return prev;
      });
    },
    [currentTabbedPage]
  );

  // Clear active utility (switch back to base content)
  const clearActiveUtility = useCallback(() => {
    if (!currentTabbedPage) return;
    setActiveUtilityByPage((prev) => ({
      ...prev,
      [currentTabbedPage]: null,
    }));
  }, [currentTabbedPage]);

  const handleOpenWeeklyTask = (taskId: string) => {
    setPendingWeeklyTaskId(taskId);
    setActiveTab("weekly");
  };

  const handleTabChange = (nextTab: PageId) => {
    if (nextTab === "weekly" && activeTab !== "weekly") {
      actions.setWeekStart(formatDateISO(getMostRecentSunday()));
      setActiveTab("weekly");
      return;
    }
    setActiveTab(nextTab);
  };

  const handleOpenFileExplorerTab = useCallback(() => {
    if (activeTab === "notes") {
      notesActionsRef.current?.focusExplorer();
    } else if (activeTab === "weekly") {
      weeklyActionsRef.current?.focusExplorer();
    }
  }, [activeTab]);

  const handleFocusSearch = useCallback(() => {
    if (activeTab === "notes") {
      notesActionsRef.current?.focusSearch();
    } else if (activeTab === "weekly") {
      weeklyActionsRef.current?.focusSearch();
    }
  }, [activeTab]);

  const handleOpenOverview = useCallback(() => {
    if (activeTab === "weekly") {
      weeklyActionsRef.current?.openOverview();
    }
  }, [activeTab]);

  const handleNotesShellStateChange = useCallback(
    (nextState: {
      filePath: string;
      secondaryFilePath?: string;
      canGoBack: boolean;
      canGoForward: boolean;
      editorMode: EditorMode;
      noteTabs: NoteTab[];
      activeNoteTabIndex: number;
      splitMode: SplitMode;
      tabCount: number;
      primaryPane: EditorPaneState | null;
      secondaryPane: EditorPaneState | null;
      splitRatio: number;
    }) => {
      setNotesShellState(nextState);
    },
    []
  );

  const handleNoteTabChange = useCallback(
    (index: number) => {
      if (activeTab !== "notes") return;
      notesActionsRef.current?.selectTabIndex(index);
    },
    [activeTab]
  );

  const handleNoteTabClose = useCallback(
    (index: number) => {
      if (activeTab !== "notes") return;
      notesActionsRef.current?.closeTabIndex(index);
    },
    [activeTab]
  );

  const handleTabReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (activeTab !== "notes") return;
      notesActionsRef.current?.reorderTab(fromIndex, toIndex);
    },
    [activeTab]
  );

  const handleAddTab = useCallback(() => {
    if (activeTab !== "notes") return;
    notesActionsRef.current?.addTab();
  }, [activeTab]);

  const handleGroupAddTab = useCallback(
    (groupIndex: number) => {
      if (activeTab !== "notes") return;
      const pane = groupIndex === 0 ? "primary" : "secondary";
      notesActionsRef.current?.addPaneTab(pane);
    },
    [activeTab]
  );

  const handleNotesGoBack = useCallback(() => {
    if (activeTab !== "notes") return;
    notesActionsRef.current?.goBack();
  }, [activeTab]);

  const handleNotesGoForward = useCallback(() => {
    if (activeTab !== "notes") return;
    notesActionsRef.current?.goForward();
  }, [activeTab]);

  const handleNotesToggleEditorMode = useCallback(() => {
    if (activeTab !== "notes") return;
    notesActionsRef.current?.toggleEditorMode();
  }, [activeTab]);

  const handleWeeklyShellStateChange = useCallback(
    (nextState: { weekTabs: WeekTab[]; activeWeekTabIndex: number }) => {
      setWeeklyShellState(nextState);
    },
    []
  );

  const handleWeeklyTabChange = useCallback(
    (index: number) => {
      if (activeTab !== "weekly") return;
      weeklyActionsRef.current?.selectTabIndex(index);
    },
    [activeTab]
  );

  const handleWeeklyTabClose = useCallback(
    (index: number) => {
      if (activeTab !== "weekly") return;
      weeklyActionsRef.current?.closeTabIndex(index);
    },
    [activeTab]
  );

  // Compute combined pageTabs (base + utility) for current page
  const { combinedTabs, baseTabCount } = useMemo(() => {
    const utilityTabs = currentTabbedPage
      ? (utilityTabsByPage[currentTabbedPage] ?? [])
      : [];

    // Build base tabs
    let baseTabs: PageTab[] = [];
    if (activeTab === "notes") {
      baseTabs = notesShellState.noteTabs.map((t) => ({
        id: t.noteId,
        title: t.title,
        variant: "base" as const,
        closable: true,
      }));
    } else if (activeTab === "weekly") {
      baseTabs = weeklyShellState.weekTabs.map((t) => ({
        id: t.weekStartISO,
        title: t.title,
        variant: "base" as const,
        closable: true,
      }));
    } else if (activeTab === "calendar") {
      // Calendar has a non-closable root tab
      baseTabs = [
        {
          id: "calendar-root",
          title: "Calendar",
          variant: "root" as const,
          closable: false,
        },
      ];
    }

    // Build utility tabs
    const utilityTabItems: PageTab[] = utilityTabs.map((tabId) => ({
      id: `utility:${tabId}`,
      title: UTILITY_TAB_LABELS[tabId],
      variant: "utility" as const,
      closable: true,
    }));

    return {
      combinedTabs: [...baseTabs, ...utilityTabItems],
      baseTabCount: baseTabs.length,
    };
  }, [
    activeTab,
    currentTabbedPage,
    notesShellState.noteTabs,
    weeklyShellState.weekTabs,
    utilityTabsByPage,
  ]);

  // Compute active tab index (considering utility tabs)
  const activePageTabIndex = useMemo(() => {
    if (!currentTabbedPage) return undefined;

    const utilityTabs = utilityTabsByPage[currentTabbedPage] ?? [];
    const activeUtil = activeUtilityByPage[currentTabbedPage] ?? null;

    // If a utility tab is active, find its index
    if (activeUtil) {
      const utilityIndex = utilityTabs.indexOf(activeUtil);
      if (utilityIndex !== -1) {
        return baseTabCount + utilityIndex;
      }
    }

    // Otherwise use the base active index
    if (activeTab === "notes") return notesShellState.activeNoteTabIndex;
    if (activeTab === "weekly") return weeklyShellState.activeWeekTabIndex;
    if (activeTab === "calendar") return 0; // Calendar root is always index 0

    return undefined;
  }, [
    activeTab,
    currentTabbedPage,
    baseTabCount,
    utilityTabsByPage,
    activeUtilityByPage,
    notesShellState.activeNoteTabIndex,
    weeklyShellState.activeWeekTabIndex,
  ]);

  // Handle tab change (base vs utility)
  const handlePageTabChange = useCallback(
    (index: number) => {
      if (!currentTabbedPage) return;

      const utilityTabs = utilityTabsByPage[currentTabbedPage] ?? [];

      // Check if this is a utility tab
      if (index >= baseTabCount) {
        const utilityIndex = index - baseTabCount;
        const utilityTab = utilityTabs[utilityIndex];
        if (utilityTab) {
          setActiveUtilityByPage((prev) => ({
            ...prev,
            [currentTabbedPage]: utilityTab,
          }));
        }
        return;
      }

      // Otherwise it's a base tab - clear utility and delegate
      clearActiveUtility();

      if (activeTab === "notes") {
        handleNoteTabChange(index);
      } else if (activeTab === "weekly") {
        handleWeeklyTabChange(index);
      }
      // Calendar doesn't need delegation - just showing base content
    },
    [
      activeTab,
      currentTabbedPage,
      baseTabCount,
      utilityTabsByPage,
      clearActiveUtility,
      handleNoteTabChange,
      handleWeeklyTabChange,
    ]
  );

  // Handle tab close (base vs utility)
  const handlePageTabClose = useCallback(
    (index: number) => {
      if (!currentTabbedPage) return;

      const utilityTabs = utilityTabsByPage[currentTabbedPage] ?? [];

      // Check if this is a utility tab
      if (index >= baseTabCount) {
        const utilityIndex = index - baseTabCount;
        const utilityTab = utilityTabs[utilityIndex];
        if (utilityTab) {
          handleCloseUtilityTab(utilityTab);
        }
        return;
      }

      // Otherwise it's a base tab - delegate to page
      // Calendar root cannot be closed (closable: false handles UI, but guard here too)
      if (activeTab === "calendar") return;

      if (activeTab === "notes") {
        handleNoteTabClose(index);
      } else if (activeTab === "weekly") {
        handleWeeklyTabClose(index);
      }
    },
    [
      activeTab,
      currentTabbedPage,
      baseTabCount,
      utilityTabsByPage,
      handleCloseUtilityTab,
      handleNoteTabClose,
      handleWeeklyTabClose,
    ]
  );

  // Build tab groups for split mode, or single pageTabs for normal mode
  const { pageTabs, tabGroups } = useMemo(() => {
    const isSplit = activeTab === "notes" && notesShellState.splitMode !== "none";

    if (isSplit && notesShellState.primaryPane && notesShellState.secondaryPane) {
      // Build tab groups from pane data
      const buildTabsFromPane = (pane: EditorPaneState): PageTab[] => {
        return pane.noteIds.map((noteId) => {
          const noteTab = notesShellState.noteTabs.find((t) => t.noteId === noteId);
          return {
            id: noteId,
            title: noteTab?.title ?? "Untitled",
            variant: "base" as const,
            closable: true,
          };
        });
      };

      const groups: TabGroup[] = [
        {
          tabs: buildTabsFromPane(notesShellState.primaryPane),
          activeIndex: notesShellState.primaryPane.activeIndex,
        },
        {
          tabs: buildTabsFromPane(notesShellState.secondaryPane),
          activeIndex: notesShellState.secondaryPane.activeIndex,
        },
      ];

      return { pageTabs: undefined, tabGroups: groups };
    }

    // Normal single-group mode
    return {
      pageTabs: combinedTabs.length > 0 ? combinedTabs : undefined,
      tabGroups: undefined,
    };
  }, [activeTab, notesShellState.splitMode, notesShellState.primaryPane, notesShellState.secondaryPane, notesShellState.noteTabs, combinedTabs]);

  // Handlers for grouped tab operations (split mode)
  const handleGroupTabChange = useCallback(
    (groupIndex: number, tabIndex: number) => {
      if (activeTab !== "notes") return;
      const pane: FocusedPane = groupIndex === 0 ? "primary" : "secondary";
      notesActionsRef.current?.selectPaneTabIndex(pane, tabIndex);
    },
    [activeTab]
  );

  const handleGroupTabClose = useCallback(
    (groupIndex: number, tabIndex: number) => {
      if (activeTab !== "notes") return;
      const pane: FocusedPane = groupIndex === 0 ? "primary" : "secondary";
      notesActionsRef.current?.closePaneTabIndex(pane, tabIndex);
    },
    [activeTab]
  );

  const handleTabMove = useCallback(
    (fromGroup: number, fromIndex: number, toGroup: number, toIndex: number) => {
      if (activeTab !== "notes") return;
      const fromPane: FocusedPane = fromGroup === 0 ? "primary" : "secondary";
      const toPane: FocusedPane = toGroup === 0 ? "primary" : "secondary";
      notesActionsRef.current?.movePaneTab(fromPane, fromIndex, toPane, toIndex);
    },
    [activeTab]
  );

  // Convert weekly tasks to calendar events
  const calendarEvents = useMemo(() => {
    return convertWeekToCalendarEvents(weekState);
  }, [weekState]);

  // Compute header menu items based on active tab (hide when utility tab is active)
  const headerMenuItems = useMemo<HeaderMenuItem[] | undefined>(() => {
    // Don't show page-specific menu items when a utility tab is active
    if (activeUtility) return undefined;

    if (activeTab === "notes") {
      const canSplit = notesShellState.tabCount > 1;

      const splitItems: HeaderMenuItem[] = notesShellState.splitMode === "none"
        ? [
            {
              id: "split-right",
              label: "Split Right",
              icon: IconLayoutColumns,
              disabled: !canSplit,
              onSelect: () => notesActionsRef.current?.splitRight(),
            },
            {
              id: "split-down",
              label: "Split Down",
              icon: IconLayoutRows,
              disabled: !canSplit,
              onSelect: () => notesActionsRef.current?.splitBelow(),
            },
          ]
        : [
            {
              id: "close-split",
              label: "Close Split",
              icon: IconX,
              onSelect: () => notesActionsRef.current?.closeSplit(),
            },
          ];

      return [
        ...splitItems,
        {
          id: "find-replace",
          label: "Find & Replace",
          icon: IconSearch,
          separatorBefore: true,
          onSelect: () => notesActionsRef.current?.openFindReplace(),
        },
        {
          id: "copy-path",
          label: "Copy Path",
          icon: IconLink,
          separatorBefore: true,
          onSelect: () => notesActionsRef.current?.copyCurrentNotePath(),
        },
        {
          id: "copy",
          label: "Copy",
          icon: IconCopy,
          onSelect: () => notesActionsRef.current?.copyCurrentNote(),
        },
        {
          id: "rename",
          label: "Rename",
          icon: IconPencil,
          onSelect: () => notesActionsRef.current?.renameCurrentNote(),
        },
        {
          id: "delete",
          label: "Delete",
          icon: IconTrash,
          danger: true,
          separatorBefore: true,
          onSelect: () => notesActionsRef.current?.deleteCurrentNote(),
        },
      ];
    }
    if (activeTab === "weekly") {
      return [
        {
          id: "remove-all-tasks",
          label: "Remove all tasks",
          icon: IconTrashX,
          danger: true,
          onSelect: () => weeklyActionsRef.current?.removeAllTasksForCurrentWeek(),
        },
      ];
    }
    return undefined;
  }, [activeTab, activeUtility, notesShellState.splitMode, notesShellState.tabCount]);

  // Compute filePath for header (utility tab overrides base)
  const headerFilePath = useMemo(() => {
    if (activeUtility) {
      return UTILITY_TAB_FILE_PATHS[activeUtility];
    }
    if (activeTab === "notes") return notesShellState.filePath;
    if (activeTab === "weekly") return formatWeeklyHeaderPath(weekState.weekStart);
    if (activeTab === "calendar") return "Calendar";
    return undefined;
  }, [activeUtility, activeTab, notesShellState.filePath, weekState.weekStart]);

  // Tab context menu callbacks (only for notes page)
  const tabContextMenu = useMemo<TabContextMenuCallbacks | undefined>(() => {
    if (activeTab !== "notes") return undefined;
    return {
      onSplitBelow: (tabId) => notesActionsRef.current?.splitBelowWithNote(tabId),
      onSplitRight: (tabId) => notesActionsRef.current?.splitRightWithNote(tabId),
      onCloseSplit: () => notesActionsRef.current?.closeSplit(),
      onCopyPath: (tabId) => notesActionsRef.current?.copyNotePath(tabId),
      onCopyFile: (tabId) => notesActionsRef.current?.copyNote(tabId),
      onRename: (tabId) => notesActionsRef.current?.renameNote(tabId),
      onDelete: (tabId) => notesActionsRef.current?.deleteNote(tabId),
    };
  }, [activeTab]);

  return (
    <AgniShellLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onOpenFileExplorerTab={handleOpenFileExplorerTab}
      onFocusSearch={handleFocusSearch}
      onOpenOverview={handleOpenOverview}
      onOpenUtilityTab={handleOpenUtilityTab}
      sidebarContent={<div id="agni-shell-sidebar-slot" className="h-full" />}
      filePath={headerFilePath}
      canGoBack={activeTab === "notes" && !activeUtility ? notesShellState.canGoBack : undefined}
      canGoForward={activeTab === "notes" && !activeUtility ? notesShellState.canGoForward : undefined}
      editorMode={activeTab === "notes" && !activeUtility ? notesShellState.editorMode : undefined}
      onGoBack={handleNotesGoBack}
      onGoForward={handleNotesGoForward}
      onToggleEditorMode={!activeUtility ? handleNotesToggleEditorMode : undefined}
      headerTitle={activeTab === "weekly" && !activeUtility ? "Weekly Planner" : undefined}
      pageTabs={pageTabs}
      activePageTabIndex={activePageTabIndex}
      onPageTabChange={handlePageTabChange}
      onPageTabClose={handlePageTabClose}
      onTabReorder={handleTabReorder}
      onAddTab={handleAddTab}
      tabGroups={tabGroups}
      onGroupTabChange={handleGroupTabChange}
      onGroupTabClose={handleGroupTabClose}
      onTabMove={handleTabMove}
      onGroupAddTab={handleGroupAddTab}
      headerMenuItems={headerMenuItems}
      splitMode={activeTab === "notes" ? notesShellState.splitMode : undefined}
      secondaryFilePath={activeTab === "notes" ? notesShellState.secondaryFilePath : undefined}
      splitRatio={activeTab === "notes" ? notesShellState.splitRatio : undefined}
      tabContextMenu={tabContextMenu}
    >
      {/* Base page content - hidden when utility tab is active but kept mounted */}
      {activeTab === "weekly" && (
        <div className={activeUtility ? "hidden" : undefined}>
          <WeeklyView
            weekState={weekState}
            actions={actions}
            openTaskId={pendingWeeklyTaskId}
            onOpenTaskHandled={() => setPendingWeeklyTaskId(null)}
            availableWeekStartsISO={availableWeekStartsISO}
            onSelectWeekStart={(iso) => {
              actions.setWeekStart(iso);
              setActiveTab("weekly");
            }}
            onCreateCurrentWeek={actions.createOrSelectCurrentWeek}
            onCreateWeekForDate={actions.createOrSelectWeekForDate}
            actionsRef={weeklyActionsRef}
            onShellStateChange={handleWeeklyShellStateChange}
          />
        </div>
      )}
      {activeTab === "calendar" && (
        <div className={activeUtility ? "hidden" : undefined}>
          <CalendarView events={calendarEvents} />
        </div>
      )}
      {activeTab === "notes" && (
        <div className={activeUtility ? "hidden" : undefined}>
          <NotesPage
            actionsRef={notesActionsRef}
            onShellStateChange={handleNotesShellStateChange}
          />
        </div>
      )}

      {/* Utility tab content - rendered when active on current page */}
      {activeUtility === "goals" && (
        <GoalsPage
          weekState={weekState}
          actions={actions}
          onOpenWeeklyTask={handleOpenWeeklyTask}
        />
      )}
      {activeUtility === "companions" && (
        <CompanionsPage weekState={weekState} actions={actions} />
      )}
      {activeUtility === "settings" && (
        <SettingsPage weekState={weekState} actions={actions} />
      )}
    </AgniShellLayout>
  );
}

export default App;
