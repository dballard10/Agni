import type {
  Task,
  RecurrenceRule,
  RecurrenceException,
} from "../../../shared/types/weekly";

/**
 * Gets the ISO date string (YYYY-MM-DD) for a given day index within a week.
 */
export function getWeekDateISO(weekStartISO: string, dayIndex: number): string {
  const date = new Date(weekStartISO + "T00:00:00");
  date.setDate(date.getDate() + dayIndex);
  return date.toISOString().split("T")[0];
}

/**
 * Determines if a recurrence rule produces an occurrence on the given date.
 */
export function occursOnDate(rule: RecurrenceRule, dateISO: string): boolean {
  const start = new Date(rule.startDateISO + "T00:00:00");
  const target = new Date(dateISO + "T00:00:00");

  if (target < start) return false;
  if (rule.endDateISO && target > new Date(rule.endDateISO + "T00:00:00")) return false;

  const diffTime = target.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  switch (rule.frequency) {
    case "day":
      return diffDays % rule.interval === 0;

    case "week": {
      if (target.getDay() !== start.getDay()) return false;
      const diffWeeks = Math.floor(diffDays / 7);
      return diffWeeks % rule.interval === 0;
    }

    case "month": {
      const monthsDiff =
        (target.getFullYear() - start.getFullYear()) * 12 +
        (target.getMonth() - start.getMonth());
      if (monthsDiff % rule.interval !== 0) return false;

      const targetDay = target.getDate();
      const startDay = start.getDate();

      if (targetDay === startDay) return true;

      // Handle clamping: if target date is the last day of the month and startDay is greater
      const lastDayOfTargetMonth = new Date(
        target.getFullYear(),
        target.getMonth() + 1,
        0
      ).getDate();
      if (targetDay === lastDayOfTargetMonth && startDay > lastDayOfTargetMonth) {
        return true;
      }

      return false;
    }

    default:
      return false;
  }
}

/**
 * Ensures that all recurring occurrences for a given week are present in the task list.
 */
export function applyRecurrencesToWeek(
  weekStartISO: string,
  existingTasks: Task[],
  recurrences: Record<string, RecurrenceRule>,
  exceptions: Record<string, RecurrenceException>
): Task[] {
  const updatedTasks = [...existingTasks];
  const recurrenceIds = Object.keys(recurrences);

  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const dateISO = getWeekDateISO(weekStartISO, dayIndex);

    for (const rid of recurrenceIds) {
      const rule = recurrences[rid];
      const exception = exceptions[rid];

      // Skip if it shouldn't occur on this date
      if (!occursOnDate(rule, dateISO)) continue;

      // Skip if this specific date is an exception
      if (exception?.skipDatesISO.includes(dateISO)) continue;

      // Check if an occurrence already exists for this rule on this date
      const exists = existingTasks.some(
        (t) => t.recurrenceId === rid && t.occurrenceDateISO === dateISO
      );

      if (!exists) {
        // Create new occurrence
        const newTask: Task = {
          id: `occ-${rid}-${dateISO}`,
          type: rule.type,
          title: rule.title,
          status: "open",
          dayIndex,
          position: 999, // Will be sorted at the end of the day or group
          createdAt: new Date().toISOString(),
          goalIds: rule.goalIds,
          companionIds: rule.companionIds,
          linksMarkdown: rule.linksMarkdown,
          location: rule.location,
          notesMarkdown: rule.notesMarkdown,
          groupId: rule.groupId || undefined,
          recurrenceId: rid,
          occurrenceDateISO: dateISO,
        };

        // Fix position: find max position in target context
        const contextTasks = updatedTasks.filter(
          (t) => t.dayIndex === dayIndex && t.groupId === (rule.groupId || undefined)
        );
        const maxPos = contextTasks.reduce((max, t) => Math.max(max, t.position), -1);
        newTask.position = maxPos + 1;

        updatedTasks.push(newTask);
      }
    }
  }

  return updatedTasks;
}
