import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { IconPlus, IconUsers } from "@tabler/icons-react";
import type { WeekState, Goal } from "../../shared/types/weekly";
import { PageHeader } from "../../widgets/PageHeader";
import { PanelToggle, RightSidePanel } from "../../widgets/SidePanel";
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

  const handleToggleStatsPanel = () => {
    if (isStatsPanelOpen) {
      setIsStatsPanelOpen(false);
      setReturnToStatsOnClose(false);
    } else {
      setIsStatsPanelOpen(true);
      setSelectedGoalId(null);
      setReturnToStatsOnClose(false);
    }
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
      <PageHeader
        title="Goals"
        rightContent={
          <PanelToggle
            isOpen={isStatsPanelOpen}
            onClick={handleToggleStatsPanel}
            label="Statistics panel"
          />
        }
      />

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
                className={`${TASK_CARD_CONTAINER} bg-slate-800 p-4 rounded-xl flex flex-col gap-3 border border-slate-700`}
                onSubmit={handleCreateGoal}
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newGoalEmoji}
                    onChange={(e) => setNewGoalEmoji(e.target.value)}
                    className="w-12 p-2 bg-slate-900 border border-slate-700 rounded text-center text-xl focus:border-indigo-500 outline-none"
                    placeholder="Emoji"
                  />
                  <input
                    type="text"
                    value={newGoalName}
                    onChange={(e) => setNewGoalName(e.target.value)}
                    className="flex-1 p-2 bg-slate-900 border border-slate-700 rounded text-slate-100 focus:border-indigo-500 outline-none"
                    placeholder="Goal name (e.g. Learn French)"
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddGoalOpen(false)}
                    className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded"
                  >
                    Save
                  </button>
                </div>
              </motion.form>
            )}

            <div
              className={`${TASK_CARD_CONTAINER} border border-slate-600 bg-slate-900/20 hover:border-slate-400 hover:bg-slate-900/35 shadow-sm transition-all`}
            >
              <button
                type="button"
                disabled={isAddGoalOpen}
                onClick={() => setIsAddGoalOpen(true)}
                className="group flex items-center gap-4 w-full px-4 py-3 text-left disabled:cursor-not-allowed disabled:opacity-80"
                aria-label="Add goal"
              >
                <span className="flex items-center justify-center w-12 h-12 rounded-full border border-slate-600 bg-slate-900 text-slate-200 shadow-sm transition-shadow group-hover:shadow-lg">
                  <IconPlus className="w-5 h-5" />
                </span>
                <div className="flex-1">
                  <p className="text-lg font-semibold text-slate-100">
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
        <div className="space-y-6 text-slate-300">
          <div className="flex items-center justify-between">
            <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
              {(["week", "month", "year"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    dateRange === range
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
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
            <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-lg text-center text-slate-500">
              Historical data coming soon...
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <MetricCard label="Total Tasks" value={weekStats.total.all} />
                <MetricCard
                  label="Completed"
                  value={weekStats.total.completed}
                  color="text-emerald-400"
                />
                <MetricCard
                  label="Failed"
                  value={weekStats.total.failed}
                  color="text-rose-400"
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
                  color="text-indigo-400"
                />
              </div>

              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-800">
                <h3 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">
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
                        <span className="w-24 text-slate-400">{day.label}</span>
                        <div className="flex-1 h-4 bg-slate-700/50 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            className="h-full bg-indigo-500/80"
                          />
                        </div>
                        <span className="w-8 text-right text-slate-300">
                          {day.total}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-800">
                <h3 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">
                  Goal Progress
                </h3>
                <div className="space-y-3">
                  {goalStats.map((goal) => (
                    <div key={goal.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-200">
                          {goal.emoji} {goal.name}
                        </span>
                        <span className="text-slate-400">
                          {goal.stats.completed} / {goal.stats.total}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${goal.stats.completionRate}%` }}
                          className={`h-full rounded-full ${
                            goal.stats.completionRate >= 80
                              ? "bg-emerald-500"
                              : goal.stats.completionRate >= 50
                              ? "bg-amber-500"
                              : "bg-slate-500"
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                  {goalStats.length === 0 && (
                    <div className="text-slate-500 text-sm">
                      No goals linked yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
              <IconUsers className="w-5 h-5 text-pink-400" />
              Shared Experiences
            </h2>
            <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 p-6 rounded-xl relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-lg font-medium text-indigo-200 mb-2">
                  Weekly Summary
                </h3>
                <p className="text-indigo-100/80 leading-relaxed text-sm">
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
              <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
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
  color = "text-slate-100",
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 flex flex-col items-center justify-center text-center">
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
      <span className="text-xs text-slate-400 uppercase tracking-wide mt-1">
        {label}
      </span>
    </div>
  );
}
