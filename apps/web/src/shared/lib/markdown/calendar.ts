import type { CalendarEvent } from "../../types/calendar";

/**
 * ### Calendar Markdown Format
 * 
 * Proposed structure for storing yearly/monthly calendar data in markdown:
 * 
 * # Calendar 2025
 * 
 * ## 2025-01-01
 * - [ ] New Year's Day (Holiday)
 * - [ ] Event: Family Dinner (Event)
 * 
 * ## 2025-01-15
 * - [ ] Task: Project Deadline
 * 
 * Note: Weekly tasks are stored separately in weekly markdown files. 
 * This module is for independent calendar events (holidays, future planning).
 */

export const calendarEventsToMarkdown = (_events: CalendarEvent[]): string => {
  // TODO: Implement serialization
  return "";
};

export const parseCalendarMarkdown = (_markdown: string): CalendarEvent[] => {
  // TODO: Implement parsing
  return [];
};






