import type { Task, TaskStatus, TaskLocation, WeekState, Group, WeeklyItemType } from "../../types/weekly";

export type MarkdownTaskStatusToken = "[ ]" | "[x]" | "[>]" | "[-]" | "[?]";

export interface MarkdownTask {
  status: TaskStatus;
  title: string;
  type?: WeeklyItemType;
}

export const taskStatusToToken = (
  status: TaskStatus
): MarkdownTaskStatusToken => {
  switch (status) {
    case "completed":
      return "[x]";
    case "moved":
      return "[>]";
    case "cancelled":
      return "[-]";
    case "failed":
      return "[?]";
    case "open":
    default:
      return "[ ]";
  }
};

export const tokenToTaskStatus = (token: string): TaskStatus => {
  switch (token) {
    case "[x]":
      return "completed";
    case "[>]":
      return "moved";
    case "[-]":
      return "cancelled";
    case "[?]":
      return "failed";
    case "[ ]":
    default:
      return "open";
  }
};

const TASK_LINE_REGEX = /^(\s*)([-*])\s+\[( |x|>|\-|\?)\]\s+(.*)$/;

const TYPE_MARKER_REGEX = /^\[(task|event|birthday|holiday)\]\s+/i;

export const parseMarkdownTaskLine = (line: string): MarkdownTask | null => {
  const match = line.match(TASK_LINE_REGEX);
  if (!match) return null;

  // match[1] is indent, match[2] is bullet char
  const rawToken = match[3];
  let title = match[4].trim();

  const markerMatch = title.match(TYPE_MARKER_REGEX);
  let type: WeeklyItemType = "task";
  if (markerMatch) {
    type = markerMatch[1].toLowerCase() as WeeklyItemType;
    title = title.replace(markerMatch[0], "").trim();
  }

  const token: MarkdownTaskStatusToken =
    rawToken === " " ? "[ ]" : (`[${rawToken}]` as MarkdownTaskStatusToken);

  return {
    status: tokenToTaskStatus(token),
    title,
    type,
  };
};

export const serializeMarkdownTask = (task: MarkdownTask): string => {
  const token = taskStatusToToken(task.status);
  const title = task.title.trim() || "New task...";
  const typeMarker =
    task.type && task.type !== "task" ? `[${task.type}] ` : "";
  return `- ${token} ${typeMarker}${title}`;
};

export const taskToMarkdownLine = (task: Task): string => {
  const mainLine = serializeMarkdownTask({
    status: task.status,
    title: task.title,
  });

  // If no location, just return the main line
  if (!task.location) {
    return mainLine;
  }

  // Add location metadata as indented bullet lines
  const lines = [mainLine];
  lines.push(`  - location: ${task.location.label}`);
  if (task.location.mapUrl) {
    lines.push(`  - map: ${task.location.mapUrl}`);
  }

  return lines.join("\n");
};

// Parse location metadata from indented lines following a task
const LOCATION_LINE_REGEX = /^\s+-\s+location:\s+(.+)$/;
const MAP_LINE_REGEX = /^\s+-\s+map:\s+(.+)$/;

interface ParsedLocationMeta {
  label?: string;
  mapUrl?: string;
}

function parseLocationMetaLines(
  lines: string[],
  startIndex: number
): { meta: ParsedLocationMeta; linesConsumed: number } {
  const meta: ParsedLocationMeta = {};
  let linesConsumed = 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];

    // Check for location line
    const locationMatch = line.match(LOCATION_LINE_REGEX);
    if (locationMatch) {
      meta.label = locationMatch[1].trim();
      linesConsumed++;
      continue;
    }

    // Check for map line
    const mapMatch = line.match(MAP_LINE_REGEX);
    if (mapMatch) {
      meta.mapUrl = mapMatch[1].trim();
      linesConsumed++;
      continue;
    }

    // If line doesn't match location metadata patterns, stop
    // (could be another task, header, etc.)
    break;
  }

  return { meta, linesConsumed };
}

