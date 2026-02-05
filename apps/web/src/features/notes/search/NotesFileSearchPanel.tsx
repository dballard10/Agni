import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  IconSearch,
  IconFileText,
  IconChevronRight,
  IconChevronDown,
} from "@tabler/icons-react";
import type { Note } from "../../../mock/mockNotes";
import {
  searchNotes,
  type NoteSearchResult,
  type MatchPreview,
} from "./notesSearch";

interface NotesFileSearchPanelProps {
  notes: Note[];
  onOpenResult: (
    noteId: string,
    firstMatchRange: { from: number; to: number } | null
  ) => void;
  onRequestClose: () => void;
}

const INITIAL_MATCH_LIMIT = 3;

export function NotesFileSearchPanel({
  notes,
  onOpenResult,
  onRequestClose,
}: NotesFileSearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [expandedById, setExpandedById] = useState<Record<string, boolean>>({});
  const [showAllById, setShowAllById] = useState<Record<string, boolean>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(
    () => searchNotes(notes, searchQuery),
    [notes, searchQuery]
  );

  // Reset active index and expanded/showAll state when results change
  useEffect(() => {
    setActiveIndex(0);
    setExpandedById({});
    setShowAllById({});
  }, [results]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current && results.length > 0) {
      const activeEl = listRef.current.querySelector(
        `[data-result-index="${activeIndex}"]`
      );
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [activeIndex, results.length]);

  const toggleExpanded = useCallback((noteId: string) => {
    setExpandedById((prev) => ({ ...prev, [noteId]: !prev[noteId] }));
  }, []);

  const toggleShowAll = useCallback((noteId: string) => {
    setShowAllById((prev) => ({ ...prev, [noteId]: true }));
  }, []);

  const openMatchLine = useCallback(
    (noteId: string, range: { from: number; to: number }) => {
      onOpenResult(noteId, range);
    },
    [onOpenResult]
  );

  const openNoteWithoutRange = useCallback(
    (noteId: string) => {
      onOpenResult(noteId, null);
    },
    [onOpenResult]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (results[activeIndex]) {
            toggleExpanded(results[activeIndex].noteId);
          }
          break;
        case "Escape":
          e.preventDefault();
          if (searchQuery) {
            setSearchQuery("");
          } else {
            onRequestClose();
          }
          break;
      }
    },
    [results, activeIndex, searchQuery, toggleExpanded, onRequestClose]
  );

  return (
    <div className="flex flex-col h-full" onKeyDown={handleKeyDown}>
      {/* Search input */}
      <div className="relative mb-3">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search in notes..."
          autoFocus
          className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-200 text-sm placeholder-slate-500 outline-none focus:border-slate-600 transition-colors"
        />
      </div>

      {/* Results list */}
      <div ref={listRef} className="flex-1 overflow-y-auto -mx-2 px-2">
        {searchQuery.trim() === "" ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            Type to search notes
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No results found
          </div>
        ) : (
          <ul className="space-y-1">
            {results.map((result, index) => (
              <ResultItem
                key={result.noteId}
                result={result}
                isActive={index === activeIndex}
                isExpanded={!!expandedById[result.noteId]}
                showAll={!!showAllById[result.noteId]}
                index={index}
                query={searchQuery}
                onToggleExpanded={() => toggleExpanded(result.noteId)}
                onToggleShowAll={() => toggleShowAll(result.noteId)}
                onOpenMatchLine={(range) =>
                  openMatchLine(result.noteId, range)
                }
                onOpenNote={() => openNoteWithoutRange(result.noteId)}
                onMouseEnter={() => setActiveIndex(index)}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Footer with result count */}
      {searchQuery.trim() !== "" && results.length > 0 && (
        <div className="pt-2 mt-2 border-t border-slate-800 text-xs text-slate-500">
          {results.length} file{results.length !== 1 ? "s" : ""} found
        </div>
      )}
    </div>
  );
}

export default NotesFileSearchPanel;

interface ResultItemProps {
  result: NoteSearchResult;
  isActive: boolean;
  isExpanded: boolean;
  showAll: boolean;
  index: number;
  query: string;
  onToggleExpanded: () => void;
  onToggleShowAll: () => void;
  onOpenMatchLine: (range: { from: number; to: number }) => void;
  onOpenNote: () => void;
  onMouseEnter: () => void;
}

function ResultItem({
  result,
  isActive,
  isExpanded,
  showAll,
  index,
  query,
  onToggleExpanded,
  onToggleShowAll,
  onOpenMatchLine,
  onOpenNote,
  onMouseEnter,
}: ResultItemProps) {
  const hasTitleMatch = result.titleMatchCount > 0;
  const hasPathMatch = result.pathMatchCount > 0;
  const hasContentMatches = result.contentMatches.length > 0;

  const visibleMatches = showAll
    ? result.contentMatches
    : result.contentMatches.slice(0, INITIAL_MATCH_LIMIT);
  const hiddenCount = Math.max(0, result.contentMatches.length - INITIAL_MATCH_LIMIT);

  return (
    <li data-result-index={index} onMouseEnter={onMouseEnter}>
      {/* File header - toggles expand/collapse */}
      <div
        onClick={onToggleExpanded}
        className={`rounded-md cursor-pointer transition-colors px-2 py-2 ${
          isActive ? "bg-slate-700" : "hover:bg-slate-800"
        }`}
      >
        <div className="flex items-center gap-2">
          {/* Chevron indicator */}
          <span className="w-4 h-4 flex items-center justify-center text-slate-500 shrink-0">
            {isExpanded ? (
              <IconChevronDown className="w-3.5 h-3.5" />
            ) : (
              <IconChevronRight className="w-3.5 h-3.5" />
            )}
          </span>
          <IconFileText className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="text-sm font-medium text-slate-200 truncate">
            {result.title}
          </span>
          <span className="text-xs text-slate-500 ml-auto shrink-0">
            {result.matchCount} match{result.matchCount !== 1 ? "es" : ""}
          </span>
        </div>

        {/* Path */}
        <div className="text-[10px] font-mono text-slate-500 truncate mt-1 pl-8">
          {result.path}
        </div>
      </div>

      {/* Expanded content - match lines list */}
      {isExpanded && (
        <div className="pl-8 pr-2 pb-2 space-y-0.5">
          {hasTitleMatch && (
            <MetaMatchItem
              kind="T"
              label="Title"
              text={result.title}
              query={query}
              onClick={onOpenNote}
            />
          )}
          {hasPathMatch && (
            <MetaMatchItem
              kind="P"
              label="Path"
              text={result.path}
              query={query}
              onClick={onOpenNote}
            />
          )}

          {hasContentMatches && (
            <>
              {visibleMatches.map((match, idx) => (
                <MatchLineItem
                  key={idx}
                  match={match}
                  query={query}
                  onClick={() =>
                    onOpenMatchLine({ from: match.rangeFrom, to: match.rangeTo })
                  }
                />
              ))}
              {!showAll && hiddenCount > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleShowAll();
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors pl-6 py-1"
                >
                  Show more ({hiddenCount})
                </button>
              )}
            </>
          )}
        </div>
      )}
    </li>
  );
}

interface MetaMatchItemProps {
  kind: "T" | "P";
  label: string;
  text: string;
  query: string;
  onClick: () => void;
}

function MetaMatchItem({ kind, label, text, query, onClick }: MetaMatchItemProps) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex items-start gap-2 text-xs cursor-pointer rounded px-1 py-0.5 hover:bg-slate-800 transition-colors"
    >
      <span className="text-slate-600 font-mono w-4 text-right shrink-0">
        {kind}
      </span>
      <span className="text-slate-400 truncate">
        <span className="text-slate-500 mr-1">{label}:</span>{" "}
        <InlineHighlight text={text} query={query} />
      </span>
    </div>
  );
}

