import { useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  IconBook,
  IconEdit,
  IconDots,
} from "@tabler/icons-react";
import type { EditorMode } from "@/app/shell/types";
import type { SplitMode } from "@/pages/NotesPage";
import { useAnchoredMenu } from "@/shared/hooks/useAnchoredMenu";

export interface HeaderMenuItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  danger?: boolean;
  disabled?: boolean;
  separatorBefore?: boolean;
  onSelect: () => void;
}

interface MainContentHeaderProps {
  filePath: string;
  editorMode?: EditorMode;
  /** If not provided, the editor mode toggle button is hidden */
  onToggleEditorMode?: () => void;
  /** Menu items for the three-dots dropdown. If empty/undefined, button is disabled. */
  menuItems?: HeaderMenuItem[];
  /** Optional page title shown at the left of the header */
  title?: string;
  /** Split view mode - when not "none", shows two file paths side by side */
  splitMode?: SplitMode;
  /** File path for the secondary pane (right/bottom) in split view */
  secondaryFilePath?: string;
}

function formatHeaderFilePath(raw: string): string {
  if (!raw) return "";
  const withoutExtension = raw.replace(/\.md$/i, "");
  const parts = withoutExtension.split(/[\\/]+/).filter(Boolean);
  if (parts.length === 0) return "";
  return parts.join(" / ");
}

export function MainContentHeader({
  filePath,
  editorMode,
  onToggleEditorMode,
  menuItems,
  title,
  splitMode,
  secondaryFilePath,
}: MainContentHeaderProps) {
  const EditorIcon = editorMode === "preview" ? IconBook : IconEdit;
  const menuButtonRef = useRef<HTMLButtonElement>(null);

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

  const isSplit = splitMode && splitMode !== "none";

  // Controls section (shared between layouts)
  const controlsSection = (
    <div className="flex items-center gap-1 px-3 shrink-0">
      {onToggleEditorMode && (
        <button
          onClick={onToggleEditorMode}
          className="flex items-center justify-center w-7 h-7 rounded-md text-text-muted hover:bg-bg-hover hover:text-text-secondary transition-colors"
          aria-label={editorMode === "preview" ? "Switch to edit mode" : "Switch to preview mode"}
          title={editorMode === "preview" ? "Switch to edit mode" : "Switch to preview mode"}
        >
          <EditorIcon className="w-5 h-5" />
        </button>
      )}
      <button
        ref={menuButtonRef}
        onClick={handleMenuButtonClick}
        disabled={!hasMenuItems}
        className={`flex items-center justify-center w-7 h-7 rounded-md transition-colors ${
          hasMenuItems
            ? "text-text-muted hover:bg-bg-hover hover:text-text-secondary"
            : "text-text-disabled cursor-not-allowed"
        }`}
        aria-label="Open menu"
        title="Open menu"
      >
        <IconDots className="w-5 h-5" />
      </button>
    </div>
  );

  if (isSplit) {
    return (
      <div className="relative flex items-center h-10 bg-bg-panel border-b border-border">
        {/* Primary pane header - 50% */}
        <div className="flex-1 flex items-center justify-center min-w-0 pr-8">
          <span className="text-text-muted text-sm font-mono truncate px-4">
            {formatHeaderFilePath(filePath)}
          </span>
        </div>

        {/* Secondary pane header - 50% */}
        <div className="flex-1 flex items-center justify-center min-w-0">
          <span className="text-text-muted text-sm font-mono truncate px-4">
            {formatHeaderFilePath(secondaryFilePath ?? "")}
          </span>
        </div>

        {/* Controls - positioned absolutely so they don't affect the 50/50 split */}
        <div className="absolute right-0 top-0 bottom-0 flex items-center">
          {controlsSection}
        </div>

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

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center h-10 px-3 bg-bg-panel border-b border-border">
      {/* Left section: Optional title */}
      <div className="min-w-0 flex items-center">
        {title && (
          <span className="text-text-muted text-sm font-mono truncate">
            {title}
          </span>
        )}
      </div>

      {/* Center section: File path */}
      <span className="text-text-muted text-sm font-mono truncate max-w-md px-4">
        {formatHeaderFilePath(filePath)}
      </span>

      {/* Right section: Editor mode toggle and menu */}
      <div className="flex items-center gap-1 justify-end">
        {onToggleEditorMode && (
          <button
            onClick={onToggleEditorMode}
            className="flex items-center justify-center w-7 h-7 rounded-md text-text-muted hover:bg-bg-hover hover:text-text-secondary transition-colors"
            aria-label={editorMode === "preview" ? "Switch to edit mode" : "Switch to preview mode"}
            title={editorMode === "preview" ? "Switch to edit mode" : "Switch to preview mode"}
          >
            <EditorIcon className="w-5 h-5" />
          </button>
        )}
        <button
          ref={menuButtonRef}
          onClick={handleMenuButtonClick}
          disabled={!hasMenuItems}
          className={`flex items-center justify-center w-7 h-7 rounded-md transition-colors ${
            hasMenuItems
              ? "text-text-muted hover:bg-bg-hover hover:text-text-secondary"
              : "text-text-disabled cursor-not-allowed"
          }`}
          aria-label="Open menu"
          title="Open menu"
        >
          <IconDots className="w-5 h-5" />
        </button>
      </div>

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