// Build a TaskLocation from parsed metadata
function buildTaskLocation(meta: ParsedLocationMeta): TaskLocation | undefined {
  if (!meta.label) {
    return undefined;
  }

  return {
    label: meta.label,
    mapUrl: meta.mapUrl || "",
    provider: "nominatim",
  };
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const formatISODate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

const getDateForDayIndex = (weekStartISO: string, dayIndex: number): Date => {
  const base = new Date(weekStartISO);
  const d = new Date(base);
  d.setDate(base.getDate() + dayIndex);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatMonthDayLabel = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}/${day}`;
};

export const weekStateToMarkdown = (week: WeekState): string => {
  const lines: string[] = [];

  lines.push(`# Week of ${week.weekStart}`);
  lines.push("");
  lines.push("## Days");
  lines.push("");

  for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
    const date = getDateForDayIndex(week.weekStart, dayIndex);
    const dayName = DAY_NAMES[dayIndex];
    const label = formatMonthDayLabel(date);

    lines.push(`### ${dayName} ${label}`);
    lines.push("");

    // 1. Get groups for this day
    const dayGroups = (week.groups || [])
      .filter((g) => g.dayIndex === dayIndex)
      .sort((a, b) => a.position - b.position);

    // 2. Get root-level tasks (no groupId) for this day
    const rootTasks = week.tasks
      .filter((task) => task.dayIndex === dayIndex && !task.groupId)
      .sort((a, b) => a.position - b.position);

    // We need to interleave them based on position if we want precise reconstruction,
    // but for now let's just dump root tasks then groups.
    // TODO: A more robust approach would be to unify them into a single list of "items" and sort.

    // Render root tasks first (or we could mix them)
    if (rootTasks.length > 0) {
      for (const task of rootTasks) {
        // taskToMarkdownLine may return multiple lines (task + metadata)
        const taskLines = taskToMarkdownLine(task);
        lines.push(taskLines);
      }
    }

    // Render groups
    for (const group of dayGroups) {
      lines.push("");
      lines.push(`#### Group: ${group.title}`);

      const groupTasks = week.tasks
        .filter((task) => task.groupId === group.id)
        .sort((a, b) => a.position - b.position);

      for (const task of groupTasks) {
        // Indent all lines (task + metadata) under group
        const taskLines = taskToMarkdownLine(task);
        const indentedLines = taskLines
          .split("\n")
          .map((l) => `  ${l}`)
          .join("\n");
        lines.push(indentedLines);
      }
    }

    // If day is totally empty
    if (rootTasks.length === 0 && dayGroups.length === 0) {
      lines.push("- [ ] ...");
    }

    lines.push("");
  }

  return lines.join("\n");
};

export const parseWeeklyMarkdown = (markdown: string): WeekState => {
  const lines = markdown.split(/\r?\n/);

  let weekStart = "";
  let currentDayIndex: number | null = null;
  let currentGroupId: string | null = null;

  const tasks: Task[] = [];
  const groups: Group[] = [];

  const weekHeaderPrefix = "# Week of ";

  const getOrCreateId = () => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `id-${Math.random().toString(36).slice(2)}`;
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!weekStart && trimmed.startsWith(weekHeaderPrefix)) {
      weekStart = trimmed.slice(weekHeaderPrefix.length).trim();
      i++;
      continue;
    }

    // Day Header
    if (trimmed.startsWith("### ")) {
      const heading = trimmed.slice(4).trim();
      const parts = heading.split(" ");
      const maybeDayName = parts[0];
      const dayIndex = DAY_NAMES.indexOf(
        maybeDayName as (typeof DAY_NAMES)[number]
      );
      currentDayIndex = dayIndex >= 0 ? dayIndex : null;
      currentGroupId = null; // Reset group context on new day
      i++;
      continue;
    }

    // Group Header
    // Simple heuristic: "#### Group: My Title"
    if (trimmed.startsWith("#### Group:")) {
      if (currentDayIndex == null) {
        i++;
        continue;
      }

      const groupTitle = trimmed.replace("#### Group:", "").trim();
      const newGroup: Group = {
        id: getOrCreateId(),
        title: groupTitle,
        dayIndex: currentDayIndex,
        position:
          groups.filter((g) => g.dayIndex === currentDayIndex).length +
          tasks.filter((t) => t.dayIndex === currentDayIndex && !t.groupId)
            .length,
        createdAt: new Date().toISOString(),
      };
      groups.push(newGroup);
      currentGroupId = newGroup.id;
      i++;
      continue;
    }

    // Task Line
    if (TASK_LINE_REGEX.test(line)) {
      if (currentDayIndex == null) {
        i++;
        continue;
      }
      const parsed = parseMarkdownTaskLine(line);
      if (!parsed) {
        i++;
        continue;
      }

      // Check indentation from regex match
      const match = line.match(TASK_LINE_REGEX);
      const indentation = match ? match[1] : "";

      // If no indentation, it might mean we stepped out of the group
      let targetGroupId = currentGroupId;
      if (currentGroupId && indentation.length < 2) {
        // Indentation broken -> likely exited group
        targetGroupId = null;
        currentGroupId = null;
      }

      const existingInContext = targetGroupId
        ? tasks.filter((t) => t.groupId === targetGroupId)
        : tasks.filter((t) => t.dayIndex === currentDayIndex && !t.groupId);

      // Look ahead for location metadata on subsequent lines
      const { meta, linesConsumed } = parseLocationMetaLines(lines, i + 1);
      const location = buildTaskLocation(meta);

      tasks.push({
        id: getOrCreateId(),
        type: parsed.type ?? "task",
        title: parsed.title,
        status: parsed.status,
        dayIndex: currentDayIndex,
        position: existingInContext.length,
        createdAt: new Date().toISOString(),
        groupId: targetGroupId || undefined,
        location,
      });

      // Skip the metadata lines we consumed
      i += 1 + linesConsumed;
      continue;
    }

    // Default: move to next line
    i++;
  }

  if (!weekStart) {
    const today = new Date();
    const day = today.getDay();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - day);
    sunday.setHours(0, 0, 0, 0);
    weekStart = formatISODate(sunday);
  }

  return {
    weekStart,
    tasks,
    groups,
    goals: [],
    companions: [],
  };
};
