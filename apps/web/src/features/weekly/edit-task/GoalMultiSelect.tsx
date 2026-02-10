import { useMemo, useRef, useState } from "react";
import {
  IconChevronDown,
  IconCheck,
  IconX,
  IconSearch,
} from "@tabler/icons-react";
import type { Goal } from "../../../shared/types/weekly";
import {
  TASK_GOAL_BUTTON,
  TASK_GOAL_BUTTON_SELECTED,
  TASK_GOAL_BUTTON_UNSELECTED,
  TASK_GOAL_DROPDOWN,
  TASK_GOAL_PILL,
  TASK_GOAL_PILL_AVATAR_BORDER,
  TASK_GOAL_PILL_REMOVE_ICON,
  TASK_GOAL_PILLS_WRAP,
  TASK_GOAL_SELECTOR,
  TASK_GOAL_TRIGGER,
  TASK_SELECTOR_SEARCH_ICON,
  TASK_SELECTOR_SEARCH_INPUT,
  TASK_SELECTOR_SEARCH_WRAPPER,
} from "./taskDetailsStyles";
import { useClickOutside } from "../../../shared/hooks/useClickOutside";

interface GoalMultiSelectProps {
  goals: Goal[];
  selectedGoalIds: string[];
  onChange: (goalIds: string[]) => void;
  showSelectedPills?: boolean;
}

export function GoalMultiSelect({
  goals,
  selectedGoalIds,
  onChange,
  showSelectedPills = true,
}: GoalMultiSelectProps) {
  const [isGoalDropdownOpen, setIsGoalDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const goalDropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(
    [goalDropdownRef],
    () => {
      setIsGoalDropdownOpen(false);
      setSearchQuery("");
    },
    isGoalDropdownOpen
  );

  const selectedGoals = useMemo(
    () =>
      selectedGoalIds
        .map((id) => goals.find((g) => g.id === id))
        .filter((g): g is Goal => !!g),
    [goals, selectedGoalIds]
  );

  const filteredGoals = useMemo(() => {
    if (!searchQuery.trim()) return goals;
    const lowerQuery = searchQuery.toLowerCase();
    return goals.filter((g) => g.name.toLowerCase().includes(lowerQuery));
  }, [goals, searchQuery]);

  const handleToggleGoal = (goalId: string) => {
    const isSelected = selectedGoalIds.includes(goalId);
    const next = isSelected
      ? selectedGoalIds.filter((id) => id !== goalId)
      : [...selectedGoalIds, goalId];
    onChange(next);
  };

  return (
    <div className={TASK_GOAL_SELECTOR} ref={goalDropdownRef}>
      <div
        onClick={() => setIsGoalDropdownOpen(!isGoalDropdownOpen)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsGoalDropdownOpen(!isGoalDropdownOpen);
          }
        }}
        className={`${TASK_GOAL_TRIGGER} ${
          isGoalDropdownOpen ? "border-emerald-500 ring-1 ring-emerald-500/40" : ""
        }`}
        tabIndex={0}
        role="button"
      >
        <span className="text-text-muted select-none">
          {selectedGoals.length > 0
            ? `${selectedGoals.length} goal${
                selectedGoals.length === 1 ? "" : "s"
              } linked`
            : "Select goals"}
        </span>
        <IconChevronDown
          className={`w-4 h-4 text-text-muted transition-transform ${
            isGoalDropdownOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {isGoalDropdownOpen && (
        <div className={TASK_GOAL_DROPDOWN}>
          <div className={TASK_SELECTOR_SEARCH_WRAPPER}>
            <IconSearch className={TASK_SELECTOR_SEARCH_ICON} />
            <input
              type="text"
              placeholder="Search goals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={TASK_SELECTOR_SEARCH_INPUT}
              autoFocus
            />
          </div>
          <div className="p-1 space-y-0.5 max-h-48 overflow-y-auto">
            {filteredGoals.length > 0 ? (
              filteredGoals.map((g) => {
                const isSelected = selectedGoalIds.includes(g.id);
                return (
                  <button
                    key={g.id}
                    onClick={() => handleToggleGoal(g.id)}
                    className={`${TASK_GOAL_BUTTON} ${
                      isSelected
                        ? TASK_GOAL_BUTTON_SELECTED
                        : TASK_GOAL_BUTTON_UNSELECTED
                    }`}
                  >
                    <span className="flex-shrink-0 w-5 text-center">
                      {g.emoji}
                    </span>
                    <span className="flex-1 truncate">{g.name}</span>
                    {isSelected && (
                      <IconCheck className="w-4 h-4 text-accent" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-xs text-text-muted text-center italic">
                No goals found
              </div>
            )}
          </div>
        </div>
      )}

      {showSelectedPills && (
        <div className={TASK_GOAL_PILLS_WRAP}>
          {selectedGoals.length > 0 &&
            selectedGoals.map((g) => (
              <button
                key={g.id}
                onClick={() => handleToggleGoal(g.id)}
                className={TASK_GOAL_PILL}
                title={`Unlink ${g.name}`}
              >
                <div className="relative w-5 h-5">
                  <div
                    className={TASK_GOAL_PILL_AVATAR_BORDER}
                    style={{ backgroundColor: g.color ?? "var(--bg-elevated)" }}
                  >
                    <span className="text-[11px] leading-none">{g.emoji}</span>
                  </div>
                  <div className={TASK_GOAL_PILL_REMOVE_ICON}>
                    <IconX className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
                <span>{g.name}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

export default GoalMultiSelect;
