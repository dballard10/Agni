import { useCallback, useEffect, useMemo, useRef, useState, useImperativeHandle } from "react";
import type {
  WeekState,
  TaskStatus,
  TaskLocation,
  WeeklyItemType,
  RecurrenceRule,
  Task,
} from "../../shared/types/weekly";
import DayCard from "../../entities/day/ui/DayCard";
import { computeWeekStats } from "../../features/weekly/stats";
import { getDateForDayIndex, parseISODateLocal } from "../../shared/lib/date";
import { getGroupsForDay, getTasksForDay } from "./selectors";
import { useWeeklyViewDetails } from "./useWeeklyViewDetails";
import DeleteRecurrenceModal from "../../features/weekly/recurrence/DeleteRecurrenceModal";
import { UnsavedChangesModal } from "../../shared/ui/UnsavedChangesModal";
import { useNotifications } from "../../shared/context/NotificationsContext";
import type { DayClipboard, ClipboardTask } from "../../features/weekly/day-settings/dayClipboard";
import { buildDayClipboard } from "../../features/weekly/day-settings/dayClipboard";
import { TaskDetailsModal } from "../../features/weekly/edit-task/TaskDetailsModal";
import { WeeklySidebarPanel } from "../../features/weekly/sidebar/WeeklySidebarPanel";

export interface WeekTab {
  weekStartISO: string;
  title: string;
}

export interface WeeklyPageActions {
  focusExplorer: () => void;
  focusSearch: () => void;
  openOverview: () => void;
  selectTabIndex: (index: number) => void;
  closeTabIndex: (index: number) => void;
  /** Remove all tasks for the current week */
  removeAllTasksForCurrentWeek: () => void;
}

type WeeklyClipboard = 
  | { kind: "day"; data: DayClipboard }
  | { kind: "task"; data: ClipboardTask };

interface WeeklyViewProps {
  weekState: WeekState;
  actions: {
    addTask: (dayIndex: number, title: string, groupId?: string) => void;
    addGroup: (dayIndex: number) => void;
    updateTaskStatus: (id: string, status: TaskStatus) => void;
    updateTaskTitle: (id: string, title: string) => void;
    updateTaskType: (id: string, type: WeeklyItemType) => void;
    updateTaskLinks?: (id: string, linksMarkdown?: string) => void;
    updateTaskNotes?: (id: string, notesMarkdown?: string) => void;
    updateTaskLocation?: (id: string, location?: TaskLocation) => void;
    updateTaskSchedule?: (
      id: string,
      schedule: {
        startDate?: string | null;
        endDate?: string | null;
        startTime?: string | null;
        endTime?: string | null;
      }
    ) => void;
    deleteTask: (id: string) => void;
    updateGroupTitle: (id: string, title: string) => void;
    deleteGroup: (id: string) => void;
    deleteAllForDay: (dayIndex: number) => void;
    pasteDayFromClipboard: (dayIndex: number, clipboard: DayClipboard) => void;
    clearCurrentWeek: () => void;
    addTaskFromClipboard: (dayIndex: number, clipboard: ClipboardTask) => void;
    // Linking Actions
    setTaskGoals?: (taskId: string, goalIds: string[]) => void;
    setTaskCompanions?: (taskId: string, companionIds: string[]) => void;
    createOrUpdateRecurrenceFromTask?: (
      taskId: string,
      ruleDraft: Omit<
        RecurrenceRule,
        | "id"
        | "title"
        | "type"
        | "goalIds"
        | "companionIds"
        | "linksMarkdown"
        | "location"
        | "groupId"
      >
    ) => void;
    deleteTaskOccurrence?: (taskId: string) => void;
    deleteRecurrenceSeries?: (recurrenceId: string) => void;
    patchTaskLocal: (id: string, patch: Partial<Task>) => void;
    commitTaskPatch: (id: string, patch: any) => Promise<void>;
    moveTask: (taskId: string, targetDayIndex: number, targetPosition: number) => void;
  };
  openTaskId?: string | null;
  onOpenTaskHandled?: () => void;
  availableWeekStartsISO: string[];
  onSelectWeekStart: (iso: string) => void;
  onCreateCurrentWeek?: () => void;
  onCreateWeekForDate?: (dateISO: string) => void;
  // Shell integration
  actionsRef?: React.MutableRefObject<WeeklyPageActions | null>;
  onShellStateChange?: (state: { weekTabs: WeekTab[]; activeWeekTabIndex: number }) => void;
}

