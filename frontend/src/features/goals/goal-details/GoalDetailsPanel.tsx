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
  open: "bg-indigo-700/70 text-indigo-400",
  completed: "bg-emerald-700/70 text-emerald-400",
  failed: "bg-rose-700/70 text-rose-400",
  cancelled: "bg-slate-700/70 text-slate-400",
  moved: "bg-amber-700/70 text-amber-400",
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
    <div className="flex flex-col h-full text-slate-100">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl border border-slate-700 flex items-center justify-center text-3xl"
            style={{ backgroundColor: color }}
          >
            {goal.emoji ?? "🎯"}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">{goal.name}</h3>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              {formatPercentage(goal.stats.completionRate)} complete this week
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500"
              style={{ width: `${goal.stats.completionRate}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs text-slate-400">
            <div className="space-y-0.5">
              <p className="text-[11px] uppercase">Completed</p>
              <p className="text-sm text-slate-100 font-semibold">
                {completedTasks}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] uppercase">In progress</p>
              <p className="text-sm text-slate-100 font-semibold">
                {activeTasks}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] uppercase">Failed</p>
              <p className="text-sm text-slate-100 font-semibold">
                {failedTasks}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label className="text-xs uppercase tracking-wide text-slate-400">
            Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            onBlur={handleDescriptionBlur}
            placeholder="Add framing details, notes, or resources..."
            className="mt-1 w-full rounded-xl bg-slate-900 border border-slate-700 p-3 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400">
              Color
            </label>
            <GoalColorSelect value={color} onChange={handleColorChange} />
            <p className="text-xs text-slate-400 mt-1 font-mono">
              {color.toUpperCase()}
            </p>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400">
              Due Date
            </label>
            <DateInputWithPicker
              value={dueDate}
              onChange={(value) => handleDueDateChange(value)}
              className="mt-1 w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
              placeholder="Pick a date"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex-1 flex flex-col gap-3 overflow-y-auto">
        <div className="flex items-center justify-between text-sm font-semibold text-slate-200">
          <span>Linked tasks</span>
          <span className="text-slate-500">{linkedTasks.length}</span>
        </div>
        {linkedTasks.length === 0 ? (
          <p className="text-xs text-slate-500">
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
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-start justify-between gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 transition">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-100 truncate">
                      {task.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
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
        <div className="mt-4 pt-4 border-t border-slate-700">
          {isConfirmingDelete ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onDelete();
                }}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition"
              >
                Confirm delete
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="px-4 py-2 text-sm font-medium rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 transition"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 hover:border-rose-500/50 transition"
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
