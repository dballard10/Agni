import { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import type { Extension } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import {
  IconBook,
  IconEdit,
  IconDots,
} from "@tabler/icons-react";
import { LiveMarkdownEditor } from "../../features/notes/editor/LiveMarkdownEditor";
import { PageNavigator } from "../../features/notes/pages/PageNavigator";
import { PageWheel } from "../../features/notes/pages/PageWheel";
import { useAnchoredMenu } from "@/shared/hooks/useAnchoredMenu";
import type { Note, NotePage } from "../../mock/mockNotes";

type EditorMode = "preview" | "edit";

interface JumpTarget {
  from: number;
  to: number;
  nonce: number;
}

export interface HeaderMenuItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  danger?: boolean;
  disabled?: boolean;
  separatorBefore?: boolean;
  onSelect: () => void;
}

interface EditorPaneProps {
  // Active note
  activeNote: Note | null;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;

  // Page content (from active page)
  content: string;
  pageTitle: string;
  onPageTitleChange: (index: number, title: string) => void;

  // Page navigation
  pages: NotePage[];
  activePageIndex: number;
  onPageChange: (index: number) => void;
  onAddPage: () => void;
  onDeletePage: (index: number) => void;

  // Editor mode
  mode: EditorMode;
  onToggleMode?: () => void;

  // Header
  filePath: string;
  menuItems?: HeaderMenuItem[];

  // Pane identity
  paneId: string;
  isFocused?: boolean;
  onFocus?: () => void;

  // Optional
  onOpenBracketLink?: (label: string) => void;
  jumpTo?: JumpTarget | null;

  // Find/replace support
  additionalExtensions?: Extension[];
  onEditorViewReady?: (view: EditorView | undefined) => void;
}

