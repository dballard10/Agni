import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import type { EditorView } from "@codemirror/view";
import type { EditorMode } from "@/app/shell/types";
import { IconAlertTriangle, IconX } from "@tabler/icons-react";
import { mockNotes, createNewNote, type Note } from "../../mock/mockNotes";
import { NotesFileExplorerPanel } from "../../features/notes/drawer/NotesFileExplorerPanel";
import {
  FindReplaceBar,
  useFindReplace,
  findReplaceExtension,
} from "../../features/notes/find-replace";
import { EditorPane, type HeaderMenuItem } from "./EditorPane";

export type NotesPageActions = {
  focusSearch: () => void;
  focusExplorer: () => void;
  goBack: () => void;
  goForward: () => void;
  toggleEditorMode: () => void;
  selectTabIndex: (index: number) => void;
  closeTabIndex: (index: number) => void;
  /** Rename the currently selected note via prompt */
  renameCurrentNote: () => void;
  /** Delete the currently selected note */
  deleteCurrentNote: () => void;
  /** Open the find and replace bar */
  openFindReplace: () => void;
  /** Split editor horizontally (side by side) */
  splitHorizontal: () => void;
  /** Split editor vertically (top and bottom) */
  splitVertical: () => void;
  /** Close split view */
  closeSplit: () => void;
  /** Copy the current note's path to system clipboard */
  copyCurrentNotePath: () => void;
  /** Copy the current note to internal clipboard */
  copyCurrentNote: () => void;
  /** Select tab in specific pane (for split view) */
  selectPaneTabIndex: (pane: FocusedPane, index: number) => void;
  /** Close tab in specific pane (for split view) */
  closePaneTabIndex: (pane: FocusedPane, index: number) => void;
  /** Move tab between panes (for split view) */
  movePaneTab: (fromPane: FocusedPane, fromIndex: number, toPane: FocusedPane, toIndex: number) => void;
  /** Tab context menu: split horizontal with specific note */
  splitHorizontalWithNote: (noteId: string) => void;
  /** Tab context menu: split vertical with specific note */
  splitVerticalWithNote: (noteId: string) => void;
  /** Tab context menu: copy note path to clipboard */
  copyNotePath: (noteId: string) => void;
  /** Tab context menu: copy note to internal clipboard */
  copyNote: (noteId: string) => void;
  /** Tab context menu: rename note via prompt */
  renameNote: (noteId: string) => void;
  /** Tab context menu: delete note */
  deleteNote: (noteId: string) => void;
};

interface ClipboardNote {
  title: string;
  content: string;
}

interface ClipboardFolder {
  folderName: string;
  notes: { title: string; content: string; relativePath: string }[];
  subFolders: string[];
}

interface NotesClipboard {
  kind: "note" | "folder";
  data: ClipboardNote | ClipboardFolder;
}

interface PasteConflict {
  kind: "note" | "folder";
  name: string;
  targetFolderPath: string | null;
  existingId?: string; // For notes: the ID of the existing note to replace
  existingFolderPath?: string; // For folders: the path of the existing folder
}

type NotesViewMode = "preview" | "edit";

export type SplitMode = "none" | "horizontal" | "vertical";

export interface EditorPaneState {
  noteIds: string[];
  activeIndex: number;
}

export type FocusedPane = "primary" | "secondary";

interface SplitState {
  mode: SplitMode;
  primaryPane: EditorPaneState | null;
  secondaryPane: EditorPaneState | null;
  focusedPane: FocusedPane;
}

export interface NoteTab {
  noteId: string;
  title: string;
}

interface NotesShellState {
  filePath: string;
  secondaryFilePath?: string;
  canGoBack: boolean;
  canGoForward: boolean;
  editorMode: EditorMode;
  noteTabs: NoteTab[];
  activeNoteTabIndex: number;
  splitMode: SplitMode;
  tabCount: number;
  // Pane data for split view
  primaryPane: EditorPaneState | null;
  secondaryPane: EditorPaneState | null;
  // Split ratio (0-1, proportion of left/top pane)
  splitRatio: number;
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

  const [paneModes, setPaneModes] = useState<Record<"primary" | "secondary", NotesViewMode>>({
    primary: "preview",
    secondary: "preview",
  });

  // Jump target for scrolling editor to a match
  const [jumpTo, setJumpTo] = useState<JumpTarget | null>(null);

  // Ref for the sidebar search input
  const sidebarSearchInputRef = useRef<HTMLInputElement>(null);
  const [sidebarTab, setSidebarTab] = useState<"explorer" | "search">("explorer");

  // Split view state
  const [splitState, setSplitState] = useState<SplitState>({
    mode: "none",
    primaryPane: null,
    secondaryPane: null,
    focusedPane: "primary",
  });

  // Split ratio for resizable panes (0-1, proportion of left/top pane)
   
  const [splitRatio, setSplitRatio] = useState(0.5);
   
  const [isResizingSplit, setIsResizingSplit] = useState(false);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  // Clipboard state for copy/paste operations
  const [clipboard, setClipboard] = useState<NotesClipboard | null>(null);
  const canPaste = clipboard !== null;

