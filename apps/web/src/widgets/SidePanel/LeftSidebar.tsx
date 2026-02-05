import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  IconLayoutSidebarLeftCollapse,
  IconCalendarWeek,
  IconTarget,
  IconCalendar,
  IconUsers,
  IconSettings,
  IconNotes,
} from "@tabler/icons-react";

interface LeftSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

// Let's go with a composed Sun/Moon split icon.
const AgniFlameLogo = ({ className }: { className?: string }) => (
  <img 
    src="/logos/agni-flame-logo.png"
    alt="Agni Flame"
    className={className}
  />
);

export function LeftSidebar({
  isOpen,
  onToggle,
  activeTab,
  onTabChange,
}: LeftSidebarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const didToggleRef = useRef(false);
  const isDraggingRef = useRef(false);
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    startXRef.current = e.clientX;
    didToggleRef.current = false;
    isDraggingRef.current = true;
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || didToggleRef.current) return;
    const deltaX = e.clientX - startXRef.current;
    const threshold = 32;

    if (isOpenRef.current && deltaX <= -threshold) {
      onToggle();
      didToggleRef.current = true;
      // Also end dragging immediately to prevent the handle from staying highlighted
      handlePointerUp(e);
    } else if (!isOpenRef.current && deltaX >= threshold) {
      onToggle();
      didToggleRef.current = true;
      // Also end dragging immediately to prevent the handle from staying highlighted
      handlePointerUp(e);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  const tabs = [
    { id: "notes", label: "Notes", icon: IconNotes },
    { id: "weekly", label: "Weekly", icon: IconCalendarWeek },
    { id: "calendar", label: "Calendar", icon: IconCalendar },
    { id: "goals", label: "Goals", icon: IconTarget },
    { id: "companions", label: "Companions", icon: IconUsers },
  ];

  const settingsTab = { id: "settings", label: "Settings", icon: IconSettings };

  return (
    <motion.div
      initial={false}
      animate={{ width: isOpen ? 260 : 60 }} // Rail width when collapsed
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className={`fixed md:relative flex flex-col h-screen bg-slate-900 border-r border-slate-700 flex-shrink-0 z-50 overflow-hidden ${
        isDragging ? "select-none" : ""
      }`}
    >
      {/* Header / Logo */}
      <div className="flex items-center justify-between h-14 px-3 border-b border-slate-800">
        <div className="flex items-center min-w-0">
          {/* Logo - Acts as expand button when collapsed */}
          <button
            type="button"
            onClick={() => {
              if (!isOpen) onToggle();
            }}
            className={`flex items-center justify-center min-w-[36px] rounded-md py-1 px-1 transition-colors ${
              !isOpen ? "hover:bg-slate-800 cursor-pointer" : "cursor-default"
            }`}
            title={!isOpen ? "Expand sidebar" : "Agni"}
            aria-label={!isOpen ? "Expand sidebar" : "Agni"}
            tabIndex={!isOpen ? 0 : -1}
          >
            <AgniFlameLogo className="w-6 h-6 text-slate-100" />
          </button>
          <motion.span
            animate={{ opacity: isOpen ? 1 : 0, width: isOpen ? "auto" : 0 }}
            className="ml-3 font-semibold text-slate-100 whitespace-nowrap overflow-hidden"
          >
            Agni
          </motion.span>
        </div>

        {/* Collapse Button - Only visible when open */}
        {isOpen && (
          <button
            onClick={onToggle}
            className="flex items-center justify-center p-1.5 text-slate-400 hover:text-slate-100 rounded-md hover:bg-slate-800 transition-colors"
            title="Collapse sidebar"
          >
            <IconLayoutSidebarLeftCollapse className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 flex flex-col gap-2 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const handleTabClick = () => {
            onTabChange(tab.id);
          };
          return (
            <div key={tab.id}>
              <button
                onClick={handleTabClick}
                className={`flex items-center p-2 rounded-md transition-colors w-full ${
                  isActive
                    ? "bg-slate-800 text-slate-100"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                }`}
                title={!isOpen ? tab.label : undefined}
              >
                <div className="flex items-center justify-center min-w-[28px]">
                  <Icon className="w-5 h-5" />
                </div>
                {/* Label */}
                <motion.span
                  animate={{
                    opacity: isOpen ? 1 : 0,
                    width: isOpen ? "auto" : 0,
                  }}
                  className="ml-3 text-sm font-medium whitespace-nowrap overflow-hidden"
                >
                  {tab.label}
                </motion.span>
              </button>
            </div>
          );
        })}

        {/* Bottom-pinned Settings */}
        <div className="mt-auto">
          <button
            onClick={() => onTabChange(settingsTab.id)}
            className={`flex items-center p-2 rounded-md transition-colors w-full ${
              activeTab === settingsTab.id
                ? "bg-slate-800 text-slate-100"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
            }`}
            title={!isOpen ? settingsTab.label : undefined}
          >
            <div className="flex items-center justify-center min-w-[28px]">
              <settingsTab.icon className="w-5 h-5" />
            </div>
            <motion.span
              animate={{
                opacity: isOpen ? 1 : 0,
                width: isOpen ? "auto" : 0,
              }}
              className="ml-3 text-sm font-medium whitespace-nowrap overflow-hidden"
            >
              {settingsTab.label}
            </motion.span>
          </button>
        </div>
      </nav>

      {/* Footer toggle removed */}

      {/* Edge Handle for drag-to-toggle */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onLostPointerCapture={handlePointerUp}
        className={`absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize z-50 group transition-all duration-300 touch-none ${
          isDragging 
            ? "bg-indigo-500/50 opacity-100" 
            : "bg-indigo-500/10 opacity-0 hover:opacity-100 hover:bg-indigo-500/30"
        }`}
        title="Drag to toggle sidebar"
      >
        <div 
          className={`absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-px h-8 bg-indigo-400/50 transition-opacity ${
            isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`} 
        />
      </div>
    </motion.div>
  );
}

export default LeftSidebar;
