import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  IconFilePencil,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import type { EditorMode } from "@/app/shell/types";
import { LiveMarkdownEditor } from "../../features/notes/editor/LiveMarkdownEditor";
import { mockNotes, createNewNote, type Note } from "../../mock/mockNotes";
import { NotesFileExplorerPanel } from "../../features/notes/drawer/NotesFileExplorerPanel";

export type NotesPageActions = {
  createNote: () => void;
  createFolder: () => void;
  focusSearch: () => void;
  focusExplorer: () => void;
  goBack: () => void;
  goForward: () => void;
  toggleEditorMode: () => void;
};

type NotesViewMode = "preview" | "edit";

interface NotesShellState {
  filePath: string;
  canGoBack: boolean;
  canGoForward: boolean;
  editorMode: EditorMode;
}

interface HistoryState {
  ids: string[];
  index: number;
}

interface JumpTarget {
  from: number;
  to: number;
  nonce: number;
}

/**
 * Extract the folder path from a full note path.
 * Returns null for root-level notes.
 * e.g., "Work/Meetings/2025.md" -> "Work/Meetings"
 * e.g., "Note.md" -> null
 */
function getFolderPathFromNotePath(notePath: string): string | null {
  const parts = notePath.split("/");
  if (parts.length <= 1) return null;
  return parts.slice(0, -1).join("/");
}

/**
 * Get all ancestor folder paths for a given folder path.
 * e.g., "Work/Meetings/Sync" -> ["Work", "Work/Meetings", "Work/Meetings/Sync"]
 */
function getAncestorFolderChain(folderPath: string): string[] {
  if (!folderPath) return [];
  const parts = folderPath.split("/");
  const chain: string[] = [];
  let current = "";
  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    chain.push(current);
  }
  return chain;
}

interface NotesPageProps {
  actionsRef?: React.MutableRefObject<NotesPageActions | null>;
  onShellStateChange?: (state: NotesShellState) => void;
}

