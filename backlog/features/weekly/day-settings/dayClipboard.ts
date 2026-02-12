import type {
  Task,
  Group,
  TaskLocation,
  WeeklyItemType,
} from "../../../shared/types/weekly";

/**
 * Clipboard group - stripped of IDs for paste recreation
 */
export interface ClipboardGroup {
  title: string;
  position: number;
}

/**
 * Clipboard task - stripped of IDs, status, dayIndex for paste recreation
 */
export interface ClipboardTask {
  title: string;
  type: WeeklyItemType;
  position: number;
  groupIndex?: number; // index into ClipboardGroup array (instead of groupId)
  goalIds?: string[];
  companionIds?: string[];
  linksMarkdown?: string;
  location?: TaskLocation;
  notesMarkdown?: string;
  startDate?: string | null;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}

/**
 * Day clipboard data structure
 */
export interface DayClipboard {
  version: 1;
  copiedAtISO: string;
  sourceWeekStartISO?: string;
  sourceDayIndex?: number;
  groups: ClipboardGroup[];
  tasks: ClipboardTask[];
}

/**
 * Build a DayClipboard from tasks and groups for a specific day.
 */
export function buildDayClipboard(
  dayIndex: number,
  tasks: Task[],
  groups: Group[],
  weekStartISO?: string
): DayClipboard {
  // Filter to this day
  const dayGroups = groups
    .filter((g) => g.dayIndex === dayIndex)
    .sort((a, b) => a.position - b.position);

  const dayTasks = tasks
    .filter((t) => t.dayIndex === dayIndex)
    .sort((a, b) => a.position - b.position);

  // Map old groupId -> groupIndex
  const groupIdToIndex = new Map<string, number>();
  dayGroups.forEach((g, idx) => {
    groupIdToIndex.set(g.id, idx);
  });

  const clipboardGroups: ClipboardGroup[] = dayGroups.map((g) => ({
    title: g.title,
    position: g.position,
  }));

  const clipboardTasks: ClipboardTask[] = dayTasks.map((t) => {
    const groupIndex = t.groupId ? groupIdToIndex.get(t.groupId) : undefined;
    return {
      title: t.title,
      type: t.type,
      position: t.position,
      groupIndex,
      goalIds: t.goalIds,
      companionIds: t.companionIds,
      linksMarkdown: t.linksMarkdown,
      location: t.location,
      notesMarkdown: t.notesMarkdown,
      startDate: t.startDate,
      endDate: t.endDate,
      startTime: t.startTime,
      endTime: t.endTime,
    };
  });

  return {
    version: 1,
    copiedAtISO: new Date().toISOString(),
    sourceWeekStartISO: weekStartISO,
    sourceDayIndex: dayIndex,
    groups: clipboardGroups,
    tasks: clipboardTasks,
  };
}

/**
 * Compute the max position for root tasks in a day.
 */
export function getMaxRootTaskPosition(tasks: Task[], dayIndex: number): number {
  const rootTasks = tasks.filter(
    (t) => t.dayIndex === dayIndex && !t.groupId
  );
  if (rootTasks.length === 0) return -1;
  return Math.max(...rootTasks.map((t) => t.position));
}

/**
 * Compute the max position for groups in a day.
 */
export function getMaxGroupPosition(groups: Group[], dayIndex: number): number {
  const dayGroups = groups.filter((g) => g.dayIndex === dayIndex);
  if (dayGroups.length === 0) return -1;
  return Math.max(...dayGroups.map((g) => g.position));
}

/**
 * Check if a clipboard has any content worth pasting.
 */
export function isClipboardEmpty(clipboard: DayClipboard | null): boolean {
  if (!clipboard) return true;
  return clipboard.tasks.length === 0 && clipboard.groups.length === 0;
}
