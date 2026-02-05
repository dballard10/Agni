import type { WeekState } from "../../../shared/types/weekly";

export interface DayStats {
  dayIndex: number;
  label: string;
  open: number;
  completed: number;
  failed: number;
  total: number;
}

export interface WeekStats {
  total: {
    open: number;
    completed: number;
    failed: number;
    all: number;
  };
  byDay: DayStats[];
}

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function computeWeekStats(weekState: WeekState): WeekStats {
  // Initialize counters for the week
  const weekTotal = {
    open: 0,
    completed: 0,
    failed: 0,
    all: 0,
  };

  // Initialize per-day stats
  const byDay: DayStats[] = DAY_LABELS.map((label, index) => ({
    dayIndex: index,
    label,
    open: 0,
    completed: 0,
    failed: 0,
    total: 0,
  }));

  // Iterate over tasks
  weekState.tasks.forEach((task) => {
    // 1. Exclude cancelled tasks
    if (task.status === "cancelled") {
      return;
    }

    const type = task.type ?? "task";

    // 2. Exclude informational types
    if (type === "birthday" || type === "holiday") {
      return;
    }

    // 3. Exclude moved tasks (if movedTo is defined)
    if (task.movedTo) {
      return;
    }

    // 4. Ensure valid day index (0-6)
    if (task.dayIndex < 0 || task.dayIndex > 6) {
      return;
    }

    const dayStats = byDay[task.dayIndex];

    // 4. Count based on status
    if (task.status === "open") {
      dayStats.open++;
      weekTotal.open++;
    } else if (task.status === "completed") {
      dayStats.completed++;
      weekTotal.completed++;
    } else if (task.status === "failed") {
      dayStats.failed++;
      weekTotal.failed++;
    }
    // Note: If there are other statuses in the future (besides cancelled/moved which are handled),
    // they are currently ignored based on the "only count open, completed, failed" rule.
    // However, the current type is rigid, so these are the only ones left.
  });

  // 5. Compute totals per day
  byDay.forEach((day) => {
    day.total = day.open + day.completed + day.failed;
  });

  // 6. Compute week total count
  weekTotal.all = weekTotal.open + weekTotal.completed + weekTotal.failed;

  return {
    total: weekTotal,
    byDay,
  };
}

export function formatWeekStatsAsMarkdown(stats: WeekStats): string {
  const lines: string[] = [];

  lines.push("# Weekly Overview");
  lines.push("");
  lines.push(
    `- **Week total**: ${stats.total.completed} / ${stats.total.all} completed, ${stats.total.failed} / ${stats.total.all} failed, ${stats.total.open} / ${stats.total.all} open`
  );
  lines.push("");

  stats.byDay.forEach((day) => {
    lines.push(`## ${day.label}`);
    if (day.total === 0) {
      lines.push("- No tasks");
    } else {
      lines.push(`- ${day.completed} / ${day.total} completed`);
      lines.push(`- ${day.failed} / ${day.total} failed`);
      lines.push(`- ${day.open} / ${day.total} open`);
    }
    lines.push("");
  });

  return lines.join("\n");
}
