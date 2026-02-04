import {
  IconChevronLeft,
  IconChevronRight,
  IconBook,
  IconEdit,
  IconDots,
} from "@tabler/icons-react";
import type { EditorMode } from "@/app/shell/types";

interface MainContentHeaderProps {
  filePath: string;
  editorMode: EditorMode;
  canGoBack: boolean;
  canGoForward: boolean;
  onGoBack: () => void;
  onGoForward: () => void;
  onToggleEditorMode: () => void;
  onOpenMenu: () => void;
}

export function MainContentHeader({
  filePath,
  editorMode,
  canGoBack,
  canGoForward,
  onGoBack,
  onGoForward,
  onToggleEditorMode,
  onOpenMenu,
}: MainContentHeaderProps) {
  const EditorIcon = editorMode === "preview" ? IconBook : IconEdit;

  return (
    <div className="flex items-center h-10 px-3 bg-slate-900 border-b border-slate-700">
      {/* Left section: Navigation */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={onGoBack}
          disabled={!canGoBack}
          className={`flex items-center justify-center w-7 h-7 rounded-md transition-colors ${
            canGoBack
              ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              : "text-slate-600 cursor-not-allowed"
          }`}
          aria-label="Go back"
          title="Go back"
        >
          <IconChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={onGoForward}
          disabled={!canGoForward}
          className={`flex items-center justify-center w-7 h-7 rounded-md transition-colors ${
            canGoForward
              ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              : "text-slate-600 cursor-not-allowed"
          }`}
          aria-label="Go forward"
          title="Go forward"
        >
          <IconChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Center section: File path */}
      <div className="flex-1 flex justify-center">
        <span className="text-slate-400 text-sm font-mono truncate max-w-md">
          {filePath}
        </span>
      </div>

      {/* Right section: Editor mode toggle and menu */}
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleEditorMode}
          className="flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          aria-label={editorMode === "preview" ? "Switch to edit mode" : "Switch to preview mode"}
          title={editorMode === "preview" ? "Switch to edit mode" : "Switch to preview mode"}
        >
          <EditorIcon className="w-5 h-5" />
        </button>
        <button
          onClick={onOpenMenu}
          className="flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          aria-label="Open menu"
          title="Open menu"
        >
          <IconDots className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
