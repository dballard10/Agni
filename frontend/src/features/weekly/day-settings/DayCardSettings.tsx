import {
  IconAdjustmentsHorizontal,
  IconSortAscending,
  IconFilter,
  IconSettings,
  IconChevronDown,
  IconChevronUp,
  IconCopy,
  IconClipboard,
  IconTrash,
  IconCircle,
  IconCircleCheck,
  IconCircleMinus,
  IconCircleX,
} from "@tabler/icons-react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAnchoredMenu } from "../../../shared/hooks/useAnchoredMenu";
import type { TaskStatus } from "../../../shared/types/weekly";

type MenuType = "sort" | "filter" | "settings" | null;

export type TaskFilter = TaskStatus[];

export type DaySortMode =
  | "position"
  | "type"
  | "status";

interface DayCardSettingsProps {
  taskFilters: TaskFilter;
  onTaskFiltersChange: (next: TaskFilter) => void;
  sortMode: DaySortMode;
  onSortModeChange: (next: DaySortMode) => void;
  // Collapse/Expand
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  // Copy/Paste
  onCopyDay: () => void;
  onPasteDay: () => void;
  canPaste: boolean;
  // Delete All
  onDeleteAll: () => void;
}

const FILTER_OPTIONS: Array<{ value: TaskStatus; label: string }> = [
  { value: "open", label: "Open" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "failed", label: "Failed" },
];

const STATUS_ICON_MAP: Record<
  TaskStatus,
  { icon: typeof IconCircle; className: string }
> = {
  open: { icon: IconCircle, className: "text-slate-200" },
  completed: { icon: IconCircleCheck, className: "text-emerald-400" },
  cancelled: { icon: IconCircleMinus, className: "text-yellow-400" },
  failed: { icon: IconCircleX, className: "text-red-400" },
  moved: { icon: IconCircle, className: "text-amber-400" },
};

const SORT_OPTIONS: Array<{ value: DaySortMode; label: string }> = [
  { value: "position", label: "Default" },
  { value: "type", label: "Task type" },
  { value: "status", label: "Status" },
];

const BUTTON_BASE =
  "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors select-none";
const BUTTON_ACTIVE = "text-slate-100";
const BUTTON_INACTIVE = "text-slate-400 hover:text-slate-100";

