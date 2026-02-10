import { IconLayoutSidebarRight } from "@tabler/icons-react";
import type { ComponentType } from "react";

interface PanelToggleProps {
  onClick: () => void;
  isOpen?: boolean;
  className?: string;
  label?: string;
  icon?: ComponentType<{ className?: string }>;
}

export function PanelToggle({ 
  onClick, 
  isOpen = false, 
  className = "",
  label = "Toggle panel",
  icon,
}: PanelToggleProps) {
  const Icon = icon ?? IconLayoutSidebarRight;
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-md transition-colors ${
        isOpen 
          ? "bg-bg-elevated text-text-primary" 
          : "text-text-muted hover:bg-bg-hover hover:text-text-secondary"
      } ${className}`}
      aria-label={label}
      aria-expanded={isOpen}
      title={label}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}

export default PanelToggle;




