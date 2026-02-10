import { useMemo, useRef, useState } from "react";
import {
  IconSearch,
  IconX,
  IconChevronDown,
} from "@tabler/icons-react";
import type { Companion } from "../../../shared/types/weekly";
import {
  TASK_COMPANION_DROPDOWN,
  TASK_COMPANION_PILL,
  TASK_COMPANION_PILL_ICON,
  TASK_COMPANION_SELECTED_LIST,
  TASK_COMPANION_SELECTOR,
  TASK_COMPANION_SHOW_MORE_BUTTON,
  TASK_COMPANION_SUGGESTION,
  TASK_COMPANION_TRIGGER,
  TASK_SELECTOR_SEARCH_ICON,
  TASK_SELECTOR_SEARCH_INPUT,
  TASK_SELECTOR_SEARCH_WRAPPER,
} from "./taskDetailsStyles";
import { useClickOutside } from "../../../shared/hooks/useClickOutside";
import { getInitials } from "../../../shared/lib/string";
import Avatar from "../../../shared/ui/Avatar";

interface CompanionSelectorProps {
  companions: Companion[];
  selectedIds: string[];
  onChange: (companionIds: string[]) => void;
  showSelectedPills?: boolean;
}

export function CompanionSelector({
  companions,
  selectedIds,
  onChange,
  showSelectedPills = true,
}: CompanionSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllCompanions, setShowAllCompanions] = useState(false);
  const [isCompanionDropdownOpen, setIsCompanionDropdownOpen] = useState(false);
  const companionDropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(
    [companionDropdownRef],
    () => {
      setIsCompanionDropdownOpen(false);
      setSearchQuery("");
    },
    isCompanionDropdownOpen
  );

  const selectedCompanions = useMemo(
    () =>
      selectedIds
        .map((id) => companions.find((c) => c.id === id))
        .filter((c): c is Companion => !!c),
    [companions, selectedIds]
  );

  const availableCompanions = useMemo(() => {
    const selectedSet = new Set(selectedIds);
    return companions.filter((c) => !selectedSet.has(c.id));
  }, [companions, selectedIds]);

  const filteredAvailableCompanions = useMemo(() => {
    if (!searchQuery.trim()) return availableCompanions;
    const lowerQuery = searchQuery.toLowerCase();
    return availableCompanions.filter((c) =>
      c.name.toLowerCase().includes(lowerQuery)
    );
  }, [availableCompanions, searchQuery]);

  const companionSuggestions = searchQuery.trim()
    ? filteredAvailableCompanions
    : availableCompanions;

  const handleToggleCompanion = (companionId: string) => {
    if (selectedIds.includes(companionId)) {
      onChange(selectedIds.filter((id) => id !== companionId));
    } else {
      onChange([...selectedIds, companionId]);
    }
  };

  return (
    <div className={TASK_COMPANION_SELECTOR} ref={companionDropdownRef}>
      <div
        onClick={() => setIsCompanionDropdownOpen(!isCompanionDropdownOpen)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsCompanionDropdownOpen(!isCompanionDropdownOpen);
          }
        }}
        className={`${TASK_COMPANION_TRIGGER} ${
          isCompanionDropdownOpen ? "border-orange-500 ring-1 ring-orange-500/40" : ""
        }`}
        tabIndex={0}
        role="button"
      >
        <span className="text-text-muted select-none">
          {selectedCompanions.length > 0
            ? `${selectedCompanions.length} companion${
                selectedCompanions.length === 1 ? "" : "s"
              } linked`
            : "Add companions"}
        </span>
        <IconChevronDown
          className={`w-4 h-4 text-text-muted transition-transform ${
            isCompanionDropdownOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {isCompanionDropdownOpen && (
        <div className={TASK_COMPANION_DROPDOWN}>
          <div className={TASK_SELECTOR_SEARCH_WRAPPER}>
            <IconSearch className={TASK_SELECTOR_SEARCH_ICON} />
            <input
              type="text"
              placeholder="Search companions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={TASK_SELECTOR_SEARCH_INPUT}
              autoFocus
            />
          </div>
          <div className="p-1 space-y-0.5 max-h-48 overflow-y-auto">
            {companionSuggestions.length > 0 ? (
              companionSuggestions.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    handleToggleCompanion(c.id);
                    setSearchQuery("");
                  }}
                  className={TASK_COMPANION_SUGGESTION}
                >
                  <Avatar
                    content={getInitials(c.name)}
                    bgColor={c.color || "var(--text-muted)"}
                    size={20}
                  />
                  <span className="text-sm text-text-muted group-hover:text-text-primary transition-colors">
                    {c.name}
                  </span>
                </button>
              ))
            ) : (
              <div className="p-3 text-xs text-text-muted text-center italic">
                No companions found
              </div>
            )}
          </div>
        </div>
      )}

      {showSelectedPills && (
        <div className={TASK_COMPANION_SELECTED_LIST}>
          {selectedCompanions.length > 0 && (
            <>
              {selectedCompanions
                .slice(0, showAllCompanions ? undefined : 5)
                .map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleToggleCompanion(c.id)}
                    className={TASK_COMPANION_PILL}
                    title={`Remove ${c.name}`}
                  >
                    <div className="relative w-4 h-4 flex items-center justify-center">
                      <Avatar
                        content={getInitials(c.name)}
                        bgColor={c.color || "var(--text-muted)"}
                        size={16}
                        className="absolute inset-0 transition-opacity group-hover:opacity-0"
                      />
                      <div className={TASK_COMPANION_PILL_ICON}>
                        <IconX className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <span>{c.name}</span>
                  </button>
                ))}

              {selectedCompanions.length > 5 && (
                <button
                  onClick={() => setShowAllCompanions(!showAllCompanions)}
                  className={TASK_COMPANION_SHOW_MORE_BUTTON}
                >
                  {showAllCompanions
                    ? "Show Less"
                    : `+${selectedCompanions.length - 5} more`}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default CompanionSelector;
