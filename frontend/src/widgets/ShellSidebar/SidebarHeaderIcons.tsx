import {
  IconFilePlus,
  IconFolderPlus,
  IconFolders,
  IconSearch,
  IconCalendarStats,
} from "@tabler/icons-react";
import type { PageId } from "@/app/shell/types";

interface SidebarHeaderIconsProps {
  currentPage: PageId;
  onNewItem: () => void;
  onOpenExplorer: () => void;
  onOpenFileExplorerTab?: () => void;
  onFocusSearch: () => void;
  onOpenDatePicker?: () => void;
}

export function SidebarHeaderIcons({
  currentPage,
  onNewItem,
  onOpenExplorer,
  onOpenFileExplorerTab,
  onFocusSearch,
  onOpenDatePicker,
}: SidebarHeaderIconsProps) {
  const showDatePicker = currentPage === "weekly";
  const showFileExplorerTab = currentPage === "notes" && onOpenFileExplorerTab;
  const showNotesCreateButtons = currentPage !== "notes";

  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-700">
      {showNotesCreateButtons && (
        <button
          onClick={onNewItem}
          className="flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          aria-label={currentPage === "weekly" ? "Create new week" : "Create new note"}
          title={currentPage === "weekly" ? "Create new week" : "Create new note"}
        >
          <IconFilePlus className="w-5 h-5" />
        </button>
      )}
      {showNotesCreateButtons && (
        <button
          onClick={onOpenExplorer}
          className="flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          aria-label={currentPage === "notes" ? "New folder" : "Open explorer"}
          title={currentPage === "notes" ? "New folder" : "Open explorer"}
        >
          <IconFolderPlus className="w-5 h-5" />
        </button>
      )}
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
      {showDatePicker && onOpenDatePicker && (
        <button
          onClick={onOpenDatePicker}
          className="flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          aria-label="Open date picker"
          title="Open date picker"
        >
          <IconCalendarStats className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
