import { useRef, useEffect, useCallback, useState } from "react";
import {
  IconChevronUp,
  IconChevronDown,
  IconChevronRight,
  IconX,
  IconReplace,
  IconTransform,
} from "@tabler/icons-react";

interface FindReplaceBarProps {
  isOpen: boolean;
  searchTerm: string;
  replaceTerm: string;
  matchCount: number;
  currentMatchIndex: number;
  onSearchChange: (value: string) => void;
  onReplaceChange: (value: string) => void;
  onNextMatch: () => void;
  onPrevMatch: () => void;
  onReplace: () => void;
  onReplaceAll: () => void;
  onClose: () => void;
}

export function FindReplaceBar({
  isOpen,
  searchTerm,
  replaceTerm,
  matchCount,
  currentMatchIndex,
  onSearchChange,
  onReplaceChange,
  onNextMatch,
  onPrevMatch,
  onReplace,
  onReplaceAll,
  onClose,
}: FindReplaceBarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isReplaceExpanded, setIsReplaceExpanded] = useState(false);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.select();
    }
  }, [isOpen]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) {
          onPrevMatch();
        } else {
          onNextMatch();
        }
      }
    },
    [onClose, onNextMatch, onPrevMatch]
  );

  const handleReplaceKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) {
          onReplaceAll();
        } else {
          onReplace();
        }
      }
    },
    [onClose, onReplace, onReplaceAll]
  );

  if (!isOpen) return null;

  const matchDisplay =
    matchCount > 0
      ? `${currentMatchIndex + 1} of ${matchCount}`
      : searchTerm
        ? "No results"
        : "";

  const hasMatches = matchCount > 0;

  return (
    <div className="absolute top-3 right-3 z-50 w-1/2 max-w-sm min-w-[260px] bg-slate-800/85 backdrop-blur-md border border-slate-600/50 rounded-lg shadow-2xl px-2.5 py-2 flex flex-col gap-1.5">
      {/* Find row */}
      <div className="flex items-center gap-1.5">
        {/* Chevron toggle for replace */}
        <button
          onClick={() => setIsReplaceExpanded(!isReplaceExpanded)}
          className="flex items-center justify-center w-5 h-5 rounded text-slate-400 hover:bg-slate-600/50 hover:text-slate-200 transition-colors"
          title={isReplaceExpanded ? "Hide replace" : "Show replace"}
        >
          <IconChevronRight
            className={`w-3.5 h-3.5 transition-transform ${isReplaceExpanded ? "rotate-90" : ""}`}
          />
        </button>

        <input
          ref={searchInputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Find..."
          className="flex-1 min-w-0 px-2 py-1 h-7 bg-slate-900/80 border border-slate-600/50 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-500"
        />

        <div className="flex items-center gap-0.5">
          <button
            onClick={onPrevMatch}
            disabled={!hasMatches}
            className="flex items-center justify-center w-6 h-6 rounded text-slate-400 hover:bg-slate-600/50 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
            title="Previous match (Shift+Enter)"
          >
            <IconChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onNextMatch}
            disabled={!hasMatches}
            className="flex items-center justify-center w-6 h-6 rounded text-slate-400 hover:bg-slate-600/50 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
            title="Next match (Enter)"
          >
            <IconChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        <span className="text-xs text-slate-400 min-w-[50px] text-center">
          {matchDisplay}
        </span>

        <button
          onClick={onClose}
          className="flex items-center justify-center w-6 h-6 rounded text-slate-400 hover:bg-slate-600/50 hover:text-slate-200 transition-colors"
          title="Close (Escape)"
        >
          <IconX className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Replace row - collapsible */}
      {isReplaceExpanded && (
        <div className="flex items-center gap-1.5 pl-6">
          <input
            type="text"
            value={replaceTerm}
            onChange={(e) => onReplaceChange(e.target.value)}
            onKeyDown={handleReplaceKeyDown}
            placeholder="Replace..."
            className="flex-1 min-w-0 px-2 py-1 h-7 bg-slate-900/80 border border-slate-600/50 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-500"
          />

          <button
            onClick={onReplace}
            disabled={!hasMatches}
            className="flex items-center justify-center w-6 h-6 rounded text-slate-400 hover:bg-slate-600/50 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
            title="Replace (Enter)"
          >
            <IconReplace className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onReplaceAll}
            disabled={!hasMatches}
            className="flex items-center justify-center w-6 h-6 rounded text-slate-400 hover:bg-slate-600/50 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
            title="Replace all (Shift+Enter)"
          >
            <IconTransform className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
