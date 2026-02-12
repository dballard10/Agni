import type { WeekState, WeeklyItemType } from "../../types/weekly";
import type { CalendarEvent } from "../../types/calendar";
import { parseISODateLocal } from "../date";

const ITEM_TYPE_COLORS: Record<WeeklyItemType, string> = {
  task: "#3b82f6",
  event: "#8b5cf6",
  birthday: "#ec4899",
  holiday: "#10b981",
};

export function getTaskDate(weekStartISO: string, dayIndex: number): Date {
  const base = parseISODateLocal(weekStartISO);
  const d = new Date(base);
  d.setDate(base.getDate() + dayIndex);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function convertWeekToCalendarEvents(week: WeekState): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  if (!week || !week.tasks) return events;

  week.tasks.forEach((task) => {
    const date = getTaskDate(week.weekStart, task.dayIndex);
    const dateStr = date.toISOString().split("T")[0];
    const type = task.type ?? "task";

    events.push({
      id: `evt-${task.id}`,
      type,
      title: task.title,
      start: dateStr,
      taskId: task.id,
      content: `Status: ${task.status}`,
      color: ITEM_TYPE_COLORS[type],
    });
  });

  return events;
}

// Placeholder for future extension
export function mergeCalendarEvents(
  tasks: CalendarEvent[],
  extras: CalendarEvent[] = []
): CalendarEvent[] {
  return [...tasks, ...extras];
}
