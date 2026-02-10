import type { WeekStats } from "./stats";

interface WeeklyStatsPanelProps {
  stats: WeekStats;
}

export function WeeklyStatsPanel({ stats }: WeeklyStatsPanelProps) {
  const { total, byDay } = stats;

  return (
    <div className="px-4 py-4 space-y-6 text-text-muted">
      {/* Weekly Summary */}
      <div className="p-4 bg-bg-elevated/50 rounded-lg border border-border">
        <h3 className="text-text-primary font-semibold mb-2 text-lg">
          Weekly Overview
        </h3>
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-text-muted">Total Tasks</span>
            <span className="text-text-primary font-medium">{total.all}</span>
          </div>
          <div className="flex justify-between text-status-success">
            <span>Completed</span>
            <span>
              {total.completed} / {total.all}
            </span>
          </div>
          <div className="flex justify-between text-status-error">
            <span>Failed</span>
            <span>
              {total.failed} / {total.all}
            </span>
          </div>
          <div className="flex justify-between text-sky-400">
            <span>Open</span>
            <span>
              {total.open} / {total.all}
            </span>
          </div>
        </div>
      </div>

      {/* Per-Day Breakdown */}
      <div>
        <h4 className="text-text-primary font-medium mb-3">
          Daily Breakdown
        </h4>
        <div className="space-y-3">
          {byDay.map((day) => (
            <div
              key={day.dayIndex}
              className="p-3 bg-bg-elevated/30 rounded border border-border/50"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-text-secondary font-medium">{day.label}</span>
                <span className="text-xs px-2 py-0.5 bg-bg-hover rounded-full text-text-muted">
                  {day.total} {day.total === 1 ? "task" : "tasks"}
                </span>
              </div>

              {day.total === 0 ? (
                <div className="text-xs text-text-muted italic">
                  No tasks scheduled
                </div>
              ) : (
                <div className="text-xs space-y-1 pl-1 border-l-2 border-border">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Completed</span>
                    <span
                      className={
                        day.completed > 0
                          ? "text-status-success"
                          : "text-text-muted"
                      }
                    >
                      {day.completed} / {day.total}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Failed</span>
                    <span
                      className={
                        day.failed > 0 ? "text-status-error" : "text-text-muted"
                      }
                    >
                      {day.failed} / {day.total}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Open</span>
                    <span
                      className={
                        day.open > 0 ? "text-sky-400" : "text-text-muted"
                      }
                    >
                      {day.open} / {day.total}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default WeeklyStatsPanel;
