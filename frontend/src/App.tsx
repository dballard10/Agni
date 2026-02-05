import { useState, useMemo, useRef, useCallback } from "react";
import { WeeklyView, type WeeklyPageActions, type WeekTab } from "@/pages/WeeklyPage";
import { CalendarView } from "@/pages/CalendarPage";
import { GoalsPage } from "@/pages/GoalsPage";
import { CompanionsPage } from "@/pages/CompanionsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { NotesPage, type NotesPageActions, type NoteTab } from "@/pages/NotesPage";
import { AgniShellLayout } from "@/app/layout";
import type { PageTab } from "@/widgets/TopBar";
import {
  useWeekState,
  getMostRecentSunday,
  formatDateISO,
} from "@/features/weekly/useWeekState";
import { convertWeekToCalendarEvents } from "@/shared/lib/calendar/eventAdapters";
import type { PageId, EditorMode } from "@/app/shell/types";

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
    canGoBack: boolean;
    canGoForward: boolean;
    editorMode: EditorMode;
    noteTabs: NoteTab[];
    activeNoteTabIndex: number;
  }>({
    filePath: "Notes",
    canGoBack: false,
    canGoForward: false,
    editorMode: "preview",
    noteTabs: [],
    activeNoteTabIndex: -1,
  });

  const weeklyActionsRef = useRef<WeeklyPageActions | null>(null);
  const [weeklyShellState, setWeeklyShellState] = useState<{
    weekTabs: WeekTab[];
    activeWeekTabIndex: number;
  }>({
    weekTabs: [],
    activeWeekTabIndex: -1,
  });

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
      canGoBack: boolean;
      canGoForward: boolean;
      editorMode: EditorMode;
      noteTabs: NoteTab[];
      activeNoteTabIndex: number;
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

  // Compute pageTabs based on active page
  const pageTabs = useMemo<PageTab[] | undefined>(() => {
    if (activeTab === "notes") {
      return notesShellState.noteTabs.map((t) => ({ id: t.noteId, title: t.title }));
    }
    if (activeTab === "weekly") {
      return weeklyShellState.weekTabs.map((t) => ({ id: t.weekStartISO, title: t.title }));
    }
    return undefined;
  }, [activeTab, notesShellState.noteTabs, weeklyShellState.weekTabs]);

  const activePageTabIndex = useMemo(() => {
    if (activeTab === "notes") return notesShellState.activeNoteTabIndex;
    if (activeTab === "weekly") return weeklyShellState.activeWeekTabIndex;
    return undefined;
  }, [activeTab, notesShellState.activeNoteTabIndex, weeklyShellState.activeWeekTabIndex]);

  const handlePageTabChange = useCallback(
    (index: number) => {
      if (activeTab === "notes") {
        handleNoteTabChange(index);
      } else if (activeTab === "weekly") {
        handleWeeklyTabChange(index);
      }
    },
    [activeTab, handleNoteTabChange, handleWeeklyTabChange]
  );

  const handlePageTabClose = useCallback(
    (index: number) => {
      if (activeTab === "notes") {
        handleNoteTabClose(index);
      } else if (activeTab === "weekly") {
        handleWeeklyTabClose(index);
      }
    },
    [activeTab, handleNoteTabClose, handleWeeklyTabClose]
  );

  // Convert weekly tasks to calendar events
  const calendarEvents = useMemo(() => {
    return convertWeekToCalendarEvents(weekState);
  }, [weekState]);

  return (
    <AgniShellLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onOpenFileExplorerTab={handleOpenFileExplorerTab}
      onFocusSearch={handleFocusSearch}
      onOpenOverview={handleOpenOverview}
      sidebarContent={<div id="agni-shell-sidebar-slot" className="h-full" />}
      filePath={
        activeTab === "notes"
          ? notesShellState.filePath
          : activeTab === "weekly"
            ? formatWeeklyHeaderPath(weekState.weekStart)
            : undefined
      }
      canGoBack={activeTab === "notes" ? notesShellState.canGoBack : undefined}
      canGoForward={activeTab === "notes" ? notesShellState.canGoForward : undefined}
      editorMode={activeTab === "notes" ? notesShellState.editorMode : undefined}
      onGoBack={handleNotesGoBack}
      onGoForward={handleNotesGoForward}
      onToggleEditorMode={handleNotesToggleEditorMode}
      headerTitle={activeTab === "weekly" ? "Weekly Planner" : undefined}
      pageTabs={pageTabs}
      activePageTabIndex={activePageTabIndex}
      onPageTabChange={handlePageTabChange}
      onPageTabClose={handlePageTabClose}
    >
      {activeTab === "weekly" && (
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
      )}
      {activeTab === "calendar" && <CalendarView events={calendarEvents} />}
      {activeTab === "goals" && (
        <GoalsPage
          weekState={weekState}
          actions={actions}
          onOpenWeeklyTask={handleOpenWeeklyTask}
        />
      )}
      {activeTab === "companions" && (
        <CompanionsPage weekState={weekState} actions={actions} />
      )}
      {activeTab === "settings" && (
        <SettingsPage weekState={weekState} actions={actions} />
      )}
      {activeTab === "notes" && (
        <NotesPage
          actionsRef={notesActionsRef}
          onShellStateChange={handleNotesShellStateChange}
        />
      )}
    </AgniShellLayout>
  );
}

export default App;
