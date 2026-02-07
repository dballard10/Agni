import { useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import type { Extension } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import {
  IconBook,
  IconEdit,
  IconDots,
} from "@tabler/icons-react";
import { LiveMarkdownEditor } from "../../features/notes/editor/LiveMarkdownEditor";
import { useAnchoredMenu } from "@/shared/hooks/useAnchoredMenu";
import type { Note } from "../../mock/mockNotes";

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
  mode,
  onToggleMode,
  filePath,
  menuItems,
  paneId, // Reserved for future use
  isFocused,
  onFocus,
  onOpenBracketLink,
  jumpTo,
  additionalExtensions,
  onEditorViewReady,
}: EditorPaneProps) {
  void paneId; // Reserved for future use
  const menuButtonRef = useRef<HTMLButtonElement>(null);
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
        isFocused ? "ring-1 ring-slate-600 ring-inset" : ""
      }`}
      onClick={onFocus}
    >
      {/* Subtle header bar - transparent to blend with editor */}
      <div className="flex items-center h-8 px-3 bg-transparent shrink-0">
        {/* File path - centered */}
        <div className="flex-1 flex justify-center min-w-0">
          <span className="text-slate-500 text-xs font-mono truncate">
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
              className="flex items-center justify-center w-6 h-6 rounded text-slate-500 hover:bg-slate-700 hover:text-slate-300 transition-colors"
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
                ? "text-slate-500 hover:bg-slate-700 hover:text-slate-300"
                : "text-slate-600 cursor-not-allowed"
            }`}
            aria-label="Open menu"
            title="Open menu"
          >
            <IconDots className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Title input */}
      <div className="px-6 pt-4 pb-2 shrink-0">
        <input
          type="text"
          value={activeNote?.title ?? ""}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-full bg-transparent text-2xl font-bold text-[color:var(--notes-fg-strong)] outline-none border-none placeholder:text-[color:var(--notes-placeholder)]"
          placeholder="Untitled"
        />
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <LiveMarkdownEditor
          value={activeNote?.content ?? ""}
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

      {/* Dropdown menu portal */}
      {isOpen &&
        position &&
        hasMenuItems &&
        createPortal(
          <div className="fixed inset-0 z-50" onClick={close}>
            <div
              className="absolute w-40 rounded bg-slate-900 border border-slate-700 shadow-lg overflow-hidden"
              style={{ top: position.top, left: position.left }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="py-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.id}>
                      {item.separatorBefore && (
                        <div className="my-1 border-t border-slate-700" />
                      )}
                      <button
                        onClick={() => handleItemClick(item)}
                        disabled={item.disabled}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors ${
                          item.disabled
                            ? "text-slate-600 cursor-not-allowed"
                            : item.danger
                              ? "text-red-400 hover:bg-slate-800"
                              : "text-slate-200 hover:bg-slate-800"
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