  // Paste conflict modal state
  const [pasteConflict, setPasteConflict] = useState<PasteConflict | null>(null);

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

  const handleTogglePaneMode = useCallback((paneId: "primary" | "secondary") => {
    setPaneModes((prev) => ({
      ...prev,
      [paneId]: prev[paneId] === "preview" ? "edit" : "preview",
    }));
  }, []);

  // For MainContentHeader toggle - toggles the focused pane
  const handleToggleEditorMode = useCallback(() => {
    handleTogglePaneMode(splitState.focusedPane);
  }, [handleTogglePaneMode, splitState.focusedPane]);

  const handleSelectTabIndex = useCallback((index: number) => {
    setHistory((prev) => {
      if (index < 0 || index >= prev.ids.length) return prev;
      if (prev.index === index) return prev;
      return { ...prev, index };
    });
  }, []);

  const handleCloseTabIndex = useCallback((index: number) => {
    setHistory((prev) => {
      if (index < 0 || index >= prev.ids.length) return prev;
      const nextIds = prev.ids.filter((_, i) => i !== index);
      if (nextIds.length === 0) {
        return { ids: [], index: -1 };
      }
      let nextIndex = prev.index;
      if (index < prev.index) {
        // Closed a tab to the left of active: shift active index left
        nextIndex = prev.index - 1;
      } else if (index === prev.index) {
        // Closed the active tab: prefer right, else left
        // After removal, index `index` now points to what was the right neighbor
        if (index < nextIds.length) {
          // Right neighbor exists (now at same index)
          nextIndex = index;
        } else {
          // No right neighbor, go to new last tab (left neighbor)
          nextIndex = nextIds.length - 1;
        }
      }
      // If closed a tab to the right of active, nextIndex stays unchanged
      return { ids: nextIds, index: nextIndex };
    });
  }, []);

  const selectedNote = notes.find((n) => n.id === selectedNoteId) ?? null;

  // Editor view ref for find/replace operations
  const editorViewRef = useRef<EditorView | undefined>(undefined);

  const getEditorView = useCallback(() => editorViewRef.current, []);

  const handleEditorViewReady = useCallback((view: EditorView | undefined) => {
    editorViewRef.current = view;
  }, []);

  const handleSelectNote = useCallback((noteId: string) => {
    // When in split mode, add to the focused pane
    if (splitState.mode !== "none") {
      setSplitState((prev) => {
        const targetPane = prev.focusedPane === "primary" ? "primaryPane" : "secondaryPane";
        const pane = prev[targetPane];
        if (!pane) return prev;

        // Check if already open in this pane
        const existingIndex = pane.noteIds.indexOf(noteId);
        if (existingIndex !== -1) {
          return {
            ...prev,
            [targetPane]: { ...pane, activeIndex: existingIndex },
          };
        }

        // Add to this pane
        return {
          ...prev,
          [targetPane]: {
            noteIds: [...pane.noteIds, noteId],
            activeIndex: pane.noteIds.length,
          },
        };
      });
      return;
    }

    // Normal (non-split) behavior
    setHistory((prev) => {
      // If note is already open, focus its existing tab
      const existingIndex = prev.ids.indexOf(noteId);
      if (existingIndex !== -1) {
        if (prev.index === existingIndex) return prev;
        return { ...prev, index: existingIndex };
      }
      // Append new tab (don't truncate forward - tabs are not back/forward history)
      const newIds = [...prev.ids, noteId];
      return {
        ids: newIds,
        index: newIds.length - 1,
      };
    });
  }, [splitState.mode]);

