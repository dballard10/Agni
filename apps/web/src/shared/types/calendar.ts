export type CalendarViewMode = "year" | "month" | "week" | "day";

export interface CalendarEvent {
  id: string;
  type: "event" | "holiday" | "task" | "birthday";
  title: string;
  start: string; // ISO date-time string
  end?: string; // ISO date-time string
  taskId?: string; // Link to original task if type is 'task'
  content?: string; // Markdown content or description
  color?: string; // Optional override color
}
