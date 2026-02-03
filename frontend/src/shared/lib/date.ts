export function getDateForDayIndex(weekStart: Date, dayIndex: number): Date {
  const date = new Date(weekStart);
  date.setDate(weekStart.getDate() + dayIndex);
  return date;
}

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getNext30MinBlock(): string {
  const now = new Date();
  const minutes = now.getMinutes();
  const hours = now.getHours();

  if (minutes === 0) {
    return `${String(hours).padStart(2, "0")}:00`;
  }

  if (minutes <= 30) {
    return `${String(hours).padStart(2, "0")}:30`;
  }

  const nextHour = (hours + 1) % 24;
  return `${String(nextHour).padStart(2, "0")}:00`;
}

export interface ScheduleValues {
  startDate?: string | null;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}

/**
 * Validates that the end datetime is not before the start datetime.
 * - If both dates exist: endDate must be >= startDate.
 * - If dates are equal and both times exist: endTime must be >= startTime.
 */
export function isEndBeforeStart(schedule: ScheduleValues): boolean {
  const { endDateError, endTimeError } = getScheduleEndErrors(schedule);
  return endDateError || endTimeError;
}

export function isValidISODate(dateStr: string): boolean {
  if (!dateStr) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(dateStr + "T00:00:00");
  return !isNaN(d.getTime()) && d.toISOString().startsWith(dateStr);
}

export function isValidTimeHHmm(timeStr: string): boolean {
  if (!timeStr) return true;
  const match = timeStr.match(/^(\d{2}):(\d{2})$/);
  if (!match) return false;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  return h >= 0 && h < 24 && m >= 0 && m < 60;
}

/**
 * Returns field-specific error states for the schedule.
 */
export function getScheduleEndErrors(schedule: ScheduleValues): {
  endDateError: boolean;
  endTimeError: boolean;
} {
  const { startDate, endDate, startTime, endTime } = schedule;

  let endDateError = false;
  let endTimeError = false;

  // 1. Format validation (if non-empty)
  if (endDate && !isValidISODate(endDate)) {
    endDateError = true;
  }
  if (endTime && !isValidTimeHHmm(endTime)) {
    endTimeError = true;
  }

  if (endDateError || endTimeError) {
    return { endDateError, endTimeError };
  }

  // 2. Chronological validation
  if (startDate && endDate && isValidISODate(startDate) && isValidISODate(endDate)) {
    if (endDate < startDate) {
      endDateError = true;
    } else if (endDate === startDate && startTime && endTime && isValidTimeHHmm(startTime) && isValidTimeHHmm(endTime)) {
      if (endTime < startTime) {
        endTimeError = true;
      }
    }
  }

  return { endDateError, endTimeError };
}