import { markdownToLinksJson } from "../../features/weekly/edit-task/linksConversion";

export default function WeeklyView({
  weekState,
  actions,
  openTaskId,
  onOpenTaskHandled,
  availableWeekStartsISO,
  onSelectWeekStart,
  onCreateCurrentWeek,
  onCreateWeekForDate,
  actionsRef,
  onShellStateChange,
}: WeeklyViewProps) {
  // Sidebar tab state: "explorer" | "search" | "overview"
  const [sidebarTab, setSidebarTab] = useState<"explorer" | "search" | "overview">("explorer");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Week tabs state
  const [weekTabs, setWeekTabs] = useState<WeekTab[]>([]);
  const [activeWeekTabIndex, setActiveWeekTabIndex] = useState(-1);

  // Draft/Dirty state for Task Details (manual save only)
  const [isDirty, setIsDirty] = useState(false);
  const pendingPatchRef = useRef<Record<string, any>>({});
  const lastCommittedTaskIdRef = useRef<string | null>(null);

  // Task details modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // Unsaved changes modal state
  const [isUnsavedModalOpen, setIsUnsavedModalOpen] = useState(false);
  const pendingActionRef = useRef<{ type: "close" } | { type: "switch"; taskId: string } | null>(null);

  // Snapshot of task when opened - for discard restoration
  const taskSnapshotRef = useRef<Task | null>(null);

  const {
    selectedTaskId,
    detailsMode,
    highlightedTaskId,
    openSidePanel,
    closeDetails,
  } = useWeeklyViewDetails({ openTaskId, onOpenTaskHandled });

  const weekStartDateObj = useMemo(
    () => parseISODateLocal(weekState.weekStart),
    [weekState.weekStart]
  );

  // Helper to format week title
  const formatWeekTitle = useCallback((weekStartISO: string) => {
    const date = parseISODateLocal(weekStartISO);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }, []);

  // When the current week changes, ensure it's in the tabs
  useEffect(() => {
    const currentWeekISO = weekState.weekStart;
    setWeekTabs((prev) => {
      const existingIndex = prev.findIndex((t) => t.weekStartISO === currentWeekISO);
      if (existingIndex >= 0) {
        // Already in tabs, just select it
        setActiveWeekTabIndex(existingIndex);
        return prev;
      }
      // Add new tab
      const newTab: WeekTab = { weekStartISO: currentWeekISO, title: formatWeekTitle(currentWeekISO) };
      const newTabs = [...prev, newTab];
      setActiveWeekTabIndex(newTabs.length - 1);
      return newTabs;
    });
  }, [weekState.weekStart, formatWeekTitle]);

  // Sync shell state when tabs change
  useEffect(() => {
    onShellStateChange?.({ weekTabs, activeWeekTabIndex });
  }, [weekTabs, activeWeekTabIndex, onShellStateChange]);

  // Tab management callbacks
  const handleSelectTabIndex = useCallback((index: number) => {
    if (index < 0 || index >= weekTabs.length) return;
    const tab = weekTabs[index];
    setActiveWeekTabIndex(index);
    onSelectWeekStart(tab.weekStartISO);
  }, [weekTabs, onSelectWeekStart]);

  const handleCloseTabIndex = useCallback((index: number) => {
    if (index < 0 || index >= weekTabs.length) return;
    setWeekTabs((prev) => {
      const newTabs = prev.filter((_, i) => i !== index);
      // If we closed the active tab, select neighbor
      if (index === activeWeekTabIndex) {
        const newIndex = Math.min(index, newTabs.length - 1);
        setActiveWeekTabIndex(newIndex);
        if (newIndex >= 0 && newTabs[newIndex]) {
          onSelectWeekStart(newTabs[newIndex].weekStartISO);
        }
      } else if (index < activeWeekTabIndex) {
        // Adjust active index if we removed a tab before it
        setActiveWeekTabIndex(activeWeekTabIndex - 1);
      }
      return newTabs;
    });
  }, [weekTabs.length, activeWeekTabIndex, onSelectWeekStart]);

  // Expose actions to parent via ref
  useImperativeHandle(
    actionsRef,
    () => ({
      focusExplorer: () => {
        setSidebarTab("explorer");
      },
      focusSearch: () => {
        setSidebarTab("search");
        // Focus input after state update
        setTimeout(() => searchInputRef.current?.focus(), 0);
      },
      openOverview: () => {
        setSidebarTab("overview");
      },
      selectTabIndex: handleSelectTabIndex,
      closeTabIndex: handleCloseTabIndex,
      removeAllTasksForCurrentWeek: () => {
        actions.clearCurrentWeek();
      },
    }),
    [handleSelectTabIndex, handleCloseTabIndex, actions]
  );

  const commitPendingTaskEdits = useCallback(async () => {
    if (!isDirty || !selectedTaskId) return;

    const patch = { ...pendingPatchRef.current };
    setIsDirty(false);
    pendingPatchRef.current = {};

    // If no backend-relevant fields were changed, skip the API call
    if (Object.keys(patch).length === 0) {
      return;
    }

    try {
      await actions.commitTaskPatch(selectedTaskId, patch);
    } catch (err) {
      console.error("Failed to commit changes", err);
      // useWeekState already handles refetch on error
    }
  }, [isDirty, selectedTaskId, actions]);

  // Derived state - selected task object
  const selectedTask = selectedTaskId
    ? weekState.tasks.find((t) => t.id === selectedTaskId)
    : undefined;

  // Track when we switch tasks and capture snapshot for discard
  useEffect(() => {
    if (selectedTaskId) {
      lastCommittedTaskIdRef.current = selectedTaskId;
    }
    // Capture snapshot when task changes and we're clean
    if (selectedTask && !isDirty) {
      taskSnapshotRef.current = { ...selectedTask };
    }
  }, [selectedTaskId, selectedTask, isDirty]);

  const { confirm, notify } = useNotifications();

  // Day/Task clipboard state
  const [clipboard, setClipboard] = useState<WeeklyClipboard | null>(null);

  // Day clipboard handlers
  const handleCopyDay = (dayIndex: number) => {
    const dayClipboard = buildDayClipboard(
      dayIndex,
      weekState.tasks,
      weekState.groups,
      weekState.weekStart
    );

    if (dayClipboard.tasks.length === 0 && dayClipboard.groups.length === 0) {
      notify({
        title: "Nothing to copy",
        message: "This day has no tasks or groups.",
        tone: "info",
        dismissible: true,
      });
      return;
    }

    setClipboard({ kind: "day", data: dayClipboard });
    const dayDate = getDateForDayIndex(weekStartDateObj, dayIndex);
    const dateStr = dayDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    notify({
      title: "Day copied",
      message: `Copied ${dayClipboard.tasks.length} task(s) and ${dayClipboard.groups.length} group(s) from ${dateStr}.`,
      tone: "success",
      dismissible: true,
    });
  };

  const handleCopyTask = (taskId: string) => {
    const task = weekState.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const clipboardTask: ClipboardTask = {
      title: task.title,
      type: task.type,
      position: task.position,
      goalIds: task.goalIds,
      companionIds: task.companionIds,
      linksMarkdown: task.linksMarkdown,
      location: task.location,
      notesMarkdown: task.notesMarkdown,
      startDate: task.startDate,
      endDate: task.endDate,
      startTime: task.startTime,
      endTime: task.endTime,
    };

    setClipboard({ kind: "task", data: clipboardTask });

    notify({
      title: "Task copied",
      message: `Copied "${task.title}" to clipboard.`,
      tone: "success",
      dismissible: true,
    });
  };

  const handlePasteDay = (dayIndex: number) => {
    if (!clipboard) {
      return;
    }

    if (clipboard.kind === "day") {
      actions.pasteDayFromClipboard(dayIndex, clipboard.data);
    } else {
      actions.addTaskFromClipboard(dayIndex, clipboard.data);
    }

    const dayDate = getDateForDayIndex(weekStartDateObj, dayIndex);
    const dateStr = dayDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    notify({
      title: clipboard.kind === "day" ? "Day pasted" : "Task pasted",
      message: 
        clipboard.kind === "day"
          ? `Pasted ${clipboard.data.tasks.length} task(s) and ${clipboard.data.groups.length} group(s) to ${dateStr}.`
          : `Pasted task to ${dateStr}.`,
      tone: "success",
      dismissible: true,
    });
  };

  const handleDeleteAllForDay = async (dayIndex: number) => {
    const dayDate = getDateForDayIndex(weekStartDateObj, dayIndex);
    const dateStr = dayDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });

    const dayTasks = weekState.tasks.filter((t) => t.dayIndex === dayIndex);
    const dayGroups = weekState.groups.filter((g) => g.dayIndex === dayIndex);

    if (dayTasks.length === 0 && dayGroups.length === 0) {
      notify({
        title: "Nothing to delete",
        message: "This day is already empty.",
        tone: "info",
        dismissible: true,
      });
      return;
    }

    const confirmed = await confirm({
      title: "Delete all for this day?",
      message: `Are you sure you want to delete all ${dayTasks.length} task(s) and ${dayGroups.length} group(s) for ${dateStr}?`,
      confirmLabel: "Delete all",
      cancelLabel: "Cancel",
      tone: "danger",
    });

    if (confirmed) {
      actions.deleteAllForDay(dayIndex);
      // Close any open details if it was for a task in this day
      if (selectedTask && selectedTask.dayIndex === dayIndex) {
        setIsTaskModalOpen(false);
        closeDetails();
      }
    }
  };

  const canPaste = !!clipboard;

  // Handler to add a new task (day level)
  const handleAddTask = (dayIndex: number, title: string) => {
    actions.addTask(dayIndex, title);
  };

  // Handler to add a new task to a specific group
  const handleAddTaskToGroup = (
    dayIndex: number,
    groupId: string,
    title: string
  ) => {
    actions.addTask(dayIndex, title, groupId);
  };

  // Helper to actually perform close/switch after save or discard
  const performPendingAction = useCallback(() => {
    const action = pendingActionRef.current;
    pendingActionRef.current = null;

    if (!action) return;

    if (action.type === "close") {
      taskSnapshotRef.current = null; // Clear snapshot on close
      setIsTaskModalOpen(false);
      closeDetails();
    } else if (action.type === "switch") {
      // Clear dirty state first, then switch
      setIsDirty(false);
      pendingPatchRef.current = {};
      openSidePanel(action.taskId);
      // Note: snapshot will be captured in useEffect when selectedTask changes
    }
  }, [closeDetails, openSidePanel]);

  // Unsaved changes modal handlers
  const handleUnsavedModalSave = useCallback(async () => {
    await commitPendingTaskEdits();
    // Update snapshot to current saved state
    if (selectedTask) {
      taskSnapshotRef.current = { ...selectedTask };
    }
    setIsUnsavedModalOpen(false);
    performPendingAction();
  }, [commitPendingTaskEdits, performPendingAction, selectedTask]);

  const handleUnsavedModalDiscard = useCallback(() => {
    // Restore task from snapshot
    if (taskSnapshotRef.current && selectedTaskId) {
      actions.patchTaskLocal(selectedTaskId, taskSnapshotRef.current);
    }
    // Clear dirty state
    setIsDirty(false);
    pendingPatchRef.current = {};
    setIsUnsavedModalOpen(false);
    performPendingAction();
  }, [performPendingAction, selectedTaskId, actions]);

  const handleUnsavedModalCancel = useCallback(() => {
    pendingActionRef.current = null;
    setIsUnsavedModalOpen(false);
  }, []);

  // Guard for leaving task details - shows modal if dirty
  const guardLeaveDetails = useCallback((action: { type: "close" } | { type: "switch"; taskId: string }): boolean => {
    if (isDirty) {
      pendingActionRef.current = action;
      setIsUnsavedModalOpen(true);
      return false; // Blocked - modal will handle it
    }
    return true; // Allowed to proceed
  }, [isDirty]);

  const handleOpenDetailsSidePanel = (taskId: string) => {
    // If switching to a different task while dirty, show the modal
    if (selectedTaskId && selectedTaskId !== taskId && isDirty) {
      if (!guardLeaveDetails({ type: "switch", taskId })) {
        return;
      }
    }

    // Clear dirty state when switching tasks (if not blocked by guard)
    if (selectedTaskId && selectedTaskId !== taskId) {
      setIsDirty(false);
      pendingPatchRef.current = {};
    }

    setIsTaskModalOpen(true);
    openSidePanel(taskId);
  };

  const handleManualSave = async () => {
    await commitPendingTaskEdits();
    // Update snapshot to current saved state
    if (selectedTask) {
      taskSnapshotRef.current = { ...selectedTask };
    }
    notify({
      title: "Changes saved",
      tone: "success",
    });
  };

  const handleDeleteTask = () => {
    if (!selectedTaskId || !selectedTask) return;

    if (selectedTask.recurrenceId) {
      setTaskToDelete(selectedTask);
      setIsDeleteModalOpen(true);
    } else {
      actions.deleteTask(selectedTaskId);
      setIsTaskModalOpen(false);
      closeDetails();
    }
  };

  const handleConfirmDeleteThis = () => {
    if (!taskToDelete) return;
    actions.deleteTaskOccurrence?.(taskToDelete.id);
    setIsDeleteModalOpen(false);
    setTaskToDelete(null);
    if (selectedTaskId === taskToDelete.id) {
      setIsTaskModalOpen(false);
      closeDetails();
    }
  };

  const handleConfirmDeleteAll = () => {
    if (!taskToDelete || !taskToDelete.recurrenceId) return;
    actions.deleteRecurrenceSeries?.(taskToDelete.recurrenceId);
    setIsDeleteModalOpen(false);
    setTaskToDelete(null);
    if (selectedTaskId === taskToDelete.id) {
      setIsTaskModalOpen(false);
      closeDetails();
    }
  };

  const handleExternalDeleteTask = (id: string) => {
    const task = weekState.tasks.find((t) => t.id === id);
    if (task?.recurrenceId) {
      setTaskToDelete(task);
      setIsDeleteModalOpen(true);
    } else {
      actions.deleteTask(id);
    }
  };

  // Sync task modal with detailsMode
  useEffect(() => {
    if (detailsMode === "side-panel" && selectedTask) {
      setIsTaskModalOpen(true);
    }
  }, [detailsMode, selectedTask]);

  // Compute stats for the current week
  const weekStats = computeWeekStats(weekState);
  
  // Task details handlers - always use manual save mode
  const detailsProps = selectedTask
    ? {
        onStatusChange: (s: TaskStatus) => {
          actions.patchTaskLocal(selectedTask.id, { status: s });
          pendingPatchRef.current.status = s;
          setIsDirty(true);
        },
        onTitleChange: (t: string) => {
          actions.patchTaskLocal(selectedTask.id, { title: t });
          pendingPatchRef.current.title = t;
          setIsDirty(true);
        },
        onTypeChange: (type: WeeklyItemType) => {
          actions.patchTaskLocal(selectedTask.id, { type });
          pendingPatchRef.current.task_type_id = type;
          setIsDirty(true);
        },
        onGoalsChange: (goalIds: string[]) => {
          // Goals are local-only (not persisted to backend yet), so just patch locally
          actions.patchTaskLocal(selectedTask.id, { goalIds: goalIds.length > 0 ? goalIds : undefined });
          setIsDirty(true);
        },
        onCompanionsChange: (cids: string[]) => {
          // Companions are local-only (not persisted to backend yet), so just patch locally
          actions.patchTaskLocal(selectedTask.id, { companionIds: cids });
          setIsDirty(true);
        },
        onLinksChange: (links?: string) => {
          actions.patchTaskLocal(selectedTask.id, { linksMarkdown: links });
          pendingPatchRef.current.links = markdownToLinksJson(links);
          setIsDirty(true);
        },
        onNotesChange: (notes?: string) => {
          actions.patchTaskLocal(selectedTask.id, { notesMarkdown: notes });
          pendingPatchRef.current.notes = notes;
          setIsDirty(true);
        },
        onLocationChange: (loc?: TaskLocation) => {
          actions.patchTaskLocal(selectedTask.id, { location: loc });
          pendingPatchRef.current.location = loc || null;
          setIsDirty(true);
        },
        onScheduleChange: (schedule: {
          startDate?: string | null;
          endDate?: string | null;
          startTime?: string | null;
          endTime?: string | null;
        }) => {
          actions.patchTaskLocal(selectedTask.id, schedule);
          if (schedule.startDate !== undefined) pendingPatchRef.current.start_date = schedule.startDate;
          if (schedule.endDate !== undefined) pendingPatchRef.current.end_date = schedule.endDate;
          if (schedule.startTime !== undefined) pendingPatchRef.current.start_time = schedule.startTime;
          if (schedule.endTime !== undefined) pendingPatchRef.current.end_time = schedule.endTime;
          setIsDirty(true);
        },
        onRecurrenceChange: (
          rule: Omit<
            RecurrenceRule,
            | "id"
            | "title"
            | "type"
            | "goalIds"
            | "companionIds"
            | "linksMarkdown"
            | "location"
            | "groupId"
          > | null
        ) => {
          if (rule === null) {
            // Actions to clear recurrence could be added here
          } else {
            actions.createOrUpdateRecurrenceFromTask?.(selectedTask.id, rule);
          }
        },
        onDelete: handleDeleteTask,
        // Manual save props
        isDirty,
        onSave: handleManualSave,
      }
    : undefined;

  return (
    <div className="relative min-h-screen flex flex-col">
      <div className="flex-1 mx-auto max-w-6xl w-full p-4 md:p-6">
        <div className="flex flex-col gap-4 mt-2">
          {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
            const dayDate = getDateForDayIndex(weekStartDateObj, dayIndex);

            // Filter data for this day
            const dayTasks = getTasksForDay(weekState.tasks, dayIndex);
            const dayGroups = getGroupsForDay(weekState.groups, dayIndex);

            return (
              <DayCard
                key={dayIndex}
                dayIndex={dayIndex}
                date={dayDate}
                tasks={dayTasks}
                groups={dayGroups}
                goals={weekState.goals}
                companions={weekState.companions}
                highlightTaskId={highlightedTaskId}
                onAddTask={handleAddTask}
                onAddGroup={actions.addGroup}
                onAddTaskToGroup={handleAddTaskToGroup}
                onUpdateTaskStatus={actions.updateTaskStatus}
                onUpdateTaskTitle={actions.updateTaskTitle}
                onDeleteTask={handleExternalDeleteTask}
                onCopyTask={handleCopyTask}
                onUpdateGroupTitle={actions.updateGroupTitle}
                onDeleteGroup={actions.deleteGroup}
                // Pass details handlers
                onOpenDetailsSidePanel={handleOpenDetailsSidePanel}
                // Day clipboard handlers
                onCopyDay={handleCopyDay}
                onPasteDay={handlePasteDay}
                canPaste={canPaste}
                onDeleteAllForDay={handleDeleteAllForDay}
                onMoveTask={actions.moveTask}
              />
            );
          })}
        </div>
      </div>

      {/* Left sidebar panel (portal) */}
      <WeeklySidebarPanel
        sidebarTab={sidebarTab}
        selectedWeekStartISO={weekState.weekStart}
        availableWeekStartsISO={availableWeekStartsISO}
        onSelectWeekStart={onSelectWeekStart}
        onCreateCurrentWeek={onCreateCurrentWeek}
        onCreateWeekForDate={onCreateWeekForDate}
        weekStats={weekStats}
        searchInputRef={searchInputRef}
      />

      {/* Task details modal */}
      {selectedTask && detailsProps && (
        <TaskDetailsModal
          isOpen={isTaskModalOpen}
          task={selectedTask}
          goals={weekState.goals}
          companions={weekState.companions}
          recurrences={weekState.recurrences}
          onClose={() => {
            if (!guardLeaveDetails({ type: "close" })) {
              return;
            }
            setIsTaskModalOpen(false);
            closeDetails();
          }}
          {...detailsProps}
        />
      )}

      <DeleteRecurrenceModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDeleteThis={handleConfirmDeleteThis}
        onDeleteAll={handleConfirmDeleteAll}
      />

      <UnsavedChangesModal
        isOpen={isUnsavedModalOpen}
        onClose={handleUnsavedModalCancel}
        onSave={handleUnsavedModalSave}
        onDiscard={handleUnsavedModalDiscard}
      />
    </div>
  );
}
