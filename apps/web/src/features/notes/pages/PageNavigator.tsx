import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { useAnchoredMenu } from "@/shared/hooks/useAnchoredMenu";
import { MAX_PAGES_PER_NOTE, type NotePage } from "../../../mock/mockNotes";

interface PageNavigatorProps {
  pages: NotePage[];
  activePageIndex: number;
  onPageChange: (index: number) => void;
  onAddPage: () => void;
  onDeletePage: (index: number) => void;
  onPageTitleChange?: (index: number, title: string) => void;
}

const LONG_PRESS_MS = 300;

export function PageNavigator({
  pages,
  activePageIndex,
  onPageChange,
  onAddPage,
  onDeletePage,
  onPageTitleChange,
}: PageNavigatorProps) {
  const labelRef = useRef<HTMLButtonElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  const { isOpen, position, open, close } = useAnchoredMenu({
    resolveAnchor: () => labelRef.current,
    menuWidth: 200,
  });

  const contextMenu = useAnchoredMenu({
    resolveAnchor: () => labelRef.current,
    menuWidth: 160,
  });

  // Focus rename input when editing starts
  useEffect(() => {
    if (editingIndex !== null && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingIndex]);

  // Single page: show just a "+" button to add the first additional page
  if (pages.length <= 1) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAddPage();
        }}
        className="flex items-center justify-center w-5 h-5 rounded text-text-muted hover:bg-bg-hover hover:text-text-secondary transition-colors shrink-0"
        aria-label="Add page"
        title="Add page"
      >
        <IconPlus className="w-3.5 h-3.5" />
      </button>
    );
  }

  const canGoPrev = activePageIndex > 0;
  const canGoNext = activePageIndex < pages.length - 1;
  const canAddPage = pages.length < MAX_PAGES_PER_NOTE;

  const handlePrev = () => {
    if (canGoPrev) onPageChange(activePageIndex - 1);
  };

  const handleNext = () => {
    if (canGoNext) onPageChange(activePageIndex + 1);
  };

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const startLongPress = () => {
    clearLongPress();
    longPressTimerRef.current = setTimeout(() => {
      longPressTimerRef.current = null;
      open();
    }, LONG_PRESS_MS);
  };

  const handleArrowPointerDown = () => {
    startLongPress();
  };

  const handleArrowPointerUp = () => {
    clearLongPress();
  };

  const handleLabelClick = () => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  };

  const handleSelectPage = (index: number) => {
    onPageChange(index);
    close();
  };

  const handleStartRename = (index: number) => {
    setEditingIndex(index);
    setEditValue(pages[index].title);
  };

  const handleCommitRename = () => {
    if (editingIndex !== null && onPageTitleChange) {
      const trimmed = editValue.trim();
      if (trimmed && trimmed !== pages[editingIndex].title) {
        onPageTitleChange(editingIndex, trimmed);
      }
    }
    setEditingIndex(null);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCommitRename();
    } else if (e.key === "Escape") {
      setEditingIndex(null);
    }
  };

  const handleDeletePage = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    onDeletePage(index);
    if (pages.length <= 2) {
      close();
    }
  };

  return (
    <>
      <div className="flex items-center gap-0.5 shrink-0">
        {/* Prev arrow */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          onPointerDown={handleArrowPointerDown}
          onPointerUp={handleArrowPointerUp}
          onPointerLeave={handleArrowPointerUp}
          disabled={!canGoPrev}
          className={`flex items-center justify-center w-5 h-5 rounded transition-colors ${
            canGoPrev
              ? "text-text-muted hover:bg-bg-hover hover:text-text-secondary"
              : "text-text-disabled cursor-not-allowed"
          }`}
          aria-label="Previous page"
        >
          <IconChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Page label — clickable to open dropdown, right-click for context menu */}
        <button
          ref={labelRef}
          onClick={(e) => {
            e.stopPropagation();
            handleLabelClick();
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            close();
            contextMenu.openAtPosition(e.clientX, e.clientY);
          }}
          className="px-1.5 text-text-muted text-xs font-mono hover:bg-bg-hover hover:text-text-secondary rounded transition-colors select-none whitespace-nowrap"
        >
          {activePageIndex + 1} of {pages.length}
        </button>

        {/* Next arrow */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          onPointerDown={handleArrowPointerDown}
          onPointerUp={handleArrowPointerUp}
          onPointerLeave={handleArrowPointerUp}
          disabled={!canGoNext}
          className={`flex items-center justify-center w-5 h-5 rounded transition-colors ${
            canGoNext
              ? "text-text-muted hover:bg-bg-hover hover:text-text-secondary"
              : "text-text-disabled cursor-not-allowed"
          }`}
          aria-label="Next page"
        >
          <IconChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Dropdown portal */}
      {isOpen &&
        position &&
        createPortal(
          <div className="fixed inset-0 z-50" onClick={close}>
            <div
              className="absolute w-[200px] rounded bg-bg-panel border border-border shadow-lg overflow-hidden"
              style={{ top: position.top, left: position.left }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="py-1 max-h-[320px] overflow-y-auto">
                {pages.map((page, index) => (
                  <div
                    key={page.id}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer transition-colors group ${
                      index === activePageIndex
                        ? "bg-bg-hover text-text-primary"
                        : "text-text-secondary hover:bg-bg-hover"
                    }`}
                    onClick={() => handleSelectPage(index)}
                    onDoubleClick={() => handleStartRename(index)}
                  >
                    {/* Page number */}
                    <span className="text-text-muted text-xs font-mono w-4 shrink-0 text-right">
                      {index + 1}
                    </span>

                    {/* Page title (or rename input) */}
                    {editingIndex === index ? (
                      <input
                        ref={editInputRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCommitRename}
                        onKeyDown={handleRenameKeyDown}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 min-w-0 bg-bg-input border border-border rounded px-1 py-0.5 text-xs text-text-primary outline-none"
                      />
                    ) : (
                      <span className="flex-1 min-w-0 truncate">{page.title}</span>
                    )}

                    {/* Delete button (hidden on single remaining, shown on hover) */}
                    {pages.length > 1 && editingIndex !== index && (
                      <button
                        onClick={(e) => handleDeletePage(e, index)}
                        className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-5 h-5 rounded text-text-muted hover:text-status-error hover:bg-bg-hover transition-all"
                        aria-label={`Delete ${page.title}`}
                      >
                        <IconTrash className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}

                {/* Add page button */}
                {canAddPage && (
                  <>
                    <div className="my-1 border-t border-border" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddPage();
                        close();
                      }}
                      className="flex items-center justify-center w-full py-1.5 text-text-muted hover:bg-bg-hover hover:text-text-secondary transition-colors"
                      aria-label="Add page"
                    >
                      <IconPlus className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Context menu portal */}
      {contextMenu.isOpen &&
        contextMenu.position &&
        createPortal(
          <div className="fixed inset-0 z-50" onClick={contextMenu.close}>
            <div
              className="absolute w-40 rounded bg-bg-panel border border-border shadow-lg overflow-hidden"
              style={{ top: contextMenu.position.top, left: contextMenu.position.left }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="py-1">
                <button
                  onClick={() => {
                    onAddPage();
                    contextMenu.close();
                  }}
                  disabled={!canAddPage}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors ${
                    canAddPage
                      ? "text-text-secondary hover:bg-bg-hover"
                      : "text-text-disabled cursor-not-allowed"
                  }`}
                >
                  <IconPlus className="w-4 h-4" />
                  <span>Add Page</span>
                </button>
                <button
                  onClick={() => {
                    onDeletePage(activePageIndex);
                    contextMenu.close();
                  }}
                  disabled={pages.length <= 1}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors ${
                    pages.length > 1
                      ? "text-status-error hover:bg-bg-hover"
                      : "text-text-disabled cursor-not-allowed"
                  }`}
                >
                  <IconTrash className="w-4 h-4" />
                  <span>Delete Page</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
