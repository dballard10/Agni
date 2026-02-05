// Shared types - domain model types
// Note: These will eventually be split into entity-specific type files
// For now, they're consolidated here for easier migration

export type {
  TaskStatus,
  WeeklyItemType,
  RecurrenceFrequency,
  RecurrenceRule,
  RecurrenceException,
  Goal,
  CompanionRelationship,
  TaskLocation,
  Companion,
  Task,
  Group,
  WeekState,
} from "./weekly";

export type { CalendarEvent, CalendarViewMode } from "./calendar";