export default function DayCardSettings({
  taskFilters,
  onTaskFiltersChange,
  sortMode,
  onSortModeChange,
  isCollapsed,
  onToggleCollapsed,
  onCopyDay,
  onPasteDay,
  canPaste,
  onDeleteAll,
}: DayCardSettingsProps) {
  const [openMenu, setOpenMenu] = useState<MenuType>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  const getRefForMenu = (menu: MenuType) => {
    switch (menu) {
      case "sort":
        return sortRef;
      case "filter":
        return filterRef;
      case "settings":
        return settingsRef;
      default:
        return null;
    }
  };

  const currentMenuWidth = openMenu === "settings" ? 160 : 128;
  const { position, open, close } = useAnchoredMenu({
    resolveAnchor: () => getRefForMenu(openMenu)?.current ?? null,
    menuWidth: currentMenuWidth,
  });

  useEffect(() => {
    if (openMenu) {
      open();
    } else {
      close();
    }
  }, [close, open, openMenu]);

  const closeTimeoutRef = useRef<number | null>(null);

  const handleMouseEnter = (menu: MenuType) => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpenMenu(menu);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = window.setTimeout(() => {
      setOpenMenu(null);
    }, 150);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && openMenu) {
        setOpenMenu(null);
        close();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [close, openMenu]);

  return (
    <div ref={containerRef} className="relative flex items-center group z-20">
      {/* Base Icon Button */}
      <button
        type="button"
        className="p-1 text-slate-200 hover:text-slate-100 rounded transition-colors z-30"
        aria-label="Day settings"
      >
        <IconAdjustmentsHorizontal className="w-5 h-5" />
      </button>

      {/* Expandable Menu Container */}
      <div
        className={`absolute left-0 flex items-center bg-slate-800 rounded-lg border border-slate-700 shadow-xl pl-8 pr-2 py-1 gap-1 transition-all duration-300 ease-out origin-left ${
          openMenu
            ? "opacity-100 translate-x-0 pointer-events-auto"
            : "opacity-0 -translate-x-4 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 group-hover:pointer-events-auto"
        }`}
      >
        {/* Sort Button */}
        <div
          ref={sortRef}
          className="relative"
          onMouseEnter={() => handleMouseEnter("sort")}
          onMouseLeave={handleMouseLeave}
        >
          <button
            type="button"
            className={`${BUTTON_BASE} ${
              openMenu === "sort" ? BUTTON_ACTIVE : BUTTON_INACTIVE
            }`}
          >
            <IconSortAscending className="w-3 h-3" />
            Sort
          </button>
        </div>

        {/* Filter Button */}
        <div
          ref={filterRef}
          className="relative"
          onMouseEnter={() => handleMouseEnter("filter")}
          onMouseLeave={handleMouseLeave}
        >
          <button
            type="button"
            className={`${BUTTON_BASE} ${
              openMenu === "filter" ? BUTTON_ACTIVE : BUTTON_INACTIVE
            }`}
          >
            <IconFilter className="w-3 h-3" />
            Filter
          </button>
        </div>

        {/* Settings Button */}
        <div
          ref={settingsRef}
          className="relative"
          onMouseEnter={() => handleMouseEnter("settings")}
          onMouseLeave={handleMouseLeave}
        >
          <button
            type="button"
            className={`${BUTTON_BASE} ${
              openMenu === "settings" ? BUTTON_ACTIVE : BUTTON_INACTIVE
            }`}
          >
            <IconSettings className="w-3 h-3" />
            Settings
          </button>
        </div>
      </div>

      {/* Portal Dropdowns */}
      {openMenu &&
        position &&
        createPortal(
          <div className="fixed inset-0 z-50 pointer-events-none">
            <div
              className={`absolute rounded bg-slate-900 border border-slate-700 shadow-lg overflow-hidden pointer-events-auto ${
                openMenu === "settings" ? "w-40" : "w-32"
              }`}
              style={{ top: position.top, left: position.left }}
              onMouseEnter={() => {
                if (closeTimeoutRef.current) {
                  clearTimeout(closeTimeoutRef.current);
                  closeTimeoutRef.current = null;
                }
              }}
              onMouseLeave={() => {
                setOpenMenu(null);
              }}
            >
              <div className="py-1">
                {openMenu === "sort" &&
                  SORT_OPTIONS.map((option) => {
                    const isSelected = sortMode === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          onSortModeChange(option.value);
                          setOpenMenu(null);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs ${
                          isSelected
                            ? "bg-slate-800 text-slate-100"
                            : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                {openMenu === "filter" &&
                  FILTER_OPTIONS.map((option) => {
                    const isSelected = taskFilters.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="menuitemcheckbox"
                        aria-checked={isSelected}
                        onClick={() => {
                          if (isSelected) {
                            onTaskFiltersChange(
                              taskFilters.filter((v) => v !== option.value)
                            );
                          } else {
                            onTaskFiltersChange([...taskFilters, option.value]);
                          }
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                          isSelected
                            ? "bg-slate-800 text-slate-100"
                            : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {(() => {
                            const { icon: Icon, className } =
                              STATUS_ICON_MAP[option.value];
                            return <Icon className={`w-3.5 h-3.5 ${className}`} />;
                          })()}
                          <span>{option.label}</span>
                        </span>
                        {isSelected && (
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        )}
                      </button>
                    );
                  })}
                {openMenu === "settings" && (
                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => {
                        onToggleCollapsed();
                        setOpenMenu(null);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-slate-100 flex items-center gap-2"
                    >
                      {isCollapsed ? (
                        <IconChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <IconChevronUp className="w-3.5 h-3.5" />
                      )}
                      {isCollapsed ? "Expand Day" : "Collapse Day"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onCopyDay();
                        setOpenMenu(null);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-slate-100 flex items-center gap-2"
                    >
                      <IconCopy className="w-3.5 h-3.5" />
                      Copy Day
                    </button>
                    <button
                      type="button"
                      disabled={!canPaste}
                      onClick={() => {
                        onPasteDay();
                        setOpenMenu(null);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 ${
                        canPaste
                          ? "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                          : "text-slate-600 cursor-not-allowed"
                      }`}
                    >
                      <IconClipboard className="w-3.5 h-3.5" />
                      Paste Day
                    </button>
                    <div className="h-[2px] bg-slate-700/80 my-1" />
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteAll();
                        setOpenMenu(null);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-rose-900/30 hover:text-rose-300 flex items-center gap-2"
                    >
                      <IconTrash className="w-3.5 h-3.5" />
                      Delete All
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