function formatHeaderFilePath(raw: string, title?: string): string {
  if (!raw) return "";
  const withoutExtension = raw.replace(/\.md$/i, "");
  const parts = withoutExtension.split(/[\\/]+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (title && parts.length > 0) {
    parts[parts.length - 1] = title;
  }
  return parts.join(" / ");
}

export function EditorPane({
  activeNote,
  onTitleChange,
  onContentChange,
  content,
  pageTitle,
  onPageTitleChange,
  pages,
  activePageIndex,
  onPageChange,
  onAddPage,
  onDeletePage,
  mode,
  onToggleMode,
  filePath,
  menuItems,
  paneId,
  isFocused,
  onFocus,
  onOpenBracketLink,
  jumpTo,
  additionalExtensions,
  onEditorViewReady,
}: EditorPaneProps) {
  void paneId; // Reserved for future use
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [wheelOpen, setWheelOpen] = useState(false);
  const [wheelAnchorRect, setWheelAnchorRect] = useState<DOMRect | null>(null);
  const EditorIcon = mode === "preview" ? IconBook : IconEdit;

  const { isOpen, position, open, close } = useAnchoredMenu({
    resolveAnchor: () => menuButtonRef.current,
    menuWidth: 160,
  });

  const hasMenuItems = menuItems && menuItems.length > 0;

  const handleMenuButtonClick = useCallback(() => {
    if (!hasMenuItems) return;
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [hasMenuItems, isOpen, close, open]);

  const handleItemClick = useCallback(
    (item: HeaderMenuItem) => {
      close();
      item.onSelect();
    },
    [close]
  );

  // Close menu on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, close]);

  return (
    <div
      className={`flex flex-col h-full overflow-hidden ${
        isFocused ? "ring-1 ring-border ring-inset" : ""
      }`}
      onClick={onFocus}
    >
      {/* Subtle header bar - transparent to blend with editor */}
      <div className="flex items-center h-8 px-3 bg-transparent shrink-0">
        {/* Page navigator (left-aligned) */}
        <PageNavigator
          pages={pages}
          activePageIndex={activePageIndex}
          onPageChange={onPageChange}
          onAddPage={onAddPage}
          onDeletePage={onDeletePage}
          onPageTitleChange={onPageTitleChange}
        />

        {/* File path - centered */}
        <div className="flex-1 flex justify-center min-w-0">
          <span className="text-text-muted text-xs font-mono truncate">
            {formatHeaderFilePath(filePath, activeNote?.title)}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-0.5 shrink-0">
          {onToggleMode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleMode();
              }}
              className="flex items-center justify-center w-6 h-6 rounded text-text-muted hover:bg-bg-hover hover:text-text-secondary transition-colors"
              aria-label={mode === "preview" ? "Switch to edit mode" : "Switch to preview mode"}
              title={mode === "preview" ? "Switch to edit mode" : "Switch to preview mode"}
            >
              <EditorIcon className="w-4 h-4" />
            </button>
          )}
          <button
            ref={menuButtonRef}
            onClick={(e) => {
              e.stopPropagation();
              handleMenuButtonClick();
            }}
            disabled={!hasMenuItems}
            className={`flex items-center justify-center w-6 h-6 rounded transition-colors ${
              hasMenuItems
                ? "text-text-muted hover:bg-bg-hover hover:text-text-secondary"
                : "text-text-disabled cursor-not-allowed"
            }`}
            aria-label="Open menu"
            title="Open menu"
          >
            <IconDots className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Title area */}
      <div className={`px-6 pt-4 pb-2 shrink-0 transition-opacity duration-200 ${wheelOpen ? "opacity-20 pointer-events-none" : ""}`}>
        {/* Note title (h1) */}
        <input
          type="text"
          value={activeNote?.title ?? ""}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-full bg-transparent text-2xl font-bold text-[color:var(--notes-fg-strong)] outline-none border-none placeholder:text-[color:var(--notes-placeholder)]"
          placeholder="Untitled"
        />
        {/* Page title (h4) — only shown when note has multiple pages */}
        {pages.length > 1 && (
          <div className="relative mt-1">
            <input
              type="text"
              value={pageTitle}
              onChange={(e) => onPageTitleChange(activePageIndex, e.target.value)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (wheelOpen) {
                  setWheelOpen(false);
                } else {
                  setWheelAnchorRect(e.currentTarget.getBoundingClientRect());
                  setWheelOpen(true);
                }
              }}
              className={`w-full bg-transparent text-sm font-semibold text-[color:var(--notes-fg)] outline-none border-none placeholder:text-[color:var(--notes-placeholder)] ${
                wheelOpen ? "invisible" : ""
              }`}
              placeholder="Page title"
            />
          </div>
        )}
      </div>

      {/* Editor */}
      <div className={`flex-1 overflow-hidden transition-opacity duration-200 ${wheelOpen ? "opacity-20 pointer-events-none" : ""}`}>
        <LiveMarkdownEditor
          value={content}
          onChange={onContentChange}
          placeholder="Start writing..."
          jumpTo={jumpTo}
          onOpenBracketLink={onOpenBracketLink}
          mode={mode}
          autoFocus={false}
          additionalExtensions={additionalExtensions}
          onEditorViewReady={onEditorViewReady}
        />
      </div>

      {/* Page wheel overlay */}
      {wheelOpen && wheelAnchorRect && pages.length > 1 && (
        <PageWheel
          pages={pages}
          activePageIndex={activePageIndex}
          anchorRect={wheelAnchorRect}
          onConfirm={(index) => {
            onPageChange(index);
            setWheelOpen(false);
          }}
          onCancel={() => setWheelOpen(false)}
        />
      )}

      {/* Dropdown menu portal */}
      {isOpen &&
        position &&
        hasMenuItems &&
        createPortal(
          <div className="fixed inset-0 z-50" onClick={close}>
            <div
              className="absolute w-40 rounded bg-bg-panel border border-border shadow-lg overflow-hidden"
              style={{ top: position.top, left: position.left }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="py-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.id}>
                      {item.separatorBefore && (
                        <div className="my-1 border-t border-border" />
                      )}
                      <button
                        onClick={() => handleItemClick(item)}
                        disabled={item.disabled}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors ${
                          item.disabled
                            ? "text-text-disabled cursor-not-allowed"
                            : item.danger
                              ? "text-status-error hover:bg-bg-hover"
                              : "text-text-secondary hover:bg-bg-hover"
                        }`}
                      >
                        {Icon && <Icon className="w-4 h-4" />}
                        <span>{item.label}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
