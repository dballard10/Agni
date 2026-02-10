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
      {sidebarTab === "explorer" && (
        // Explorer tab - matches Notes sidebar layout
        <div className="flex-1 overflow-y-auto -mx-2 px-2">
          {/* Sticky header with right-aligned actions (matches NotesDrawer) */}
          <div className="sticky top-0 z-10 mx-3 px-0 py-2 bg-bg-panel">
            <div className="flex items-center gap-1 justify-end">
              <CreateWeekPickerButton
                onCreateWeek={(dateISO) => onCreateWeekForDate?.(dateISO)}
                buttonClassName="flex items-center justify-center w-8 h-8 rounded-md text-text-muted hover:bg-bg-hover hover:text-text-secondary transition-colors"
              />
              <button
                onClick={onCreateCurrentWeek}
                className="flex items-center justify-center w-6 h-6 rounded-md text-text-muted hover:bg-bg-hover hover:text-text-secondary transition-colors"
                aria-label="Create current week"
                title="Create current week"
              >
                <IconFilePlus className="w-5 h-5" />
              </button>
            </div>
          </div>
          {availableWeekStartsISO.length === 0 ? (
            <div className="text-center py-8 text-text-muted text-sm pointer-events-none">
              No weeks found
            </div>
          ) : (
            <WeeklyFolderTree
              selectedWeekStartISO={selectedWeekStartISO}
              availableWeekStartsISO={availableWeekStartsISO}
              onSelectWeekStart={onSelectWeekStart}
            />
          )}
        </div>
      )}

      {sidebarTab === "search" && (
        // Search tab - matches Notes search layout
        <div className="flex-1 overflow-y-auto -mx-2 px-2">
          {/* Search header */}
          <div className="flex items-center gap-2 mb-3 px-2 pt-2">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search weeks..."
                className="w-full pl-10 pr-4 py-2 bg-bg-elevated border border-border rounded-md text-text-secondary text-sm placeholder-text-muted outline-none focus:border-border transition-colors"
              />
            </div>
          </div>
          {/* Search results */}
          <div className="space-y-1 px-1">
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
                      ? "bg-bg-hover text-text-primary"
                      : "text-text-muted hover:bg-bg-hover hover:text-text-secondary"
                  }`}
                >
                  Week of {label}
                </button>
              );
            })}
            {filteredWeeks.length === 0 && (
              <p className="text-sm text-text-muted px-2 py-4 text-center">
                No weeks found
              </p>
            )}
          </div>
        </div>
      )}

      {sidebarTab === "overview" && (
        // Overview tab - same scroll container pattern
        <div className="flex-1 overflow-y-auto -mx-2 px-2">
          <div className="py-2 px-1">
            <WeeklyStatsPanel stats={weekStats} />
          </div>
        </div>
      )}
    </div>,
    sidebarSlot
  );
}