interface MatchLineItemProps {
  match: MatchPreview;
  query: string;
  onClick: () => void;
}

function MatchLineItem({ match, onClick }: MatchLineItemProps) {
  const { lineNumber, text, matchStart, matchEnd } = match;

  // Truncate long lines, keeping the match visible
  const maxLen = 60;
  let displayText = text;
  let displayMatchStart = matchStart;
  let displayMatchEnd = matchEnd;

  if (text.length > maxLen) {
    // Center the match in the display window
    const matchCenter = (matchStart + matchEnd) / 2;
    let start = Math.max(0, Math.floor(matchCenter - maxLen / 2));
    let end = Math.min(text.length, start + maxLen);

    // Adjust if we hit the end
    if (end === text.length) {
      start = Math.max(0, end - maxLen);
    }

    displayText =
      (start > 0 ? "..." : "") +
      text.slice(start, end) +
      (end < text.length ? "..." : "");
    displayMatchStart = matchStart - start + (start > 0 ? 3 : 0);
    displayMatchEnd = matchEnd - start + (start > 0 ? 3 : 0);
  }

  // Split into before, match, after
  const before = displayText.slice(0, displayMatchStart);
  const matchText = displayText.slice(displayMatchStart, displayMatchEnd);
  const after = displayText.slice(displayMatchEnd);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex items-start gap-2 text-xs cursor-pointer rounded px-1 py-0.5 hover:bg-slate-800 transition-colors"
    >
      <span className="text-slate-600 font-mono w-4 text-right shrink-0">
        {lineNumber}
      </span>
      <span className="text-slate-400 truncate">
        <span>{before}</span>
        <span className="bg-amber-500/30 text-amber-200 rounded-sm px-0.5">
          {matchText}
        </span>
        <span>{after}</span>
      </span>
    </div>
  );
}

function InlineHighlight({ text, query }: { text: string; query: string }) {
  const trimmed = query.trim();
  if (!trimmed) return <>{text}</>;

  const lowerText = text.toLowerCase();
  const lowerQuery = trimmed.toLowerCase();
  const idx = lowerText.indexOf(lowerQuery);
  if (idx === -1) return <>{text}</>;

  const before = text.slice(0, idx);
  const matchText = text.slice(idx, idx + trimmed.length);
  const after = text.slice(idx + trimmed.length);

  return (
    <>
      <span>{before}</span>
      <span className="bg-amber-500/30 text-amber-200 rounded-sm px-0.5">
        {matchText}
      </span>
      <span>{after}</span>
    </>
  );
}
