import {
  IconChevronDown,
  IconChevronRight,
  IconFolder,
  IconFileText,
} from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";

interface WeeklyFolderTreeProps {
  selectedWeekStartISO?: string;
  availableWeekStartsISO: string[];
  onSelectWeekStart: (iso: string) => void;
}

const ISO_DATE_FORMAT = "en-US";

function formatMonth(monthIndex: number): string {
  return new Date(2020, monthIndex, 1).toLocaleDateString(ISO_DATE_FORMAT, {
    month: "long",
  });
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString(ISO_DATE_FORMAT, {
    month: "short",
    day: "numeric",
  });
}

interface WeekItem {
  iso: string;
  date: Date;
  weekLabel: string;
  year: string;
  month: string;
}

function buildWeekItems(isoDates: string[]): WeekItem[] {
  return [...isoDates]
    .filter(Boolean)
    .map((iso) => {
      const date = new Date(iso);
      const end = new Date(date);
      end.setDate(end.getDate() + 6);
      return {
        iso,
        date,
        weekLabel: `${formatShortDate(date)} - ${formatShortDate(end)}`,
        year: date.getFullYear().toString(),
        month: formatMonth(date.getMonth()),
      };
    })
    .sort((a, b) => (a.iso < b.iso ? 1 : -1));
}

export function WeeklyFolderTree({
  selectedWeekStartISO,
  availableWeekStartsISO,
  onSelectWeekStart,
}: WeeklyFolderTreeProps) {
  const weekItems = useMemo(
    () => buildWeekItems(availableWeekStartsISO),
    [availableWeekStartsISO]
  );

  const focusISO = selectedWeekStartISO ?? weekItems[0]?.iso;
  const focusWeekItem = weekItems.find((item) => item.iso === focusISO);
  const initialFocusYear = focusWeekItem?.year;
  const initialFocusMonthKey =
    focusWeekItem && `${focusWeekItem.year}::${focusWeekItem.month}`;

  const [expandedYears, setExpandedYears] = useState<Set<string>>(() => {
    const initialSet = new Set<string>();
    if (initialFocusYear) {
      initialSet.add(initialFocusYear);
    }
    return initialSet;
  });
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(() => {
    const initialSet = new Set<string>();
    if (initialFocusMonthKey) {
      initialSet.add(initialFocusMonthKey);
    }
    return initialSet;
  });

  useEffect(() => {
    if (!selectedWeekStartISO) {
      return;
    }
    const selectedItem = weekItems.find(
      (item) => item.iso === selectedWeekStartISO
    );
    if (!selectedItem) {
      return;
    }

    setExpandedYears((previous) => {
      if (previous.has(selectedItem.year)) {
        return previous;
      }
      const next = new Set(previous);
      next.add(selectedItem.year);
      return next;
    });

    const monthKey = `${selectedItem.year}::${selectedItem.month}`;
    setExpandedMonths((previous) => {
      if (previous.has(monthKey)) {
        return previous;
      }
      const next = new Set(previous);
      next.add(monthKey);
      return next;
    });
  }, [selectedWeekStartISO, weekItems]);

  const groupedByYear = useMemo(() => {
    return weekItems.reduce<Record<string, Record<string, WeekItem[]>>>(
      (acc, item) => {
        if (!acc[item.year]) {
          acc[item.year] = {};
        }
        if (!acc[item.year][item.month]) {
          acc[item.year][item.month] = [];
        }
        acc[item.year][item.month].push(item);
        return acc;
      },
      {}
    );
  }, [weekItems]);

  const toggleYear = (year: string) => {
    setExpandedYears((previous) => {
      const next = new Set(previous);
      if (next.has(year)) {
        next.delete(year);
      } else {
        next.add(year);
      }
      return next;
    });
  };

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths((previous) => {
      const next = new Set(previous);
      if (next.has(monthKey)) {
        next.delete(monthKey);
      } else {
        next.add(monthKey);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto -mx-2 px-2">
        <ul className="space-y-0.5">
          {Object.entries(groupedByYear).map(([year, months]) => {
            const isYearExpanded = expandedYears.has(year);
            return (
              <li key={year}>
                <button
                  type="button"
                  onClick={() => toggleYear(year)}
                  className="w-full flex items-center gap-1.5 px-2 py-1 rounded transition-colors group hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                  style={{ paddingLeft: "8px" }}
                >
                  <span className="shrink-0">
                    {isYearExpanded ? (
                      <IconChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <IconChevronRight className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <IconFolder className="w-4 h-4 text-slate-500 group-hover:text-slate-400 shrink-0" />
                  <span className="text-sm font-medium truncate">{year}</span>
                </button>

                {isYearExpanded && (
                  <ul className="space-y-0.5">
                    {Object.entries(months).map(([month, weeks]) => {
                      const monthKey = `${year}::${month}`;
                      const isMonthExpanded = expandedMonths.has(monthKey);
                      return (
                        <li key={month}>
                          <button
                            type="button"
                            onClick={() => toggleMonth(monthKey)}
                            className="w-full flex items-center gap-1.5 px-2 py-1 rounded transition-colors group hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                            style={{ paddingLeft: "20px" }}
                          >
                            <span className="shrink-0">
                              {isMonthExpanded ? (
                                <IconChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <IconChevronRight className="w-3.5 h-3.5" />
                              )}
                            </span>
                            <IconFolder className="w-4 h-4 text-slate-500 group-hover:text-slate-400 shrink-0" />
                            <span className="text-sm font-medium truncate">
                              {month}
                            </span>
                          </button>

                          {isMonthExpanded && (
                            <ul className="space-y-0.5">
                              {weeks.map((week) => {
                                const isSelected =
                                  week.iso === selectedWeekStartISO;
                                return (
                                  <li key={week.iso}>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onSelectWeekStart(week.iso)
                                      }
                                      className={`w-full flex items-center gap-2 px-2 py-1 rounded transition-colors ${
                                        isSelected
                                          ? "bg-slate-700 text-slate-100"
                                          : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                                      }`}
                                      style={{ paddingLeft: "52px" }}
                                    >
                                      <IconFileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                      <span className="text-sm truncate">
                                        {week.weekLabel}
                                      </span>
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default WeeklyFolderTree;
