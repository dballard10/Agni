import { useEffect, useState } from "react";
import { IconTrash } from "@tabler/icons-react";
import type { Goal, Task, TaskStatus } from "../../../shared/types/weekly";
import GoalColorSelect from "../goal-color/GoalColorSelect";
import type { GoalAccentColor } from "../../../entities/goal/model/goalStyles";
import {
  DEFAULT_GOAL_COLOR,
  normalizeGoalColor,
} from "../../../entities/goal/model/goalStyles";
import { ITEM_TYPE_STYLES } from "../../../entities/task/model/itemTypeConfig";
import DateInputWithPicker from "../../../shared/ui/DateInputWithPicker";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_BADGES: Record<TaskStatus, string> = {
  open: "bg-accent/20 text-accent",
  completed: "bg-status-success/20 text-status-success",
  failed: "bg-status-error/20 text-status-error",
  cancelled: "bg-bg-hover/70 text-text-muted",
  moved: "bg-status-warning/20 text-status-warning",
};

const formatPercentage = (value: number) => `${value}%`;

const getInitialColor = (color?: string): GoalAccentColor =>
  normalizeGoalColor(color) ?? DEFAULT_GOAL_COLOR;

interface GoalDetailsPanelProps {
  goal: Goal & {
    stats: { completionRate: number; completed: number; total: number };
  };
  linkedTasks: Task[];
  onUpdate?: (updates: Partial<Omit<Goal, "id" | "createdAt">>) => void;
  onOpenTask?: (taskId: string) => void;
  onDelete?: () => void;
}

export default function GoalDetailsPanel({
  goal,
  linkedTasks,
  onUpdate,
  onOpenTask,
  onDelete,
}: GoalDetailsPanelProps) {
  const [description, setDescription] = useState(goal.description ?? "");
  const [color, setColor] = useState<GoalAccentColor>(
    getInitialColor(goal.color)
  );
  const [dueDate, setDueDate] = useState(goal.dueDate ?? "");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const activeTasks = linkedTasks.filter(
    (task) => task.status === "open"
  ).length;
  const failedTasks = linkedTasks.filter(
    (task) => task.status === "failed"
  ).length;
  const completedTasks = linkedTasks.filter(
    (task) => task.status === "completed"
  ).length;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync with prop changes
    setDescription(goal.description ?? "");
     
    setColor(getInitialColor(goal.color));
     
    setDueDate(goal.dueDate ?? "");
     
    setIsConfirmingDelete(false);
  }, [goal.id, goal.description, goal.color, goal.dueDate]);

  const sendUpdate = (updates: Partial<Omit<Goal, "id" | "createdAt">>) => {
    if (onUpdate) {
      onUpdate(updates);
    }
  };

  const handleDescriptionBlur = () => {
    const trimmed = description.trim();
    sendUpdate({ description: trimmed ? trimmed : undefined });
  };

  const handleDueDateChange = (value: string) => {
    setDueDate(value);
    sendUpdate({ dueDate: value || undefined });
  };

  const handleColorChange = (value: GoalAccentColor) => {
    setColor(value);
    sendUpdate({ color: value });
  };

  return (
    <div className="flex flex-col h-full text-text-primary">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl border border-border flex items-center justify-center text-3xl"
            style={{ backgroundColor: color }}
          >
            {goal.emoji ?? "🎯"}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">{goal.name}</h3>
            <p className="text-xs uppercase tracking-wide text-text-muted">
              {formatPercentage(goal.stats.completionRate)} complete this week
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
            <div
              className="h-full bg-accent"
              style={{ width: `${goal.stats.completionRate}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs text-text-muted">
            <div className="space-y-0.5">
              <p className="text-[11px] uppercase">Completed</p>
              <p className="text-sm text-text-primary font-semibold">
                {completedTasks}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] uppercase">In progress</p>
              <p className="text-sm text-text-primary font-semibold">
                {activeTasks}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] uppercase">Failed</p>
              <p className="text-sm text-text-primary font-semibold">
                {failedTasks}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label className="text-xs uppercase tracking-wide text-text-muted">
            Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            onBlur={handleDescriptionBlur}
            placeholder="Add framing details, notes, or resources..."
            className="mt-1 w-full rounded-xl bg-bg-panel border border-border p-3 text-sm text-text-primary focus:border-focus-ring focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-text-muted">
              Color
            </label>
            <GoalColorSelect value={color} onChange={handleColorChange} />
            <p className="text-xs text-text-muted mt-1 font-mono">
              {color.toUpperCase()}
            </p>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-text-muted">
              Due Date
            </label>
            <DateInputWithPicker
              value={dueDate}
              onChange={(value) => handleDueDateChange(value)}
              className="mt-1 w-full rounded-xl bg-bg-panel border border-border px-3 py-2 text-sm text-text-primary focus:border-focus-ring focus:outline-none"
              placeholder="Pick a date"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex-1 flex flex-col gap-3 overflow-y-auto">
        <div className="flex items-center justify-between text-sm font-semibold text-text-secondary">
          <span>Linked tasks</span>
          <span className="text-text-muted">{linkedTasks.length}</span>
        </div>
        {linkedTasks.length === 0 ? (
          <p className="text-xs text-text-muted">
            Link tasks to this goal to see progress inside the sidebar.
          </p>
        ) : (
          <div className="space-y-2">
            {linkedTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => onOpenTask?.(task.id)}
                className="w-full text-left"
                aria-label={`Open details for ${task.title}`}
              >
                <div className="bg-bg-panel border border-border-subtle rounded-xl p-3 flex items-start justify-between gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring transition">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {task.title}
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      {DAY_LABELS[task.dayIndex] ?? "Day"} •{" "}
                      {ITEM_TYPE_STYLES[task.type ?? "task"]?.label ?? "Task"}
                    </p>
                  </div>
                  <span
                    className={`text-[11px] uppercase tracking-wider px-3 py-0.5 rounded-full font-semibold ${
                      STATUS_BADGES[task.status]
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {onDelete && (
        <div className="mt-4 pt-4 border-t border-border">
          {isConfirmingDelete ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onDelete();
                }}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-xl bg-status-error hover:opacity-90 text-white transition"
              >
                Confirm delete
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="px-4 py-2 text-sm font-medium rounded-xl bg-bg-hover hover:bg-bg-hover text-text-secondary transition"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-status-error/10 hover:bg-status-error/20 text-status-error hover:opacity-90 border border-status-error/30 hover:border-status-error/50 transition"
            >
              <IconTrash className="w-4 h-4" />
              Delete goal
            </button>
          )}
        </div>
      )}
    </div>
  );
}
