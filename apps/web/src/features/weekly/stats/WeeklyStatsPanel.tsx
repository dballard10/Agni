import type { WeekStats } from "./stats";

interface WeeklyStatsPanelProps {
  stats: WeekStats;
}

export function WeeklyStatsPanel({ stats }: WeeklyStatsPanelProps) {
  const { total, byDay } = stats;

  return (
    <div className="px-4 py-4 space-y-6 text-slate-300">
      {/* Weekly Summary */}
      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <h3 className="text-slate-100 font-semibold mb-2 text-lg">
          Weekly Overview
        </h3>
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-400">Total Tasks</span>
            <span className="text-slate-100 font-medium">{total.all}</span>
          </div>
          <div className="flex justify-between text-emerald-400">
            <span>Completed</span>
            <span>
              {total.completed} / {total.all}
            </span>
          </div>
          <div className="flex justify-between text-rose-400">
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
        <h4 className="text-slate-100 font-medium mb-3">
          Daily Breakdown
        </h4>
        <div className="space-y-3">
          {byDay.map((day) => (
            <div
              key={day.dayIndex}
              className="p-3 bg-slate-800/30 rounded border border-slate-700/50"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-200 font-medium">{day.label}</span>
                <span className="text-xs px-2 py-0.5 bg-slate-700 rounded-full text-slate-300">
                  {day.total} {day.total === 1 ? "task" : "tasks"}
                </span>
              </div>

              {day.total === 0 ? (
                <div className="text-xs text-slate-500 italic">
                  No tasks scheduled
                </div>
              ) : (
                <div className="text-xs space-y-1 pl-1 border-l-2 border-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Completed</span>
                    <span
                      className={
                        day.completed > 0
                          ? "text-emerald-400"
                          : "text-slate-600"
                      }
                    >
                      {day.completed} / {day.total}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Failed</span>
                    <span
                      className={
                        day.failed > 0 ? "text-rose-400" : "text-slate-600"
                      }
                    >
                      {day.failed} / {day.total}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Open</span>
                    <span
                      className={
                        day.open > 0 ? "text-sky-400" : "text-slate-600"
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
