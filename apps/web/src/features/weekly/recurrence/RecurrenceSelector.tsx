import { useState, useRef } from "react";
import { IconChevronDown, IconCheck, IconChevronLeft } from "@tabler/icons-react";
import {
  TASK_SELECTOR_TRIGGER,
  TASK_SELECTOR_DROPDOWN,
  TASK_SELECTOR_SEARCH_WRAPPER,
  TASK_GOAL_BUTTON,
  TASK_GOAL_BUTTON_SELECTED,
  TASK_GOAL_BUTTON_UNSELECTED,
} from "../edit-task/taskDetailsStyles";
import { useClickOutside } from "../../../shared/hooks/useClickOutside";
import type { RecurrenceFrequency } from "../../../shared/types/weekly";

interface RecurrenceSelectorProps {
  frequency: RecurrenceFrequency | "none";
  interval: number;
  onChange: (frequency: RecurrenceFrequency | "none", interval: number) => void;
}

type MenuMode = "presets" | "custom";

export function RecurrenceSelector({
  frequency,
  interval,
  onChange,
}: RecurrenceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuMode, setMenuMode] = useState<MenuMode>("presets");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(
    [dropdownRef],
    () => {
      setIsOpen(false);
      setMenuMode("presets");
    },
    isOpen
  );

  const getLabel = () => {
    if (frequency === "none") return "None";
    if (frequency === "day") {
      if (interval === 1) return "Daily";
      return `Every ${interval} days`;
    }
    if (frequency === "week") {
      if (interval === 1) return "Weekly";
      if (interval === 2) return "Bi-weekly";
      return `Every ${interval} weeks`;
    }
    if (frequency === "month") {
      if (interval === 1) return "Monthly";
      return `Every ${interval} months`;
    }
    return "Select recurrence";
  };

  const isSelected = (f: RecurrenceFrequency | "none", i: number) => {
    return frequency === f && interval === i;
  };

  const handleSelect = (f: RecurrenceFrequency | "none", i: number) => {
    onChange(f, i);
    setIsOpen(false);
    setMenuMode("presets");
  };

  const customDays = Array.from({ length: 365 }, (_, idx) => idx + 1);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${TASK_SELECTOR_TRIGGER} focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:border-blue-500`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="text-text-secondary select-none font-medium">{getLabel()}</span>
        <IconChevronDown
          className={`w-4 h-4 text-text-muted transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className={TASK_SELECTOR_DROPDOWN}>
          {menuMode === "presets" ? (
            <div className="p-1 space-y-0.5 max-h-60 overflow-y-auto">
              <button
                type="button"
                onClick={() => handleSelect("none", 1)}
                className={`${TASK_GOAL_BUTTON} ${
                  isSelected("none", 1)
                    ? TASK_GOAL_BUTTON_SELECTED
                    : TASK_GOAL_BUTTON_UNSELECTED
                }`}
              >
                <span className="flex-1">None</span>
                {isSelected("none", 1) && <IconCheck className="w-4 h-4 text-accent" />}
              </button>
              <button
                type="button"
                onClick={() => handleSelect("day", 1)}
                className={`${TASK_GOAL_BUTTON} ${
                  isSelected("day", 1)
                    ? TASK_GOAL_BUTTON_SELECTED
                    : TASK_GOAL_BUTTON_UNSELECTED
                }`}
              >
                <span className="flex-1">Daily</span>
                {isSelected("day", 1) && <IconCheck className="w-4 h-4 text-accent" />}
              </button>
              <button
                type="button"
                onClick={() => handleSelect("week", 1)}
                className={`${TASK_GOAL_BUTTON} ${
                  isSelected("week", 1)
                    ? TASK_GOAL_BUTTON_SELECTED
                    : TASK_GOAL_BUTTON_UNSELECTED
                }`}
              >
                <span className="flex-1">Weekly</span>
                {isSelected("week", 1) && <IconCheck className="w-4 h-4 text-accent" />}
              </button>
              <button
                type="button"
                onClick={() => handleSelect("week", 2)}
                className={`${TASK_GOAL_BUTTON} ${
                  isSelected("week", 2)
                    ? TASK_GOAL_BUTTON_SELECTED
                    : TASK_GOAL_BUTTON_UNSELECTED
                }`}
              >
                <span className="flex-1">Bi-weekly</span>
                {isSelected("week", 2) && <IconCheck className="w-4 h-4 text-accent" />}
              </button>
              <button
                type="button"
                onClick={() => handleSelect("month", 1)}
                className={`${TASK_GOAL_BUTTON} ${
                  isSelected("month", 1)
                    ? TASK_GOAL_BUTTON_SELECTED
                    : TASK_GOAL_BUTTON_UNSELECTED
                }`}
              >
                <span className="flex-1">Monthly</span>
                {isSelected("month", 1) && <IconCheck className="w-4 h-4 text-accent" />}
              </button>
              <div className="h-px bg-border my-1 mx-2" />
              <button
                type="button"
                onClick={() => setMenuMode("custom")}
                className={`${TASK_GOAL_BUTTON} ${TASK_GOAL_BUTTON_UNSELECTED}`}
              >
                <span className="flex-1">Custom...</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col h-full max-h-60">
              <div className={TASK_SELECTOR_SEARCH_WRAPPER}>
                <button
                  type="button"
                  onClick={() => setMenuMode("presets")}
                  className={`${TASK_GOAL_BUTTON} ${TASK_GOAL_BUTTON_UNSELECTED} text-text-muted flex items-center gap-1`}
                >
                  <IconChevronLeft size={16} />
                  <span>Back</span>
                </button>
              </div>
              <div className="p-1 space-y-0.5 overflow-y-auto">
                {customDays.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => handleSelect("day", n)}
                    className={`${TASK_GOAL_BUTTON} ${
                      isSelected("day", n)
                        ? TASK_GOAL_BUTTON_SELECTED
                        : TASK_GOAL_BUTTON_UNSELECTED
                    }`}
                  >
                    <span className="flex-1 text-sm">Every {n} day{n === 1 ? "" : "s"}</span>
                    {isSelected("day", n) && <IconCheck className="w-4 h-4 text-accent" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RecurrenceSelector;
