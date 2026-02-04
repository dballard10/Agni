import {
  IconBook,
  IconEdit,
  IconDots,
} from "@tabler/icons-react";
import type { EditorMode } from "@/app/shell/types";

interface MainContentHeaderProps {
  filePath: string;
  editorMode: EditorMode;
  onToggleEditorMode: () => void;
  onOpenMenu: () => void;
  /** Optional page title shown at the left of the header */
  title?: string;
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
  onOpenMenu,
  title,
}: MainContentHeaderProps) {
  const EditorIcon = editorMode === "preview" ? IconBook : IconEdit;

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center h-10 px-3 bg-slate-900 border-b border-slate-700">
      {/* Left section: Optional title */}
      <div className="min-w-0 flex items-center">
        {title && (
          <span className="text-slate-400 text-sm font-mono truncate">
            {title}
          </span>
        )}
      </div>

      {/* Center section: File path */}
      <span className="text-slate-400 text-sm font-mono truncate max-w-md px-4">
        {formatHeaderFilePath(filePath)}
      </span>

      {/* Right section: Editor mode toggle and menu */}
      <div className="flex items-center gap-1 justify-end">
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
