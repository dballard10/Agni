import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { IconPlus, IconUsers } from "@tabler/icons-react";
import type { WeekState, Goal } from "../../shared/types/weekly";
import { RightSidePanel } from "../../widgets/SidePanel";
import { computeWeekStats } from "../../features/weekly/stats";
import GoalDetailsPanel from "../../features/goals/goal-details/GoalDetailsPanel";
import GoalCard from "../../entities/goal/ui/GoalCard";
import { TASK_CARD_CONTAINER } from "../../entities/task/ui/taskCardStyles";

interface GoalsPageProps {
  weekState: WeekState;
  actions: {
    addGoal: (name: string, emoji?: string) => void;
    updateGoal: (
      id: string,
      updates: Partial<Omit<Goal, "id" | "createdAt">>
    ) => void;
    deleteGoal: (id: string) => void;
  };
  onOpenWeeklyTask?: (taskId: string) => void;
}

export default function GoalsPage({
  weekState,
  actions,
  onOpenWeeklyTask,
}: GoalsPageProps) {
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalEmoji, setNewGoalEmoji] = useState("🎯");
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [isStatsPanelOpen, setIsStatsPanelOpen] = useState(false);
  const [returnToStatsOnClose, setReturnToStatsOnClose] = useState(false);

  // Date Range State (Stub for now)
  const [dateRange, setDateRange] = useState<"week" | "month" | "year">("week");

  // Compute stats
  const weekStats = useMemo(() => computeWeekStats(weekState), [weekState]);

  // Compute Goal Stats
  const goalStats = useMemo(() => {
    return weekState.goals.map((goal) => {
      const linkedTasks = weekState.tasks.filter(
        (t) =>
          t.goalIds &&
          t.goalIds.includes(goal.id) &&
          t.status !== "cancelled" &&
          !t.movedTo
      );
      const total = linkedTasks.length;
      const completed = linkedTasks.filter(
        (t) => t.status === "completed"
      ).length;
      const failed = linkedTasks.filter((t) => t.status === "failed").length;
      const open = linkedTasks.filter((t) => t.status === "open").length;

      const completionRate =
        total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        ...goal,
        stats: { total, completed, failed, open, completionRate },
      };
    });
  }, [weekState.goals, weekState.tasks]);

  // Compute Companion Stats
  const companionStats = useMemo(() => {
    const tasksWithCompanions = weekState.tasks.filter(
      (t) =>
        t.companionIds && t.companionIds.length > 0 && t.status !== "cancelled"
    );
    const total = tasksWithCompanions.length;
    const completed = tasksWithCompanions.filter(
      (t) => t.status === "completed"
    ).length;
    const failed = tasksWithCompanions.filter(
      (t) => t.status === "failed"
    ).length;

    // Top companion
    const companionCounts: Record<string, number> = {};
    weekState.tasks.forEach((t) => {
      t.companionIds?.forEach((cid) => {
        companionCounts[cid] = (companionCounts[cid] || 0) + 1;
      });
    });

    let topCompanionId: string | null = null;
    let maxCount = 0;
    Object.entries(companionCounts).forEach(([cid, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topCompanionId = cid;
      }
    });

    const topCompanionName = topCompanionId
      ? weekState.companions.find((c) => c.id === topCompanionId)?.name
      : null;

    return { total, completed, failed, topCompanionName };
  }, [weekState.tasks, weekState.companions]);

  const selectedGoal =
    selectedGoalId && goalStats
      ? goalStats.find((goal) => goal.id === selectedGoalId) ?? null
      : null;

  const selectedGoalLinkedTasks = selectedGoal
    ? weekState.tasks
        .filter(
          (task) =>
            task.goalIds?.includes(selectedGoal.id) &&
            task.status !== "cancelled" &&
            !task.movedTo
        )
        .sort((a, b) => {
          if (a.dayIndex !== b.dayIndex) {
            return a.dayIndex - b.dayIndex;
          }
          return a.position - b.position;
        })
    : [];

  const handleSelectedGoalUpdate = (
    updates: Partial<Omit<Goal, "id" | "createdAt">>
  ) => {
    if (selectedGoal) {
      actions.updateGoal(selectedGoal.id, updates);
    }
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGoalName.trim()) {
      actions.addGoal(newGoalName, newGoalEmoji);
      setNewGoalName("");
      setNewGoalEmoji("🎯");
      setIsAddGoalOpen(false);
    }
  };

  const handleUpdateGoal = (id: string, name: string, emoji: string) => {
    actions.updateGoal(id, { name, emoji });
    setEditingGoalId(null);
  };

  const handleGoalSelect = (goalId: string) => {
    setReturnToStatsOnClose(isStatsPanelOpen);
    setIsStatsPanelOpen(false);
    setSelectedGoalId(goalId);
  };

  const handleCloseGoalDetails = () => {
    const shouldReturnToStats = returnToStatsOnClose;
    setSelectedGoalId(null);
    setReturnToStatsOnClose(false);
    if (shouldReturnToStats) {
      setIsStatsPanelOpen(true);
    }
  };

  const handleDeleteSelectedGoal = () => {
    if (selectedGoal) {
      actions.deleteGoal(selectedGoal.id);
      setSelectedGoalId(null);
      setReturnToStatsOnClose(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-12">
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6">
        <div className="space-y-6">
          <div className="grid gap-4">
            {goalStats.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onUpdate={handleUpdateGoal}
                onDelete={actions.deleteGoal}
                isEditing={editingGoalId === goal.id}
                setEditingId={setEditingGoalId}
                onSelect={() => handleGoalSelect(goal.id)}
              />
            ))}

            {isAddGoalOpen && (
              <motion.form
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${TASK_CARD_CONTAINER} bg-bg-elevated p-4 rounded-xl flex flex-col gap-3 border border-border`}
                onSubmit={handleCreateGoal}
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newGoalEmoji}
                    onChange={(e) => setNewGoalEmoji(e.target.value)}
                    className="w-12 p-2 bg-bg-panel border border-border rounded text-center text-xl focus:border-accent outline-none"
                    placeholder="Emoji"
                  />
                  <input
                    type="text"
                    value={newGoalName}
                    onChange={(e) => setNewGoalName(e.target.value)}
                    className="flex-1 p-2 bg-bg-panel border border-border rounded text-text-primary focus:border-accent outline-none"
                    placeholder="Goal name (e.g. Learn French)"
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddGoalOpen(false)}
                    className="px-3 py-1.5 text-sm text-text-muted hover:text-text-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-sm bg-accent hover:bg-accent/90 text-white rounded"
                  >
                    Save
                  </button>
                </div>
              </motion.form>
            )}

            <div
              className={`${TASK_CARD_CONTAINER} border border-border bg-bg-panel/20 hover:border-border hover:bg-bg-panel/35 shadow-sm transition-all`}
            >
              <button
                type="button"
                disabled={isAddGoalOpen}
                onClick={() => setIsAddGoalOpen(true)}
                className="group flex items-center gap-4 w-full px-4 py-3 text-left disabled:cursor-not-allowed disabled:opacity-80"
                aria-label="Add goal"
              >
                <span className="flex items-center justify-center w-12 h-12 rounded-full border border-border bg-bg-panel text-text-secondary shadow-sm transition-shadow group-hover:shadow-lg">
                  <IconPlus className="w-5 h-5" />
                </span>
                <div className="flex-1">
                  <p className="text-lg font-semibold text-text-primary">
                    {goalStats.length === 0
                      ? "Add your first goal"
                      : "Add Goal"}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <RightSidePanel
        title="Statistics"
        isOpen={isStatsPanelOpen}
        onClose={() => {
          setIsStatsPanelOpen(false);
          setReturnToStatsOnClose(false);
        }}
        persistWidthKey="rightPanelWidth:goals:stats"
      >
        <div className="space-y-6 text-text-secondary">
          <div className="flex items-center justify-between">
            <div className="flex bg-bg-elevated rounded-lg p-1 border border-border">
              {(["week", "month", "year"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    dateRange === range
                      ? "bg-accent text-white shadow-sm"
                      : "text-text-muted hover:text-text-secondary"
                  }`}
                >
                  {range === "week"
                    ? "This Week"
                    : range === "month"
                    ? "Month"
                    : "Custom"}
                </button>
              ))}
            </div>
          </div>

          {dateRange !== "week" ? (
            <div className="p-8 bg-bg-panel/50 border border-border rounded-lg text-center text-text-muted">
              Historical data coming soon...
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <MetricCard label="Total Tasks" value={weekStats.total.all} />
                <MetricCard
                  label="Completed"
                  value={weekStats.total.completed}
                  color="text-status-success"
                />
                <MetricCard
                  label="Failed"
                  value={weekStats.total.failed}
                  color="text-status-error"
                />
                <MetricCard
                  label="Completion"
                  value={`${
                    weekStats.total.all > 0
                      ? Math.round(
                          (weekStats.total.completed / weekStats.total.all) *
                            100
                        )
                      : 0
                  }%`}
                  color="text-accent"
                />
              </div>

              <div className="bg-bg-elevated/50 p-4 rounded-lg border border-border">
                <h3 className="text-sm font-medium text-text-muted mb-4 uppercase tracking-wider">
                  Activity by Day
                </h3>
                <div className="space-y-2">
                  {weekStats.byDay.map((day) => {
                    const max = Math.max(
                      ...weekStats.byDay.map((d) => d.total)
                    );
                    const percent = max > 0 ? (day.total / max) * 100 : 0;
                    return (
                      <div
                        key={day.label}
                        className="flex items-center gap-3 text-sm"
                      >
                        <span className="w-24 text-text-muted">{day.label}</span>
                        <div className="flex-1 h-4 bg-bg-elevated/50 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            className="h-full bg-accent/80"
                          />
                        </div>
                        <span className="w-8 text-right text-text-secondary">
                          {day.total}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-bg-elevated/50 p-4 rounded-lg border border-border">
                <h3 className="text-sm font-medium text-text-muted mb-4 uppercase tracking-wider">
                  Goal Progress
                </h3>
                <div className="space-y-3">
                  {goalStats.map((goal) => (
                    <div key={goal.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-text-secondary">
                          {goal.emoji} {goal.name}
                        </span>
                        <span className="text-text-muted">
                          {goal.stats.completed} / {goal.stats.total}
                        </span>
                      </div>
                      <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${goal.stats.completionRate}%` }}
                          className={`h-full rounded-full ${
                            goal.stats.completionRate >= 80
                              ? "bg-status-success"
                              : goal.stats.completionRate >= 50
                              ? "bg-status-warning"
                              : "bg-bg-elevated"
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                  {goalStats.length === 0 && (
                    <div className="text-text-muted text-sm">
                      No goals linked yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
              <IconUsers className="w-5 h-5 text-pink-400" />
              Shared Experiences
            </h2>
            <div className="bg-gradient-to-br from-accent/20 to-accent-2/20 border border-accent/20 p-6 rounded-xl relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-lg font-medium text-text-primary mb-2">
                  Weekly Summary
                </h3>
                <p className="text-text-secondary leading-relaxed text-sm">
                  {companionStats.total > 0
                    ? `You've been active socially this week! You completed ${companionStats.completed} shared activities. ` +
                      (companionStats.topCompanionName
                        ? `Most of your time was spent with ${companionStats.topCompanionName}.`
                        : "")
                    : "No shared activities recorded this week yet."}
                  <br />
                  <br />
                  <span className="text-xs uppercase tracking-wide opacity-50 block mt-2">
                    AI Insights coming soon
                  </span>
                </p>
              </div>
              <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
            </div>
          </div>
        </div>
      </RightSidePanel>

      <RightSidePanel
        title="Goal Details"
        isOpen={!!selectedGoal}
        onClose={handleCloseGoalDetails}
        persistWidthKey="rightPanelWidth:goals:details"
      >
        {selectedGoal && (
          <GoalDetailsPanel
            goal={selectedGoal}
            linkedTasks={selectedGoalLinkedTasks}
            onUpdate={handleSelectedGoalUpdate}
            onOpenTask={onOpenWeeklyTask}
            onDelete={handleDeleteSelectedGoal}
          />
        )}
      </RightSidePanel>
    </div>
  );
}

function MetricCard({
  label,
  value,
  color = "text-text-primary",
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="bg-bg-elevated p-3 rounded-lg border border-border flex flex-col items-center justify-center text-center">
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
      <span className="text-xs text-text-muted uppercase tracking-wide mt-1">
        {label}
      </span>
    </div>
  );
}
