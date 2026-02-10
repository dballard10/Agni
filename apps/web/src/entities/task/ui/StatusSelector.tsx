import {
  IconCircle,
  IconCircleCheck,
  IconCircleX,
  IconCircleMinus,
} from "@tabler/icons-react";
import {
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import type { TaskStatus } from "../../../shared/types/weekly";
import { useAnchoredMenu } from "../../../shared/hooks/useAnchoredMenu";

interface StatusSelectorProps {
  status: TaskStatus;
  onChange: (nextStatus: TaskStatus) => void;
}

const STATUS_OPTIONS: Array<{
  value: TaskStatus;
  label: string;
  icon: ReactNode;
  iconClass?: string;
}> = [
  {
    value: "open",
    label: "Open",
    icon: <IconCircle className="w-6 h-6" />,
    iconClass: "text-text-secondary",
  },
  {
    value: "completed",
    label: "Completed",
    icon: <IconCircleCheck className="w-6 h-6" />,
    iconClass: "text-status-success",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    icon: <IconCircleMinus className="w-6 h-6" />,
    iconClass: "text-status-warning",
  },
  {
    value: "failed",
    label: "Failed",
    icon: <IconCircleX className="w-6 h-6" />,
    iconClass: "text-status-error",
  },
];

const getIconForStatus = (status: TaskStatus) => {
  const fallback = STATUS_OPTIONS[0];
  const match = STATUS_OPTIONS.find((option) => option.value === status);
  return match ?? fallback;
};

export default function StatusSelector({
  status,
  onChange,
}: StatusSelectorProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { isOpen, position, toggle, close } = useAnchoredMenu({
    resolveAnchor: () => buttonRef.current,
    menuWidth: 144,
  });

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        close();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [close, isOpen]);

  const current = getIconForStatus(status);

  const handleSelect = (next: TaskStatus) => {
    onChange(next);
    close();
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={toggle}
        className="flex items-center justify-center p-1 text-text-secondary hover:text-text-primary hover:scale-105 rounded transition-colors"
      >
        <span className={current.iconClass}>{current.icon}</span>
      </button>

      {isOpen &&
        position &&
        createPortal(
          <div className="fixed inset-0 z-50" onClick={close}>
            <div
              className="absolute w-36 rounded bg-bg-panel border border-border shadow-lg"
              style={{ top: position.top, left: position.left }}
              onClick={(e) => e.stopPropagation()}
            >
              <div role="listbox" aria-label="Select status" className="py-1">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={option.value === status}
                    onClick={() => handleSelect(option.value)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-bg-hover"
                  >
                    <span className={option.iconClass}>{option.icon}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
