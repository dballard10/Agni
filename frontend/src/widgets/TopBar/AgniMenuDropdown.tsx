import { useRef, useEffect } from "react";
import {
  IconFolder,
  IconListCheck,
  IconCalendarWeek,
  IconUsers,
  IconTargetArrow,
} from "@tabler/icons-react";
import type { PageId } from "@/app/shell/types";

interface AgniMenuDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPage: (page: PageId) => void;
  currentPage: PageId;
}

const menuItems: { id: PageId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "notes", label: "Notes", icon: IconFolder },
  { id: "weekly", label: "Weekly Todo", icon: IconListCheck },
  { id: "calendar", label: "Calendar", icon: IconCalendarWeek },
  { id: "companions", label: "Companions", icon: IconUsers },
  { id: "goals", label: "Goals", icon: IconTargetArrow },
];

export function AgniMenuDropdown({
  isOpen,
  onClose,
  onSelectPage,
  currentPage,
}: AgniMenuDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded-md shadow-lg z-50 py-1"
    >
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPage === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              onSelectPage(item.id);
              onClose();
            }}
            className={`flex items-center gap-3 w-full px-3 py-2 text-sm text-left transition-colors ${
              isActive
                ? "bg-slate-700 text-slate-100"
                : "text-slate-300 hover:bg-slate-700/50 hover:text-slate-100"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
