import { motion } from "framer-motion";
import { SidebarHeaderIcons } from "./SidebarHeaderIcons";
import type { PageId } from "@/app/shell/types";

interface ShellSidebarProps {
  isOpen: boolean;
  currentPage: PageId;
  onNewItem: () => void;
  onOpenExplorer: () => void;
  onOpenFileExplorerTab?: () => void;
  onFocusSearch: () => void;
  onOpenOverview?: () => void;
  children?: React.ReactNode;
}

const sidebarLabels: Record<PageId, string> = {
  notes: "FILE EXPLORER GOES HERE",
  weekly: "WEEK EXPLORER GOES HERE",
  calendar: "CALENDAR EXPLORER GOES HERE",
  goals: "GOALS EXPLORER GOES HERE",
  companions: "COMPANIONS EXPLORER GOES HERE",
  settings: "SETTINGS",
};

export function ShellSidebar({
  isOpen,
  currentPage,
  onNewItem,
  onOpenExplorer,
  onOpenFileExplorerTab,
  onFocusSearch,
  onOpenOverview,
  children,
}: ShellSidebarProps) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 260 : 0, opacity: isOpen ? 1 : 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="flex flex-col h-full bg-slate-900 border-r border-slate-700 overflow-hidden flex-shrink-0"
    >
      <SidebarHeaderIcons
        currentPage={currentPage}
        onNewItem={onNewItem}
        onOpenExplorer={onOpenExplorer}
        onOpenFileExplorerTab={onOpenFileExplorerTab}
        onFocusSearch={onFocusSearch}
        onOpenOverview={currentPage === "weekly" ? onOpenOverview : undefined}
      />
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3">
        {children ?? (
          <div className="text-slate-500 text-sm">
            {sidebarLabels[currentPage]}
          </div>
        )}
      </div>
    </motion.aside>
  );
}
