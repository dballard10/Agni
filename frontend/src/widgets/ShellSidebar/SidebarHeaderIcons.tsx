import {
  IconFolders,
  IconSearch,
  IconCalendarStats,
} from "@tabler/icons-react";
import type { PageId } from "@/app/shell/types";

interface SidebarHeaderIconsProps {
  currentPage: PageId;
  onOpenFileExplorerTab?: () => void;
  onFocusSearch: () => void;
  onOpenOverview?: () => void;
}

export function SidebarHeaderIcons({
  currentPage,
  onOpenFileExplorerTab,
  onFocusSearch,
  onOpenOverview,
}: SidebarHeaderIconsProps) {
  const isNotesPage = currentPage === "notes";
  const isWeeklyPage = currentPage === "weekly";
  const showOverview = isWeeklyPage;
  const showFileExplorerTab = (isNotesPage || isWeeklyPage) && onOpenFileExplorerTab;

  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-700">
      {showFileExplorerTab && (
        <button
          onClick={onOpenFileExplorerTab}
          className="flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          aria-label="Open file explorer"
          title="Open file explorer"
        >
          <IconFolders className="w-5 h-5" />
        </button>
      )}
      <button
        onClick={onFocusSearch}
        className="flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
        aria-label="Search"
        title="Search"
      >
        <IconSearch className="w-5 h-5" />
      </button>
      {showOverview && onOpenOverview && (
        <button
          onClick={onOpenOverview}
          className="flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          aria-label="Overview"
          title="Overview"
        >
          <IconCalendarStats className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
