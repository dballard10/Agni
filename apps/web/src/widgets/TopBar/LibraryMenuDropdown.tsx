import { useRef, useEffect } from "react";
import { IconTargetArrow, IconUsers } from "@tabler/icons-react";

type LibraryTabId = "goals" | "companions";

interface LibraryMenuDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUtilityTab: (tab: LibraryTabId) => void;
}

const libraryItems: { id: LibraryTabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "goals", label: "Goals", icon: IconTargetArrow },
  { id: "companions", label: "Companions", icon: IconUsers },
];

export function LibraryMenuDropdown({
  isOpen,
  onClose,
  onSelectUtilityTab,
}: LibraryMenuDropdownProps) {
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
      className="absolute top-full right-0 mt-1 w-48 bg-bg-elevated border border-border rounded-md shadow-lg z-50 py-1"
    >
      {libraryItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => {
              onSelectUtilityTab(item.id);
              onClose();
            }}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm text-left transition-colors text-text-secondary hover:bg-bg-hover/50 hover:text-text-primary"
          >
            <Icon className="w-4 h-4" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
