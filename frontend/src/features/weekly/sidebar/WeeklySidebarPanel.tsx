import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconFilePlus, IconSearch } from "@tabler/icons-react";
import WeeklyFolderTree from "../week-picker/WeeklyFolderTree";
import WeeklyStatsPanel from "../stats/WeeklyStatsPanel";
import CreateWeekPickerButton from "../week-picker/CreateWeekPickerButton";
import type { WeekStats } from "../stats";
import { parseISODateLocal } from "@/shared/lib/date";

interface WeeklySidebarPanelProps {
  sidebarTab: "explorer" | "search" | "overview";
  selectedWeekStartISO: string;
  availableWeekStartsISO: string[];
  onSelectWeekStart: (iso: string) => void;
  onCreateCurrentWeek?: () => void;
  onCreateWeekForDate?: (dateISO: string) => void;
  weekStats: WeekStats;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function WeeklySidebarPanel({
  sidebarTab,
  selectedWeekStartISO,
  availableWeekStartsISO,
  onSelectWeekStart,
  onCreateCurrentWeek,
  onCreateWeekForDate,
  weekStats,
  searchInputRef,
}: WeeklySidebarPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const localSearchRef = useRef<HTMLInputElement>(null);
  const inputRef = searchInputRef || localSearchRef;

  // Filter available weeks by search query
  const filteredWeeks = searchQuery.trim()
    ? availableWeekStartsISO.filter((iso) => {
        const date = parseISODateLocal(iso);
        const formatted = date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        return formatted.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : availableWeekStartsISO;

  const sidebarSlot = typeof document !== "undefined" ? document.getElementById("agni-shell-sidebar-slot") : null;
  if (!sidebarSlot) return null;

  return createPortal(
    <div className="h-full flex flex-col -m-3">
      {/* Sticky header with actions */}
      <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-700 px-3 py-2 flex items-center gap-1">
        {sidebarTab === "explorer" && (
          <>
            <CreateWeekPickerButton onCreateWeek={(dateISO) => onCreateWeekForDate?.(dateISO)} />
            <button
              onClick={onCreateCurrentWeek}
              className="flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
              aria-label="Create current week"
              title="Create current week"
            >
              <IconFilePlus className="w-5 h-5" />
            </button>
          </>
        )}
        {sidebarTab === "search" && (
          <span className="text-sm text-slate-400">Search weeks</span>
        )}
        {sidebarTab === "overview" && (
          <span className="text-sm text-slate-400">Weekly Overview</span>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto -mx-2 px-2">
        {sidebarTab === "explorer" && (
          <div className="py-2">
            <WeeklyFolderTree
              selectedWeekStartISO={selectedWeekStartISO}
              availableWeekStartsISO={availableWeekStartsISO}
              onSelectWeekStart={onSelectWeekStart}
            />
          </div>
        )}

        {sidebarTab === "search" && (
          <div className="py-2 px-1">
            <div className="relative mb-3">
              <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search weeks..."
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-md text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50"
              />
            </div>
            <div className="space-y-1">
              {filteredWeeks.map((iso) => {
                const date = parseISODateLocal(iso);
                const label = date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const isSelected = iso === selectedWeekStartISO;
                return (
                  <button
                    key={iso}
                    onClick={() => onSelectWeekStart(iso)}
                    className={`w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors ${
                      isSelected
                        ? "bg-indigo-600/20 text-indigo-300"
                        : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    Week of {label}
                  </button>
                );
              })}
              {filteredWeeks.length === 0 && (
                <p className="text-sm text-slate-500 px-2 py-4 text-center">
                  No weeks found
                </p>
              )}
            </div>
          </div>
        )}

        {sidebarTab === "overview" && (
          <div className="py-2 px-1">
            <WeeklyStatsPanel stats={weekStats} />
          </div>
        )}
      </div>
    </div>,
    sidebarSlot
  );
}