export function NotesPage({ actionsRef, onShellStateChange }: NotesPageProps = {}) {
  const [notes, setNotes] = useState<Note[]>(mockNotes);
  const [folders, setFolders] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryState>(() => {
    const firstId = mockNotes[0]?.id;
    return {
      ids: firstId ? [firstId] : [],
      index: firstId ? 0 : -1,
    };
  });

  const selectedNoteId = history.index >= 0 ? history.ids[history.index] : null;

  const [notesViewMode, setNotesViewMode] = useState<NotesViewMode>("preview");

  // Jump target for scrolling editor to a match
  const [jumpTo, setJumpTo] = useState<JumpTarget | null>(null);

  // Ref for the sidebar search input
  const sidebarSearchInputRef = useRef<HTMLInputElement>(null);
  const [sidebarTab, setSidebarTab] = useState<"explorer" | "search">("explorer");

  const canGoBack = history.index > 0;
  const canGoForward = history.index < history.ids.length - 1;

  const handleGoBack = useCallback(() => {
    if (!canGoBack) return;
    setHistory((prev) => ({ ...prev, index: prev.index - 1 }));
  }, [canGoBack]);

  const handleGoForward = useCallback(() => {
    if (!canGoForward) return;
    setHistory((prev) => ({ ...prev, index: prev.index + 1 }));
  }, [canGoForward]);

  const handleToggleEditorMode = useCallback(() => {
    setNotesViewMode((prev) => (prev === "preview" ? "edit" : "preview"));
  }, []);

  const selectedNote = notes.find((n) => n.id === selectedNoteId) ?? null;

  const handleSelectNote = useCallback((noteId: string) => {
    setHistory((prev) => {
      // If we're already on this note, do nothing
      if (prev.index >= 0 && prev.ids[prev.index] === noteId) {
        return prev;
      }
      // Truncate forward history and add new note
      const newIds = [...prev.ids.slice(0, prev.index + 1), noteId];
      return {
        ids: newIds,
        index: newIds.length - 1,
      };
    });
  }, []);

  // Handle opening a search result with optional jump to match
  const handleOpenSearchResult = useCallback(
    (noteId: string, firstMatchRange: { from: number; to: number } | null) => {
      // Select the note
      setHistory((prev) => {
        if (prev.index >= 0 && prev.ids[prev.index] === noteId) {
          return prev;
        }
        const newIds = [...prev.ids.slice(0, prev.index + 1), noteId];
        return {
          ids: newIds,
          index: newIds.length - 1,
        };
      });

      // Set jump target if we have a match range
      if (firstMatchRange) {
        setJumpTo({
          from: firstMatchRange.from,
          to: firstMatchRange.to,
          nonce: Date.now(),
        });
      }
    },
    []
  );

  const handleCreateNote = useCallback(() => {
    const newNote = createNewNote();
    setNotes((prev) => [newNote, ...prev]);
    setHistory((prev) => {
      const newIds = [...prev.ids.slice(0, prev.index + 1), newNote.id];
      return {
        ids: newIds,
        index: newIds.length - 1,
      };
    });
  }, []);

  const handleFocusSearch = useCallback(() => {
    setSidebarTab("search");
    requestAnimationFrame(() => {
      sidebarSearchInputRef.current?.focus();
    });
  }, []);

  const handleFocusExplorer = useCallback(() => {
    setSidebarTab("explorer");
    sidebarSearchInputRef.current?.blur();
  }, []);

  // Open note by label (bracket link) or create if not found
  const openOrCreateNoteByLabel = useCallback(
    (label: string) => {
      // Normalize: trim whitespace, drop trailing .md
      let normalized = label.trim();
      if (normalized.toLowerCase().endsWith(".md")) {
        normalized = normalized.slice(0, -3);
      }

      // Find existing note by case-insensitive match against title or path basename
      const existingNote = notes.find((note) => {
        // Match against title
        if (note.title.toLowerCase() === normalized.toLowerCase()) {
          return true;
        }
        // Match against path basename (without .md)
        const pathParts = note.path.split("/");
        let basename = pathParts[pathParts.length - 1];
        if (basename.toLowerCase().endsWith(".md")) {
          basename = basename.slice(0, -3);
        }
        return basename.toLowerCase() === normalized.toLowerCase();
      });

      if (existingNote) {
        // Open existing note
        setHistory((prev) => {
          if (prev.index >= 0 && prev.ids[prev.index] === existingNote.id) {
            return prev;
          }
          const newIds = [...prev.ids.slice(0, prev.index + 1), existingNote.id];
          return {
            ids: newIds,
            index: newIds.length - 1,
          };
        });
      } else {
        // Create new note with this title
        const now = new Date().toISOString();
        const id = `note-${Date.now()}`;

        // Support folder prefixes if label contains /
        let title = normalized;
        let path = `${normalized}.md`;
        if (normalized.includes("/")) {
          const parts = normalized.split("/");
          title = parts[parts.length - 1];
          path = `${normalized}.md`;
        }

        const newNote: Note = {
          id,
          title,
          path,
          content: `# ${title}\n\n`,
          createdAt: now,
          updatedAt: now,
        };

        setNotes((prev) => [newNote, ...prev]);
        setHistory((prev) => {
          const newIds = [...prev.ids.slice(0, prev.index + 1), newNote.id];
          return {
            ids: newIds,
            index: newIds.length - 1,
          };
        });
      }
    },
    [notes]
  );

  const handleUpdateNoteContent = useCallback(
    (content: string) => {
      if (!selectedNoteId) return;
      setNotes((prev) =>
        prev.map((note) =>
          note.id === selectedNoteId
            ? { ...note, content, updatedAt: new Date().toISOString() }
            : note
        )
      );
    },
    [selectedNoteId]
  );

  const handleUpdateNoteTitle = useCallback(
    (title: string) => {
      if (!selectedNoteId) return;
      setNotes((prev) =>
        prev.map((note) =>
          note.id === selectedNoteId
            ? { ...note, title, updatedAt: new Date().toISOString() }
            : note
        )
      );
    },
    [selectedNoteId]
  );

  const handleCreateFolder = useCallback(() => {
    // Gather all existing root-level folder names (from explicit folders + note paths)
    const existingRootFolders = new Set<string>();

    // Add explicit folders (just the first segment for root-level check)
    folders.forEach((f) => {
      const rootPart = f.split("/")[0];
      if (rootPart) existingRootFolders.add(rootPart);
    });

    // Add folders derived from note paths
    notes.forEach((note) => {
      const parts = note.path.split("/");
      if (parts.length > 1) {
        existingRootFolders.add(parts[0]);
      }
    });

    // Generate unique name: "New Folder", "New Folder 2", "New Folder 3", etc.
    let folderName = "New Folder";
    let counter = 2;
    while (existingRootFolders.has(folderName)) {
      folderName = `New Folder ${counter}`;
      counter++;
    }

    setFolders((prev) => [...prev, folderName]);
  }, [folders, notes]);

  // Register actions for external components (e.g., sidebar)
  useEffect(() => {
    if (!actionsRef) return;
    actionsRef.current = { 
      createNote: handleCreateNote, 
      createFolder: handleCreateFolder,
      focusSearch: handleFocusSearch,
      focusExplorer: handleFocusExplorer,
      goBack: handleGoBack,
      goForward: handleGoForward,
      toggleEditorMode: handleToggleEditorMode,
    };
    return () => {
      if (actionsRef) actionsRef.current = null;
    };
  }, [
    actionsRef,
    handleCreateNote,
    handleCreateFolder,
    handleFocusSearch,
    handleFocusExplorer,
    handleGoBack,
    handleGoForward,
    handleToggleEditorMode,
  ]);

  useEffect(() => {
    if (!onShellStateChange) return;
    onShellStateChange({
      filePath: selectedNote?.path ?? "Notes",
      canGoBack,
      canGoForward,
      editorMode: notesViewMode,
    });
  }, [
    onShellStateChange,
    selectedNote?.path,
    canGoBack,
    canGoForward,
    notesViewMode,
  ]);

  const handleCreateNoteInFolder = useCallback(
    (folderPath: string) => {
      // Generate unique name: "Untitled Note", "Untitled Note 2", etc.
      let title = "Untitled Note";
      let counter = 2;
      const getPath = (t: string) => `${folderPath}/${t}.md`;

      while (notes.some((n) => n.path === getPath(title))) {
        title = `Untitled Note ${counter}`;
        counter++;
      }

      const now = new Date().toISOString();
      const newNote: Note = {
        id: `note-${Date.now()}`,
        title,
        path: getPath(title),
        content: `# ${title}\n\nStart writing here...`,
        createdAt: now,
        updatedAt: now,
      };

      setNotes((prev) => [newNote, ...prev]);
      setHistory((prev) => {
        const newIds = [...prev.ids.slice(0, prev.index + 1), newNote.id];
        return {
          ids: newIds,
          index: newIds.length - 1,
        };
      });
    },
    [notes]
  );

  const handleCreateFolderInFolder = useCallback(
    (folderPath: string) => {
      // Gather existing subfolder names under folderPath
      const existingSubFolders = new Set<string>();

      // From explicit folders
      folders.forEach((f) => {
        if (f.startsWith(folderPath + "/")) {
          const relative = f.slice(folderPath.length + 1);
          const firstPart = relative.split("/")[0];
          if (firstPart) existingSubFolders.add(firstPart);
        }
      });

      // From note paths
      notes.forEach((note) => {
        if (note.path.startsWith(folderPath + "/")) {
          const relative = note.path.slice(folderPath.length + 1);
          const parts = relative.split("/");
          if (parts.length > 1) {
            existingSubFolders.add(parts[0]);
          }
        }
      });

      let folderName = "New Folder";
      let counter = 2;
      while (existingSubFolders.has(folderName)) {
        folderName = `New Folder ${counter}`;
        counter++;
      }

      const newFolderPath = `${folderPath}/${folderName}`;
      setFolders((prev) => [...prev, newFolderPath]);
    },
    [folders, notes]
  );

  // Rename a note: update title and also update the filename portion of path
  const handleRenameNote = useCallback((noteId: string, nextTitle: string) => {
    setNotes((prev) =>
      prev.map((note) => {
        if (note.id !== noteId) return note;
        // Update the filename portion of path
        const pathParts = note.path.split("/");
        // Keep folder prefix, update filename to newTitle.md
        const newFileName = nextTitle.endsWith(".md")
          ? nextTitle
          : `${nextTitle}.md`;
        pathParts[pathParts.length - 1] = newFileName;
        const newPath = pathParts.join("/");
        return {
          ...note,
          title: nextTitle,
          path: newPath,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  // Delete a note: remove from notes array, adjust history
  const handleDeleteNote = useCallback(
    (noteId: string) => {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));

      // Adjust history if the deleted note is in it
      setHistory((prev) => {
        const newIds = prev.ids.filter((id) => id !== noteId);
        if (newIds.length === 0) {
          return { ids: [], index: -1 };
        }
        // If deleted note was the current selection, adjust index
        const wasAtIndex = prev.ids.indexOf(noteId);
        let newIndex = prev.index;
        if (wasAtIndex !== -1 && wasAtIndex <= prev.index) {
          newIndex = Math.max(0, prev.index - 1);
        }
        // Make sure index is within bounds
        newIndex = Math.min(newIndex, newIds.length - 1);
        return { ids: newIds, index: newIndex };
      });
    },
    []
  );

  // Rename a folder: update folder path and all notes under it
  const handleRenameFolder = useCallback(
    (folderPath: string, nextFolderName: string) => {
      // Build the new folder path by replacing the last segment
      const pathParts = folderPath.split("/");
      pathParts[pathParts.length - 1] = nextFolderName;
      const newFolderPath = pathParts.join("/");

      // Update explicit folders
      setFolders((prev) =>
        prev.map((f) => {
          if (f === folderPath) {
            return newFolderPath;
          }
          // Also update nested folders
          if (f.startsWith(folderPath + "/")) {
            return newFolderPath + f.slice(folderPath.length);
          }
          return f;
        })
      );

      // Update note paths under this folder
      setNotes((prev) =>
        prev.map((note) => {
          if (
            note.path === folderPath ||
            note.path.startsWith(folderPath + "/")
          ) {
            const newPath = newFolderPath + note.path.slice(folderPath.length);
            return {
              ...note,
              path: newPath,
              updatedAt: new Date().toISOString(),
            };
          }
          return note;
        })
      );
    },
    []
  );

  // Delete a folder: remove folder and all nested notes/folders
  // Show confirmation if folder is not empty
  const handleDeleteFolder = useCallback(
    (folderPath: string) => {
      // Check if folder has any notes or nested folders
      const hasNotes = notes.some(
        (n) => n.path.startsWith(folderPath + "/") || n.path === folderPath
      );
      const hasNestedFolders = folders.some(
        (f) => f.startsWith(folderPath + "/") && f !== folderPath
      );
      const isNotEmpty = hasNotes || hasNestedFolders;

      if (isNotEmpty) {
        const confirmed = window.confirm(
          `The folder "${folderPath}" is not empty. Delete it and all its contents?`
        );
        if (!confirmed) return;
      }

      // Remove notes under this folder
      const noteIdsToDelete = notes
        .filter(
          (n) => n.path.startsWith(folderPath + "/") || n.path === folderPath
        )
        .map((n) => n.id);

      setNotes((prev) =>
        prev.filter(
          (n) =>
            !n.path.startsWith(folderPath + "/") && n.path !== folderPath
        )
      );

      // Remove explicit folders equal to or nested under this folder
      setFolders((prev) =>
        prev.filter((f) => f !== folderPath && !f.startsWith(folderPath + "/"))
      );

      // Adjust history to remove deleted notes
      if (noteIdsToDelete.length > 0) {
        setHistory((prev) => {
          const newIds = prev.ids.filter((id) => !noteIdsToDelete.includes(id));
          if (newIds.length === 0) {
            return { ids: [], index: -1 };
          }
          // Count how many deleted notes were at or before current index
          let removed = 0;
          for (let i = 0; i <= prev.index && i < prev.ids.length; i++) {
            if (noteIdsToDelete.includes(prev.ids[i])) {
              removed++;
            }
          }
          let newIndex = Math.max(0, prev.index - removed);
          newIndex = Math.min(newIndex, newIds.length - 1);
          return { ids: newIds, index: newIndex };
        });
      }
    },
    [notes, folders]
  );

  const handleMoveNote = useCallback(
    (noteId: string, targetFolderPath: string | null) => {
      // Find the note to get its current folder path before moving
      const noteToMove = notes.find((n) => n.id === noteId);
      if (noteToMove) {
        const sourceFolderPath = getFolderPathFromNotePath(noteToMove.path);
        if (sourceFolderPath) {
          const ancestors = getAncestorFolderChain(sourceFolderPath);
          setFolders((prev) => {
            const next = new Set(prev);
            ancestors.forEach((a) => next.add(a));
            return Array.from(next);
          });
        }
      }

      setNotes((prev) =>
        prev.map((note) => {
          if (note.id !== noteId) return note;

          const pathParts = note.path.split("/");
          const fileName = pathParts[pathParts.length - 1];
          const newPath = targetFolderPath
            ? `${targetFolderPath}/${fileName}`
            : fileName;

          if (newPath === note.path) return note;

          return {
            ...note,
            path: newPath,
            updatedAt: new Date().toISOString(),
          };
        })
      );
    },
    [notes]
  );

  const handleMoveFolder = useCallback(
    (folderPath: string, targetFolderPath: string | null) => {
      // Get source parent folder chain to preserve it if it becomes empty
      const parts = folderPath.split("/");
      if (parts.length > 1) {
        const sourceParentPath = parts.slice(0, -1).join("/");
        const ancestors = getAncestorFolderChain(sourceParentPath);
        setFolders((prev) => {
          const next = new Set(prev);
          ancestors.forEach((a) => next.add(a));
          return Array.from(next);
        });
      }

      const folderName = parts[parts.length - 1];
      const newFolderPath = targetFolderPath
        ? `${targetFolderPath}/${folderName}`
        : folderName;

      if (newFolderPath === folderPath) return;

      // Update explicit folders
      setFolders((prev) =>
        prev.map((f) => {
          if (f === folderPath) {
            return newFolderPath;
          }
          if (f.startsWith(folderPath + "/")) {
            return newFolderPath + f.slice(folderPath.length);
          }
          return f;
        })
      );

      // Update notes under this folder
      setNotes((prev) =>
        prev.map((note) => {
          if (note.path.startsWith(folderPath + "/")) {
            return {
              ...note,
              path: newFolderPath + note.path.slice(folderPath.length),
              updatedAt: new Date().toISOString(),
            };
          }
          return note;
        })
      );
    },
    []
  );

  // Portal file explorer to left sidebar
  const sidebarSlot = typeof document !== "undefined" 
    ? document.getElementById("agni-shell-sidebar-slot") 
    : null;

  return (
    <>
      {sidebarSlot && createPortal(
        <div className="h-full flex flex-col">
          <NotesFileExplorerPanel
            notes={notes}
            folders={folders}
            selectedNoteId={selectedNoteId}
            onOpenNote={handleSelectNote}
            onRenameNote={handleRenameNote}
            onDeleteNote={handleDeleteNote}
            onRenameFolder={handleRenameFolder}
            onDeleteFolder={handleDeleteFolder}
            onCreateNoteInFolder={handleCreateNoteInFolder}
            onCreateFolderInFolder={handleCreateFolderInFolder}
            onMoveNote={handleMoveNote}
            onMoveFolder={handleMoveFolder}
            searchInputRef={sidebarSearchInputRef}
            onOpenSearchResult={handleOpenSearchResult}
            sidebarTab={sidebarTab}
            onSidebarTabChange={setSidebarTab}
          />
        </div>,
        sidebarSlot
      )}

      <div className="flex flex-col h-full">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-2 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-lg font-semibold text-slate-100 truncate flex-1">
              {selectedNote ? (
                <input
                  type="text"
                  value={selectedNote.title}
                  onChange={(e) => handleUpdateNoteTitle(e.target.value)}
                  className="bg-transparent border-none outline-none text-lg font-semibold text-slate-100 w-full"
                  placeholder="Untitled Note"
                />
              ) : (
                "Notes"
              )}
            </h1>
          </div>
          {selectedNote && (
            <div
              className="text-[10px] text-slate-500 font-mono truncate -mt-0.5"
              title={selectedNote.path}
            >
              {selectedNote.path}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Back/Forward buttons */}
          <div className="flex items-center gap-1 mr-1">
            <button
              onClick={handleGoBack}
              disabled={!canGoBack}
              className="p-2 rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
              title="Back"
              aria-label="Go back to previous note"
            >
              <IconChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleGoForward}
              disabled={!canGoForward}
              className="p-2 rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
              title="Forward"
              aria-label="Go forward to next note"
            >
              <IconChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* New note */}
          <button
            onClick={handleCreateNote}
            className="p-2 rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            title="New note"
            aria-label="Create new note"
          >
            <IconFilePencil className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden relative">
        {selectedNote ? (
          <LiveMarkdownEditor
            value={selectedNote.content}
            onChange={handleUpdateNoteContent}
            placeholder="Start writing..."
            jumpTo={jumpTo}
            onOpenBracketLink={openOrCreateNoteByLabel}
            mode={notesViewMode}
            autoFocus={false}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500">
            <div className="text-center">
              <p className="mb-4">No note selected</p>
              <button
                onClick={handleCreateNote}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-md text-slate-200 transition-colors"
              >
                Create your first note
              </button>
            </div>
          </div>
        )}
      </main>
      </div>
    </>
  );
}

export default NotesPage;
