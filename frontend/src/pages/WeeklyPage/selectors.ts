import type { Group, Task } from "../../shared/types/weekly";

export function getTasksForDay(tasks: Task[], dayIndex: number) {
  return tasks
    .filter((t) => t.dayIndex === dayIndex)
    .sort((a, b) => a.position - b.position);
}

export function getGroupsForDay(groups: Group[], dayIndex: number) {
  return groups
    .filter((g) => g.dayIndex === dayIndex)
    .sort((a, b) => a.position - b.position);
}


