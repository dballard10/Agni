import type { WeekState } from "../../types/weekly";
import type { CalendarEvent } from "../../types/calendar";
import { ITEM_TYPE_STYLES } from "../../../entities/task/model/itemTypeConfig";
import { parseISODateLocal } from "../date";

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
      color: ITEM_TYPE_STYLES[type]?.colorHex,
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
