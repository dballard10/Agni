export type TaskStatus = "open" | "completed" | "cancelled" | "failed" | "moved";

export type WeeklyItemType = "task" | "event" | "birthday" | "holiday";

export type RecurrenceFrequency = "day" | "week" | "month";

export interface RecurrenceRule {
  id: string;
  frequency: RecurrenceFrequency;
  interval: number;
  startDateISO: string;
  endDateISO?: string;
  // Template fields for generated tasks
  title: string;
  type: WeeklyItemType;
  goalIds?: string[];
  companionIds?: string[];
  linksMarkdown?: string;
  location?: TaskLocation;
  notesMarkdown?: string;
  groupId?: string | null;
}

export interface RecurrenceException {
  skipDatesISO: string[];
}

export interface Goal {
  id: string;
  name: string;
  emoji?: string;
  description?: string;
  color?: string;
  imageKey?: string;
  createdAt: string; // ISO string
  archived?: boolean;
  dueDate?: string;
}

export type CompanionRelationship =
  | "friend"
  | "coworker"
  | "partner"
  | "family"
  | "acquaintance"
  | "other";

export interface TaskLocation {
  label: string; // what user sees in the field, e.g. "Glory Days Grill, 123 Main St, City"
  mapUrl: string; // derived from lat/lng when available
  lat?: number;
  lng?: number;
  provider: "nominatim";
  nominatim?: {
    placeId?: string;
    osmType?: string;
    osmId?: string;
    raw: unknown; // raw payload for future flexibility
  };
}

export interface Companion {
  id: string;
  name: string;
  relationship: CompanionRelationship;
  description?: string;
  avatarImageKey?: string;
  color?: string; // Hex code or Tailwind class for background
  createdAt: string; // ISO string
}

export interface Task {
  id: string;
  type: WeeklyItemType;
  title: string;
  status: TaskStatus;
  dayIndex: number; // 0 = Sunday ... 6 = Saturday
  position: number; // order within the day (or within the group)
  createdAt: string; // ISO string
  groupId?: string | null; // Optional: if null/undefined, it's a root-level task
  movedTo?: {
    weekOffset: number; // 0 now, later can be +/- weeks
    dayIndex: number; // 0-6
  };
  // New fields
  goalIds?: string[];
  companionIds?: string[];
  linksMarkdown?: string;
  location?: TaskLocation;
  notesMarkdown?: string;
  // Recurrence linkage
  recurrenceId?: string;
  occurrenceDateISO?: string;
  // Schedule fields
  startDate?: string | null; // ISO YYYY-MM-DD
  endDate?: string | null;   // ISO YYYY-MM-DD
  startTime?: string | null; // 24h HH:mm
  endTime?: string | null;   // 24h HH:mm
}

export interface Group {
  id: string;
  title: string;
  dayIndex: number; // 0 = Sunday ... 6 = Saturday
  position: number; // order within the day relative to other groups/tasks
  createdAt: string; // ISO string
}

export interface WeekState {
  weekStart: string; // ISO date string representing Sunday
  tasks: Task[];
  groups: Group[];
  goals: Goal[];
  companions: Companion[];
  recurrences?: Record<string, RecurrenceRule>;
}
