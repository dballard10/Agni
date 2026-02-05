import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { Transition } from "framer-motion";
import { SidebarHeaderIcons } from "./SidebarHeaderIcons";
import type { PageId } from "@/app/shell/types";

const DEFAULT_WIDTH = 260;
const CLOSE_THRESHOLD = 65;
const MIN_MAIN_CONTENT_WIDTH = 400;

interface ShellSidebarProps {
  isOpen: boolean;
  currentPage: PageId;
  onOpenFileExplorerTab?: () => void;
  onFocusSearch: () => void;
  onOpenOverview?: () => void;
  onClose?: () => void;
  onWidthChange?: (width: number) => void;
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
  onOpenFileExplorerTab,
  onFocusSearch,
  onOpenOverview,
  onClose,
  onWidthChange,
  children,
}: ShellSidebarProps) {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const prevIsOpenRef = useRef(isOpen);

  // Reset width to default when sidebar reopens
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset on open
      setWidth(DEFAULT_WIDTH);
      onWidthChange?.(DEFAULT_WIDTH);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, onWidthChange]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = width;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = startWidth + deltaX;

      if (newWidth < CLOSE_THRESHOLD && onClose) {
        onClose();
        handlePointerUp();
        return;
      }

      // Calculate maximum sidebar width based on viewport
      const maxWidth = window.innerWidth - MIN_MAIN_CONTENT_WIDTH;

      // Clamp: minimum is DEFAULT_WIDTH, maximum preserves main content space
      const clampedWidth = Math.max(DEFAULT_WIDTH, Math.min(newWidth, maxWidth));
      setWidth(clampedWidth);
      onWidthChange?.(clampedWidth);
    };

    const handlePointerUp = () => {
      setIsResizing(false);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const sidebarTransition: Transition = {
    width: isResizing
      ? { duration: 0 }
      : { type: "spring", damping: 25, stiffness: 200 },
    opacity: { type: "spring", damping: 25, stiffness: 200 },
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? width : 0, opacity: isOpen ? 1 : 0 }}
      transition={sidebarTransition}
      className={`relative flex flex-col h-full bg-slate-900 border-r border-slate-700 overflow-hidden flex-shrink-0 ${
        isResizing ? "select-none" : ""
      }`}
    >
      {/* Resize Handle */}
      <div
        onPointerDown={handlePointerDown}
        className={`absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize z-50 group transition-all duration-300 ${
          isResizing
            ? "bg-indigo-500/50 opacity-100"
            : "bg-indigo-500/10 opacity-0 hover:opacity-100 hover:bg-indigo-500/30"
        }`}
      >
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-px h-8 bg-indigo-400/50 transition-opacity opacity-0 group-hover:opacity-100" />
      </div>

      <SidebarHeaderIcons
        currentPage={currentPage}
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