  // Handle opening a search result with optional jump to match
  const handleOpenSearchResult = useCallback(
    (noteId: string, firstMatchRange: { from: number; to: number } | null) => {
      // Select the note (using tab-based logic: focus existing or append)
      setHistory((prev) => {
        const existingIndex = prev.ids.indexOf(noteId);
        if (existingIndex !== -1) {
          if (prev.index === existingIndex) return prev;
          return { ...prev, index: existingIndex };
        }
        const newIds = [...prev.ids, noteId];
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
      const newIds = [...prev.ids, newNote.id];
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
        // Open existing note (focus existing tab or append)
        setHistory((prev) => {
          const existingIndex = prev.ids.indexOf(existingNote.id);
          if (existingIndex !== -1) {
            if (prev.index === existingIndex) return prev;
            return { ...prev, index: existingIndex };
          }
          const newIds = [...prev.ids, existingNote.id];
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
          const newIds = [...prev.ids, newNote.id];
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

  // Generic handler for updating any note's content by ID (used by split panes)
  const handleUpdateNoteContentById = useCallback(
    (noteId: string, content: string) => {
      setNotes((prev) =>
        prev.map((note) =>
          note.id === noteId
            ? { ...note, content, updatedAt: new Date().toISOString() }
            : note
        )
      );
    },
    []
  );

  // Find and replace functionality
  const { state: findReplaceState, actions: findReplaceActions } = useFindReplace({
    content: selectedNote?.content ?? "",
    getEditorView,
    onContentChange: handleUpdateNoteContent,
  });

  // Cmd+F / Ctrl+F keyboard shortcut for find/replace
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        findReplaceActions.open();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [findReplaceActions]);

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

  // Derive noteTabs from history.ids for TopBar
  const noteTabs = useMemo<NoteTab[]>(() => {
    return history.ids.map((id) => {
      const note = notes.find((n) => n.id === id);
      return { noteId: id, title: note?.title ?? "Untitled" };
    });
  }, [history.ids, notes]);

  // Calculate total tab count across all panes
  const tabCount = splitState.mode !== "none"
    ? (splitState.primaryPane?.noteIds.length ?? 0) + (splitState.secondaryPane?.noteIds.length ?? 0)
    : history.ids.length;

  useEffect(() => {
    if (!onShellStateChange) return;

    // Compute file paths for split mode
    let filePath = selectedNote?.path ?? "Notes";
    let secondaryFilePath: string | undefined;

    if (splitState.mode !== "none" && splitState.primaryPane && splitState.secondaryPane) {
      const primaryNoteId = splitState.primaryPane.noteIds[splitState.primaryPane.activeIndex];
      const primaryNote = primaryNoteId ? notes.find((n) => n.id === primaryNoteId) : null;
      filePath = primaryNote?.path ?? "Notes";

      const secondaryNoteId = splitState.secondaryPane.noteIds[splitState.secondaryPane.activeIndex];
      const secondaryNote = secondaryNoteId ? notes.find((n) => n.id === secondaryNoteId) : null;
      secondaryFilePath = secondaryNote?.path;
    }

    // Pass tab data to shell for TopBar rendering
    onShellStateChange({
      filePath,
      secondaryFilePath,
      canGoBack,
      canGoForward,
      editorMode: paneModes[splitState.focusedPane],
      noteTabs,
      activeNoteTabIndex: history.index,
      splitMode: splitState.mode,
      tabCount,
      primaryPane: splitState.primaryPane,
      secondaryPane: splitState.secondaryPane,
      splitRatio,
    });
  }, [
    onShellStateChange,
    selectedNote?.path,
    notes,
    canGoBack,
    canGoForward,
    paneModes,
    splitState.focusedPane,
    noteTabs,
    history.index,
    splitState.mode,
    tabCount,
    splitState.primaryPane,
    splitState.secondaryPane,
    splitRatio,
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
        const newIds = [...prev.ids, newNote.id];
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

  // Rename the currently selected note via prompt (for header menu)
  const handleRenameCurrentNote = useCallback(() => {
    if (!selectedNoteId) return;
    const note = notes.find((n) => n.id === selectedNoteId);
    if (!note) return;
    const newTitle = window.prompt("Rename note:", note.title);
    if (newTitle && newTitle.trim() && newTitle.trim() !== note.title) {
      handleRenameNote(selectedNoteId, newTitle.trim());
    }
  }, [selectedNoteId, notes, handleRenameNote]);

  // Delete the currently selected note (for header menu)
  const handleDeleteCurrentNote = useCallback(() => {
    if (!selectedNoteId) return;
    handleDeleteNote(selectedNoteId);
  }, [selectedNoteId, handleDeleteNote]);

  // Copy path to system clipboard
  const handleCopyPath = useCallback((path: string) => {
    navigator.clipboard.writeText(path);
  }, []);

  // Copy note to internal clipboard
  const handleCopyNote = useCallback(
    (noteId: string) => {
      const note = notes.find((n) => n.id === noteId);
      if (!note) return;
      setClipboard({
        kind: "note",
        data: { title: note.title, content: note.content },
      });
    },
    [notes]
  );

  // Copy folder to internal clipboard
  const handleCopyFolder = useCallback(
    (folderPath: string) => {
      const folderName = folderPath.split("/").pop() || folderPath;
      const folderNotes = notes.filter(
        (n) => n.path.startsWith(folderPath + "/") || n.path === folderPath
      );
      const nestedFolders = folders.filter((f) => f.startsWith(folderPath + "/"));

      setClipboard({
        kind: "folder",
        data: {
          folderName,
          notes: folderNotes.map((n) => ({
            title: n.title,
            content: n.content,
            relativePath: n.path.slice(folderPath.length + 1),
          })),
          subFolders: nestedFolders.map((f) => f.slice(folderPath.length + 1)),
        },
      });
    },
    [notes, folders]
  );

  // Paste from clipboard into target folder (checks for conflicts first)
  const handlePaste = useCallback(
    (targetFolderPath: string | null) => {
      if (!clipboard) return;

      if (clipboard.kind === "note") {
        const data = clipboard.data as ClipboardNote;
        const getPath = (t: string) =>
          targetFolderPath ? `${targetFolderPath}/${t}.md` : `${t}.md`;

        // Check for conflict
        const existingNote = notes.find((n) => n.path === getPath(data.title));
        if (existingNote) {
          setPasteConflict({
            kind: "note",
            name: data.title,
            targetFolderPath,
            existingId: existingNote.id,
          });
          return;
        }

        // No conflict - create the note
        const now = new Date().toISOString();
        const newNote: Note = {
          id: `note-${Date.now()}`,
          title: data.title,
          path: getPath(data.title),
          content: data.content,
          createdAt: now,
          updatedAt: now,
        };

        setNotes((prev) => [newNote, ...prev]);
        setHistory((prev) => {
          const newIds = [...prev.ids, newNote.id];
          return { ids: newIds, index: newIds.length - 1 };
        });
      } else {
        const data = clipboard.data as ClipboardFolder;
        const getFolderPath = (name: string) =>
          targetFolderPath ? `${targetFolderPath}/${name}` : name;

        // Check for conflict
        const folderPath = getFolderPath(data.folderName);
        const folderExists = folders.some((f) => f === folderPath);
        const notesInPath = notes.some((n) => n.path.startsWith(folderPath + "/"));

        if (folderExists || notesInPath) {
          setPasteConflict({
            kind: "folder",
            name: data.folderName,
            targetFolderPath,
            existingFolderPath: folderPath,
          });
          return;
        }

        // No conflict - create the folder and notes
        const now = new Date().toISOString();

        // Add the folder
        setFolders((prev) => [
          ...prev,
          folderPath,
          ...data.subFolders.map((sf) => `${folderPath}/${sf}`),
        ]);

        // Add the notes
        const newNotes: Note[] = data.notes.map((n, i) => ({
          id: `note-${Date.now()}-${i}`,
          title: n.title,
          path: n.relativePath
            ? `${folderPath}/${n.relativePath}`
            : `${folderPath}/${n.title}.md`,
          content: n.content,
          createdAt: now,
          updatedAt: now,
        }));

        setNotes((prev) => [...newNotes, ...prev]);
      }
    },
    [clipboard, notes, folders]
  );

  // Handle paste with replace (when user confirms overwriting)
  const handlePasteReplace = useCallback(() => {
    if (!clipboard || !pasteConflict) return;

    if (pasteConflict.kind === "note") {
      const data = clipboard.data as ClipboardNote;
      const now = new Date().toISOString();

      // Replace the existing note's content
      setNotes((prev) =>
        prev.map((note) =>
          note.id === pasteConflict.existingId
            ? { ...note, content: data.content, updatedAt: now }
            : note
        )
      );

      // Select the replaced note
      if (pasteConflict.existingId) {
        setHistory((prev) => {
          const existingIndex = prev.ids.indexOf(pasteConflict.existingId!);
          if (existingIndex !== -1) {
            return { ...prev, index: existingIndex };
          }
          const newIds = [...prev.ids, pasteConflict.existingId!];
          return { ids: newIds, index: newIds.length - 1 };
        });
      }
    } else {
      // For folders: delete existing folder and its contents, then create new
      const data = clipboard.data as ClipboardFolder;
      const existingPath = pasteConflict.existingFolderPath!;
      const now = new Date().toISOString();

      // Remove existing folder and subfolders
      setFolders((prev) =>
        prev.filter((f) => f !== existingPath && !f.startsWith(existingPath + "/"))
      );

      // Remove existing notes in that folder
      setNotes((prev) =>
        prev.filter((n) => !n.path.startsWith(existingPath + "/"))
      );

      // Add the new folder structure
      setFolders((prev) => [
        ...prev,
        existingPath,
        ...data.subFolders.map((sf) => `${existingPath}/${sf}`),
      ]);

      // Add the new notes
      const newNotes: Note[] = data.notes.map((n, i) => ({
        id: `note-${Date.now()}-${i}`,
        title: n.title,
        path: n.relativePath
          ? `${existingPath}/${n.relativePath}`
          : `${existingPath}/${n.title}.md`,
        content: n.content,
        createdAt: now,
        updatedAt: now,
      }));

      setNotes((prev) => [...newNotes, ...prev]);
    }

    setPasteConflict(null);
  }, [clipboard, pasteConflict]);

  // Close paste conflict modal
  const handleClosePasteConflict = useCallback(() => {
    setPasteConflict(null);
  }, []);

  // Copy current note's path (for header menu)
  const handleCopyCurrentNotePath = useCallback(() => {
    if (!selectedNote) return;
    handleCopyPath(selectedNote.path);
  }, [selectedNote, handleCopyPath]);

  // Copy current note (for header menu)
  const handleCopyCurrentNote = useCallback(() => {
    if (!selectedNoteId) return;
    handleCopyNote(selectedNoteId);
  }, [selectedNoteId, handleCopyNote]);

  // Split view handlers
  const handleSplitHorizontal = useCallback(() => {
    if (history.ids.length <= 1) return; // Can't split with only 1 tab

    // Move active tab to secondary pane, keep rest in primary
    const activeId = history.ids[history.index];
    const remainingIds = history.ids.filter((_, i) => i !== history.index);

    setSplitState({
      mode: "horizontal",
      primaryPane: {
        noteIds: remainingIds,
        activeIndex: Math.min(history.index, remainingIds.length - 1),
      },
      secondaryPane: {
        noteIds: [activeId],
        activeIndex: 0,
      },
      focusedPane: "secondary", // Focus the pane with the moved tab
    });
  }, [history.ids, history.index]);

  const handleSplitVertical = useCallback(() => {
    if (history.ids.length <= 1) return; // Can't split with only 1 tab

    const activeId = history.ids[history.index];
    const remainingIds = history.ids.filter((_, i) => i !== history.index);

    setSplitState({
      mode: "vertical",
      primaryPane: {
        noteIds: remainingIds,
        activeIndex: Math.min(history.index, remainingIds.length - 1),
      },
      secondaryPane: {
        noteIds: [activeId],
        activeIndex: 0,
      },
      focusedPane: "secondary",
    });
  }, [history.ids, history.index]);

  const handleCloseSplit = useCallback(() => {
    // Merge tabs back into single history
    if (splitState.primaryPane && splitState.secondaryPane) {
      const mergedIds = [...splitState.primaryPane.noteIds, ...splitState.secondaryPane.noteIds];
      setHistory({
        ids: mergedIds,
        index: splitState.primaryPane.activeIndex,
      });
    }
    setSplitState({
      mode: "none",
      primaryPane: null,
      secondaryPane: null,
      focusedPane: "primary",
    });
    // Reset split ratio when closing split
    setSplitRatio(0.5);
  }, [splitState.primaryPane, splitState.secondaryPane]);

  // Split resize handler
  const MIN_SPLIT_RATIO = 0.2;
  const MAX_SPLIT_RATIO = 0.8;

   
  const handleSplitResizePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsResizingSplit(true);

    const container = splitContainerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const isHorizontal = splitState.mode === "horizontal";
    const containerSize = isHorizontal ? containerRect.width : containerRect.height;
    const containerStart = isHorizontal ? containerRect.left : containerRect.top;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const position = isHorizontal ? moveEvent.clientX : moveEvent.clientY;
      const relativePosition = position - containerStart;
      const newRatio = relativePosition / containerSize;
      const clampedRatio = Math.max(MIN_SPLIT_RATIO, Math.min(MAX_SPLIT_RATIO, newRatio));
      setSplitRatio(clampedRatio);
    };

    const handlePointerUp = () => {
      setIsResizingSplit(false);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }, [splitState.mode]);

  const handlePrimaryTabClose = useCallback((index: number) => {
    setSplitState((prev) => {
      if (!prev.primaryPane) return prev;
      const nextIds = prev.primaryPane.noteIds.filter((_, i) => i !== index);

      // If no tabs left in primary, close split and move secondary to main
      if (nextIds.length === 0) {
        if (prev.secondaryPane) {
          setHistory({
            ids: prev.secondaryPane.noteIds,
            index: prev.secondaryPane.activeIndex,
          });
        }
        return {
          mode: "none",
          primaryPane: null,
          secondaryPane: null,
          focusedPane: "primary",
        };
      }

      let nextIndex = prev.primaryPane.activeIndex;
      if (index < prev.primaryPane.activeIndex) {
        nextIndex = prev.primaryPane.activeIndex - 1;
      } else if (index === prev.primaryPane.activeIndex) {
        nextIndex = Math.min(index, nextIds.length - 1);
      }

      return {
        ...prev,
        primaryPane: { noteIds: nextIds, activeIndex: nextIndex },
      };
    });
  }, []);

  const handleSecondaryTabClose = useCallback((index: number) => {
    setSplitState((prev) => {
      if (!prev.secondaryPane) return prev;
      const nextIds = prev.secondaryPane.noteIds.filter((_, i) => i !== index);

      // If no tabs left in secondary, close split and keep primary as main
      if (nextIds.length === 0) {
        if (prev.primaryPane) {
          setHistory({
            ids: prev.primaryPane.noteIds,
            index: prev.primaryPane.activeIndex,
          });
        }
        return {
          mode: "none",
          primaryPane: null,
          secondaryPane: null,
          focusedPane: "primary",
        };
      }

      let nextIndex = prev.secondaryPane.activeIndex;
      if (index < prev.secondaryPane.activeIndex) {
        nextIndex = prev.secondaryPane.activeIndex - 1;
      } else if (index === prev.secondaryPane.activeIndex) {
        nextIndex = Math.min(index, nextIds.length - 1);
      }

      return {
        ...prev,
        secondaryPane: { noteIds: nextIds, activeIndex: nextIndex },
      };
    });
  }, []);

  const handlePaneFocus = useCallback((pane: FocusedPane) => {
    setSplitState((prev) => ({ ...prev, focusedPane: pane }));
  }, []);

  // Pane-specific actions for TopBar grouped tabs
  const handleSelectPaneTabIndex = useCallback((pane: FocusedPane, index: number) => {
    setSplitState((prev) => {
      const targetPane = pane === "primary" ? "primaryPane" : "secondaryPane";
      const paneState = prev[targetPane];
      if (!paneState) return prev;
      return {
        ...prev,
        [targetPane]: { ...paneState, activeIndex: index },
        focusedPane: pane,
      };
    });
  }, []);

  const handleClosePaneTabIndex = useCallback((pane: FocusedPane, index: number) => {
    if (pane === "primary") {
      handlePrimaryTabClose(index);
    } else {
      handleSecondaryTabClose(index);
    }
  }, [handlePrimaryTabClose, handleSecondaryTabClose]);

  const handleMovePaneTab = useCallback((fromPane: FocusedPane, fromIndex: number, toPane: FocusedPane, toIndex: number) => {
    setSplitState((prev) => {
      const fromKey = fromPane === "primary" ? "primaryPane" : "secondaryPane";
      const toKey = toPane === "primary" ? "primaryPane" : "secondaryPane";
      const fromPaneState = prev[fromKey];
      const toPaneState = prev[toKey];
      if (!fromPaneState || !toPaneState) return prev;

      // Get the note being moved
      const noteId = fromPaneState.noteIds[fromIndex];
      if (!noteId) return prev;

      // Remove from source pane
      const newFromIds = fromPaneState.noteIds.filter((_, i) => i !== fromIndex);
      let newFromActiveIndex = fromPaneState.activeIndex;
      if (fromIndex < fromPaneState.activeIndex) {
        newFromActiveIndex--;
      } else if (fromIndex === fromPaneState.activeIndex && newFromIds.length > 0) {
        newFromActiveIndex = Math.min(fromIndex, newFromIds.length - 1);
      }

      // If source pane becomes empty, close split
      if (newFromIds.length === 0) {
        const remainingPane = fromPane === "primary" ? prev.secondaryPane : prev.primaryPane;
        if (remainingPane) {
          setHistory({
            ids: remainingPane.noteIds,
            index: remainingPane.activeIndex,
          });
        }
        return {
          mode: "none",
          primaryPane: null,
          secondaryPane: null,
          focusedPane: "primary",
        };
      }

      // Insert into target pane
      let newToIds: string[];
      if (fromPane === toPane) {
        // Moving within same pane (reorder)
        newToIds = [...newFromIds];
        newToIds.splice(toIndex, 0, noteId);
        return {
          ...prev,
          [fromKey]: { noteIds: newToIds, activeIndex: toIndex },
          focusedPane: fromPane,
        };
      } else {
        // Moving between panes
        newToIds = [...toPaneState.noteIds];
        newToIds.splice(toIndex, 0, noteId);
        return {
          ...prev,
          [fromKey]: { noteIds: newFromIds, activeIndex: Math.max(0, newFromActiveIndex) },
          [toKey]: { noteIds: newToIds, activeIndex: toIndex },
          focusedPane: toPane,
        };
      }
    });
  }, []);

  // Register actions for external components (e.g., sidebar)
  useEffect(() => {
    if (!actionsRef) return;
    actionsRef.current = {
      focusSearch: handleFocusSearch,
      focusExplorer: handleFocusExplorer,
      goBack: handleGoBack,
      goForward: handleGoForward,
      toggleEditorMode: handleToggleEditorMode,
      selectTabIndex: handleSelectTabIndex,
      closeTabIndex: handleCloseTabIndex,
      renameCurrentNote: handleRenameCurrentNote,
      deleteCurrentNote: handleDeleteCurrentNote,
      openFindReplace: findReplaceActions.open,
      splitHorizontal: handleSplitHorizontal,
      splitVertical: handleSplitVertical,
      closeSplit: handleCloseSplit,
      copyCurrentNotePath: handleCopyCurrentNotePath,
      copyCurrentNote: handleCopyCurrentNote,
      selectPaneTabIndex: handleSelectPaneTabIndex,
      closePaneTabIndex: handleClosePaneTabIndex,
      movePaneTab: handleMovePaneTab,
      // Tab context menu actions
      splitHorizontalWithNote: (noteId: string) => {
        if (history.ids.length <= 1) return;
        const remainingIds = history.ids.filter((id) => id !== noteId);
        if (remainingIds.length === 0) return;
        setSplitState({
          mode: "horizontal",
          primaryPane: {
            noteIds: remainingIds,
            activeIndex: 0,
          },
          secondaryPane: {
            noteIds: [noteId],
            activeIndex: 0,
          },
          focusedPane: "secondary",
        });
      },
      splitVerticalWithNote: (noteId: string) => {
        if (history.ids.length <= 1) return;
        const remainingIds = history.ids.filter((id) => id !== noteId);
        if (remainingIds.length === 0) return;
        setSplitState({
          mode: "vertical",
          primaryPane: {
            noteIds: remainingIds,
            activeIndex: 0,
          },
          secondaryPane: {
            noteIds: [noteId],
            activeIndex: 0,
          },
          focusedPane: "secondary",
        });
      },
      copyNotePath: (noteId: string) => {
        const note = notes.find((n) => n.id === noteId);
        if (note) handleCopyPath(note.path);
      },
      copyNote: handleCopyNote,
      renameNote: (noteId: string) => {
        const note = notes.find((n) => n.id === noteId);
        if (!note) return;
        const newTitle = window.prompt("Rename note:", note.title);
        if (newTitle && newTitle.trim() && newTitle.trim() !== note.title) {
          handleRenameNote(noteId, newTitle.trim());
        }
      },
      deleteNote: handleDeleteNote,
    };
    return () => {
      if (actionsRef) actionsRef.current = null;
    };
  }, [
    actionsRef,
    handleFocusSearch,
    handleFocusExplorer,
    handleGoBack,
    handleGoForward,
    handleToggleEditorMode,
    handleSelectTabIndex,
    handleCloseTabIndex,
    handleRenameCurrentNote,
    handleDeleteCurrentNote,
    findReplaceActions.open,
    handleSplitHorizontal,
    handleSplitVertical,
    handleCloseSplit,
    handleCopyCurrentNotePath,
    handleCopyCurrentNote,
    handleSelectPaneTabIndex,
    handleClosePaneTabIndex,
    handleMovePaneTab,
    notes,
    history.ids,
    handleCopyPath,
    handleCopyNote,
    handleRenameNote,
    handleDeleteNote,
  ]);

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
        <div className="h-full flex flex-col -m-3">
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
            onCreateNote={handleCreateNote}
            onCreateFolder={handleCreateFolder}
            onMoveNote={handleMoveNote}
            onMoveFolder={handleMoveFolder}
            searchInputRef={sidebarSearchInputRef}
            onOpenSearchResult={handleOpenSearchResult}
            sidebarTab={sidebarTab}
            onSidebarTabChange={setSidebarTab}
            onCopyPath={handleCopyPath}
            onCopyNote={handleCopyNote}
            onCopyFolder={handleCopyFolder}
            onPaste={handlePaste}
            canPaste={canPaste}
          />
        </div>,
        sidebarSlot
      )}

      <div className="flex flex-col h-full">
        {/* Main content */}
        <main className="flex-1 overflow-hidden relative">
          {/* Find and Replace Bar - floating overlay */}
          <FindReplaceBar
            isOpen={findReplaceState.isOpen}
            searchTerm={findReplaceState.searchTerm}
            replaceTerm={findReplaceState.replaceTerm}
            matchCount={findReplaceState.matches.length}
            currentMatchIndex={findReplaceState.currentMatchIndex}
            onSearchChange={findReplaceActions.setSearchTerm}
            onReplaceChange={findReplaceActions.setReplaceTerm}
            onNextMatch={findReplaceActions.nextMatch}
            onPrevMatch={findReplaceActions.prevMatch}
            onReplace={findReplaceActions.replace}
            onReplaceAll={findReplaceActions.replaceAll}
            onClose={findReplaceActions.close}
          />
          {splitState.mode !== "none" && splitState.primaryPane && splitState.secondaryPane ? (
            // Split view - tabs are in TopBar, each pane has its own header
            <div
              ref={splitContainerRef}
              className={`h-full flex ${
                splitState.mode === "horizontal" ? "flex-row" : "flex-col"
              } ${isResizingSplit ? "select-none" : ""}`}
            >
              {/* Primary pane */}
              <div
                style={{
                  [splitState.mode === "horizontal" ? "width" : "height"]: `${splitRatio * 100}%`,
                  flexShrink: 0,
                }}
              >
                {(() => {
                  const pane = splitState.primaryPane;
                  const activeNoteId = pane.noteIds[pane.activeIndex];
                  const activeNote = activeNoteId ? notes.find((n) => n.id === activeNoteId) ?? null : null;
                  const menuItems: HeaderMenuItem[] = [
                    { id: "rename", label: "Rename", onSelect: handleRenameCurrentNote },
                    { id: "copy-path", label: "Copy Path", onSelect: handleCopyCurrentNotePath },
                    { id: "find", label: "Find & Replace", onSelect: findReplaceActions.open },
                    { id: "split-h", label: "Split Horizontal", onSelect: handleSplitHorizontal, disabled: tabCount <= 1 },
                    { id: "split-v", label: "Split Vertical", onSelect: handleSplitVertical, disabled: tabCount <= 1 },
                    { id: "close-split", label: "Close Split", onSelect: handleCloseSplit, separatorBefore: true },
                    { id: "delete", label: "Delete", danger: true, onSelect: handleDeleteCurrentNote, separatorBefore: true },
                  ];
                  return (
                    <EditorPane
                      paneId="primary"
                      activeNote={activeNote}
                      onTitleChange={(title) => activeNoteId && handleRenameNote(activeNoteId, title)}
                      onContentChange={(content) => activeNoteId && handleUpdateNoteContentById(activeNoteId, content)}
                      mode={paneModes.primary}
                      onToggleMode={() => handleTogglePaneMode("primary")}
                      filePath={activeNote?.path ?? "Notes"}
                      menuItems={menuItems}
                      isFocused={splitState.focusedPane === "primary"}
                      onFocus={() => handlePaneFocus("primary")}
                      jumpTo={jumpTo}
                      onOpenBracketLink={openOrCreateNoteByLabel}
                    />
                  );
                })()}
              </div>

              {/* Resize Handle */}
              <div
                onPointerDown={handleSplitResizePointerDown}
                className={`
                  relative z-20 flex-shrink-0 transition-all duration-150

                  ${splitState.mode === "horizontal"
                    ? "w-px hover:w-1.5 cursor-col-resize"
                    : "h-px hover:h-1.5 cursor-row-resize"
                  }

                  ${isResizingSplit
                    ? `bg-indigo-500/50 ${splitState.mode === "horizontal" ? "w-1.5" : "h-1.5"}`
                    : "bg-slate-600 hover:bg-indigo-500/30"
                  }

                  before:absolute
                  before:content-['']
                  before:top-[-12px]
                  before:bottom-[-12px]
                  before:left-0
                  before:right-0
                `}
              />

              {/* Secondary pane */}
              <div
                style={{
                  [splitState.mode === "horizontal" ? "width" : "height"]: `${(1 - splitRatio) * 100}%`,
                  flexShrink: 0,
                }}
              >
                {(() => {
                  const pane = splitState.secondaryPane;
                  const activeNoteId = pane.noteIds[pane.activeIndex];
                  const activeNote = activeNoteId ? notes.find((n) => n.id === activeNoteId) ?? null : null;
                  const menuItems: HeaderMenuItem[] = [
                    { id: "rename", label: "Rename", onSelect: handleRenameCurrentNote },
                    { id: "copy-path", label: "Copy Path", onSelect: handleCopyCurrentNotePath },
                    { id: "find", label: "Find & Replace", onSelect: findReplaceActions.open },
                    { id: "close-split", label: "Close Split", onSelect: handleCloseSplit },
                    { id: "delete", label: "Delete", danger: true, onSelect: handleDeleteCurrentNote, separatorBefore: true },
                  ];
                  return (
                    <EditorPane
                      paneId="secondary"
                      activeNote={activeNote}
                      onTitleChange={(title) => activeNoteId && handleRenameNote(activeNoteId, title)}
                      onContentChange={(content) => activeNoteId && handleUpdateNoteContentById(activeNoteId, content)}
                      mode={paneModes.secondary}
                      onToggleMode={() => handleTogglePaneMode("secondary")}
                      filePath={activeNote?.path ?? "Notes"}
                      menuItems={menuItems}
                      isFocused={splitState.focusedPane === "secondary"}
                      onFocus={() => handlePaneFocus("secondary")}
                      onClosePane={handleCloseSplit}
                      onOpenBracketLink={openOrCreateNoteByLabel}
                    />
                  );
                })()}
              </div>
            </div>
          ) : (
            // Single pane view - tabs are in TopBar
            (() => {
              const menuItems: HeaderMenuItem[] = [
                { id: "rename", label: "Rename", onSelect: handleRenameCurrentNote },
                { id: "copy-path", label: "Copy Path", onSelect: handleCopyCurrentNotePath },
                { id: "find", label: "Find & Replace", onSelect: findReplaceActions.open },
                { id: "split-h", label: "Split Horizontal", onSelect: handleSplitHorizontal, disabled: history.ids.length <= 1 },
                { id: "split-v", label: "Split Vertical", onSelect: handleSplitVertical, disabled: history.ids.length <= 1 },
                { id: "delete", label: "Delete", danger: true, onSelect: handleDeleteCurrentNote, separatorBefore: true },
              ];
              return (
                <EditorPane
                  paneId="primary"
                  activeNote={selectedNote}
                  onTitleChange={(title) => selectedNoteId && handleRenameNote(selectedNoteId, title)}
                  onContentChange={handleUpdateNoteContent}
                  mode={paneModes.primary}
                  onToggleMode={() => handleTogglePaneMode("primary")}
                  filePath={selectedNote?.path ?? "Notes"}
                  menuItems={menuItems}
                  jumpTo={jumpTo}
                  onOpenBracketLink={openOrCreateNoteByLabel}
                  additionalExtensions={findReplaceExtension}
                  onEditorViewReady={handleEditorViewReady}
                />
              );
            })()
          )}
        </main>
      </div>

      {/* Paste Conflict Modal */}
      {pasteConflict &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={handleClosePasteConflict}
            />
            <div className="relative bg-slate-900 border border-slate-700 rounded-lg shadow-2xl max-w-md w-full overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <div className="flex items-center gap-2 text-amber-400">
                  <IconAlertTriangle size={20} />
                  <h3 className="font-semibold text-slate-100">
                    {pasteConflict.kind === "note" ? "File" : "Folder"} Already Exists
                  </h3>
                </div>
                <button
                  onClick={handleClosePasteConflict}
                  className="text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <IconX size={20} />
                </button>
              </div>

              <div className="p-6">
                <p className="text-slate-300 mb-6 text-sm leading-relaxed">
                  A {pasteConflict.kind} named <span className="font-semibold text-slate-100">"{pasteConflict.name}"</span> already exists
                  {pasteConflict.targetFolderPath
                    ? ` in "${pasteConflict.targetFolderPath}"`
                    : " at the root level"}
                  . Would you like to replace it?
                </p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handlePasteReplace}
                    className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-md transition-colors text-sm"
                  >
                    Replace existing {pasteConflict.kind}
                  </button>
                  <button
                    onClick={handleClosePasteConflict}
                    className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-md border border-slate-700 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

export default NotesPage;
